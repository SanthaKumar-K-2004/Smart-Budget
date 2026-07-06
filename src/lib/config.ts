import { safeGetItem, safeSetItem } from "./storage";

type ApiConfig = {
  coinGeckoKey?: string;
  frankfurterKey?: string;
  nagerKey?: string;
};

let warned = false;

function readEnv(name: string): string | undefined {
  if (typeof process === "undefined" || !process.env) return undefined;
  const value = process.env[name];
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function getApiConfig(): ApiConfig {
  let coinGeckoKey = readEnv("NEXT_PUBLIC_COINGECKO_API_KEY");
  let frankfurterKey = readEnv("NEXT_PUBLIC_FRANKFURTER_API_KEY");
  let nagerKey = readEnv("NEXT_PUBLIC_NAGER_API_KEY");

  // Fallback to local storage if available
  if (typeof window !== "undefined") {
    coinGeckoKey = safeGetItem("smartbudget:api:coingecko") ?? coinGeckoKey ?? undefined;
    frankfurterKey = safeGetItem("smartbudget:api:frankfurter") ?? frankfurterKey ?? undefined;
    nagerKey = safeGetItem("smartbudget:api:nager") ?? nagerKey ?? undefined;
  }

  const cfg: ApiConfig = {
    coinGeckoKey: coinGeckoKey || undefined,
    frankfurterKey: frankfurterKey || undefined,
    nagerKey: nagerKey || undefined,
  };

  if (typeof window !== "undefined" && !warned) {
    warned = true;
    if (!cfg.coinGeckoKey && !cfg.frankfurterKey && !cfg.nagerKey) {
      console.info(
        "SmartBudget: no API keys configured. Using public key-free endpoints (recommended for default setup)."
      );
    }
  }

  return cfg;
}

export function setApiConfig(keys: Partial<ApiConfig>): void {
  if (typeof window !== "undefined") {
    if (keys.coinGeckoKey !== undefined) safeSetItem("smartbudget:api:coingecko", keys.coinGeckoKey);
    if (keys.frankfurterKey !== undefined) safeSetItem("smartbudget:api:frankfurter", keys.frankfurterKey);
    if (keys.nagerKey !== undefined) safeSetItem("smartbudget:api:nager", keys.nagerKey);
  }
}
