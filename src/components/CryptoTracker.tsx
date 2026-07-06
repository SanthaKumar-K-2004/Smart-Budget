"use client";

import { useEffect, useState } from "react";
import { fetchCoinPrices, POPULAR_COINS, CoinPrice } from "@/lib/crypto";
import { formatCurrency } from "@/lib/calc";
import { RefreshCw, WifiOff, Bitcoin } from "lucide-react";
import { motion } from "framer-motion";

export default function CryptoTracker({ currency, symbol }: { currency: string; symbol: string }) {
  const [prices, setPrices] = useState<CoinPrice[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  // Fetches from the external CoinGecko API whenever `currency` changes;
  // this is a data-fetching effect (not a render-derived value), so the
  // loading/error state updates inside it are the correct pattern.
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
     
    setFailed(false);
    fetchCoinPrices(
      currency,
      POPULAR_COINS.map((c) => c.id)
    ).then((res) => {
      if (cancelled) return;
      setLoading(false);
      if (!res) {
        setFailed(true);
        return;
      }
      setPrices(res);
    });
    return () => {
      cancelled = true;
    };
  }, [currency]);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-semibold flex items-center gap-2">
          <Bitcoin size={16} className="text-[var(--brand)]" /> Live Crypto Prices
        </h2>
        {loading && <RefreshCw size={14} className="animate-spin text-[var(--muted)]" />}
      </div>
      <p className="text-xs text-[var(--muted)] mb-4">
        Free public market data via CoinGecko — no API key required. Add a crypto asset below to
        track its live value in your net worth.
      </p>

      {failed ? (
        <div className="flex items-center gap-2 text-sm text-amber-500 py-4">
          <WifiOff size={16} />
          Couldn&apos;t reach CoinGecko (offline or blocked). Everything else in SmartBudget still
          works fully offline.
        </div>
      ) : prices ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {prices.map((c) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl p-3 bg-[var(--surface-2)] border border-[var(--border)]"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--muted)] mb-1">
                {c.symbol.toUpperCase()}
              </div>
              <div className="text-sm font-bold truncate">{formatCurrency(c.current_price, symbol)}</div>
              <div
                className={`text-[11px] font-medium mt-0.5 ${
                  c.price_change_percentage_24h >= 0 ? "text-emerald-500" : "text-red-500"
                }`}
              >
                {c.price_change_percentage_24h >= 0 ? "+" : ""}
                {c.price_change_percentage_24h?.toFixed(2)}%
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-16" />
          ))}
        </div>
      )}
    </div>
  );
}
