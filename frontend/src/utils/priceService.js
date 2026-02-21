const API_URL = import.meta.env.VITE_API_URL;
const COINGECKO_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=crypto-com-chain&vs_currencies=usd';
const DEFAULT_CRO_PRICE = 0.07;

let cachedPrice = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60000; // 1 minute

export async function fetchCroPrice() {
  // Return cached if fresh
  if (cachedPrice && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedPrice;
  }

  // Try backend first
  try {
    const res = await fetch(`${API_URL}/price/cro`, { signal: AbortSignal.timeout(3000) });
    const data = await res.json();
    if (data.success && data.price) {
      cachedPrice = data.price;
      cacheTimestamp = Date.now();
      return data.price;
    }
  } catch {
    // Backend unavailable, try CoinGecko directly
  }

  // Fallback: CoinGecko direct
  try {
    const res = await fetch(COINGECKO_URL, { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    const price = data['crypto-com-chain']?.usd;
    if (price) {
      cachedPrice = price;
      cacheTimestamp = Date.now();
      return price;
    }
  } catch {
    // CoinGecko also unavailable
  }

  // Last resort: cached or default
  return cachedPrice || DEFAULT_CRO_PRICE;
}
