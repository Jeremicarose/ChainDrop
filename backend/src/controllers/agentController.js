const agentService = require('../services/agentService');
const transferService = require('../services/transferService');

const agentController = {
  /**
   * POST /api/agent/create
   * Create a new agent API key
   */
  async create(req, res) {
    try {
      const { ownerAddress, name, policies } = req.body;

      if (!ownerAddress || !name) {
        return res.status(400).json({
          error: 'Missing required fields',
          required: ['ownerAddress', 'name']
        });
      }

      console.log(`🤖 Creating agent: ${name} for ${ownerAddress}`);

      const agent = await agentService.createAgent(ownerAddress, name, policies);

      res.status(201).json({
        success: true,
        message: 'Agent created successfully',
        data: agent
      });
    } catch (error) {
      console.error('Create agent error:', error);
      res.status(500).json({
        error: 'Failed to create agent',
        message: error.message
      });
    }
  },

  /**
   * POST /api/agent/pay
   * Agent makes a payment (with policy enforcement)
   */
  async pay(req, res) {
    try {
      const apiKey = req.headers['x-api-key'];
      const { recipientIdentifier, identifierType, amount, tokenAddress, metadata } = req.body;

      // Validate API key
      if (!apiKey) {
        return res.status(401).json({
          error: 'Missing API key',
          message: 'Include X-API-Key header with your agent API key'
        });
      }

      // Validate required fields
      if (!recipientIdentifier || !identifierType || !amount) {
        return res.status(400).json({
          error: 'Missing required fields',
          required: ['recipientIdentifier', 'identifierType', 'amount']
        });
      }

      console.log(`🤖 Agent payment request: ${amount} to ${recipientIdentifier}`);

      // Verify API key
      let agent;
      try {
        agent = await agentService.verifyApiKey(apiKey);
      } catch (error) {
        return res.status(401).json({
          error: 'Invalid API key',
          message: error.message
        });
      }

      console.log(`✅ Agent verified: ${agent.name}`);

      // Check policies
      const policyCheck = await agentService.checkPolicies(
        agent.id,
        recipientIdentifier,
        amount,
        tokenAddress
      );

      if (!policyCheck.allowed) {
        console.log(`🚫 Policy check failed: ${policyCheck.reason}`);

        // Log failed transaction
        await agentService.logTransaction(
          agent.id,
          recipientIdentifier,
          amount,
          tokenAddress,
          'policy_rejected',
          null,
          policyCheck.reason
        );

        return res.status(403).json({
          error: 'Policy violation',
          message: policyCheck.reason,
          requiresApproval: policyCheck.requiresApproval || false
        });
      }

      console.log(`✅ Policy check passed`);

      // Execute transfer using existing transferService
      const result = await transferService.createTransfer(
        agent.owner_address,
        recipientIdentifier,
        identifierType,
        amount,
        tokenAddress
      );

      // Log successful transaction
      await agentService.logTransaction(
        agent.id,
        recipientIdentifier,
        amount,
        tokenAddress,
        'success',
        result.transferId,
        null
      );

      console.log(`✅ Agent payment successful: ${result.transferId}`);

      res.status(201).json({
        success: true,
        message: 'Payment initiated successfully',
        data: {
          transferId: result.transferId,
          recipientAddress: result.recipientAddress,
          claimLink: result.claimLink,
          txHash: result.txHash,
          agentName: agent.name,
          metadata: metadata || {}
        }
      });
    } catch (error) {
      console.error('Agent payment error:', error);

      // Log error transaction if we have agent context
      if (req.agentId) {
        await agentService.logTransaction(
          req.agentId,
          req.body.recipientIdentifier,
          req.body.amount,
          req.body.tokenAddress,
          'error',
          null,
          error.message
        );
      }

      res.status(500).json({
        error: 'Failed to process payment',
        message: error.message
      });
    }
  },

  /**
   * GET /api/agent/stats
   * Get agent statistics
   */
  async getStats(req, res) {
    try {
      const apiKey = req.headers['x-api-key'];

      if (!apiKey) {
        return res.status(401).json({
          error: 'Missing API key'
        });
      }

      const agent = await agentService.verifyApiKey(apiKey);
      const stats = await agentService.getAgentStats(agent.id);

      res.json({
        success: true,
        data: {
          agentName: agent.name,
          ...stats,
          policies: agent.policies
        }
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
   * GET /api/agent/list
   * List all agents for an owner
   */
  async list(req, res) {
    try {
      const { ownerAddress } = req.query;

      if (!ownerAddress) {
        return res.status(400).json({
          error: 'Missing ownerAddress parameter'
        });
      }

      const agents = await agentService.listAgents(ownerAddress);

      res.json({
        success: true,
        data: agents
      });
    } catch (error) {
      console.error('List agents error:', error);
      res.status(500).json({
        error: 'Failed to list agents',
        message: error.message
      });
    }
  },

  /**
   * POST /api/agent/revoke
   * Revoke an agent API key
   */
  async revoke(req, res) {
    try {
      const { agentId, ownerAddress } = req.body;

      if (!agentId || !ownerAddress) {
        return res.status(400).json({
          error: 'Missing required fields',
          required: ['agentId', 'ownerAddress']
        });
      }

      await agentService.revokeAgent(agentId, ownerAddress);

      res.json({
        success: true,
        message: 'Agent revoked successfully'
      });
    } catch (error) {
      console.error('Revoke agent error:', error);
      res.status(500).json({
        error: 'Failed to revoke agent',
        message: error.message
      });
    }
  },

  /**
   * POST /api/agent/update-status
   * Update agent status (active/paused)
   */
  async updateStatus(req, res) {
    try {
      const { agentId, ownerAddress, status } = req.body;

      if (!agentId || !ownerAddress || !status) {
        return res.status(400).json({
          error: 'Missing required fields',
          required: ['agentId', 'ownerAddress', 'status']
        });
      }

      if (!['active', 'paused'].includes(status)) {
        return res.status(400).json({
          error: 'Invalid status',
          message: 'Status must be either "active" or "paused"'
        });
      }

      await agentService.updateStatus(agentId, ownerAddress, status);

      res.json({
        success: true,
        message: `Agent ${status === 'active' ? 'activated' : 'paused'} successfully`
      });
    } catch (error) {
      console.error('Update status error:', error);
      res.status(500).json({
        error: 'Failed to update agent status',
        message: error.message
      });
    }
  }
};

module.exports = agentController;
