"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { currencySymbol } from "@/lib/defaults";
import { formatCurrency } from "@/lib/calc";
import { CategoryIcon } from "@/lib/icons";
import { Plus, Trash2, Search, Pencil, Download, Repeat2, Tag } from "lucide-react";
import { toast } from "sonner";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";
import Switch from "@/components/ui/Switch";
import { RecurringTransaction, Transaction } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import DOMPurify from "dompurify";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

// Zod Schema for validation
const transactionSchema = z.object({
  description: z.string().min(1, "Description is required").max(100, "Description must be under 100 characters"),
  payee: z.string().max(100, "Payee name must be under 100 characters").optional(),
  account: z.string().max(50, "Account name must be under 50 characters").optional(),
  amount: z.number().positive("Amount must be greater than 0"),
  type: z.enum(["expense", "income"]),
  categoryId: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  note: z.string().max(500, "Notes must be under 500 characters").optional(),
  tags: z.array(z.string()).optional(),
});

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
  const [payee, setPayee] = useState("");
  const [account, setAccount] = useState("Cash");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState(state.categories[0]?.id || "");
  const [date, setDate] = useState(todayIso());
  const [note, setNote] = useState("");
  const [tagsInput, setTagsInput] = useState("");

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

  // List of accounts available from user's assets and debts
  const accountOptions = useMemo(() => {
    const list = ["Cash", "Main Bank Account", "Credit Card"];
    state.assets.forEach((a) => {
      if (a.name && !list.includes(a.name)) list.push(a.name);
    });
    state.debts.forEach((d) => {
      if (d.name && !list.includes(d.name)) list.push(d.name);
    });
    return list;
  }, [state.assets, state.debts]);

  const filtered = useMemo(() => {
    return state.transactions.filter((t) => {
      const matchDesc = t.description.toLowerCase().includes(search.toLowerCase());
      const matchPayee = t.payee?.toLowerCase().includes(search.toLowerCase()) || false;
      const matchTags = t.tags?.some((tg) => tg.toLowerCase().includes(search.toLowerCase())) || false;
      const matchesSearch = matchDesc || matchPayee || matchTags;
      const matchesCat = filterCat === "all" || t.categoryId === filterCat;
      return matchesSearch && matchesCat;
    });
  }, [state.transactions, search, filterCat]);

  if (!hydrated) return <div className="skeleton h-64" />;

  const handleSubmit = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      toast.error("Enter a valid amount greater than 0.");
      return;
    }

    // Input Sanitization using DOMPurify
    const cleanDesc = DOMPurify.sanitize(description.trim());
    const cleanPayee = DOMPurify.sanitize(payee.trim());
    const cleanNote = DOMPurify.sanitize(note.trim());
    const cleanAccount = DOMPurify.sanitize(account.trim());
    const tagArray = tagsInput
      .split(",")
      .map((t) => DOMPurify.sanitize(t.trim()))
      .filter((t) => t.length > 0);

    const validation = transactionSchema.safeParse({
      description: cleanDesc,
      payee: cleanPayee || undefined,
      account: cleanAccount || undefined,
      amount: amt,
      type,
      categoryId: type === "expense" ? categoryId : undefined,
      date,
      note: cleanNote || undefined,
      tags: tagArray.length > 0 ? tagArray : undefined,
    });

    if (!validation.success) {
      toast.error(validation.error.issues[0].message);
      return;
    }

    addTransaction(validation.data);
    toast.success(`${type === "income" ? "Income" : "Expense"} added.`);
    
    setDescription("");
    setPayee("");
    setAmount("");
    setNote("");
    setTagsInput("");
  };

  const handleExportCsv = () => {
    const header = ["Date", "Description", "Payee", "Account", "Type", "Category", "Amount", "Note", "Tags"];
    const rows = state.transactions.map((t) => {
      const cat = state.categories.find((c) => c.id === t.categoryId);
      return [
        t.date,
        t.description,
        t.payee || "",
        t.account || "",
        t.type,
        cat?.name || "",
        t.amount.toString(),
        t.note || "",
        (t.tags || []).join(";"),
      ];
    });
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
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
      description: DOMPurify.sanitize(recName.trim()),
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
        <button className="btn-secondary text-sm w-fit animate-fade-in" onClick={handleExportCsv}>
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Add transaction form */}
      <div className="card p-5">
        <h2 className="font-semibold mb-3">Add Transaction</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-[10px] uppercase font-semibold text-[var(--muted)]">Type</label>
            <select className="input mt-1" value={type} onChange={(e) => setType(e.target.value as "expense" | "income")}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-semibold text-[var(--muted)]">Description</label>
            <input
              className="input mt-1"
              placeholder="e.g. Weekly Groceries"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-semibold text-[var(--muted)]">Payee / Merchant</label>
            <input
              className="input mt-1"
              placeholder="e.g. Supermarket"
              value={payee}
              onChange={(e) => setPayee(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-semibold text-[var(--muted)]">Account</label>
            <select className="input mt-1" value={account} onChange={(e) => setAccount(e.target.value)}>
              {accountOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-semibold text-[var(--muted)]">Amount ({symbol})</label>
            <input
              type="number"
              className="input mt-1"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          {type === "expense" ? (
            <div>
              <label className="text-[10px] uppercase font-semibold text-[var(--muted)]">Category</label>
              <select className="input mt-1" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                {state.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="hidden lg:block" />
          )}

          <div>
            <label className="text-[10px] uppercase font-semibold text-[var(--muted)]">Date</label>
            <input type="date" className="input mt-1" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div>
            <label className="text-[10px] uppercase font-semibold text-[var(--muted)]">Tags (comma separated)</label>
            <input
              className="input mt-1"
              placeholder="food, travel"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-4">
            <label className="text-[10px] uppercase font-semibold text-[var(--muted)]">Notes</label>
            <input
              className="input mt-1"
              placeholder="Optional notes about this transaction..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
        </div>
        <button className="btn-primary mt-4" onClick={handleSubmit}>
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
            placeholder="Search by description, payee, or #tags..."
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
                      <div className="text-xs text-[var(--muted)] space-y-0.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span>{cat?.name || (t.type === "income" ? "Income" : "Uncategorized")}</span>
                          <span>·</span>
                          <span>{new Date(t.date).toLocaleDateString()}</span>
                          {t.account && (
                            <>
                              <span>·</span>
                              <span className="px-1.5 py-0.5 rounded bg-[var(--border)] text-[10px] text-[var(--foreground)]">
                                {t.account}
                              </span>
                            </>
                          )}
                        </div>
                        {t.payee && <p>Payee: <span className="font-medium text-[var(--foreground)]">{t.payee}</span></p>}
                        {t.note && <p className="italic">Note: {t.note}</p>}
                        {t.tags && t.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {t.tags.map((tg) => (
                              <span key={tg} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[var(--brand)]/10 text-[var(--brand)] text-[9px] font-medium">
                                <Tag size={8} /> {tg}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
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
            <div>
              <label className="text-xs font-semibold text-[var(--muted)]">Type</label>
              <select
                className="input mt-1"
                value={editing.type}
                onChange={(e) => setEditing({ ...editing, type: e.target.value as "expense" | "income" })}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--muted)]">Description</label>
              <input
                className="input mt-1"
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--muted)]">Payee</label>
              <input
                className="input mt-1"
                value={editing.payee || ""}
                onChange={(e) => setEditing({ ...editing, payee: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--muted)]">Account</label>
              <select
                className="input mt-1"
                value={editing.account || "Cash"}
                onChange={(e) => setEditing({ ...editing, account: e.target.value })}
              >
                {accountOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--muted)]">Amount</label>
              <input
                type="number"
                className="input mt-1"
                value={editing.amount}
                onChange={(e) => setEditing({ ...editing, amount: parseFloat(e.target.value) || 0 })}
              />
            </div>

            {editing.type === "expense" && (
              <div>
                <label className="text-xs font-semibold text-[var(--muted)]">Category</label>
                <select
                  className="input mt-1"
                  value={editing.categoryId || ""}
                  onChange={(e) => setEditing({ ...editing, categoryId: e.target.value })}
                >
                  {state.categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-[var(--muted)]">Date</label>
              <input
                type="date"
                className="input mt-1"
                value={editing.date}
                onChange={(e) => setEditing({ ...editing, date: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--muted)]">Tags (comma separated)</label>
              <input
                className="input mt-1"
                value={(editing.tags || []).join(", ")}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    tags: e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter((t) => t.length > 0),
                  })
                }
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--muted)]">Notes</label>
              <input
                className="input mt-1"
                value={editing.note || ""}
                onChange={(e) => setEditing({ ...editing, note: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button className="btn-secondary" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  const amt = editing.amount;
                  if (!editing.description.trim() || amt <= 0) {
                    toast.error("Please enter a valid description and amount.");
                    return;
                  }
                  
                  const cleanDesc = DOMPurify.sanitize(editing.description.trim());
                  const cleanPayee = DOMPurify.sanitize(editing.payee?.trim() || "");
                  const cleanNote = DOMPurify.sanitize(editing.note?.trim() || "");
                  const cleanAccount = DOMPurify.sanitize(editing.account?.trim() || "Cash");
                  const cleanTags = (editing.tags || []).map((t) => DOMPurify.sanitize(t.trim())).filter((t) => t.length > 0);

                  const validation = transactionSchema.safeParse({
                    description: cleanDesc,
                    payee: cleanPayee || undefined,
                    account: cleanAccount || undefined,
                    amount: amt,
                    type: editing.type,
                    categoryId: editing.type === "expense" ? editing.categoryId : undefined,
                    date: editing.date,
                    note: cleanNote || undefined,
                    tags: cleanTags.length > 0 ? cleanTags : undefined,
                  });

                  if (!validation.success) {
                    toast.error(validation.error.issues[0].message);
                    return;
                  }

                  updateTransaction(editing.id, {
                    ...editing,
                    ...validation.data,
                  });
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
