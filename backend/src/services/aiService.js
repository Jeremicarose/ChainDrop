/**
 * AI Service for Natural Language Payment Parsing
 * Uses Claude API for intelligent payment intent extraction
 */

const Anthropic = require('@anthropic-ai/sdk');

class AIService {
  constructor() {
    this.client = null;
    this.enabled = false;

    if (process.env.ANTHROPIC_API_KEY) {
      this.client = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
      this.enabled = true;
      console.log('AI Service initialized with Claude API');
    } else {
      console.log('AI Service running in fallback mode (no ANTHROPIC_API_KEY)');
    }
  }

  /**
   * Parse a natural language payment request
   * @param {string} message - User`s natural language input
   * @param {object} context - Additional context (user info, previous messages)
   * @returns {object} Parsed payment intent
   */
  async parsePaymentIntent(message, context = {}) {
    if (!this.enabled) {
      return this.fallbackParse(message);
    }

    try {
      const systemPrompt = `You are an AI assistant for ChainDrop, a crypto payment platform that enables sending payments to anyone via eamil, phone , or Twitter - even if they don't have a wallet yet.
      
      `
    }
  }
}