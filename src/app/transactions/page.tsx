"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { currencySymbol } from "@/lib/defaults";
import { formatCurrency } from "@/lib/calc";
import { CategoryIcon } from "@/lib/icons";
import { Plus, Trash2, Search, Pencil, Download, Repeat2 } from "lucide-react";
import { toast } from "sonner";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";
import Switch from "@/components/ui/Switch";
import { RecurringTransaction, Transaction } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function TransactionsPage() {
  const {
    state,
    addTransaction,
    updateTransaction,
    removeTransaction,
    addRecurring,
    updateRecurring,
    removeRecurring,
    hydrated,
  } = useStore();
  const symbol = currencySymbol(state.currency);

  const [type, setType] = useState<"expense" | "income">("expense");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState(state.categories[0]?.id || "");
  const [date, setDate] = useState(todayIso());
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [showRecurring, setShowRecurring] = useState(false);

  const [recName, setRecName] = useState("");
  const [recAmount, setRecAmount] = useState("");
  const [recType, setRecType] = useState<"expense" | "income">("expense");
  const [recCategoryId, setRecCategoryId] = useState(state.categories[0]?.id || "");
  const [recCadence, setRecCadence] = useState<"monthly" | "weekly" | "yearly">("monthly");
  const [deleteRecurring, setDeleteRecurring] = useState<RecurringTransaction | null>(null);

  const filtered = useMemo(() => {
    return state.transactions.filter((t) => {
      const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase());
      const matchesCat = filterCat === "all" || t.categoryId === filterCat;
      return matchesSearch && matchesCat;
    });
  }, [state.transactions, search, filterCat]);

  if (!hydrated) return <div className="skeleton h-64" />;

  const handleSubmit = () => {
    const amt = parseFloat(amount);
    if (!description.trim()) {
      toast.error("Enter a description.");
      return;
    }
    if (!amt || amt <= 0) {
      toast.error("Enter a valid amount greater than 0.");
      return;
    }
    addTransaction({
      date,
      description: description.trim(),
      amount: amt,
      type,
      categoryId: type === "expense" ? categoryId : undefined,
    });
    toast.success(`${type === "income" ? "Income" : "Expense"} added.`);
    setDescription("");
    setAmount("");
  };

  const handleExportCsv = () => {
    const header = ["Date", "Description", "Type", "Category", "Amount"];
    const rows = state.transactions.map((t) => {
      const cat = state.categories.find((c) => c.id === t.categoryId);
      return [t.date, t.description, t.type, cat?.name || "", t.amount.toString()];
    });
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "smartbudget-transactions.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported transactions.csv");
  };

  const handleAddRecurring = () => {
    const amt = parseFloat(recAmount);
    if (!recName.trim()) {
      toast.error("Enter a description.");
      return;
    }
    if (!amt || amt <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    addRecurring({
      description: recName.trim(),
      amount: amt,
      type: recType,
      categoryId: recType === "expense" ? recCategoryId : undefined,
      cadence: recCadence,
      active: true,
    });
    toast.success(`Recurring "${recName.trim()}" scheduled — it will auto-post each period.`);
    setRecName("");
    setRecAmount("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Transactions</h1>
          <p className="text-[var(--muted)] text-sm">Log spending and income manually — fully private, no bank linking.</p>
        </div>
        <button className="btn-secondary text-sm w-fit" onClick={handleExportCsv}>
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Add transaction form */}
      <div className="card p-5">
        <h2 className="font-semibold mb-3">Add Transaction</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">
          <select className="input lg:col-span-1" value={type} onChange={(e) => setType(e.target.value as "expense" | "income")}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          <input
            className="input lg:col-span-2"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          <input
            type="number"
            className="input"
            placeholder={`Amount (${symbol})`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          {type === "expense" ? (
            <select className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {state.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="hidden lg:block" />
          )}
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <button className="btn-primary mt-3" onClick={handleSubmit}>
          <Plus size={16} /> Add Transaction
        </button>
      </div>

      {/* Recurring transactions */}
      <div className="card p-5">
        <button
          className="flex items-center justify-between w-full"
          onClick={() => setShowRecurring((v) => !v)}
        >
          <h2 className="font-semibold flex items-center gap-2">
            <Repeat2 size={16} className="text-[var(--brand)]" /> Recurring Transactions
            {state.recurring.filter((r) => r.active).length > 0 && (
              <span className="chip bg-[color-mix(in_srgb,var(--brand)_12%,transparent)] text-[var(--brand)] border-transparent">
                {state.recurring.filter((r) => r.active).length} active
              </span>
            )}
          </h2>
          <span className="text-xs text-[var(--brand)] font-medium">{showRecurring ? "Hide" : "Manage"}</span>
        </button>

        <AnimatePresence initial={false}>
          {showRecurring && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <p className="text-xs text-[var(--muted)] mt-3 mb-3">
                Recurring items auto-post as a transaction once per period (e.g. rent, salary, gym membership) so
                you don&apos;t have to log them manually every month.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 mb-3">
                <select className="input" value={recType} onChange={(e) => setRecType(e.target.value as "expense" | "income")}>
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
                <input className="input lg:col-span-2" placeholder="Description (e.g. Rent)" value={recName} onChange={(e) => setRecName(e.target.value)} />
                <input type="number" className="input" placeholder={`Amount (${symbol})`} value={recAmount} onChange={(e) => setRecAmount(e.target.value)} />
                <select className="input" value={recCadence} onChange={(e) => setRecCadence(e.target.value as "monthly" | "weekly" | "yearly")}>
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                  <option value="yearly">Yearly</option>
                </select>
                {recType === "expense" && (
                  <select className="input lg:col-span-2" value={recCategoryId} onChange={(e) => setRecCategoryId(e.target.value)}>
                    {state.categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                )}
              </div>
              <button className="btn-secondary mb-3" onClick={handleAddRecurring}>
                <Plus size={14} /> Schedule Recurring Item
              </button>

              <div className="divide-y divide-[var(--border)]">
                {state.recurring.length === 0 && (
                  <p className="text-sm text-[var(--muted)] text-center py-4">No recurring items scheduled.</p>
                )}
                {state.recurring.map((r) => {
                  const cat = state.categories.find((c) => c.id === r.categoryId);
                  return (
                    <div key={r.id} className="flex items-center justify-between py-2.5 gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{r.description}</p>
                        <p className="text-xs text-[var(--muted)] capitalize">
                          {r.cadence} {cat ? `· ${cat.name}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-sm font-semibold ${r.type === "income" ? "text-emerald-500" : ""}`}>
                          {r.type === "income" ? "+" : "-"}
                          {formatCurrency(r.amount, symbol)}
                        </span>
                        <Switch checked={r.active} onCheckedChange={(v) => updateRecurring(r.id, { active: v })} />
                        <button className="icon-btn danger" onClick={() => setDeleteRecurring(r)}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="input flex items-center gap-2 flex-1">
          <Search size={16} className="text-[var(--muted)]" />
          <input
            className="flex-1 outline-none bg-transparent"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input sm:w-56" value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
          <option value="all">All Categories</option>
          {state.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* List */}
      <div className="card divide-y divide-[var(--border)]">
        {filtered.length === 0 ? (
          <div className="text-sm text-[var(--muted)] text-center py-10">No transactions found.</div>
        ) : (
          <AnimatePresence initial={false}>
            {filtered.map((t) => {
              const cat = state.categories.find((c) => c.id === t.categoryId);
              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-9 h-9 rounded-full bg-[color-mix(in_srgb,var(--muted)_10%,transparent)] flex items-center justify-center text-[var(--muted)] shrink-0">
                      <CategoryIcon name={cat?.icon} size={16} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{t.description}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {cat?.name || (t.type === "income" ? "Income" : "Uncategorized")} ·{" "}
                        {new Date(t.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className={`text-sm font-semibold mr-2 ${t.type === "income" ? "text-emerald-500" : ""}`}>
                      {t.type === "income" ? "+" : "-"}
                      {formatCurrency(t.amount, symbol)}
                    </span>
                    <button className="icon-btn" onClick={() => setEditing(t)} aria-label="Edit">
                      <Pencil size={15} />
                    </button>
                    <button className="icon-btn danger" onClick={() => setDeleteTarget(t)} aria-label="Delete">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      <Modal open={!!editing} onOpenChange={(o) => !o && setEditing(null)} title="Edit Transaction">
        {editing && (
          <div className="space-y-3">
            <select
              className="input"
              value={editing.type}
              onChange={(e) => setEditing({ ...editing, type: e.target.value as "expense" | "income" })}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
            <input
              className="input"
              value={editing.description}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
            />
            <input
              type="number"
              className="input"
              value={editing.amount}
              onChange={(e) => setEditing({ ...editing, amount: parseFloat(e.target.value) || 0 })}
            />
            {editing.type === "expense" && (
              <select
                className="input"
                value={editing.categoryId || ""}
                onChange={(e) => setEditing({ ...editing, categoryId: e.target.value })}
              >
                {state.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
            <input
              type="date"
              className="input"
              value={editing.date}
              onChange={(e) => setEditing({ ...editing, date: e.target.value })}
            />
            <div className="flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  if (!editing.description.trim() || editing.amount <= 0) {
                    toast.error("Please enter a valid description and amount.");
                    return;
                  }
                  updateTransaction(editing.id, editing);
                  toast.success("Transaction updated.");
                  setEditing(null);
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete Transaction"
        description={`Delete "${deleteTarget?.description}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) {
            removeTransaction(deleteTarget.id);
            toast.success("Transaction deleted.");
          }
        }}
      />

      <ConfirmDialog
        open={!!deleteRecurring}
        onOpenChange={(o) => !o && setDeleteRecurring(null)}
        title="Delete Recurring Item"
        description={`Stop and remove "${deleteRecurring?.description}"? Past auto-posted transactions won't be affected.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteRecurring) {
            removeRecurring(deleteRecurring.id);
            toast.success("Recurring item removed.");
          }
        }}
      />
    </div>
  );
}
