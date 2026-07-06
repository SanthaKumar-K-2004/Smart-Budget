"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { currencySymbol } from "@/lib/defaults";
import { formatCurrency } from "@/lib/calc";
import { Plus, Trash2, Target as TargetIcon, PiggyBank } from "lucide-react";
import { toast } from "sonner";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { motion } from "framer-motion";

export default function GoalsPage() {
  const { state, addGoal, updateGoal, removeGoal, addTransaction, hydrated } = useStore();
  const symbol = currencySymbol(state.currency);

  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [saved, setSaved] = useState("");
  const [date, setDate] = useState("");

  const [addAmounts, setAddAmounts] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  if (!hydrated) return <div className="skeleton h-64" />;

  const handleAdd = () => {
    const t = parseFloat(target);
    if (!name.trim()) {
      toast.error("Enter a goal name.");
      return;
    }
    if (!t || t <= 0) {
      toast.error("Enter a valid target amount.");
      return;
    }
    addGoal({ name: name.trim(), targetAmount: t, savedAmount: parseFloat(saved) || 0, targetDate: date || undefined });
    toast.success(`Goal "${name.trim()}" created.`);
    setName("");
    setTarget("");
    setSaved("");
    setDate("");
  };

  const handleContribute = (id: string, goalName: string) => {
    const raw = addAmounts[id];
    const amt = parseFloat(raw);
    if (!amt || amt <= 0) {
      toast.error("Enter an amount to add.");
      return;
    }
    const goal = state.goals.find((g) => g.id === id);
    if (!goal) return;
    updateGoal(id, { savedAmount: goal.savedAmount + amt });

    // Find the first cash asset to deduct from or fallback to 'Main Bank Account'
    const defaultAccount = state.assets.find((a) => a.type === "cash")?.name || "Main Bank Account";
    addTransaction({
      date: new Date().toISOString().slice(0, 10),
      description: `Goal Contribution: ${goalName}`,
      amount: amt,
      type: "expense",
      account: defaultAccount,
      note: `Contributed to savings goal "${goalName}"`,
      tags: ["savings", "goal-transfer"],
    });

    setAddAmounts((s) => ({ ...s, [id]: "" }));
    toast.success(`Added ${formatCurrency(amt, symbol)} to ${goalName} (debited from ${defaultAccount}).`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Savings Goals</h1>
        <p className="text-[var(--muted)] text-sm">
          Track progress toward an emergency fund, a trip, a new gadget, or anything else.
        </p>
      </div>

      <div className="card p-5">
        <h2 className="font-semibold mb-3">New Goal</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          <input
            className="input lg:col-span-2"
            placeholder="Goal name (e.g. Emergency Fund)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input type="number" className="input" placeholder={`Target (${symbol})`} value={target} onChange={(e) => setTarget(e.target.value)} />
          <input type="number" className="input" placeholder="Already saved" value={saved} onChange={(e) => setSaved(e.target.value)} />
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <button className="btn-primary mt-3" onClick={handleAdd}>
          <Plus size={16} /> Add Goal
        </button>
      </div>

      {state.goals.length === 0 ? (
        <div className="text-sm text-[var(--muted)] text-center py-10 card">No goals yet. Add one above.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {state.goals.map((g) => {
            const pct = Math.min(100, (g.savedAmount / g.targetAmount) * 100);
            const complete = pct >= 100;
            return (
              <div key={g.id} className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: "color-mix(in srgb, var(--savings) 18%, transparent)", color: "var(--savings)" }}
                    >
                      {complete ? <PiggyBank size={16} /> : <TargetIcon size={16} />}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{g.name}</p>
                      {g.targetDate && (
                        <p className="text-xs text-[var(--muted)]">By {new Date(g.targetDate).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                  <button className="icon-btn danger shrink-0" onClick={() => setDeleteTarget({ id: g.id, name: g.name })}>
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="progress-track mb-2">
                  <motion.div
                    className="progress-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    style={{ background: complete ? "#22c55e" : "var(--savings)" }}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{formatCurrency(g.savedAmount, symbol)}</span>
                  <span className="text-[var(--muted)]">of {formatCurrency(g.targetAmount, symbol)}</span>
                </div>
                {complete ? (
                  <p className="text-xs text-emerald-500 font-medium mt-3">🎉 Goal reached!</p>
                ) : (
                  <div className="flex gap-2 mt-3">
                    <input
                      type="number"
                      className="input text-sm"
                      placeholder="Add amount"
                      value={addAmounts[g.id] || ""}
                      onChange={(e) => setAddAmounts((s) => ({ ...s, [g.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && handleContribute(g.id, g.name)}
                    />
                    <button className="btn-secondary text-sm shrink-0" onClick={() => handleContribute(g.id, g.name)}>
                      Add
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete Goal"
        description={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) {
            removeGoal(deleteTarget.id);
            toast.success("Goal deleted.");
          }
        }}
      />
    </div>
  );
}
