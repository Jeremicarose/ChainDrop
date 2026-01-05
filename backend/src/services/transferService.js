const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const db = require('../db/schema');
const blockchainService = require('./blockchainService');

class TransferService {
  /**
   * Initiate a new transfer
   */
  async createTransfer(senderAddress, recipientIdentifier, identifierType, amount, tokenAddress = null) {
    try {
      const transferId = uuidv4();
      const claimId = `claim-${transferId}`;
      const claimToken = this.generateClaimToken();
      
      // Generate counterfactual address
      const recipientAddress = await blockchainService.getCounterfactualAddress(
        recipientIdentifier,
        senderAddress
      );

      // Calculate expiry (24 hours from now)
      const expiresAt = Date.now() + (24 * 60 * 60 * 1000);

      // Format amount for blockchain
      const formattedAmount = await blockchainService.formatAmount(amount, tokenAddress);

      // Send funds to counterfactual address
      console.log(`💸 Sending ${amount} to ${recipientAddress}`);
      const txHash = await blockchainService.sendFunds(
        recipientAddress,
        formattedAmount,
        tokenAddress
      );

      // Generate claim link
      const claimLink = `${process.env.CLAIM_LINK_BASE_URL}/${claimToken}`;

      // Save transfer to database
      await db.run(`
        INSERT INTO transfers (
          id, sender_address, recipient_identifier, recipient_identifier_type,
          recipient_address, token_address, amount, claim_id, claim_token,
          claim_link, tx_hash, created_at, expires_at, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        transferId,
        senderAddress,
        this.hashIdentifier(recipientIdentifier),
        identifierType,
        recipientAddress,
        tokenAddress || 'ETH',
        formattedAmount.toString(),
        claimId,
        claimToken,
        claimLink,
        txHash,
        Date.now(),
        expiresAt,
        'pending'
      ]);

      // Create wallet record
      await db.run(`
        INSERT INTO wallets (
          address, owner_address, identifier, identifier_type, deployed, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        recipientAddress,
        senderAddress,
        this.hashIdentifier(recipientIdentifier),
        identifierType,
        false,
        Date.now()
      ]);

      console.log(`✅ Transfer created: ${transferId}`);

      return {
        transferId,
        recipientAddress,
        claimLink,
        claimToken,
        txHash,
        expiresAt
      };
    } catch (error) {
      console.error('Error creating transfer:', error);
      throw error;
    }
  }

  /**
   * Get transfer by claim token
   */
  async getTransferByClaimToken(claimToken) {
    const transfer = await db.get(
      'SELECT * FROM transfers WHERE claim_token = ?',
      [claimToken]
    );
    return transfer;
  }

  /**
   * Get transfer by ID
   */
  async getTransferById(transferId) {
    const transfer = await db.get(
      'SELECT * FROM transfers WHERE id = ?',
      [transferId]
      
    );
    return transfer;
  }

  /**
   * Check if transfer is claimable
   */
  async isClaimable(claimToken) {
    const transfer = await this.getTransferByClaimToken(claimToken);
    
    if (!transfer) {
      return { claimable: false, reason: 'Transfer not found' };
    }

    if (transfer.status === 'claimed') {
      return { claimable: false, reason: 'Already claimed' };
    }

    if (Date.now() > transfer.expires_at) {
      return { claimable: false, reason: 'Claim expired' };
    }

    return { claimable: true, transfer };
  }

  /**
   * Process claim
   */
  async processClaim(claimToken, recipientWalletAddress) {
    try {
      const { claimable, transfer, reason } = await this.isClaimable(claimToken);

      if (!claimable) {
        throw new Error(reason);
      }

      console.log(`🎯 Processing claim for transfer ${transfer.id}`);

      // Deploy account and claim funds
      const result = await blockchainService.deployAndClaim(
        recipientWalletAddress,
        transfer.recipient_identifier,
        transfer.token_address === 'ETH' ? null : transfer.token_address,
        transfer.amount,
        transfer.claim_id
      );

      // Update transfer status
      await db.run(`
        UPDATE transfers 
        SET status = 'claimed', claimed_at = ?
        WHERE id = ?
      `, [Date.now(), transfer.id]);

      // Update wallet deployment status
      await db.run(`
        UPDATE wallets
        SET deployed = 1, deployed_at = ?, deployment_tx_hash = ?
        WHERE address = ?
      `, [Date.now(), result.deployTxHash, result.accountAddress]);

      console.log(`✅ Claim processed successfully`);

      return {
        success: true,
        accountAddress: result.accountAddress,
        deployTxHash: result.deployTxHash,
        claimTxHash: result.claimTxHash
      };
    } catch (error) {
      console.error('Error processing claim:', error);
      throw error;
    }
  }

  /**
   * Get transfers by sender
   */
  async getTransfersBySender(senderAddress) {
    const transfers = await db.all(
      'SELECT * FROM transfers WHERE sender_address = ? ORDER BY created_at DESC',
      [senderAddress]
    );
    return transfers;
  }

  /**
   * Get transfer statistics
   */
  async getStats() {
    const total = await db.get('SELECT COUNT(*) as count FROM transfers');
    const claimed = await db.get('SELECT COUNT(*) as count FROM transfers WHERE status = "claimed"');
    const pending = await db.get('SELECT COUNT(*) as count FROM transfers WHERE status = "pending"');

    return {
      total: total.count,
      claimed: claimed.count,
      pending: pending.count
    };
  }

  /**
   * Generate secure claim token
   */
  generateClaimToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hash identifier for privacy
   */
  hashIdentifier(identifier) {
    return crypto.createHash('sha256').update(identifier).digest('hex');
  }
}

module.exports = new TransferService();