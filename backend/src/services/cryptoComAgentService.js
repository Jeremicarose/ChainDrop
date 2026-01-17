/**
 * Crypto.com AI Agent Service
 * Integrates with Crypto.com AI Agent SDK for blockchain operations
 * Used alongside Claude for hackathon compliance
 */

const { createClient } = require('@crypto.com/ai-agent-client');

class CryptoComAgentService {
  constructor() {
    this.client = null;
    this.enabled = false;
    this.chainId = process.env.CRONOS_CHAIN_ID || '338'; // Default to testnet

    this.init();
  }

  init() {
    try {
      // Create the Crypto.com AI Agent client
      // The SDK connects to Crypto.com's hosted AI agent service
      const explorerApiKey = process.env.CRONOS_EXPLORER_API_KEY;
      const openAiApiKey = process.env.OPENAI_API_KEY;

      if (explorerApiKey) {
        this.client = createClient({
          chain: {
            id: parseInt(this.chainId),
            name: this.chainId === '25' ? 'cronos-mainnet' : 'cronos-testnet',
            rpc: process.env.VITE_RPC_URL || 'https://evm-t3.cronos.org',
          },
          explorer: {
            apiKey: explorerApiKey,
          },
          openAI: openAiApiKey ? {
            apiKey: openAiApiKey,
          } : undefined,
        });
        this.enabled = true;
        console.log('🤖 Crypto.com AI Agent Service initialized (Chain ID:', this.chainId, ')');
      } else {
        console.log('⚠️  Crypto.com AI Agent running in mock mode (set CRONOS_EXPLORER_API_KEY)');
      }
    } catch (error) {
      console.log('⚠️  Crypto.com AI Agent SDK error:', error.message);
      this.enabled = false;
    }
  }

  /**
   * Check if service is enabled
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Query the Crypto.com AI Agent
   * @param {string} query - Natural language query
   * @param {object} context - Additional context (wallet, etc.)
   */
  async query(query, context = {}) {
    if (!this.enabled || !this.client) {
      return this.mockQuery(query, context);
    }

    try {
      console.log(`🤖 Crypto.com AI Agent query: "${query}"`);

      // Use the SDK's generateQuery method
      const response = await this.client.agent.generateQuery(query);

      console.log('🤖 Crypto.com AI Agent response:', response);

      return {
        success: true,
        message: response.message || 'Query processed',
        data: response.object || response,
        source: 'crypto.com-ai-agent'
      };
    } catch (error) {
      console.error('Crypto.com AI Agent error:', error.message);
      return this.mockQuery(query, context);
    }
  }

  /**
   * Get blockchain data via AI Agent
   * @param {string} dataType - Type of data (balance, block, gasPrice, etc.)
   * @param {object} params - Query parameters
   */
  async getBlockchainData(dataType, params = {}) {
    const queries = {
      balance: `What is the CRO balance of address ${params.address} on Cronos?`,
      latestBlock: 'What is the latest block number on Cronos?',
      gasPrice: 'What is the current gas price on Cronos?',
      txHistory: `Show me the recent transactions for address ${params.address} on Cronos`,
      tokenInfo: `What tokens does address ${params.address} hold on Cronos?`
    };

    const query = queries[dataType] || `Get ${dataType} for ${JSON.stringify(params)} on Cronos`;
    return this.query(query, params);
  }

  /**
   * Create an autonomous payment agent configuration
   * @param {object} config - Agent configuration
   */
  async createAutonomousAgent(config) {
    const {
      name,
      schedule,
      recipients,
      amount,
      token = 'CRO',
      conditions = []
    } = config;

    // Store agent config - in production, this would set up scheduled tasks
    const agent = {
      id: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      schedule,
      recipients: Array.isArray(recipients) ? recipients : [recipients],
      amount,
      token,
      conditions,
      status: 'active',
      createdAt: new Date().toISOString(),
      nextRun: this.calculateNextRun(schedule),
      chainId: this.chainId,
      source: 'crypto.com-ai-agent'
    };

    console.log(`🤖 Created autonomous agent: ${name} (${agent.id})`);
    console.log(`   Schedule: ${schedule}, Amount: ${amount} ${token}`);
    console.log(`   Recipients: ${agent.recipients.join(', ')}`);

    return agent;
  }

  /**
   * Calculate next run time based on schedule
   */
  calculateNextRun(schedule) {
    const now = new Date();
    switch (schedule) {
      case 'hourly':
        return new Date(now.getTime() + 60 * 60 * 1000).toISOString();
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      case 'monthly':
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        return nextMonth.toISOString();
      default:
        // Assume it's a cron expression or custom - default to daily
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    }
  }

  /**
   * Mock query for development/testing when SDK not configured
   */
  mockQuery(query, context) {
    console.log(`🤖 [Mock] Crypto.com AI Agent query: "${query}"`);
    const lowerQuery = query.toLowerCase();

    // Simulate responses for common queries
    if (lowerQuery.includes('balance')) {
      const address = context.address || context.walletAddress || '0x...';
      return {
        success: true,
        message: `Balance query received for ${address}. Configure CRONOS_EXPLORER_API_KEY for live data.`,
        data: {
          address,
          balance: '0.00',
          currency: 'CRO',
          mock: true
        },
        source: 'mock'
      };
    }

    if (lowerQuery.includes('block')) {
      return {
        success: true,
        message: 'Latest block on Cronos Testnet: Block data requires API key configuration.',
        data: {
          blockNumber: 'N/A',
          mock: true
        },
        source: 'mock'
      };
    }

    if (lowerQuery.includes('gas')) {
      return {
        success: true,
        message: 'Gas price on Cronos: Configure API keys for real-time data.',
        data: {
          gasPrice: '5000000000',
          unit: 'wei',
          mock: true
        },
        source: 'mock'
      };
    }

    if (lowerQuery.includes('send') || lowerQuery.includes('transfer')) {
      return {
        success: true,
        message: 'Transfer request noted. Use ChainDrop payment flow to execute actual transfers.',
        data: {
          action: 'transfer',
          status: 'use_chaindrop_api',
          mock: true
        },
        source: 'mock'
      };
    }

    return {
      success: true,
      message: `Crypto.com AI Agent (mock): "${query}" - Configure CRONOS_EXPLORER_API_KEY for live responses.`,
      data: { mock: true },
      source: 'mock'
    };
  }

  /**
   * Get service status for health check
   */
  getStatus() {
    return {
      enabled: this.enabled,
      chainId: this.chainId,
      network: this.chainId === '25' ? 'Cronos Mainnet' : 'Cronos Testnet',
      mode: this.enabled ? 'live' : 'mock',
      features: [
        'Natural language blockchain queries',
        'Balance & transaction lookups',
        'Autonomous payment agent config',
        'Cronos EVM integration'
      ]
    };
  }
}

module.exports = new CryptoComAgentService();
