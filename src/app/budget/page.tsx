"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { currencySymbol } from "@/lib/defaults";
import { formatCurrency, totalAssigned, groupTotals, currentMonthKey, spentByCategory } from "@/lib/calc";
import { CategoryIcon } from "@/lib/icons";
import { CategoryGroup } from "@/lib/types";
import { Plus, Trash2, Sparkles, Pencil } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";
import { CHART_COLORS } from "@/lib/theme";
import MonthSwitcher from "@/components/MonthSwitcher";

const GROUP_LABELS: Record<CategoryGroup, { label: string; hint: string; color: string; pct: number }> = {
  needs: { label: "Needs", hint: "Essentials: rent, groceries, bills", color: CHART_COLORS.needs, pct: 50 },
  wants: { label: "Wants", hint: "Lifestyle & discretionary spending", color: CHART_COLORS.wants, pct: 30 },
  savings: { label: "Savings & Debt", hint: "Future you: savings, investing, debt payoff", color: CHART_COLORS.savings, pct: 20 },
};

const groupMotion = {
  hidden: { opacity: 0, y: 14 },
  show: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: index * 0.08, duration: 0.28 },
  }),
};

export default function BudgetPage() {
  const {
    state,
    setMonthlyIncome,
    setBudgetMethod,
    addCategory,
    updateCategory,
    removeCategory,
    applyAutoBudget,
    selectedMonth: monthKey,
    hydrated,
  } = useStore();
  const symbol = currencySymbol(state.currency);
  const [newCatName, setNewCatName] = useState("");
  const [newCatGroup, setNewCatGroup] = useState<CategoryGroup>("needs");
  const [incomeInput, setIncomeInput] = useState(String(state.monthlyIncome || ""));
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  if (!hydrated) return <div className="skeleton h-64" />;

  const assigned = totalAssigned(state.categories);
  let leftToAssign = 0;
  let overspendPrev = 0;
  
  if (state.budgetMethod === "zero-based") {
    const cashAssets = state.assets.filter((a) => a.type === "cash" || a.type === "investment").reduce((s, a) => s + a.value, 0);
    const cashAvailable = cashAssets > 0 ? cashAssets : state.monthlyIncome;
    
    const now = new Date();
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthKey = currentMonthKey(prevMonthDate);
    const prevSpentMap = spentByCategory(state.transactions, prevMonthKey);
    overspendPrev = state.categories.reduce((sum, c) => {
      const spentInPrev = prevSpentMap.get(c.id) || 0;
      return sum + Math.max(0, spentInPrev - (c.assigned || 0));
    }, 0);

    const rta = cashAvailable - assigned - overspendPrev;
    leftToAssign = Math.abs(rta) < 1 ? 0 : rta;
  } else {
    const leftToAssignRaw = state.monthlyIncome - assigned;
    leftToAssign = Math.abs(leftToAssignRaw) < 1 ? 0 : leftToAssignRaw;
  }
  const gTotals = groupTotals(state.categories);
  const spentMap = spentByCategory(state.transactions, monthKey);

  const handleAdd = () => {
    if (!newCatName.trim()) {
      toast.error("Enter a category name first.");
      return;
    }
    addCategory(newCatName.trim(), newCatGroup);
    toast.success(`Added category "${newCatName.trim()}"`);
    setNewCatName("");
  };

  return (
    <div className="space-y-6">
      <div className="lg:hidden fixed bottom-[84px] inset-x-0 z-30 px-3 pointer-events-none">
        <div className="glass-strong rounded-2xl px-3 py-2 pointer-events-auto">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">Income</p>
              <p className="text-sm font-semibold">{formatCurrency(state.monthlyIncome, symbol)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">Assigned</p>
              <p className="text-sm font-semibold">{formatCurrency(assigned, symbol)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">Left</p>
              <p className={`text-sm font-semibold ${leftToAssign < 0 ? "text-red-500" : leftToAssign === 0 ? "text-emerald-500" : ""}`}>
                {formatCurrency(leftToAssign, symbol)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Budget</h1>
          <p className="text-[var(--muted)] text-sm">Give every {symbol} a job.</p>
        </div>
        <div className="flex items-center gap-3">
          <MonthSwitcher />
          {state.budgetMethod === "50-30-20" && (
            <button
              className="btn-secondary text-sm"
              onClick={() => {
                applyAutoBudget();
                toast.success("Applied 50/30/20 auto-allocation.");
              }}
            >
              <Sparkles size={14} /> Auto-fill 50/30/20
            </button>
          )}
        </div>
      </div>

      {/* Settings row */}
      <div className="card p-4 sm:p-5 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
        <div>
          <label className="text-xs font-medium text-[var(--muted)]">Monthly Income</label>
          <div className="flex gap-2 mt-1">
            <input
              type="number"
              className="input"
              value={incomeInput}
              onChange={(e) => setIncomeInput(e.target.value)}
              onBlur={() => {
                const v = parseFloat(incomeInput) || 0;
                setMonthlyIncome(v);
                setIncomeInput(String(v || ""));
              }}
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--muted)]">Budgeting Method</label>
          <select
            className="input mt-1"
            value={state.budgetMethod}
            onChange={(e) => setBudgetMethod(e.target.value as "zero-based" | "50-30-20")}
          >
            <option value="50-30-20">50 / 30 / 20 Rule</option>
            <option value="zero-based">Zero-Based Budgeting</option>
          </select>
        </div>
        <div className="flex flex-col justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)]/70 p-3 sm:p-4">
          <label className="text-xs font-medium text-[var(--muted)]">Left to Assign</label>
          <div
            className={`text-xl font-bold ${leftToAssign < 0 ? "text-red-500" : leftToAssign === 0 ? "text-emerald-500" : ""}`}
          >
            {formatCurrency(leftToAssign, symbol)}
          </div>
          {state.budgetMethod === "zero-based" && (
            <p className="text-[11px] text-[var(--muted)] mt-0.5">
              {overspendPrev > 0 && `Prev Month Overspent: ${formatCurrency(overspendPrev, symbol)} (Deducted) · `}
              {leftToAssign > 0
                ? "Assign the rest so every rupee has a job."
                : leftToAssign < 0
                ? "You've over-assigned — adjust a category."
                : "Perfect! Every rupee has a job."}
            </p>
          )}
        </div>
      </div>

      {/* Groups */}
      {(["needs", "wants", "savings"] as CategoryGroup[]).map((group, index) => {
        const meta = GROUP_LABELS[group];
        const cats = state.categories.filter((c) => c.group === group);
        const groupTotal = gTotals[group] || 0;
        const target = state.monthlyIncome * (meta.pct / 100);
        return (
          <motion.section
            key={group}
            className="card p-4 sm:p-5"
            variants={groupMotion}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            custom={index}
          >
            <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
              <div>
                <h2 className="font-semibold flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: meta.color }} />
                  {meta.label}
                </h2>
                <p className="text-xs text-[var(--muted)]">{meta.hint}</p>
              </div>
              <div className="text-right">
                <div className="font-semibold">{formatCurrency(groupTotal, symbol)}</div>
                {state.budgetMethod === "50-30-20" && (
                  <div className="text-xs text-[var(--muted)]">
                    Target: {formatCurrency(target, symbol)} ({meta.pct}%)
                  </div>
                )}
              </div>
            </div>

            <div className="progress-track mt-2 mb-4">
              <motion.div
                className="progress-fill"
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min(100, state.monthlyIncome > 0 ? (groupTotal / state.monthlyIncome) * 100 : 0)}%`,
                }}
                style={{ background: meta.color }}
              />
            </div>

            <div className="space-y-2">
              {cats.length === 0 && (
                <p className="text-sm text-[var(--muted)] text-center py-4">No categories in this group yet.</p>
              )}
              {cats.map((c) => {
                const spent = spentMap.get(c.id) || 0;
                const pct = c.assigned > 0 ? Math.min(100, (spent / c.assigned) * 100) : 0;
                const over = c.assigned > 0 && spent > c.assigned;
                return (
                  <div
                    key={c.id}
                    className="grid grid-cols-[auto_1fr_auto] sm:grid-cols-[auto_1fr_auto_auto] gap-2 sm:gap-3 items-start sm:items-center py-2 border-b border-[var(--border)] last:border-0"
                  >
                    <span className="w-8 h-8 rounded-full bg-[color-mix(in_srgb,var(--muted)_10%,transparent)] flex items-center justify-center text-[var(--muted)] shrink-0">
                      <CategoryIcon name={c.icon} size={15} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <button
                          className="text-sm font-medium truncate hover:text-[var(--brand)] transition-colors text-left flex items-center gap-1 group"
                          onClick={() => setRenaming({ id: c.id, name: c.name })}
                        >
                          {c.name}
                          <Pencil size={11} className="opacity-0 group-hover:opacity-60 transition-opacity" />
                        </button>
                        <span className={`text-xs shrink-0 ${over ? "text-red-500 font-semibold" : "text-[var(--muted)]"}`}>
                          {formatCurrency(spent, symbol)} spent
                        </span>
                      </div>
                      <div className="progress-track mt-1">
                        <motion.div
                          className="progress-fill"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          style={{ background: over ? CHART_COLORS.danger : meta.color }}
                        />
                      </div>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <input
                        type="number"
                        className="input w-full sm:w-28 text-sm shrink-0"
                        value={c.assigned || ""}
                        placeholder="0"
                        onChange={(e) => updateCategory(c.id, { assigned: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <button
                      onClick={() => setDeleteTarget({ id: c.id, name: c.name })}
                      className="icon-btn danger shrink-0 justify-self-end"
                      aria-label="Remove category"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.section>
        );
      })}

      {/* Add category */}
      <div className="card p-4 sm:p-5">
        <h2 className="font-semibold mb-3">Add a Category</h2>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_12rem_auto] gap-2">
          <input
            className="input"
            placeholder="Category name (e.g. Gym membership)"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <select
            className="input"
            value={newCatGroup}
            onChange={(e) => setNewCatGroup(e.target.value as CategoryGroup)}
          >
            <option value="needs">Needs</option>
            <option value="wants">Wants</option>
            <option value="savings">Savings & Debt</option>
          </select>
          <button className="btn-primary justify-center w-full sm:w-auto" onClick={handleAdd}>
            <Plus size={16} /> Add
          </button>
        </div>
      </div>

      <Modal open={!!renaming} onOpenChange={(o) => !o && setRenaming(null)} title="Rename Category">
        <div className="space-y-3">
          <input
            className="input"
            value={renaming?.name || ""}
            onChange={(e) => setRenaming((r) => (r ? { ...r, name: e.target.value } : r))}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={() => setRenaming(null)}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                if (renaming && renaming.name.trim()) {
                  updateCategory(renaming.id, { name: renaming.name.trim() });
                  toast.success("Category renamed.");
                }
                setRenaming(null);
              }}
            >
              Save
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete Category"
        description={`Delete "${deleteTarget?.name}"? Transactions in this category will become uncategorized, but won't be deleted.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) {
            removeCategory(deleteTarget.id);
            toast.success("Category deleted.");
          }
        }}
      />

      <div className="lg:hidden h-24" />
    </div>
  );
}
