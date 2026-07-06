"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useStore } from "@/lib/store";
import { currencySymbol } from "@/lib/defaults";
import { formatCurrency, simulateDebtPayoff, totalDebts } from "@/lib/calc";
import { DebtStrategy } from "@/lib/types";
import { Flame, Snowflake, Clock, PiggyBank, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

const PayoffLineChart = dynamic(() => import("@/components/charts/PayoffLineChart"), {
  ssr: false,
  loading: () => <div className="skeleton h-[260px] w-full" />,
});

export default function DebtPage() {
  const { state, setDebtStrategy, setDebtExtraPayment, hydrated } = useStore();
  const symbol = currencySymbol(state.currency);
  const [extraInput, setExtraInput] = useState(String(state.debtExtraPayment || ""));

  const result = useMemo(
    () => simulateDebtPayoff(state.debts, state.debtExtraPayment, state.debtStrategy),
    [state.debts, state.debtExtraPayment, state.debtStrategy]
  );

  if (!hydrated) return <div className="skeleton h-64" />;

  const totalBalance = totalDebts(state.debts);
  const orderNames = result.order
    .map((id) => state.debts.find((d) => d.id === id)?.name)
    .filter(Boolean) as string[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Debt Payoff Planner</h1>
        <p className="text-[var(--muted)] text-sm">
          Simulate the Avalanche (highest interest first) vs. Snowball (smallest balance first) strategies.
        </p>
      </div>

      {state.debts.length === 0 ? (
        <div className="card p-10 text-center text-[var(--muted)]">
          No debts added yet.{" "}
          <a href="/networth" className="text-[var(--brand)] font-medium">
            Add a debt on the Net Worth page
          </a>{" "}
          to start planning your payoff.
        </div>
      ) : (
        <>
          <div className="card p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-[var(--muted)]">Strategy</label>
              <div className="flex gap-2 mt-1">
                <StrategyButton
                  icon={<Flame size={14} />}
                  label="Avalanche"
                  active={state.debtStrategy === "avalanche"}
                  onClick={() => setDebtStrategy("avalanche" as DebtStrategy)}
                />
                <StrategyButton
                  icon={<Snowflake size={14} />}
                  label="Snowball"
                  active={state.debtStrategy === "snowball"}
                  onClick={() => setDebtStrategy("snowball" as DebtStrategy)}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--muted)]">Extra payment / month</label>
              <input
                type="number"
                className="input mt-1"
                value={extraInput}
                onChange={(e) => setExtraInput(e.target.value)}
                onBlur={() => setDebtExtraPayment(parseFloat(extraInput) || 0)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--muted)]">Total balance</label>
              <div className="text-xl font-bold mt-1 text-red-500">{formatCurrency(totalBalance, symbol)}</div>
            </div>
          </div>

          {result.hasNegativeAmortization && (
            <div className="card p-4 border-red-500/20 bg-red-500/[0.02] text-xs text-red-500 flex items-start gap-2 animate-fade-in">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <div>
                <strong>Warning: Negative Amortization Detected.</strong>
                <p className="mt-0.5 opacity-90">
                  One or more of your debts has a monthly interest charge that exceeds its minimum payment plus your extra allocation. The balance will grow indefinitely under this schedule. Increase your monthly payment to clear this debt.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card p-5">
              <div className="flex items-center gap-2 text-[var(--muted)] text-xs font-medium mb-2">
                <span className="w-7 h-7 rounded-lg flex items-center justify-center bg-[var(--brand)]/15 text-[var(--brand)]">
                  <Clock size={16} />
                </span>
                Time to debt-free
              </div>
              <div className="text-xl font-bold">
                {result.monthsToPayoff} month{result.monthsToPayoff !== 1 ? "s" : ""}
                <span className="text-sm text-[var(--muted)] font-normal ml-1">
                  (~{(result.monthsToPayoff / 12).toFixed(1)} yrs)
                </span>
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-2 text-[var(--muted)] text-xs font-medium mb-2">
                <span className="w-7 h-7 rounded-lg flex items-center justify-center bg-amber-500/15 text-amber-500">
                  <PiggyBank size={16} />
                </span>
                Total interest paid
              </div>
              <div className="text-xl font-bold">{formatCurrency(result.totalInterestPaid, symbol)}</div>
            </div>
          </div>

          <div className="card p-5">
            <h2 className="font-semibold mb-2">Balance Over Time</h2>
            <PayoffLineChart data={result.schedule} symbol={symbol} />
          </div>

          <div className="card p-5">
            <h2 className="font-semibold mb-3">Payoff Order ({state.debtStrategy === "avalanche" ? "Avalanche" : "Snowball"})</h2>
            <div className="space-y-2">
              {orderNames.map((name, i) => {
                const debt = state.debts.find((d) => d.name === name);
                return (
                  <motion.div
                    key={name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-[color-mix(in_srgb,var(--muted)_6%,transparent)]"
                  >
                    <span className="w-7 h-7 rounded-full bg-[var(--brand)] text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{name}</p>
                      <p className="text-xs text-[var(--muted)]">{debt?.apr}% APR</p>
                    </div>
                    <span className="text-sm font-semibold shrink-0">{formatCurrency(debt?.balance || 0, symbol)}</span>
                  </motion.div>
                );
              })}
            </div>
            <p className="text-xs text-[var(--muted)] mt-3">
              {state.debtStrategy === "avalanche"
                ? "Avalanche pays off highest-interest debt first — mathematically saves the most money."
                : "Snowball pays off smallest balances first — builds momentum and motivation."}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function StrategyButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium border transition-colors ${
        active
          ? "bg-[var(--brand)] text-white border-transparent"
          : "border-[var(--border-strong)] text-[var(--muted)]"
      }`}
    >
      {icon} {label}
    </button>
  );
}
