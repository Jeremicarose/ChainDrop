/**
 * AI Service for Natural Language Payment Parsing
 * Uses Claude API for intelligent payment intent extraction
 * Supports USD-first UX with automatic conversion
 */

const Anthropic = require('@anthropic-ai/sdk');
const priceService = require('./priceService');

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
      return await this.fallbackParse(message);
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
      return await this.fallbackParse(message);
    }
  }

  /**
   * Fallback regex-based parsing when AI is unavailable
   * Improved to handle common payment formats including multiple recipients
   * Now supports USD-first UX with automatic conversion
   */
  async fallbackParse(message) {
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

      // Check if message uses USD ($ symbol or "dollars")
      const isUsdBulk = message.includes('$') || lowerMessage.includes('dollar') || lowerMessage.includes('usd');

      // Split message by common separators to isolate each recipient's section
      const segments = message.split(/\s+and\s+|,\s*/i);

      for (const email of emailMatches) {
        const segment = segments.find(s => s.includes(email)) || '';
        const emailIndex = segment.indexOf(email);
        const afterEmail = segment.substring(emailIndex + email.length);
        const beforeEmail = segment.substring(0, emailIndex);

        // Look for USD amount first ($X)
        let usdMatch = afterEmail.match(/\$\s*(\d+(?:\.\d+)?)/);
        if (!usdMatch) {
          usdMatch = beforeEmail.match(/\$\s*(\d+(?:\.\d+)?)/);
        }

        // Look for CRO amount
        let croMatch = afterEmail.match(/(\d+(?:\.\d+)?)\s*(?:CRO|cro)/);
        if (!croMatch) {
          croMatch = beforeEmail.match(/(\d+(?:\.\d+)?)\s*(?:CRO|cro)/);
        }

        // Generic number match
        let genericMatch = afterEmail.match(/(\d+(?:\.\d+)?)/);
        if (!genericMatch) {
          genericMatch = beforeEmail.match(/(\d+(?:\.\d+)?)/);
        }

        let amountCro = null;
        let amountUsd = null;

        if (usdMatch) {
          amountUsd = parseFloat(usdMatch[1]);
          amountCro = await priceService.usdToCro(amountUsd);
        } else if (croMatch) {
          amountCro = parseFloat(croMatch[1]);
          amountUsd = await priceService.croToUsd(amountCro);
        } else if (genericMatch && isUsdBulk) {
          // If message has $ somewhere, treat generic numbers as USD
          amountUsd = parseFloat(genericMatch[1]);
          amountCro = await priceService.usdToCro(amountUsd);
        } else if (genericMatch) {
          amountCro = parseFloat(genericMatch[1]);
          amountUsd = await priceService.croToUsd(amountCro);
        }

        result.data.recipients.push({
          recipient: email,
          recipientType: 'email',
          amount: amountCro,
          amountUsd: amountUsd
        });
      }

      // Check if all recipients have amounts
      const hasAllAmounts = result.data.recipients.every(r => r.amount && r.amount > 0);

      if (!hasAllAmounts) {
        // Try to find a global amount (e.g., "$5 each")
        const globalUsdMatch = message.match(/\$\s*(\d+(?:\.\d+)?)\s*(?:each|per|to all)/i);
        const globalCroMatch = message.match(/(\d+(?:\.\d+)?)\s*(?:CRO)?\s*(?:each|per|to all)/i);

        if (globalUsdMatch) {
          const globalUsd = parseFloat(globalUsdMatch[1]);
          const globalCro = await priceService.usdToCro(globalUsd);
          result.data.recipients = result.data.recipients.map(r => ({
            ...r,
            amount: r.amount || globalCro,
            amountUsd: r.amountUsd || globalUsd
          }));
        } else if (globalCroMatch) {
          const globalCro = parseFloat(globalCroMatch[1]);
          const globalUsd = await priceService.croToUsd(globalCro);
          result.data.recipients = result.data.recipients.map(r => ({
            ...r,
            amount: r.amount || globalCro,
            amountUsd: r.amountUsd || globalUsd
          }));
        }
      }

      // Validate bulk payment
      const validRecipients = result.data.recipients.filter(r => r.amount && r.amount > 0);
      if (validRecipients.length > 0) {
        result.data.recipients = validRecipients;
        const totalCro = validRecipients.reduce((sum, r) => sum + r.amount, 0);
        const totalUsd = validRecipients.reduce((sum, r) => sum + (r.amountUsd || 0), 0);

        // USD-first display
        const displayAmount = totalUsd > 0
          ? `$${totalUsd.toFixed(2)} (${totalCro.toFixed(4)} CRO)`
          : `${totalCro.toFixed(4)} CRO`;

        result.message = `Ready to send **${displayAmount}** to ${validRecipients.length} recipients. Type "yes" to confirm.`;
        result.confidence = 0.8;
      } else {
        result.type = 'clarification';
        result.message = `Found ${emailMatches.length} recipients but couldn't determine amounts. Please specify amounts, e.g., "Send $5 each to alice@email.com and bob@email.com"`;
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

    // Extract amount - USD-first with automatic conversion
    let amountInCro = null;
    let amountInUsd = null;
    let inputCurrency = 'CRO';

    // Pattern 1: USD format - "$X", "X dollars", "X USD" (PRIORITY)
    const usdMatch = message.match(/\$\s*(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*(?:dollars?|USD)/i);
    if (usdMatch) {
      const usdAmount = parseFloat(usdMatch[1] || usdMatch[2]);
      amountInUsd = usdAmount;
      // Convert USD to CRO
      amountInCro = await priceService.usdToCro(usdAmount);
      inputCurrency = 'USD';
    }

    // Pattern 2: "X CRO" or other crypto
    if (!amountInCro) {
      const croMatch = message.match(/(\d+(?:\.\d+)?)\s*(?:CRO|USDC|ETH|USDT)/i);
      if (croMatch) {
        amountInCro = parseFloat(croMatch[1]);
        amountInUsd = await priceService.croToUsd(amountInCro);
      }
    }

    // Pattern 3: Just a number in context of payment (default to USD for user-friendliness)
    if (!amountInCro && (lowerMessage.includes('send') || lowerMessage.includes('pay'))) {
      const payMatch = message.match(/(?:send|pay)[^0-9]*(\d+(?:\.\d+)?)/i);
      if (payMatch) {
        // Assume USD if no currency specified (user-friendly default)
        const amount = parseFloat(payMatch[1]);
        if (amount >= 1) {
          // Likely USD if >= 1 (e.g., "send 5 to bob" means $5)
          amountInUsd = amount;
          amountInCro = await priceService.usdToCro(amount);
          inputCurrency = 'USD';
        } else {
          // Small amounts likely CRO (e.g., "send 0.5 to bob")
          amountInCro = amount;
          amountInUsd = await priceService.croToUsd(amount);
        }
      }
    }

    // Pattern 4: Any standalone number
    if (!amountInCro) {
      const numbers = message.match(/\d+(?:\.\d+)?/g);
      if (numbers && numbers.length > 0) {
        for (const num of numbers) {
          if (!result.data.recipient || !result.data.recipient.includes(num)) {
            const amount = parseFloat(num);
            // Default to USD for user-friendliness
            amountInUsd = amount;
            amountInCro = await priceService.usdToCro(amount);
            inputCurrency = 'USD';
            break;
          }
        }
      }
    }

    if (amountInCro) {
      result.data.amount = amountInCro;
      result.data.amountUsd = amountInUsd;
      result.data.inputCurrency = inputCurrency;
    }

    // Extract token
    const tokenMatch = message.match(/\b(CRO|USDC|ETH|USDT)\b/i);
    if (tokenMatch) {
      result.data.token = tokenMatch[1].toUpperCase();
    } else {
      result.data.token = 'CRO';
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
      result.message = `Please provide: ${result.missing.join(' and ')}. Example: "Send $5 to alice@email.com"`;
      result.confidence = 0.3;
    } else {
      // USD-first display
      const usdDisplay = result.data.amountUsd ? `$${result.data.amountUsd.toFixed(2)}` : '';
      const croDisplay = `${result.data.amount.toFixed(4)} CRO`;
      const amountDisplay = usdDisplay ? `${usdDisplay} (${croDisplay})` : croDisplay;
      result.message = `Ready to send **${amountDisplay}** to ${result.data.recipient}${result.data.note ? ` for "${result.data.note}"` : ''}. Type "yes" to confirm.`;
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
