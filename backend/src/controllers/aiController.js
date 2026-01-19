/**
 * AI Controller
 * Handles AI-powered natural language payment parsing
 * Integrates Claude (intent parsing) + Crypto.com AI Agent (blockchain ops)
 */

const aiService = require('../services/aiService');
const transferService = require('../services/transferService');
const cryptoComAgent = require('../services/cryptoComAgentService');

const aiController = {
  /**
   * POST /api/ai/parse
   * Parse a natural language payment request
   */
  async parse(req, res) {
    try {
      const { message, context } = req.body;

      if (!message) {
        return res.status(400).json({
          success: false,
          error: 'Message is required'
        });
      }

      const result = await aiService.parsePaymentIntent(message, context || {});

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('AI parse error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to parse message',
        message: error.message
      });
    }
  },

  /**
   * POST /api/ai/execute
   * Parse AND execute a payment in one call
   */
  async execute(req, res) {
    try {
      const { message, context, senderAddress, senderEmail, autoExecute } = req.body;

      if (!message || !senderAddress) {
        return res.status(400).json({
          success: false,
          error: 'Message and senderAddress are required'
        });
      }

      // First, parse the intent
      const parsed = await aiService.parsePaymentIntent(message, context || {});

      // If clarification needed, return without executing
      if (parsed.type === 'clarification' || parsed.type === 'error') {
        return res.json({
          success: true,
          executed: false,
          ...parsed
        });
      }

      // If auto-execute is disabled, just return parsed data
      if (!autoExecute) {
        return res.json({
          success: true,
          executed: false,
          ...parsed,
          message: `Ready to send ${parsed.data.amount} ${parsed.data.token} to ${parsed.data.recipient}. Confirm?`
        });
      }

      // Handle bulk payments (multiple recipients)
      if (parsed.type === 'bulk_payment' && parsed.data.recipients && parsed.data.recipients.length > 0) {
        const results = [];
        const errors = [];

        for (const recipient of parsed.data.recipients) {
          try {
            const paymentResult = await transferService.createTransfer(
              senderAddress,
              recipient.recipient || recipient.email,
              recipient.recipientType || 'email',
              (recipient.amount || parsed.data.amount).toString(),
              null, // tokenAddress - null for native CRO
              senderEmail
            );
            results.push({
              recipient: recipient.recipient || recipient.email,
              amount: recipient.amount || parsed.data.amount,
              success: true,
              claimLink: paymentResult.claimLink
            });
          } catch (error) {
            errors.push({
              recipient: recipient.recipient || recipient.email,
              error: error.message
            });
          }
        }

        const totalSent = results.reduce((sum, r) => sum + parseFloat(r.amount), 0);
        const aiResponse = `Sent ${totalSent} CRO to ${results.length} recipient(s). ${errors.length > 0 ? `${errors.length} failed.` : ''}`;

        return res.json({
          success: true,
          executed: true,
          type: 'bulk_payment_complete',
          payments: results,
          errors,
          totalSent,
          message: aiResponse
        });
      }

      // Validate required fields for single payment
      if (!parsed.data.recipient || !parsed.data.amount) {
        return res.json({
          success: true,
          executed: false,
          type: 'clarification',
          ...parsed,
          message: 'Missing required payment details'
        });
      }

      // Execute the single payment
      const paymentResult = await transferService.createTransfer(
        senderAddress,
        parsed.data.recipient,
        parsed.data.recipientType || 'email',
        parsed.data.amount.toString(),
        null, // tokenAddress - null for native CRO
        senderEmail
      );

      // Generate AI response
      const aiResponse = await aiService.generateResponse(context, {
        success: true,
        amount: parsed.data.amount,
        token: parsed.data.token,
        recipient: parsed.data.recipient,
        claimLink: paymentResult.claimLink
      });

      res.json({
        success: true,
        executed: true,
        type: 'payment_complete',
        parsed: parsed.data,
        payment: paymentResult,
        message: aiResponse
      });

    } catch (error) {
      console.error('AI execute error:', error);

      // Generate error response
      const errorMessage = await aiService.generateResponse({}, {
        success: false,
        error: error.message
      });

      res.status(500).json({
        success: false,
        executed: false,
        error: error.message,
        message: errorMessage
      });
    }
  },

  /**
   * POST /api/ai/bulk-parse
   * Parse bulk payment input (CSV or text)
   */
  async bulkParse(req, res) {
    try {
      const { input } = req.body;

      if (!input) {
        return res.status(400).json({
          success: false,
          error: 'Input is required'
        });
      }

      const result = await aiService.parseBulkPayments(input);

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('Bulk parse error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to parse bulk input',
        message: error.message
      });
    }
  },

  /**
   * GET /api/ai/suggestions
   * Get smart payment suggestions
   */
  async suggestions(req, res) {
    try {
      const { walletAddress } = req.query;

      // Get recent recipients for context
      let recentRecipients = [];
      if (walletAddress) {
        try {
          const transfers = await transferService.getTransfersBySender(walletAddress);
          recentRecipients = [...new Set(
            transfers.slice(0, 10).map(t => t.recipient_identifier)
          )];
        } catch (e) {
          // Ignore errors
        }
      }

      const suggestions = await aiService.getSuggestions({ recentRecipients });

      res.json({
        success: true,
        suggestions
      });
    } catch (error) {
      console.error('Suggestions error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get suggestions'
      });
    }
  },

  /**
   * POST /api/ai/chat
   * Conversational payment interface
   */
  async chat(req, res) {
    try {
      const { messages, senderAddress } = req.body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Messages array is required'
        });
      }

      // Get the last user message
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role !== 'user') {
        return res.status(400).json({
          success: false,
          error: 'Last message must be from user'
        });
      }

      // Build context from conversation history
      const context = {
        walletAddress: senderAddress,
        history: messages.slice(-5).map(m => `${m.role}: ${m.content}`)
      };

      // Parse the intent
      const parsed = await aiService.parsePaymentIntent(lastMessage.content, context);

      // Build response
      const response = {
        role: 'assistant',
        content: parsed.message,
        parsed: parsed.type === 'payment' ? parsed.data : null,
        type: parsed.type,
        confidence: parsed.confidence
      };

      res.json({
        success: true,
        response,
        canExecute: parsed.type === 'payment' && parsed.data.recipient && parsed.data.amount
      });

    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({
        success: false,
        error: 'Chat failed',
        message: error.message
      });
    }
  },

  /**
   * POST /api/ai/agent/query
   * Query the Crypto.com AI Agent for blockchain data
   */
  async agentQuery(req, res) {
    try {
      const { query, walletAddress } = req.body;

      if (!query) {
        return res.status(400).json({
          success: false,
          error: 'Query is required'
        });
      }

      const result = await cryptoComAgent.query(query, { walletAddress });

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('Agent query error:', error);
      res.status(500).json({
        success: false,
        error: 'Agent query failed',
        message: error.message
      });
    }
  },

  /**
   * POST /api/ai/agent/autonomous
   * Create an autonomous payment agent
   */
  async createAutonomousAgent(req, res) {
    try {
      const { name, schedule, recipients, amount, token, conditions } = req.body;

      if (!name || !schedule || !recipients || !amount) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: name, schedule, recipients, amount'
        });
      }

      const agent = await cryptoComAgent.createAutonomousAgent({
        name,
        schedule,
        recipients,
        amount,
        token,
        conditions
      });

      res.json({
        success: true,
        agent
      });
    } catch (error) {
      console.error('Create autonomous agent error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create autonomous agent',
        message: error.message
      });
    }
  },

  /**
   * GET /api/ai/status
   * Get AI services status
   */
  async status(req, res) {
    try {
      const claudeStatus = aiService.enabled ? 'online' : 'fallback';
      const cryptoComStatus = cryptoComAgent.getStatus();

      res.json({
        success: true,
        services: {
          claude: {
            status: claudeStatus,
            purpose: 'Natural language intent parsing'
          },
          cryptoCom: {
            status: cryptoComStatus.enabled ? 'online' : 'mock',
            mode: cryptoComStatus.mode,
            chainId: cryptoComStatus.chainId,
            purpose: 'Blockchain operations & autonomous agents',
            features: cryptoComStatus.features
          }
        },
        hackathonCompliance: {
          anthropicSdk: true,
          cryptoComSdk: cryptoComStatus.enabled,
          cronosIntegration: true
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get status'
      });
    }
  }
};

module.exports = aiController;
