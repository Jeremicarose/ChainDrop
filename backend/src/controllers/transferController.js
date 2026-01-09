const transferService = require('../services/transferService');
const blockchainService = require('../services/blockchainService');
const emailService = require('../services/emailService');

const transferController = {
  /**
   * POST /api/transfer/send
   * Initiate a new transfer
   */
  async send(req, res) {
    try {
      const { senderAddress, recipientIdentifier, identifierType, amount, tokenAddress } = req.body;

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

      console.log(`📤 New transfer request from ${senderAddress}`);

      const result = await transferService.createTransfer(
        senderAddress,
        recipientIdentifier,
        identifierType,
        amount,
        tokenAddress
      );

      // Send email notification (non-blocking - don't wait for it)
      if (identifierType === 'email') {
        emailService.sendTransferNotification(
          recipientIdentifier,
          amount,
          result.claimToken,
          senderAddress
        ).catch(err => {
          console.error('Failed to send email notification:', err);
          // Don't fail the transfer if email fails
        });
      }

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

      // Send claim confirmation email (non-blocking)
      if (verifiedIdentity && verifiedIdentity.includes('@')) {
        emailService.sendClaimConfirmation(
          verifiedIdentity,
          result.claimedAmount || result.amount,
          result.transactionHash
        ).catch(err => {
          console.error('Failed to send claim confirmation email:', err);
        });
      }

      res.json({
        success: true,
        message: 'Funds claimed successfully',
        data: result
      });
    } catch (error) {
      console.error('Claim error:', error);

      // Return appropriate status code based on error type
      const statusCode = error.message.includes('Identity verification failed') ? 403 : 500;

      res.status(statusCode).json({
        error: 'Failed to process claim',
        message: error.message
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
  }
};

module.exports = transferController;