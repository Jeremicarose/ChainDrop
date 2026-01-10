const crypto = require('crypto');
const { ethers } = require('ethers');
const db = require('../db/schema');
const blockchainService = require('./blockchainService');

class TransferService {
  /**
   * Initiate a new transfer
   */
  async createTransfer(senderAddress, recipientIdentifier, identifierType, amount, tokenAddress = null) {
    try {
      const transferId = crypto.randomUUID();
      const claimId = `claim-${transferId}`;
      const claimToken = this.generateClaimToken();
      
      // Generate counterfactual address (using admin as owner for claiming)
      const recipientAddress = await blockchainService.getCounterfactualAddress(
        recipientIdentifier
        // No owner specified - defaults to admin wallet
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
          recipient_identifier_original, recipient_address, token_address, amount, claim_id, claim_token,
          claim_link, tx_hash, created_at, expires_at, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        transferId,
        senderAddress,
        this.hashIdentifier(recipientIdentifier),
        identifierType,
        recipientIdentifier,
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

      // Create wallet record (only if it doesn't exist)
      // Note: owner_address is the admin wallet (required for claiming)
      const adminAddress = blockchainService.wallet.address;
      await db.run(`
        INSERT OR IGNORE INTO wallets (
          address, owner_address, identifier, identifier_type, deployed, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        recipientAddress,
        adminAddress, // Use admin as owner for all accounts
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
  async processClaim(claimToken, recipientWalletAddress, verifiedIdentity) {
    try {
      const { claimable, transfer, reason } = await this.isClaimable(claimToken);

      if (!claimable) {
        throw new Error(reason);
      }

      console.log(`🎯 Processing claim for transfer ${transfer.id}`);

      // ⚠️ SECURITY: Verify the claimer's identity matches the recipient
      if (!verifiedIdentity) {
        throw new Error('Identity verification required. Please log in to claim.');
      }

      // Normalize identities for comparison (lowercase email, remove @ from twitter, etc.)
      const normalizeIdentity = (id) => {
        if (!id) return '';
        return id.toLowerCase().trim().replace(/^@/, ''); // Remove leading @ for twitter
      };

      const claimerIdentity = normalizeIdentity(verifiedIdentity);
      const recipientIdentity = normalizeIdentity(transfer.recipient_identifier_original);

      if (claimerIdentity !== recipientIdentity) {
        console.log(`🚫 Identity mismatch: claimer="${claimerIdentity}" vs recipient="${recipientIdentity}"`);
        throw new Error(
          `Identity verification failed. This transfer was sent to "${transfer.recipient_identifier_original}". ` +
          `You are logged in as "${verifiedIdentity}". Please log in with the correct account.`
        );
      }

      console.log(`✅ Identity verified: ${verifiedIdentity}`);

      // Get wallet info to find the owner address
      const wallet = await db.get(
        'SELECT * FROM wallets WHERE address = ?',
        [transfer.recipient_address]
      );

      if (!wallet) {
        throw new Error('Wallet record not found');
      }

      let result;
      const skipBlockchain = process.env.SKIP_BLOCKCHAIN === 'true';

      if (skipBlockchain) {
        console.log(`⚠️  SKIP_BLOCKCHAIN=true: Simulating blockchain operations for testing`);
        // Simulate blockchain deployment
        result = {
          deployTxHash: '0x' + Math.random().toString(16).substring(2, 66),
          claimTxHash: '0x' + Math.random().toString(16).substring(2, 66),
          accountAddress: transfer.recipient_address
        };
        console.log(`✅ Simulated deploy: ${result.deployTxHash}`);
      } else {
        // Real blockchain deployment (admin is owner for all accounts)
        console.log(`📦 Deploying account with admin as owner, identifier: ${transfer.recipient_identifier_original}`);
        result = await blockchainService.deployAndClaim(
          wallet.owner_address, // This is admin address
          transfer.recipient_identifier_original,
          transfer.token_address === 'ETH' ? null : transfer.token_address,
          transfer.amount,
          transfer.claim_id
        );
        console.log(`✅ Deploy result:`, result);
      }

      // Calculate gas costs to deduct from user's received amount
      // Estimated gas for deploy + claim + transfer ≈ 300,000 gas
      // At 1 gwei = 0.0003 ETH
      const estimatedGasCost = ethers.parseEther("0.0003"); // ~$1 at current prices

      // Calculate amount user receives (original amount - gas cost)
      const userReceivesAmount = BigInt(transfer.amount) - BigInt(estimatedGasCost);

      console.log(`💰 Original amount: ${ethers.formatEther(transfer.amount)} CRO`);
      console.log(`⛽ Gas deduction: ${ethers.formatEther(estimatedGasCost)} CRO`);
      console.log(`💸 User receives: ${ethers.formatEther(userReceivesAmount)} CRO`);

      let transferTxHash;

      if (skipBlockchain) {
        // Simulate transfer
        transferTxHash = '0x' + Math.random().toString(16).substring(2, 66);
        console.log(`✅ Simulated transfer: ${transferTxHash}`);
      } else {
        // Real blockchain transfer
        transferTxHash = await blockchainService.sendFunds(
          recipientWalletAddress,
          userReceivesAmount.toString(),
          transfer.token_address === 'ETH' ? null : transfer.token_address
        );
        console.log(`✅ Transfer TX: ${transferTxHash}`);
      }

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

      // Format amount for display (show what user actually received)
      const amountInEth = ethers.formatEther(userReceivesAmount);

      return {
        success: true,
        deployedAccountAddress: result.accountAddress,
        transactionHash: transferTxHash,
        claimedAmount: amountInEth,
        originalAmount: ethers.formatEther(transfer.amount),
        gasCost: ethers.formatEther(estimatedGasCost),
        token: transfer.token_address === 'ETH' ? 'ETH' : transfer.token_address,
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
   * Get transfers by recipient identifier
   */
  async getTransfersByRecipient(identifier) {
    const transfers = await db.all(
      'SELECT * FROM transfers WHERE recipient_identifier_original = ? ORDER BY created_at DESC',
      [identifier]
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