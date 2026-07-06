// Live currency exchange rates via Frankfurter (https://frankfurter.dev) —
// a fully open-source API backed by European Central Bank reference rates.
// No API key required, no rate limits for reasonable personal use, no
// tracking. Falls back gracefully to null if the network is unavailable
// (the app works fully offline otherwise).

const API_BASE = "https://api.frankfurter.dev/v1";


import { getApiConfig } from "@/lib/config";

export interface RatesResult {
  base: string;
  date: string;
  rates: Record<string, number>;
}

const CACHE_KEY = "smartbudget:rates-cache";
const CACHE_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

interface CachedRates extends RatesResult {
  fetchedAt: number;
}

export async function fetchExchangeRates(base: string): Promise<RatesResult | null> {
  try {
    const cached = readCache(base);
    if (cached) return cached;

    const cfg = getApiConfig();
    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (cfg.frankfurterKey) {
      headers["X-Frankfurter-Key"] = cfg.frankfurterKey;
    }

    const res = await fetch(`/api/rates?base=${base}`, {
      signal: AbortSignal.timeout(6000),
      headers,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as RatesResult;
    writeCache(base, data);
    return data;
  } catch {
    return null;
  }
}

function readCache(base: string): RatesResult | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(`${CACHE_KEY}:${base}`);
    if (!raw) return null;
    const parsed: CachedRates = JSON.parse(raw);
    if (Date.now() - parsed.fetchedAt > CACHE_TTL_MS) return null;
    return { base: parsed.base, date: parsed.date, rates: parsed.rates };
  } catch {
    return null;
  }
}

function writeCache(base: string, data: RatesResult) {
  try {
    if (typeof window === "undefined") return;
    const payload: CachedRates = { ...data, fetchedAt: Date.now() };
    window.localStorage.setItem(`${CACHE_KEY}:${base}`, JSON.stringify(payload));
  } catch {
    // ignore — caching is a best-effort optimization
  }
}

export function convert(amount: number, rates: Record<string, number>, to: string): number | null {
  const rate = rates[to];
  if (!rate) return null;
  return amount * rate;
}
