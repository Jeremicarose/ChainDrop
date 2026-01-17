/**
 * Crypto.com AI Agent Service
 * Integrates with Crypto.com AI Agent SDK for blockchain operations
 * Used alongside Claude for hackathon compliance
 */

let CryptoComClient = null;

class CryptoComAgentService {
  constructor() {
    this.client = null;
    this.enabled = false;
    this.chainId = process.env.CRONOS_CHAIN_ID || '338'; // Default to testnet

    this.init();
  }

  async init() {
    try {
      // Dynamic import for the Crypto.com AI Agent Client
      const cryptoComModule = await import('@crypto.com/ai-agent-client');
      CryptoComClient = cryptoComModule.createClient || cryptoComModule.default?.createClient;

      if (CryptoComClient && process.env.CRYPTO_COM_API_KEY) {
        this.client = CryptoComClient({
          openAI: {
            apiKey: process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY,
          },
          chain: {
            id: parseInt(this.chainId),
            rpc: process.env.VITE_RPC_URL || 'https://evm-t3.cronos.org',
          },
          explorer: {
            apiKey: process.env.CRONOS_EXPLORER_API_KEY,
          }
        });
        this.enabled = true;
        console.log('🤖 Crypto.com AI Agent Service initialized');
      } else {
        console.log('⚠️  Crypto.com AI Agent running in mock mode (missing API keys)');
      }
    } catch (error) {
      console.log('⚠️  Crypto.com AI Agent SDK not available:', error.message);
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
    if (!this.enabled) {
      return this.mockQuery(query, context);
    }

    try {
      const response = await this.client.query({
        query,
        walletAddress: context.walletAddress,
        chainId: this.chainId
      });

      return {
        success: true,
        response: response.message || response,
        actions: response.actions || [],
        source: 'crypto.com-ai-agent'
      };
    } catch (error) {
      console.error('Crypto.com AI Agent error:', error);
      return this.mockQuery(query, context);
    }
  }

  /**
   * Execute a blockchain action via AI Agent
   * @param {string} action - Action type (transfer, swap, etc.)
   * @param {object} params - Action parameters
   */
  async executeAction(action, params) {
    if (!this.enabled) {
      return {
        success: false,
        error: 'Crypto.com AI Agent not configured',
        mock: true
      };
    }

    try {
      const response = await this.client.execute({
        action,
        params,
        chainId: this.chainId
      });

      return {
        success: true,
        txHash: response.txHash,
        result: response,
        source: 'crypto.com-ai-agent'
      };
    } catch (error) {
      console.error('Crypto.com AI Agent execution error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get blockchain data via AI Agent
   * @param {string} dataType - Type of data (balance, txHistory, etc.)
   * @param {object} params - Query parameters
   */
  async getBlockchainData(dataType, params = {}) {
    const queries = {
      balance: `What is the CRO balance of ${params.address}?`,
      latestBlock: 'What is the latest block on Cronos?',
      gasPrice: 'What is the current gas price on Cronos?',
      txHistory: `Show me the recent transactions for ${params.address}`
    };

    const query = queries[dataType] || `Get ${dataType} for ${JSON.stringify(params)}`;
    return this.query(query, params);
  }

  /**
   * Create an autonomous payment agent
   * @param {object} config - Agent configuration
   */
  async createAutonomousAgent(config) {
    const {
      name,
      schedule, // 'daily', 'weekly', 'monthly', or cron expression
      recipients,
      amount,
      token = 'CRO',
      conditions = []
    } = config;

    // For now, store agent config and return it
    // In production, this would set up scheduled tasks
    const agent = {
      id: `agent_${Date.now()}`,
      name,
      schedule,
      recipients,
      amount,
      token,
      conditions,
      status: 'active',
      createdAt: new Date().toISOString(),
      nextRun: this.calculateNextRun(schedule),
      source: 'crypto.com-ai-agent'
    };

    console.log(`🤖 Created autonomous agent: ${name}`);
    return agent;
  }

  /**
   * Calculate next run time based on schedule
   */
  calculateNextRun(schedule) {
    const now = new Date();
    switch (schedule) {
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      case 'monthly':
        return new Date(now.setMonth(now.getMonth() + 1)).toISOString();
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    }
  }

  /**
   * Mock query for development/testing
   */
  mockQuery(query, context) {
    console.log(`🤖 [Mock] Crypto.com AI Agent query: ${query}`);

    // Parse common queries
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('balance')) {
      return {
        success: true,
        response: `Balance query for ${context.walletAddress || 'wallet'}: This is a mock response. Configure CRYPTO_COM_API_KEY for real data.`,
        mock: true,
        source: 'mock'
      };
    }

    if (lowerQuery.includes('block')) {
      return {
        success: true,
        response: 'Latest block: #12345678 (mock). Configure API keys for real data.',
        mock: true,
        source: 'mock'
      };
    }

    if (lowerQuery.includes('send') || lowerQuery.includes('transfer')) {
      return {
        success: true,
        response: 'Transfer request received. Use ChainDrop transfer API for actual transactions.',
        actions: [{
          type: 'transfer',
          status: 'mock'
        }],
        mock: true,
        source: 'mock'
      };
    }

    return {
      success: true,
      response: `Crypto.com AI Agent (mock mode): "${query}" - Configure API keys for real responses.`,
      mock: true,
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
      mode: this.enabled ? 'live' : 'mock',
      features: [
        'Natural language blockchain queries',
        'Autonomous payment agents',
        'Multi-chain support (Cronos EVM/zkEVM)'
      ]
    };
  }
}

module.exports = new CryptoComAgentService();
