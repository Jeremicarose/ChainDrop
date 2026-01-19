/**
 * Price Service
 * Fetches real-time crypto prices and handles USD conversions
 */

class PriceService {
  constructor() {
    this.cache = {};
    this.cacheTimeout = 60000; // 1 minute cache
    this.defaultCroPrice = 0.07; // Fallback price if API fails
  }

  /**
   * Get CRO price in USD
   */
  async getCroPrice() {
    const cached = this.cache['CRO'];
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.price;
    }

    try {
      // Use CoinGecko free API
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=crypto-com-chain&vs_currencies=usd'
      );
      const data = await response.json();
      const price = data['crypto-com-chain']?.usd || this.defaultCroPrice;

      this.cache['CRO'] = {
        price,
        timestamp: Date.now()
      };

      console.log(`💰 CRO price updated: $${price}`);
      return price;
    } catch (error) {
      console.error('Price fetch error:', error.message);
      return this.cache['CRO']?.price || this.defaultCroPrice;
    }
  }

  /**
   * Convert CRO amount to USD
   */
  async croToUsd(croAmount) {
    const price = await this.getCroPrice();
    return parseFloat(croAmount) * price;
  }

  /**
   * Convert USD amount to CRO
   */
  async usdToCro(usdAmount) {
    const price = await this.getCroPrice();
    return parseFloat(usdAmount) / price;
  }

  /**
   * Format USD amount for display
   */
  formatUsd(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Format CRO amount for display
   */
  formatCro(amount) {
    return `${parseFloat(amount).toFixed(4)} CRO`;
  }

  /**
   * Get display string with both USD and CRO
   * e.g., "$5.00 (71.43 CRO)"
   */
  async getDisplayAmount(croAmount) {
    const usdAmount = await this.croToUsd(croAmount);
    return {
      cro: parseFloat(croAmount),
      usd: usdAmount,
      display: `${this.formatUsd(usdAmount)} (${this.formatCro(croAmount)})`,
      displayUsdOnly: this.formatUsd(usdAmount),
      displayCroOnly: this.formatCro(croAmount)
    };
  }

  /**
   * Parse user input amount (handles both "$5" and "5 CRO")
   * Returns amount in CRO
   */
  async parseAmount(input) {
    const str = String(input).trim();

    // Check for USD format: "$5", "5 USD", "5 dollars"
    const usdMatch = str.match(/^\$?\s*(\d+(?:\.\d+)?)\s*(?:USD|dollars?)?$/i);
    if (usdMatch || str.startsWith('$')) {
      const usdAmount = parseFloat(usdMatch ? usdMatch[1] : str.replace('$', ''));
      const croAmount = await this.usdToCro(usdAmount);
      return {
        original: str,
        usd: usdAmount,
        cro: croAmount,
        currency: 'USD'
      };
    }

    // Check for CRO format: "5 CRO", "5"
    const croMatch = str.match(/^(\d+(?:\.\d+)?)\s*(?:CRO)?$/i);
    if (croMatch) {
      const croAmount = parseFloat(croMatch[1]);
      const usdAmount = await this.croToUsd(croAmount);
      return {
        original: str,
        usd: usdAmount,
        cro: croAmount,
        currency: 'CRO'
      };
    }

    // Default: treat as CRO
    const amount = parseFloat(str) || 0;
    return {
      original: str,
      usd: await this.croToUsd(amount),
      cro: amount,
      currency: 'CRO'
    };
  }
}

module.exports = new PriceService();
