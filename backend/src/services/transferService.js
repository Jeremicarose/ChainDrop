const crypto = require('crypto');
const { ethers } = require('ethers');
const db = require('../db/schema');
const blockchainService = require('./blockchainService');
const emailService = require('./emailService');

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

      // Calculate expiry (2 days from now)
      const expiresAt = Date.now() + (2 * 24 * 60 * 60 * 1000);

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
      // DECENTRALIZED: owner_address is NULL until claimed - the claimer's wallet becomes owner
      await db.run(`
        INSERT OR IGNORE INTO wallets (
          address, owner_address, identifier, identifier_type, deployed, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        recipientAddress,
        null, // Owner is determined at claim time (claimer's wallet)
        this.hashIdentifier(recipientIdentifier),
        identifierType,
        false,
        Date.now()
      ]);

      console.log(`✅ Transfer created: ${transferId}`);

      // Send email notification to recipient
      if (identifierType === 'email') {
        console.log(`📧 Sending email notification to ${recipientIdentifier}`);
        const emailResult = await emailService.sendTransferNotification(
          recipientIdentifier,
          formattedAmount.toString(),
          claimToken,
          senderAddress
        );

        if (emailResult.success) {
          console.log(`✅ Email sent successfully`);
        } else {
          console.log(`⚠️  Email not sent: ${emailResult.reason || emailResult.error}`);
        }
      } else {
        console.log(`📧 Skipping email - recipient type is ${identifierType}`);
      }

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

      // Get wallet info (for tracking purposes)
      const wallet = await db.get(
        'SELECT * FROM wallets WHERE address = ?',
        [transfer.recipient_address]
      );

      // Wallet record is optional for decentralized flow
      if (!wallet) {
        console.log(`⚠️  No wallet record found - creating on-the-fly`);
      }

      let result;
      const skipBlockchain = process.env.SKIP_BLOCKCHAIN === 'true';

      if (skipBlockchain) {
        console.log(`⚠️  SKIP_BLOCKCHAIN=true: Simulating blockchain operations for testing`);
        // Simulate blockchain deployment
        result = {
          deployTxHash: '0x' + Math.random().toString(16).substring(2, 66),
          claimTxHash: '0x' + Math.random().toString(16).substring(2, 66),
          accountAddress: transfer.recipient_address,
          ownerAddress: recipientWalletAddress
        };
        console.log(`✅ Simulated deploy: ${result.deployTxHash}`);
      } else {
        // DECENTRALIZED: Deploy with RECIPIENT's wallet as owner
        // The claimer becomes the true owner of their ghost vault
        console.log(`📦 Deploying ghost vault with recipient as owner: ${recipientWalletAddress}`);
        console.log(`   Identifier: ${transfer.recipient_identifier_original}`);
        result = await blockchainService.deployAndClaim(
          recipientWalletAddress, // Recipient's wallet becomes the owner
          transfer.recipient_identifier_original,
          transfer.token_address === 'ETH' ? null : transfer.token_address,
          transfer.amount,
          transfer.claim_id
        );
        console.log(`✅ Deploy result:`, result);
      }

      // deployAndClaim now handles the full flow: deploy -> withdraw -> transfer
      // Get the actual amount transferred from the result
      const transferTxHash = result.transferTxHash || result.claimTxHash;
      const userReceivesAmount = result.amount ? BigInt(result.amount) : BigInt(transfer.amount);

      console.log(`💰 User received: ${ethers.formatEther(userReceivesAmount)} CRO`);
      console.log(`✅ Transfer TX: ${transferTxHash}`);

      // Update transfer status
      await db.run(`
        UPDATE transfers
        SET status = 'claimed', claimed_at = ?
        WHERE id = ?
      `, [Date.now(), transfer.id]);

      // Update wallet deployment status and set owner (DECENTRALIZED)
      await db.run(`
        UPDATE wallets
        SET deployed = 1, deployed_at = ?, deployment_tx_hash = ?, owner_address = ?
        WHERE address = ?
      `, [Date.now(), result.deployTxHash, recipientWalletAddress, result.accountAddress]);

      console.log(`✅ Claim processed successfully`);

      // Send claim confirmation email
      if (transfer.recipient_identifier_type === 'email') {
        console.log(`📧 Sending claim confirmation to ${transfer.recipient_identifier_original}`);
        const emailResult = await emailService.sendClaimConfirmation(
          transfer.recipient_identifier_original,
          userReceivesAmount.toString(),
          transferTxHash
        );

        if (emailResult.success) {
          console.log(`✅ Claim confirmation email sent`);
        } else {
          console.log(`⚠️  Claim confirmation not sent: ${emailResult.reason || emailResult.error}`);
        }
      }

      // Format amounts for display
      const amountInEth = ethers.formatEther(userReceivesAmount);
      const originalAmount = result.originalAmount ? ethers.formatEther(result.originalAmount) : ethers.formatEther(transfer.amount);
      const gasCostEth = result.gasCost ? ethers.formatEther(result.gasCost) : '0';

      return {
        success: true,
        deployedAccountAddress: result.accountAddress,
        transactionHash: transferTxHash,
        claimedAmount: amountInEth,
        originalAmount: originalAmount,
        gasCost: gasCostEth,
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

  /**
   * Get all expired transfers that are still pending (not claimed, not refunded)
   */
  async getExpiredTransfers() {
    const transfers = await db.all(
      `SELECT * FROM transfers
       WHERE status = 'pending'
       AND expires_at < ?
       ORDER BY expires_at ASC`,
      [Date.now()]
    );
    return transfers;
  }

  /**
   * Process refund for an expired transfer
   * Properly withdraws from ghost vault, then sends to original sender
   */
  async processRefund(transfer) {
    try {
      console.log(`\n💸 Processing refund for transfer ${transfer.id}`);
      console.log(`   Recipient identifier: ${transfer.recipient_identifier_original}`);
      console.log(`   Ghost vault: ${transfer.recipient_address}`);
      console.log(`   Original sender: ${transfer.sender_address}`);

      const skipBlockchain = process.env.SKIP_BLOCKCHAIN === 'true';
      let result;

      if (skipBlockchain) {
        // Simulate refund
        const fakeTxHash = '0x' + crypto.randomBytes(32).toString('hex');
        console.log(`⚠️  SKIP_BLOCKCHAIN=true: Simulated refund`);
        result = {
          success: true,
          withdrawTxHash: fakeTxHash,
          transferTxHash: fakeTxHash,
          amount: transfer.amount
        };
      } else {
        // PROPER REFUND: Withdraw from ghost vault, then send to original sender
        // This uses the recipient identifier to compute ghost vault address,
        // deploys if needed, withdraws to admin, then sends to sender
        const refundClaimId = `refund-${transfer.id}`;

        result = await blockchainService.withdrawFromGhostVault(
          transfer.recipient_identifier_original,
          transfer.sender_address,
          transfer.token_address === 'ETH' ? null : transfer.token_address,
          refundClaimId
        );

        console.log(`✅ Refund withdrawn from ghost vault: ${result.withdrawTxHash}`);
        console.log(`✅ Refund sent to sender: ${result.transferTxHash}`);
        console.log(`💰 Amount refunded: ${ethers.formatEther(result.amount)} CRO`);
      }

      // Update transfer status
      await db.run(`
        UPDATE transfers
        SET status = 'refunded', refunded_at = ?, refund_tx_hash = ?
        WHERE id = ?
      `, [Date.now(), result.transferTxHash, transfer.id]);

      console.log(`✅ Refund completed for transfer ${transfer.id}\n`);

      return {
        success: true,
        transferId: transfer.id,
        refundTxHash: result.transferTxHash,
        withdrawTxHash: result.withdrawTxHash,
        amount: result.amount
      };
    } catch (error) {
      console.error(`❌ Refund failed for transfer ${transfer.id}:`, error.message);
      return {
        success: false,
        transferId: transfer.id,
        error: error.message
      };
    }
  }

  /**
   * Run auto-refund job for all expired transfers
   */
  async runAutoRefund() {
    console.log('\n🔄 Running auto-refund job...');

    const expiredTransfers = await this.getExpiredTransfers();

    if (expiredTransfers.length === 0) {
      console.log('✓ No expired transfers to refund');
      return { processed: 0, refunded: 0, failed: 0 };
    }

    console.log(`📋 Found ${expiredTransfers.length} expired transfer(s) to refund`);

    let refunded = 0;
    let failed = 0;

    for (const transfer of expiredTransfers) {
      const result = await this.processRefund(transfer);
      if (result.success) {
        refunded++;
      } else {
        failed++;
      }
    }

    console.log(`\n✅ Auto-refund complete: ${refunded} refunded, ${failed} failed`);
    return { processed: expiredTransfers.length, refunded, failed };
  }

  /**
   * Start auto-refund scheduler (runs every 5 minutes)
   */
  startAutoRefundScheduler(intervalMinutes = 5) {
    console.log(`⏰ Starting auto-refund scheduler (every ${intervalMinutes} minutes)`);

    // Run immediately on startup
    this.runAutoRefund();

    // Then run periodically
    setInterval(() => {
      this.runAutoRefund();
    }, intervalMinutes * 60 * 1000);
  }
}

module.exports = new TransferService();