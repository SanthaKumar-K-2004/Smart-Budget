// Live cryptocurrency prices via the CoinGecko public API
// (https://www.coingecko.com/en/api) — free tier, no API key required for
// the /simple/price and /coins/markets endpoints used here.

import { getApiConfig } from "@/lib/config";
import { safeGetJSON, safeSetJSON } from "@/lib/storage";

export interface CoinPrice {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
}

const CACHE_KEY = "smartbudget:crypto-cache";
const CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes — crypto moves fast

type CachedCoinPrices = {
  data: CoinPrice[];
  fetchedAt: number;
};

export const POPULAR_COINS = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum" },
  { id: "tether", symbol: "USDT", name: "Tether" },
  { id: "binancecoin", symbol: "BNB", name: "BNB" },
  { id: "solana", symbol: "SOL", name: "Solana" },
  { id: "ripple", symbol: "XRP", name: "XRP" },
  { id: "dogecoin", symbol: "DOGE", name: "Dogecoin" },
  { id: "cardano", symbol: "ADA", name: "Cardano" },
];

export async function fetchCoinPrices(vsCurrency: string, ids: string[]): Promise<CoinPrice[] | null> {
  try {
    const cacheKey = `${CACHE_KEY}:${vsCurrency}:${ids.join(",")}`;
    const cached = readCache(cacheKey);
    if (cached) return cached;

    const idsParam = ids.join(",");
    const url = `/api/crypto?vs_currency=${vsCurrency.toLowerCase()}&ids=${idsParam}`;

    const cfg = getApiConfig();
    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (cfg.coinGeckoKey) {
      headers["X-CoinGecko-Key"] = cfg.coinGeckoKey;
    }

    const res = await fetch(url, { signal: AbortSignal.timeout(6000), headers });
    if (!res.ok) return null;
    const data = (await res.json()) as CoinPrice[];
    writeCache(cacheKey, data);
    return data;
  } catch {
    return null;
  }
}

function readCache(key: string): CoinPrice[] | null {
  const parsed = safeGetJSON<CachedCoinPrices>(key);
  if (!parsed) return null;
  if (Date.now() - parsed.fetchedAt > CACHE_TTL_MS) return null;
  return parsed.data;
}

function writeCache(key: string, data: CoinPrice[]) {
  safeSetJSON(key, { data, fetchedAt: Date.now() } satisfies CachedCoinPrices);
}
