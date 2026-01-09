const crypto = require('crypto');
const { ethers } = require('ethers');
const db = require('../db/schema');

class AgentService {
  /**
   * Create a new agent API key with policies
   */
  async createAgent(ownerAddress, name, policies = {}) {
    try {
      const agentId = crypto.randomUUID();
      const apiKey = this.generateApiKey();

      // Save agent key
      await db.run(`
        INSERT INTO agent_keys (
          id, api_key, name, owner_address, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        agentId,
        apiKey,
        name,
        ownerAddress,
        'active',
        Date.now()
      ]);

      // Save policies
      const policyTypes = {
        dailyLimit: policies.dailyLimit || '10', // 10 CRO default
        allowedRecipients: policies.allowedRecipients || '*', // * = all
        requireApproval: policies.requireApproval || '1000', // Amounts over 1000 CRO need approval
        allowedTokens: policies.allowedTokens || 'CRO' // Only CRO by default
      };

      for (const [type, value] of Object.entries(policyTypes)) {
        await db.run(`
          INSERT INTO agent_policies (
            id, agent_key_id, policy_type, policy_value, created_at
          ) VALUES (?, ?, ?, ?, ?)
        `, [
          crypto.randomUUID(),
          agentId,
          type,
          String(value),
          Date.now()
        ]);
      }

      console.log(`🤖 Agent created: ${name} (${agentId})`);

      return {
        agentId,
        apiKey,
        name,
        policies: policyTypes
      };
    } catch (error) {
      console.error('Error creating agent:', error);
      throw error;
    }
  }

  /**
   * Verify API key and get agent info
   */
  async verifyApiKey(apiKey) {
    const agent = await db.get(
      'SELECT * FROM agent_keys WHERE api_key = ? AND status = ?',
      [apiKey, 'active']
    );

    if (!agent) {
      throw new Error('Invalid or inactive API key');
    }

    // Update last used timestamp
    await db.run(
      'UPDATE agent_keys SET last_used_at = ? WHERE id = ?',
      [Date.now(), agent.id]
    );

    // Get agent policies
    const policies = await db.all(
      'SELECT * FROM agent_policies WHERE agent_key_id = ?',
      [agent.id]
    );

    return {
      ...agent,
      policies: this.formatPolicies(policies)
    };
  }

  /**
   * Check if payment is allowed by policies
   */
  async checkPolicies(agentId, recipientIdentifier, amount, tokenAddress = null) {
    try {
      // Get agent policies
      const policies = await db.all(
        'SELECT * FROM agent_policies WHERE agent_key_id = ?',
        [agentId]
      );

      const policyMap = this.formatPolicies(policies);

      // Check 1: Daily spending limit
      const todayStart = new Date().setHours(0, 0, 0, 0);
      const spentTodayStr = await this.getTodaySpending(agentId, todayStart);
      const spentToday = BigInt(spentTodayStr);
      const dailyLimit = ethers.parseEther(policyMap.dailyLimit || '10');
      const requestAmount = ethers.parseEther(amount);

      if (spentToday + requestAmount > dailyLimit) {
        return {
          allowed: false,
          reason: `Daily limit exceeded. Spent: ${ethers.formatEther(spentToday)} CRO, Limit: ${policyMap.dailyLimit} CRO`
        };
      }

      // Check 2: Recipient whitelist
      const allowedRecipients = policyMap.allowedRecipients;
      if (allowedRecipients !== '*') {
        const patterns = allowedRecipients.split(',').map(p => p.trim());
        const isAllowed = patterns.some(pattern => {
          if (pattern.includes('*')) {
            // Wildcard matching
            const regex = new RegExp(pattern.replace('*', '.*'));
            return regex.test(recipientIdentifier);
          }
          return pattern === recipientIdentifier;
        });

        if (!isAllowed) {
          return {
            allowed: false,
            reason: `Recipient not whitelisted. Allowed patterns: ${allowedRecipients}`
          };
        }
      }

      // Check 3: Approval required for large amounts
      const approvalThreshold = ethers.parseEther(policyMap.requireApproval || '1000');
      if (requestAmount > approvalThreshold) {
        return {
          allowed: false,
          reason: `Amount exceeds approval threshold of ${policyMap.requireApproval} CRO. Manual approval required.`,
          requiresApproval: true
        };
      }

      // Check 4: Token whitelist
      const allowedTokens = policyMap.allowedTokens.split(',').map(t => t.trim());
      const requestedToken = tokenAddress ? 'ERC20' : 'CRO';
      if (!allowedTokens.includes('*') && !allowedTokens.includes(requestedToken)) {
        return {
          allowed: false,
          reason: `Token not allowed. Allowed tokens: ${policyMap.allowedTokens}`
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Error checking policies:', error);
      throw error;
    }
  }

  /**
   * Get today's spending for an agent
   */
  async getTodaySpending(agentId, todayStart) {
    const transactions = await db.all(`
      SELECT amount FROM agent_transactions
      WHERE agent_key_id = ? AND created_at >= ? AND status = 'success'
    `, [agentId, todayStart]);

    let total = 0n;
    for (const tx of transactions) {
      total += BigInt(tx.amount);
    }

    return total.toString();
  }

  /**
   * Log agent transaction (for audit trail)
   */
  async logTransaction(agentId, recipientIdentifier, amount, tokenAddress, status, transferId = null, errorMessage = null) {
    // Convert amount to wei for consistent storage
    const amountWei = ethers.parseEther(amount).toString();

    await db.run(`
      INSERT INTO agent_transactions (
        id, agent_key_id, transfer_id, recipient_identifier, amount, token_address, status, error_message, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      crypto.randomUUID(),
      agentId,
      transferId,
      recipientIdentifier,
      amountWei,
      tokenAddress || 'CRO',
      status,
      errorMessage,
      Date.now()
    ]);
  }

  /**
   * Get agent statistics
   */
  async getAgentStats(agentId) {
    const totalTxs = await db.get(
      'SELECT COUNT(*) as count FROM agent_transactions WHERE agent_key_id = ?',
      [agentId]
    );

    const successTxs = await db.get(
      'SELECT COUNT(*) as count FROM agent_transactions WHERE agent_key_id = ? AND status = ?',
      [agentId, 'success']
    );

    const todayStart = new Date().setHours(0, 0, 0, 0);
    const spentToday = await this.getTodaySpending(agentId, todayStart);

    return {
      totalTransactions: totalTxs.count,
      successfulTransactions: successTxs.count,
      spentToday: ethers.formatEther(spentToday)
    };
  }

  /**
   * Revoke an agent API key
   */
  async revokeAgent(agentId, ownerAddress) {
    // Verify ownership
    const agent = await db.get(
      'SELECT * FROM agent_keys WHERE id = ? AND owner_address = ?',
      [agentId, ownerAddress]
    );

    if (!agent) {
      throw new Error('Agent not found or unauthorized');
    }

    await db.run(
      'UPDATE agent_keys SET status = ?, revoked_at = ? WHERE id = ?',
      ['revoked', Date.now(), agentId]
    );

    console.log(`🔒 Agent revoked: ${agent.name}`);
  }

  /**
   * List all agents for an owner
   */
  async listAgents(ownerAddress) {
    const agents = await db.all(
      'SELECT id, name, status, created_at, last_used_at FROM agent_keys WHERE owner_address = ?',
      [ownerAddress]
    );

    return agents;
  }

  /**
   * Generate secure API key
   */
  generateApiKey() {
    const prefix = 'cd_agent';
    const random = crypto.randomBytes(32).toString('hex');
    return `${prefix}_${random}`;
  }

  /**
   * Format policies from array to object
   */
  formatPolicies(policiesArray) {
    const formatted = {};
    for (const policy of policiesArray) {
      formatted[policy.policy_type] = policy.policy_value;
    }
    return formatted;
  }
}

module.exports = new AgentService();
