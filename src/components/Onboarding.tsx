"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { CURRENCIES } from "@/lib/defaults";
import { BudgetMethod } from "@/lib/types";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { Wallet, LayoutGrid, CheckCircle2 } from "lucide-react";

export default function Onboarding() {
  const { state, setMonthlyIncome, setCurrency, setBudgetMethod, setOnboarded, applyAutoBudget, hydrated } =
    useStore();
  const [income, setIncome] = useState("");
  const [currency, setCurrencyLocal] = useState(state.currency);
  const [method, setMethod] = useState<BudgetMethod>("50-30-20");
  const [step, setStep] = useState(0);

  if (!hydrated || state.onboarded) return null;

  const finish = () => {
    setCurrency(currency);
    setBudgetMethod(method);
    const n = parseFloat(income) || 0;
    setMonthlyIncome(n);
    setOnboarded(true);
    if (method === "50-30-20" && n > 0) {
      setTimeout(() => applyAutoBudget(), 0);
    }
    toast.success("Welcome aboard! Your budget is ready to customize.");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="glass-strong w-full max-w-lg rounded-3xl p-6 sm:p-8"
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[var(--brand)] to-[var(--brand-dark)] flex items-center justify-center text-white font-bold shadow-lg shadow-[var(--brand)]/30">
            ₹
          </span>
          <h1 className="text-xl font-bold">Welcome to SmartBudget</h1>
        </div>
        <div className="flex gap-1.5 mt-4 mb-6">
          {[0, 1].map((s) => (
            <div
              key={s}
              className="h-1.5 flex-1 rounded-full transition-colors"
              style={{ background: s <= step ? "var(--brand)" : "var(--border-strong)" }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <p className="text-sm text-[var(--muted)]">
                Built from deep research on YNAB, 50/30/20, PocketGuard, Monarch Money and Rocket
                Money — combining the best ideas from each into one private, offline-first tool.
                Everything stays on this device.
              </p>
              <div>
                <label className="text-sm font-medium">Your currency</label>
                <select className="input mt-1" value={currency} onChange={(e) => setCurrencyLocal(e.target.value)}>
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.symbol} {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Your average monthly income</label>
                <input
                  type="number"
                  className="input mt-1"
                  placeholder="e.g. 50000"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                />
              </div>
              <button className="btn-primary w-full" onClick={() => setStep(1)}>
                Continue
              </button>
              <button
                type="button"
                className="w-full text-center text-xs text-[var(--muted)] hover:underline mt-2"
                onClick={() => setOnboarded(true)}
              >
                Skip onboarding & explore dashboard
              </button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              <p className="text-sm text-[var(--muted)] font-medium">Choose your budgeting method:</p>
              <MethodCard
                icon={<LayoutGrid size={18} />}
                title="50 / 30 / 20 Rule"
                desc="Simple & low-maintenance. 50% Needs, 30% Wants, 20% Savings/Debt. Best for stable income."
                active={method === "50-30-20"}
                onClick={() => setMethod("50-30-20")}
              />
              <MethodCard
                icon={<Wallet size={18} />}
                title="Zero-Based Budgeting"
                desc="Give every rupee a job (YNAB-style). Best for variable income or aggressive debt payoff."
                active={method === "zero-based"}
                onClick={() => setMethod("zero-based")}
              />
              <p className="text-xs text-[var(--muted)]">You can switch methods anytime later.</p>
              <div className="flex gap-2 pt-1">
                <button className="btn-secondary flex-1" onClick={() => setStep(0)}>
                  Back
                </button>
                <button className="btn-primary flex-1 gap-1.5" onClick={finish}>
                  <CheckCircle2 size={16} /> Get Started
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function MethodCard({
  icon,
  title,
  desc,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-2xl border-2 transition-colors ${
        active ? "border-[var(--brand)] bg-[color-mix(in_srgb,var(--brand)_8%,transparent)]" : "border-[var(--border)]"
      }`}
    >
      <div className="flex items-center gap-2 font-semibold">
        <span className={active ? "text-[var(--brand)]" : "text-[var(--muted)]"}>{icon}</span>
        {title}
      </div>
      <div className="text-sm text-[var(--muted)] mt-1">{desc}</div>
    </button>
  );
}
