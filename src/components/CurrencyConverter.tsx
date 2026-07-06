"use client";

import { useEffect, useState } from "react";
import { fetchExchangeRates } from "@/lib/exchangeRates";
import { CURRENCIES } from "@/lib/defaults";
import { ArrowRightLeft, RefreshCw, WifiOff } from "lucide-react";
import { motion } from "framer-motion";

export default function CurrencyConverter({ defaultFrom }: { defaultFrom: string }) {
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultFrom === "USD" ? "INR" : "USD");
  const [amount, setAmount] = useState("100");
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  // Keep the "from" currency in sync when the app's base currency setting
  // changes elsewhere (e.g. on the Budget page) — a genuine external-state
  // synchronization, not a derived render value.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFrom(defaultFrom);
  }, [defaultFrom]);

  // Fetches live rates from the external Frankfurter API whenever the
  // source currency changes.
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
     
    setFailed(false);
    fetchExchangeRates(from).then((res) => {
      if (cancelled) return;
      setLoading(false);
      if (!res) {
        setFailed(true);
        return;
      }
      setRates(res.rates);
      setDate(res.date);
    });
    return () => {
      cancelled = true;
    };
  }, [from]);

  const amt = parseFloat(amount) || 0;
  const converted = rates && rates[to] ? amt * rates[to] : null;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-semibold flex items-center gap-2">
          <ArrowRightLeft size={16} className="text-[var(--brand)]" /> Live Currency Converter
        </h2>
        {loading && <RefreshCw size={14} className="animate-spin text-[var(--muted)]" />}
      </div>
      <p className="text-xs text-[var(--muted)] mb-4">
        Free, open-source exchange rates via Frankfurter (ECB reference rates) — no API key, no sign-up.
      </p>

      {failed ? (
        <div className="flex items-center gap-2 text-sm text-amber-500 py-4">
          <WifiOff size={16} />
          Couldn&apos;t reach the exchange rate service (offline or blocked). Everything else in
          SmartBudget still works fully offline.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-end gap-2">
          <div>
            <label className="text-xs font-medium text-[var(--muted)]">Amount</label>
            <div className="flex gap-2 mt-1">
              <input
                type="number"
                className="input"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <select className="input w-24 shrink-0" value={from} onChange={(e) => setFrom(e.target.value)}>
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            className="icon-btn mb-1 mx-auto sm:mx-0 rotate-90 sm:rotate-0"
            onClick={() => {
              setFrom(to);
              setTo(from);
            }}
            aria-label="Swap currencies"
          >
            <ArrowRightLeft size={16} />
          </button>

          <div>
            <label className="text-xs font-medium text-[var(--muted)]">Converted</label>
            <div className="flex gap-2 mt-1">
              <motion.div
                key={converted ?? "loading"}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="input flex items-center font-semibold"
              >
                {converted !== null ? converted.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}
              </motion.div>
              <select className="input w-24 shrink-0" value={to} onChange={(e) => setTo(e.target.value)}>
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
      {date && !failed && <p className="text-[11px] text-[var(--muted)] mt-3">Rates as of {date} (ECB reference rates, cached 12h).</p>}
    </div>
  );
}
