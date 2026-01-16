/**
 * AI Controller
 * Handles AI-powered natural language payment parsing
 */

const aiService = require('../services/aiService');
const transferService = require('../services/transferService');

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
      const { message, context, senderAddress, autoExecute } = req.body;

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

      // Validate required fields
      if (!parsed.data.recipient || !parsed.data.amount) {
        return res.json({
          success: true,
          executed: false,
          type: 'clarification',
          ...parsed,
          message: 'Missing required payment details'
        });
      }

      // Execute the payment
      const paymentResult = await transferService.createTransfer(
        senderAddress,
        parsed.data.recipient,
        parsed.data.recipientType || 'email',
        parsed.data.amount.toString(),
        null // tokenAddress - null for native CRO
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
  }
};

module.exports = aiController;
