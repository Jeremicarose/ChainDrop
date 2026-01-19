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
      console.log('🤖 AI Service initialized with Claude API');
    } else {
      console.log('⚠️  AI Service running in fallback mode (no ANTHROPIC_API_KEY)');
    }
  }

  /**
   * Parse a natural language payment request
   * @param {string} message - User's natural language input
   * @param {object} context - Additional context (user info, previous messages)
   * @returns {object} Parsed payment intent
   */
  async parsePaymentIntent(message, context = {}) {
    if (!this.enabled) {
      return this.fallbackParse(message);
    }

    try {
      const systemPrompt = `You are an AI assistant for ChainDrop, a crypto payment platform that enables sending payments to anyone via email, phone, or Twitter - even if they don't have a wallet yet.

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
  "message": "Human-readable response",
  "missing": ["what's missing if clarification needed"]
}

Examples:
- "Send 5 CRO to alice@company.com" → payment with recipient, amount
- "Pay @alice_twitter 10 for the design" → payment, twitter recipient
- "Send money to the team" → clarification needed (who? how much?)
- "Pay these people: bob@test.com 5, carol@test.com 3" → bulk_payment`;

      const response = await this.client.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Parse this payment request: "${message}"

Context:
- User wallet: ${context.walletAddress || 'unknown'}
- Previous messages: ${context.history ? context.history.slice(-3).join('; ') : 'none'}
- Available balance: ${context.balance || 'unknown'} CRO`
          }
        ]
      });

      // Parse the JSON response
      const content = response.content[0].text;

      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          ...parsed
        };
      }

      // If no JSON found, return error
      return {
        success: false,
        type: 'error',
        message: 'Could not parse AI response',
        raw: content
      };

    } catch (error) {
      console.error('AI parsing error:', error);

      // Fall back to regex parsing
      return this.fallbackParse(message);
    }
  }

  /**
   * Fallback regex-based parsing when AI is unavailable
   * Improved to handle common payment formats including multiple recipients
   */
  fallbackParse(message) {
    const result = {
      success: true,
      type: 'payment',
      confidence: 0.6,
      data: {
        recipient: null,
        recipientType: null,
        amount: null,
        token: 'CRO',
        note: null,
        recipients: []
      },
      message: '',
      missing: []
    };

    const lowerMessage = message.toLowerCase();

    // Check for multiple recipients pattern: "email1 X, email2 Y" or "X to email1 and Y to email2"
    const emailMatches = message.match(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/g);

    if (emailMatches && emailMatches.length > 1) {
      // Multiple recipients detected - parse as bulk payment
      result.type = 'bulk_payment';
      result.data.recipients = [];

      // Try to extract amount for each recipient
      // Pattern: "email amount" or "amount to email" or "email, amount"
      for (const email of emailMatches) {
        // Look for amount near this email
        const emailIndex = message.indexOf(email);
        const surroundingText = message.substring(Math.max(0, emailIndex - 30), Math.min(message.length, emailIndex + email.length + 30));

        // Extract amount from surrounding text
        const amountMatch = surroundingText.match(/(\d+(?:\.\d+)?)\s*(?:CRO|USDC|ETH|USDT)?/i);
        const amount = amountMatch ? parseFloat(amountMatch[1]) : null;

        result.data.recipients.push({
          recipient: email,
          recipientType: 'email',
          amount: amount
        });
      }

      // Check if all recipients have amounts
      const hasAllAmounts = result.data.recipients.every(r => r.amount && r.amount > 0);

      if (!hasAllAmounts) {
        // Try to find a single amount to apply to all
        const globalAmountMatch = message.match(/(\d+(?:\.\d+)?)\s*(?:CRO|each|per)/i);
        if (globalAmountMatch) {
          const globalAmount = parseFloat(globalAmountMatch[1]);
          result.data.recipients = result.data.recipients.map(r => ({
            ...r,
            amount: r.amount || globalAmount
          }));
        }
      }

      // Validate bulk payment
      const validRecipients = result.data.recipients.filter(r => r.amount && r.amount > 0);
      if (validRecipients.length > 0) {
        result.data.recipients = validRecipients;
        const totalAmount = validRecipients.reduce((sum, r) => sum + r.amount, 0);
        result.message = `Ready to send ${totalAmount} CRO to ${validRecipients.length} recipients. Type "yes" to confirm.`;
        result.confidence = 0.8;
      } else {
        result.type = 'clarification';
        result.message = `Found ${emailMatches.length} recipients but couldn't determine amounts. Please specify amounts, e.g., "Send 5 CRO each to alice@email.com and bob@email.com"`;
        result.confidence = 0.4;
      }

      return result;
    }

    // Single recipient flow (original logic)
    // Extract email (most common) - improved regex
    const emailMatch = message.match(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) {
      result.data.recipient = emailMatch[0];
      result.data.recipientType = 'email';
    }

    // Extract Twitter handle (only if no email found)
    if (!result.data.recipient) {
      const twitterMatch = message.match(/@([a-zA-Z_][a-zA-Z0-9_]{0,14})/);
      if (twitterMatch && !twitterMatch[0].includes('.')) {
        result.data.recipient = twitterMatch[0];
        result.data.recipientType = 'twitter';
      }
    }

    // Extract phone number (only if no email/twitter found)
    if (!result.data.recipient) {
      const phoneMatch = message.match(/\+?[\d\s()-]{10,}/);
      if (phoneMatch) {
        result.data.recipient = phoneMatch[0].replace(/[\s()-]/g, '');
        result.data.recipientType = 'phone';
      }
    }

    // Extract amount - multiple patterns
    // Pattern 1: "X CRO" or "X USDC"
    let amountMatch = message.match(/(\d+(?:\.\d+)?)\s*(?:CRO|USDC|ETH|USDT)/i);

    // Pattern 2: "$X" or "X dollars"
    if (!amountMatch) {
      amountMatch = message.match(/\$\s*(\d+(?:\.\d+)?)/);
    }

    // Pattern 3: Just a number in context of payment
    if (!amountMatch && (lowerMessage.includes('send') || lowerMessage.includes('pay'))) {
      amountMatch = message.match(/(?:send|pay)[^0-9]*(\d+(?:\.\d+)?)/i);
    }

    // Pattern 4: Any standalone number
    if (!amountMatch) {
      const numbers = message.match(/\d+(?:\.\d+)?/g);
      if (numbers && numbers.length > 0) {
        // Take the first number that looks like an amount (not part of email)
        for (const num of numbers) {
          if (!result.data.recipient || !result.data.recipient.includes(num)) {
            amountMatch = [null, num];
            break;
          }
        }
      }
    }

    if (amountMatch && amountMatch[1]) {
      result.data.amount = parseFloat(amountMatch[1]);
    }

    // Extract token
    const tokenMatch = message.match(/\b(CRO|USDC|ETH|USDT)\b/i);
    if (tokenMatch) {
      result.data.token = tokenMatch[1].toUpperCase();
    }

    // Extract note/purpose - "for X"
    const forMatch = message.match(/\bfor\s+(.+?)(?:\.|,|$)/i);
    if (forMatch) {
      let note = forMatch[1].trim();
      // Clean up the note (remove amount/token if captured)
      note = note.replace(/\d+(?:\.\d+)?\s*(?:CRO|USDC|ETH|USDT)?/gi, '').trim();
      if (note) {
        result.data.note = note;
      }
    }

    // Determine what's missing
    if (!result.data.recipient) {
      result.missing.push('recipient (email, phone, or @twitter)');
    }
    if (!result.data.amount || result.data.amount <= 0) {
      result.missing.push('amount');
    }

    // Set response type and message
    if (result.missing.length > 0) {
      result.type = 'clarification';
      result.message = `Please provide: ${result.missing.join(' and ')}. Example: "Send 5 CRO to alice@email.com"`;
      result.confidence = 0.3;
    } else {
      result.message = `Ready to send ${result.data.amount} ${result.data.token} to ${result.data.recipient}${result.data.note ? ` for "${result.data.note}"` : ''}. Type "yes" to confirm.`;
      result.confidence = 0.85;
    }

    return result;
  }

  /**
   * Generate a conversational response for payment flow
   */
  async generateResponse(context, paymentResult) {
    if (!this.enabled) {
      return this.generateFallbackResponse(paymentResult);
    }

    try {
      const response = await this.client.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 256,
        system: `You are a friendly AI assistant for ChainDrop payments. Keep responses brief and helpful. Use casual, friendly tone. Include relevant emojis sparingly.`,
        messages: [
          {
            role: 'user',
            content: `Generate a brief response for this payment action:
Action: ${paymentResult.success ? 'Payment sent successfully' : 'Payment failed'}
Amount: ${paymentResult.amount} ${paymentResult.token || 'CRO'}
Recipient: ${paymentResult.recipient}
${paymentResult.error ? `Error: ${paymentResult.error}` : ''}
${paymentResult.claimLink ? `Claim link: ${paymentResult.claimLink}` : ''}`
          }
        ]
      });

      return response.content[0].text;
    } catch (error) {
      return this.generateFallbackResponse(paymentResult);
    }
  }

  /**
   * Fallback response generation
   */
  generateFallbackResponse(paymentResult) {
    if (paymentResult.success) {
      return `✅ Sent ${paymentResult.amount} ${paymentResult.token || 'CRO'} to ${paymentResult.recipient}! They'll get an email with a claim link.`;
    } else {
      return `❌ Payment failed: ${paymentResult.error || 'Unknown error'}. Please try again.`;
    }
  }

  /**
   * Parse bulk payment CSV/text input
   */
  async parseBulkPayments(input) {
    const lines = input.trim().split('\n').filter(line => line.trim());
    const payments = [];
    const errors = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Try CSV format: email,amount
      const csvMatch = line.match(/^([^,]+),\s*(\d+(?:\.\d+)?)/);
      if (csvMatch) {
        const [, recipient, amount] = csvMatch;

        // Validate recipient format
        let recipientType = null;
        if (recipient.includes('@') && recipient.includes('.')) {
          recipientType = 'email';
        } else if (recipient.startsWith('@')) {
          recipientType = 'twitter';
        } else if (/^\+?\d{10,}$/.test(recipient.replace(/[\s-]/g, ''))) {
          recipientType = 'phone';
        }

        if (recipientType && parseFloat(amount) > 0) {
          payments.push({
            recipient: recipient.trim(),
            recipientType,
            amount: parseFloat(amount),
            line: i + 1
          });
        } else {
          errors.push({ line: i + 1, text: line, error: 'Invalid format' });
        }
      } else {
        errors.push({ line: i + 1, text: line, error: 'Could not parse' });
      }
    }

    return {
      success: errors.length === 0,
      payments,
      errors,
      total: payments.reduce((sum, p) => sum + p.amount, 0),
      count: payments.length
    };
  }

  /**
   * Smart suggestions based on context
   */
  async getSuggestions(context) {
    // Return common payment suggestions
    const suggestions = [
      { text: 'Send 5 CRO to...', description: 'Quick payment' },
      { text: 'Pay my team', description: 'Bulk payment' },
      { text: 'Refund last payment', description: 'Refund' },
    ];

    // Add recent recipients if available
    if (context.recentRecipients) {
      context.recentRecipients.slice(0, 3).forEach(r => {
        suggestions.unshift({
          text: `Send to ${r}`,
          description: 'Recent recipient'
        });
      });
    }

    return suggestions.slice(0, 5);
  }
}

module.exports = new AIService();
