const transferService = require('../services/transferService');
const blockchainService = require('../services/blockchainService');
// NOTE: Email sending is handled in transferService - don't duplicate here

// Minimum amount to cover claim gas costs (~0.03 CRO) plus margin
const MIN_AMOUNT_CRO = '0.05';

const transferController = {
  /**
   * POST /api/transfer/send
   * Initiate a new transfer
   */
  async send(req, res) {
    try {
      const { senderAddress, recipientIdentifier, identifierType, amount, tokenAddress, senderEmail } = req.body;

      // Validation
      if (!senderAddress || !recipientIdentifier || !identifierType || !amount) {
        return res.status(400).json({
          error: 'Missing required fields',
          required: ['senderAddress', 'recipientIdentifier', 'identifierType', 'amount']
        });
      }

      // Validate identifier type
      const validTypes = ['email', 'phone', 'social'];
      if (!validTypes.includes(identifierType)) {
        return res.status(400).json({
          error: 'Invalid identifier type',
          validTypes
        });
      }

      // Validate minimum amount to cover gas costs
      if (parseFloat(amount) < parseFloat(MIN_AMOUNT_CRO)) {
        return res.status(400).json({
          error: `Amount too low`,
          message: `Minimum ${MIN_AMOUNT_CRO} CRO required to cover claim gas costs (~0.03 CRO)`,
          minimum: MIN_AMOUNT_CRO
        });
      }

      console.log(`📤 New transfer request from ${senderAddress}`);

      const result = await transferService.createTransfer(
        senderAddress,
        recipientIdentifier,
        identifierType,
        amount,
        tokenAddress,
        senderEmail
      );

      // Email notification is sent in transferService.createTransfer()

      res.status(201).json({
        success: true,
        message: 'Transfer initiated successfully',
        data: result
      });
    } catch (error) {
      console.error('Transfer error:', error);
      res.status(500).json({
        error: 'Failed to initiate transfer',
        message: error.message
      });
    }
  },

  /**
   * GET /api/transfer/:claimToken
   * Get transfer details by claim token
   */
  async getByClaimToken(req, res) {
    try {
      const { claimToken } = req.params;

      const transfer = await transferService.getTransferByClaimToken(claimToken);

      if (!transfer) {
        return res.status(404).json({
          error: 'Transfer not found'
        });
      }

      // Check if claimable
      const { claimable, reason } = await transferService.isClaimable(claimToken);

      res.json({
        success: true,
        data: {
          transferId: transfer.id,
          senderAddress: transfer.sender_address,
          recipientAddress: transfer.recipient_address,
          tokenAddress: transfer.token_address,
          amount: transfer.amount,
          status: transfer.status,
          claimable,
          reason: claimable ? null : reason,
          expiresAt: transfer.expires_at,
          createdAt: transfer.created_at
        }
      });
    } catch (error) {
      console.error('Get transfer error:', error);
      res.status(500).json({
        error: 'Failed to get transfer',
        message: error.message
      });
    }
  },

  /**
   * POST /api/transfer/claim
   * Process a claim with identity verification
   */
  async claim(req, res) {
    try {
      const { claimToken, recipientWalletAddress, verifiedIdentity } = req.body;

      if (!claimToken || !recipientWalletAddress) {
        return res.status(400).json({
          error: 'Missing required fields',
          required: ['claimToken', 'recipientWalletAddress', 'verifiedIdentity']
        });
      }

      if (!verifiedIdentity) {
        return res.status(403).json({
          error: 'Identity verification required',
          message: 'You must be logged in to claim funds. Please authenticate with email, phone, or Twitter.'
        });
      }

      console.log(`🎯 Claim request for token: ${claimToken.substring(0, 10)}...`);
      console.log(`📧 Verified identity: ${verifiedIdentity}`);

      const result = await transferService.processClaim(claimToken, recipientWalletAddress, verifiedIdentity);

      // Claim confirmation email is sent in transferService.processClaim()

      res.json({
        success: true,
        message: 'Funds claimed successfully',
        data: result
      });
    } catch (error) {
      console.error('❌ Claim error:', error);
      console.error('Error stack:', error.stack);

      // Return appropriate status code based on error type
      const statusCode = error.message.includes('Identity verification failed') ? 403 : 500;

      res.status(statusCode).json({
        error: 'Failed to process claim',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  },

  /**
   * GET /api/transfer/sender/:address
   * Get all transfers by sender
   */
  async getBySender(req, res) {
    try {
      const { address } = req.params;

      const transfers = await transferService.getTransfersBySender(address);

      res.json({
        success: true,
        data: transfers
      });
    } catch (error) {
      console.error('Get sender transfers error:', error);
      res.status(500).json({
        error: 'Failed to get transfers',
        message: error.message
      });
    }
  },

  /**
   * GET /api/transfer/recipient/:identifier
   * Get all transfers by recipient identifier (email/phone/twitter)
   */
  async getByRecipient(req, res) {
    try {
      const { identifier } = req.params;

      const transfers = await transferService.getTransfersByRecipient(identifier);

      res.json({
        success: true,
        data: transfers
      });
    } catch (error) {
      console.error('Get recipient transfers error:', error);
      res.status(500).json({
        error: 'Failed to get transfers',
        message: error.message
      });
    }
  },

  /**
   * GET /api/transfer/stats
   * Get transfer statistics
   */
  async getStats(req, res) {
    try {
      const stats = await transferService.getStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({
        error: 'Failed to get stats',
        message: error.message
      });
    }
  },

  /**
   * GET /api/transfer/recent
   * Get recent transfers for activity feed (anonymized)
   */
  async getRecent(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const transfers = await transferService.getRecent(limit);

      // Anonymize for public display
      const anonymized = transfers.map(t => ({
        id: t.id,
        amount: t.amount,
        status: t.status,
        createdAt: t.created_at,
        // Anonymize sender - show only first 6 and last 4 chars
        senderShort: t.sender_address ?
          `${t.sender_address.substring(0, 6)}...${t.sender_address.slice(-4)}` : 'Anonymous',
        // Anonymize recipient - show type only
        recipientType: t.identifier_type || 'email',
        // Show if claimed
        claimed: t.status === 'claimed'
      }));

      res.json({
        success: true,
        data: anonymized
      });
    } catch (error) {
      console.error('Get recent transfers error:', error);
      res.status(500).json({
        error: 'Failed to get recent transfers',
        message: error.message
      });
    }
  },

  /**
   * POST /api/transfer/estimate
   * Estimate counterfactual address and gas costs
   */
  async estimate(req, res) {
    try {
      const { recipientIdentifier, senderAddress } = req.body;

      if (!recipientIdentifier) {
        return res.status(400).json({
          error: 'Missing recipient identifier'
        });
      }

      const address = await blockchainService.getCounterfactualAddress(
        recipientIdentifier,
        senderAddress
      );

      const isDeployed = await blockchainService.isAccountDeployed(address);
      const gasPrice = await blockchainService.getGasPrice();

      res.json({
        success: true,
        data: {
          counterfactualAddress: address,
          isDeployed,
          estimatedGasPrice: gasPrice.toString()
        }
      });
    } catch (error) {
      console.error('Estimate error:', error);
      res.status(500).json({
        error: 'Failed to estimate',
        message: error.message
      });
    }
  },

  /**
   * POST /api/transfer/prepare
   * Prepare a transfer - returns recipient address for user to send to directly
   * User's wallet will sign and send the transaction
   */
  async prepare(req, res) {
    try {
      const { recipientIdentifier, identifierType, amount } = req.body;

      if (!recipientIdentifier || !identifierType || !amount) {
        return res.status(400).json({
          error: 'Missing required fields',
          required: ['recipientIdentifier', 'identifierType', 'amount']
        });
      }

      // Validate minimum amount
      if (parseFloat(amount) < parseFloat(MIN_AMOUNT_CRO)) {
        return res.status(400).json({
          error: `Amount too low`,
          message: `Minimum ${MIN_AMOUNT_CRO} CRO required to cover claim gas costs`,
          minimum: MIN_AMOUNT_CRO
        });
      }

      // Get counterfactual address (ghost vault for recipient)
      const recipientAddress = await blockchainService.getCounterfactualAddress(recipientIdentifier);
      const gasPrice = await blockchainService.getGasPrice();

      // Generate claim token in advance
      const crypto = require('crypto');
      const claimToken = crypto.randomBytes(32).toString('hex');
      const claimLink = `${process.env.CLAIM_LINK_BASE_URL}/${claimToken}`;

      console.log(`📋 Prepared transfer to ${recipientIdentifier}`);
      console.log(`   Ghost vault: ${recipientAddress}`);

      res.json({
        success: true,
        data: {
          recipientAddress,        // User sends CRO to this address
          recipientIdentifier,
          identifierType,
          amount,
          claimToken,              // To be used when recording
          claimLink,
          gasPrice: gasPrice.toString(),
          instructions: 'Send CRO to recipientAddress, then call /api/transfer/record with txHash'
        }
      });
    } catch (error) {
      console.error('Prepare error:', error);
      res.status(500).json({
        error: 'Failed to prepare transfer',
        message: error.message
      });
    }
  },

  /**
   * POST /api/transfer/record
   * Record a transfer after user has sent it from their wallet
   * This does NOT send funds - user already sent them
   */
  async record(req, res) {
    try {
      const {
        senderAddress,
        recipientIdentifier,
        identifierType,
        amount,
        txHash,
        claimToken,
        senderEmail
      } = req.body;

      if (!senderAddress || !recipientIdentifier || !identifierType || !amount || !txHash || !claimToken) {
        return res.status(400).json({
          error: 'Missing required fields',
          required: ['senderAddress', 'recipientIdentifier', 'identifierType', 'amount', 'txHash', 'claimToken']
        });
      }

      // Verify the transaction exists on-chain
      const provider = new (require('ethers').JsonRpcProvider)(process.env.RPC_URL);
      const receipt = await provider.getTransactionReceipt(txHash);

      if (!receipt) {
        return res.status(400).json({
          error: 'Transaction not found',
          message: 'Please wait for transaction to be mined and try again'
        });
      }

      if (receipt.status !== 1) {
        return res.status(400).json({
          error: 'Transaction failed',
          message: 'The transaction was reverted on-chain'
        });
      }

      // Get recipient address
      const recipientAddress = await blockchainService.getCounterfactualAddress(recipientIdentifier);

      // Verify transaction was sent to the correct address
      const tx = await provider.getTransaction(txHash);
      if (tx.to.toLowerCase() !== recipientAddress.toLowerCase()) {
        return res.status(400).json({
          error: 'Invalid transaction',
          message: 'Transaction was not sent to the correct recipient address'
        });
      }

      const crypto = require('crypto');
      const transferId = crypto.randomUUID();
      const claimId = `claim-${transferId}`;
      const claimLink = `${process.env.CLAIM_LINK_BASE_URL}/${claimToken}`;
      const expiresAt = Date.now() + (2 * 24 * 60 * 60 * 1000); // 2 days

      // Format amount
      const formattedAmount = await blockchainService.formatAmount(amount);

      // Save to database
      const db = require('../db/schema');
      await db.run(`
        INSERT INTO transfers (
          id, sender_address, recipient_identifier, recipient_identifier_type,
          recipient_identifier_original, recipient_address, token_address, amount, claim_id, claim_token,
          claim_link, tx_hash, created_at, expires_at, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        transferId,
        senderAddress,
        crypto.createHash('sha256').update(recipientIdentifier).digest('hex'),
        identifierType,
        recipientIdentifier,
        recipientAddress,
        'ETH',
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
        INSERT OR IGNORE INTO wallets (
          address, owner_address, identifier, identifier_type, deployed, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        recipientAddress,
        null,
        crypto.createHash('sha256').update(recipientIdentifier).digest('hex'),
        identifierType,
        false,
        Date.now()
      ]);

      console.log(`✅ Transfer recorded: ${transferId}`);
      console.log(`   From: ${senderAddress}`);
      console.log(`   To: ${recipientIdentifier} (${recipientAddress})`);
      console.log(`   Amount: ${amount} CRO`);
      console.log(`   TxHash: ${txHash}`);

      // Send email notification
      if (identifierType === 'email') {
        const emailService = require('../services/emailService');
        console.log(`📧 Sending email notification to ${recipientIdentifier}`);
        const emailResult = await emailService.sendTransferNotification(
          recipientIdentifier,
          formattedAmount.toString(),
          claimToken,
          senderAddress,
          senderEmail
        );

        if (emailResult.success) {
          console.log(`✅ Email sent successfully`);
        } else {
          console.log(`⚠️  Email not sent: ${emailResult.reason || emailResult.error}`);
        }
      }

      res.status(201).json({
        success: true,
        message: 'Transfer recorded successfully',
        data: {
          transferId,
          recipientAddress,
          claimLink,
          claimToken,
          txHash,
          expiresAt
        }
      });
    } catch (error) {
      console.error('Record transfer error:', error);
      res.status(500).json({
        error: 'Failed to record transfer',
        message: error.message
      });
    }
  }
};

module.exports = transferController;