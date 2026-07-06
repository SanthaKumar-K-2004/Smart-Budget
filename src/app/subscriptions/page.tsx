"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { currencySymbol } from "@/lib/defaults";
import { formatCurrency, monthlySubscriptionCost, detectSubscriptions } from "@/lib/calc";
import { Plus, Trash2, Repeat } from "lucide-react";
import { toast } from "sonner";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Switch from "@/components/ui/Switch";

export default function SubscriptionsPage() {
  const { state, addSubscription, updateSubscription, removeSubscription, hydrated } = useStore();
  const symbol = currencySymbol(state.currency);

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [cadence, setCadence] = useState<"monthly" | "yearly" | "weekly">("monthly");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  if (!hydrated) return <div className="skeleton h-64" />;

  const monthlyTotal = monthlySubscriptionCost(state.subscriptions);
  const yearlyTotal = monthlyTotal * 12;

  const detected = detectSubscriptions(state.transactions, state.subscriptions);

  const handleAddDetected = (d: { name: string; amount: number; cadence: "monthly" | "weekly" | "yearly" }) => {
    addSubscription({ name: d.name, amount: d.amount, cadence: d.cadence, active: true });
    toast.success(`Added subscription "${d.name}".`);
  };

  const handleAdd = () => {
    const amt = parseFloat(amount);
    if (!name.trim()) {
      toast.error("Enter a subscription name.");
      return;
    }
    if (!amt || amt <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    addSubscription({ name: name.trim(), amount: amt, cadence, active: true });
    toast.success(`Added "${name.trim()}".`);
    setName("");
    setAmount("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Subscriptions</h1>
        <p className="text-[var(--muted)] text-sm">
          Track recurring subscriptions — the #1 hidden budget killer (inspired by Rocket Money).
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-5">
          <p className="text-xs text-[var(--muted)] font-medium">Total per month</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(monthlyTotal, symbol)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-[var(--muted)] font-medium">Projected per year</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(yearlyTotal, symbol)}</p>
        </div>
      </div>

      {detected.length > 0 && (
        <div className="card p-5 border-amber-500/20 bg-amber-500/[0.02]">
          <h2 className="font-semibold text-amber-500 mb-2 flex items-center gap-1.5">
            <Repeat size={16} /> Likely Subscriptions Detected (Rocket Money Engine)
          </h2>
          <p className="text-xs text-[var(--muted)] mb-3">
            We noticed recurring transactions with similar payees/amounts. Add them to track your true monthly recurring overhead.
          </p>
          <div className="space-y-2">
            {detected.map((d) => (
              <div key={d.name} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                <div>
                  <p className="text-sm font-medium">{d.name}</p>
                  <p className="text-xs text-[var(--muted)] capitalize">{d.cadence} payment detected</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{formatCurrency(d.amount, symbol)}</span>
                  <button
                    onClick={() => handleAddDetected(d)}
                    className="btn-primary text-xs py-1 px-3 min-h-0 bg-amber-500 text-white hover:bg-amber-600 border-none rounded-lg"
                  >
                    Quick Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card p-5">
        <h2 className="font-semibold mb-3">Add Subscription</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <input className="input lg:col-span-2" placeholder="e.g. Netflix" value={name} onChange={(e) => setName(e.target.value)} />
          <input type="number" className="input" placeholder={`Amount (${symbol})`} value={amount} onChange={(e) => setAmount(e.target.value)} />
          <select className="input" value={cadence} onChange={(e) => setCadence(e.target.value as "monthly" | "yearly" | "weekly")}>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
        <button className="btn-primary mt-3" onClick={handleAdd}>
          <Plus size={16} /> Add Subscription
        </button>
      </div>

      <div className="card divide-y divide-[var(--border)]">
        {state.subscriptions.length === 0 ? (
          <div className="text-sm text-[var(--muted)] text-center py-10">No subscriptions tracked yet.</div>
        ) : (
          state.subscriptions.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-5 py-3 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-9 h-9 rounded-full bg-[color-mix(in_srgb,var(--muted)_10%,transparent)] flex items-center justify-center text-[var(--muted)] shrink-0">
                  <Repeat size={16} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{s.name}</p>
                  <p className="text-xs text-[var(--muted)] capitalize">{s.cadence}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-semibold">{formatCurrency(s.amount, symbol)}</span>
                <Switch checked={s.active} onCheckedChange={(v) => updateSubscription(s.id, { active: v })} />
                <button className="icon-btn danger" onClick={() => setDeleteTarget({ id: s.id, name: s.name })}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete Subscription"
        description={`Remove "${deleteTarget?.name}" from tracking? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) {
            removeSubscription(deleteTarget.id);
            toast.success("Subscription removed.");
          }
        }}
      />
    </div>
  );
}
