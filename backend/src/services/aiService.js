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
      
  Your job is to parse natural language payment requests and extract structured payment data.
  
  IMPORTANT RULES:
  1. Extract the recipient identifier (email, phone, or Twitter handle)
  2. Extract the amount (numeric value)
  3. Identify the token (default to CRO if not specified)
  4. Extract any note/purpose for the payment
  5. Determine if this is a single payment or bulk payment request
  6. If information is missing, ask for clarification
  
  RESPOND ONLY WITH VALID JSON in this format:
  {
    "type": "payment" | "bulk_payment" | "clarification" | "error",
    "confidence": 0.0-1.0,
    "data": {
      "recipient": "email/phone/twitter or null",
      "recipientType": "email" | "phone" | "twitter" | null,
      "amount": number or null,
      "token": "CRO" | "USDC" | etc,
      "note": "purpose/note or null",
      "recipients": [] // for bulk payments
    },
    "message": "Human-readabl response",
    "missing": ["what's missing if clarification needed"]
  }

    Examples:
    - "Send 5 CRO to alice@company.com" -> payment with recipient, amount
    - "Pay @alice_twitter 10 for the design" -> payment, twitter recipient
    - "Send money to the team" -> clarification needed (who? how much?)
    - "Pay these people: bob@test.com 5, carol@test.com 3" -> bulk_payment`;

        const response = await this.client.messages.create({
          model: 'claude-3-5haiku-20241022',
          max_tokens: 1024,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: `Parse this payment request: "${message}"
              
Context:
- User wallet: ${}              `
            }
          ]
        })
    }
  }
}