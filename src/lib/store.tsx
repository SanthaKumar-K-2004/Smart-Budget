"use client";

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { v4 as uuid } from "uuid";
import {
  AppState,
  Category,
  Transaction,
  Goal,
  Subscription,
  BudgetMethod,
  Asset,
  Debt,
  DebtStrategy,
  RecurringTransaction,
} from "./types";
import { INITIAL_STATE } from "./defaults";
import { safeGetItem, safeSetItem } from "./storage";
import { currentMonthKey, shouldPostRecurring } from "./calc";
import { toast } from "sonner";

const STORAGE_KEY = "smartbudget:v2";
const LEGACY_KEY = "smartbudget:v1";

interface StoreApi {
  state: AppState;
  hydrated: boolean;
  persistOk: boolean;
  setMonthlyIncome: (n: number) => void;
  setCurrency: (c: string) => void;
  setBudgetMethod: (m: BudgetMethod) => void;
  setOnboarded: (b: boolean) => void;

  addCategory: (name: string, group: Category["group"]) => void;
  updateCategory: (id: string, patch: Partial<Category>) => void;
  removeCategory: (id: string) => void;

  addTransaction: (t: Omit<Transaction, "id">) => void;
  updateTransaction: (id: string, patch: Partial<Transaction>) => void;
  removeTransaction: (id: string) => void;

  addGoal: (g: Omit<Goal, "id">) => void;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  removeGoal: (id: string) => void;

  addSubscription: (s: Omit<Subscription, "id">) => void;
  updateSubscription: (id: string, patch: Partial<Subscription>) => void;
  removeSubscription: (id: string) => void;

  addAsset: (a: Omit<Asset, "id">) => void;
  updateAsset: (id: string, patch: Partial<Asset>) => void;
  removeAsset: (id: string) => void;

  addDebt: (d: Omit<Debt, "id">) => void;
  updateDebt: (id: string, patch: Partial<Debt>) => void;
  removeDebt: (id: string) => void;
  setDebtStrategy: (s: DebtStrategy) => void;
  setDebtExtraPayment: (n: number) => void;

  addRecurring: (r: Omit<RecurringTransaction, "id">) => void;
  updateRecurring: (id: string, patch: Partial<RecurringTransaction>) => void;
  removeRecurring: (id: string) => void;

  setHolidayCountry: (code: string) => void;

  resetAll: () => void;
  exportData: () => string;
  importData: (json: string) => { ok: boolean; error?: string };
  applyAutoBudget: () => void;
}

const StoreContext = createContext<StoreApi | null>(null);

function sanitizeState(parsed: unknown): AppState {
  const base = { ...INITIAL_STATE };
  if (!parsed || typeof parsed !== "object") return base;
  const p = parsed as Partial<AppState>;
  return {
    ...base,
    ...p,
    categories: Array.isArray(p.categories) ? p.categories : base.categories,
    transactions: Array.isArray(p.transactions) ? p.transactions : base.transactions,
    goals: Array.isArray(p.goals) ? p.goals : base.goals,
    subscriptions: Array.isArray(p.subscriptions) ? p.subscriptions : base.subscriptions,
    assets: Array.isArray(p.assets) ? p.assets : base.assets,
    debts: Array.isArray(p.debts) ? p.debts : base.debts,
    recurring: Array.isArray(p.recurring) ? p.recurring : base.recurring,
    monthlyIncome: typeof p.monthlyIncome === "number" ? p.monthlyIncome : base.monthlyIncome,
    currency: typeof p.currency === "string" ? p.currency : base.currency,
  };
}

function loadState(): AppState {
  if (typeof window === "undefined") return INITIAL_STATE;
  try {
    const raw = safeGetItem(STORAGE_KEY) ?? safeGetItem(LEGACY_KEY);
    if (!raw) return INITIAL_STATE;
    return sanitizeState(JSON.parse(raw));
  } catch {
    return INITIAL_STATE;
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [persistOk, setPersistOk] = useState(true);

  // One-time load from localStorage after mount. This must run in an effect
  // (not during render) because localStorage is a browser-only external
  // system and reading it during SSR would cause a hydration mismatch.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(loadState());
    setHydrated(true);
  }, []);

  // Auto-post recurring transactions once per month, per item. This
  // synchronizes React state with the "current date" external system, so it
  // belongs in an effect rather than during render.
  useEffect(() => {
    if (!hydrated) return;
    const monthKey = currentMonthKey();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState((s) => {
      const due = s.recurring.filter((r) => r.active && shouldPostRecurring(r.lastPostedMonth, monthKey));
      if (due.length === 0) return s;
      const newTx: Transaction[] = due.map((r) => ({
        id: uuid(),
        date: new Date().toISOString().slice(0, 10),
        description: r.description,
        amount: r.amount,
        type: r.type,
        categoryId: r.categoryId,
      }));
      const updatedRecurring = s.recurring.map((r) =>
        due.find((d) => d.id === r.id) ? { ...r, lastPostedMonth: monthKey } : r
      );
      if (due.length > 0) {
        setTimeout(() => toast.success(`Auto-posted ${due.length} recurring transaction${due.length > 1 ? "s" : ""} for this month.`), 300);
      }
      return { ...s, transactions: [...newTx, ...s.transactions], recurring: updatedRecurring };
    });
  }, [hydrated]);

  // Persist to localStorage (an external system) whenever state changes.
  useEffect(() => {
    if (!hydrated) return;
    const ok = safeSetItem(STORAGE_KEY, JSON.stringify(state));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPersistOk(ok);
  }, [state, hydrated]);

  const setMonthlyIncome = useCallback((n: number) => setState((s) => ({ ...s, monthlyIncome: n })), []);
  const setCurrency = useCallback((c: string) => setState((s) => ({ ...s, currency: c })), []);
  const setBudgetMethod = useCallback((m: BudgetMethod) => setState((s) => ({ ...s, budgetMethod: m })), []);
  const setOnboarded = useCallback((b: boolean) => setState((s) => ({ ...s, onboarded: b })), []);

  const addCategory = useCallback((name: string, group: Category["group"]) => {
    setState((s) => ({ ...s, categories: [...s.categories, { id: uuid(), name, group, assigned: 0 }] }));
  }, []);
  const updateCategory = useCallback((id: string, patch: Partial<Category>) => {
    setState((s) => ({ ...s, categories: s.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
  }, []);
  const removeCategory = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      categories: s.categories.filter((c) => c.id !== id),
      transactions: s.transactions.map((t) => (t.categoryId === id ? { ...t, categoryId: undefined } : t)),
    }));
  }, []);

  const addTransaction = useCallback((t: Omit<Transaction, "id">) => {
    setState((s) => ({ ...s, transactions: [{ ...t, id: uuid() }, ...s.transactions] }));
  }, []);
  const updateTransaction = useCallback((id: string, patch: Partial<Transaction>) => {
    setState((s) => ({ ...s, transactions: s.transactions.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
  }, []);
  const removeTransaction = useCallback((id: string) => {
    setState((s) => ({ ...s, transactions: s.transactions.filter((t) => t.id !== id) }));
  }, []);

  const addGoal = useCallback((g: Omit<Goal, "id">) => {
    setState((s) => ({ ...s, goals: [...s.goals, { ...g, id: uuid() }] }));
  }, []);
  const updateGoal = useCallback((id: string, patch: Partial<Goal>) => {
    setState((s) => ({ ...s, goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) }));
  }, []);
  const removeGoal = useCallback((id: string) => {
    setState((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== id) }));
  }, []);

  const addSubscription = useCallback((sub: Omit<Subscription, "id">) => {
    setState((s) => ({ ...s, subscriptions: [...s.subscriptions, { ...sub, id: uuid() }] }));
  }, []);
  const updateSubscription = useCallback((id: string, patch: Partial<Subscription>) => {
    setState((s) => ({ ...s, subscriptions: s.subscriptions.map((sub) => (sub.id === id ? { ...sub, ...patch } : sub)) }));
  }, []);
  const removeSubscription = useCallback((id: string) => {
    setState((s) => ({ ...s, subscriptions: s.subscriptions.filter((sub) => sub.id !== id) }));
  }, []);

  const addAsset = useCallback((a: Omit<Asset, "id">) => {
    setState((s) => ({ ...s, assets: [...s.assets, { ...a, id: uuid() }] }));
  }, []);
  const updateAsset = useCallback((id: string, patch: Partial<Asset>) => {
    setState((s) => ({ ...s, assets: s.assets.map((a) => (a.id === id ? { ...a, ...patch } : a)) }));
  }, []);
  const removeAsset = useCallback((id: string) => {
    setState((s) => ({ ...s, assets: s.assets.filter((a) => a.id !== id) }));
  }, []);

  const addDebt = useCallback((d: Omit<Debt, "id">) => {
    setState((s) => ({ ...s, debts: [...s.debts, { ...d, id: uuid() }] }));
  }, []);
  const updateDebt = useCallback((id: string, patch: Partial<Debt>) => {
    setState((s) => ({ ...s, debts: s.debts.map((d) => (d.id === id ? { ...d, ...patch } : d)) }));
  }, []);
  const removeDebt = useCallback((id: string) => {
    setState((s) => ({ ...s, debts: s.debts.filter((d) => d.id !== id) }));
  }, []);
  const setDebtStrategy = useCallback((strat: DebtStrategy) => setState((s) => ({ ...s, debtStrategy: strat })), []);
  const setDebtExtraPayment = useCallback((n: number) => setState((s) => ({ ...s, debtExtraPayment: n })), []);

  const addRecurring = useCallback((r: Omit<RecurringTransaction, "id">) => {
    setState((s) => ({ ...s, recurring: [...s.recurring, { ...r, id: uuid() }] }));
  }, []);
  const updateRecurring = useCallback((id: string, patch: Partial<RecurringTransaction>) => {
    setState((s) => ({ ...s, recurring: s.recurring.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
  }, []);
  const removeRecurring = useCallback((id: string) => {
    setState((s) => ({ ...s, recurring: s.recurring.filter((r) => r.id !== id) }));
  }, []);

  const setHolidayCountry = useCallback((code: string) => setState((s) => ({ ...s, holidayCountry: code })), []);

  const resetAll = useCallback(() => setState(INITIAL_STATE), []);

  const exportData = useCallback(() => JSON.stringify(state, null, 2), [state]);

  const importData = useCallback((json: string): { ok: boolean; error?: string } => {
    try {
      const parsed = JSON.parse(json);
      if (typeof parsed !== "object" || parsed === null) {
        return { ok: false, error: "File does not contain a valid SmartBudget export." };
      }
      setState(sanitizeState(parsed));
      return { ok: true };
    } catch {
      return { ok: false, error: "Could not parse JSON — please select a valid SmartBudget export file." };
    }
  }, []);

  const applyAutoBudget = useCallback(() => {
    setState((s) => {
      const income = s.monthlyIncome;
      if (income <= 0) return s;
      const roundedIncome = Math.round(income);
      const needsTarget = Math.round(roundedIncome * 0.5);
      const wantsTarget = Math.round(roundedIncome * 0.3);
      const savingsTarget = roundedIncome - needsTarget - wantsTarget;
      const groupTargets: Record<string, number> = {
        needs: needsTarget,
        wants: wantsTarget,
        savings: savingsTarget,
      };
      const byGroup: Record<string, Category[]> = { needs: [], wants: [], savings: [] };
      s.categories.forEach((c) => byGroup[c.group].push(c));

      const assignedById = new Map<string, number>();
      (Object.keys(byGroup) as Array<keyof typeof byGroup>).forEach((group) => {
        const groupCats = byGroup[group];
        if (groupCats.length === 0) return;
        const target = groupTargets[group];
        const base = Math.floor(target / groupCats.length);
        let remainder = target - base * groupCats.length;

        groupCats.forEach((cat) => {
          const extra = remainder > 0 ? 1 : 0;
          assignedById.set(cat.id, base + extra);
          if (remainder > 0) remainder--;
        });
      });

      const newCategories = s.categories.map((c) => ({
        ...c,
        assigned: assignedById.get(c.id) ?? c.assigned,
      }));
      return { ...s, categories: newCategories };
    });
  }, []);

  const value = useMemo<StoreApi>(
    () => ({
      state,
      hydrated,
      persistOk,
      setMonthlyIncome,
      setCurrency,
      setBudgetMethod,
      setOnboarded,
      addCategory,
      updateCategory,
      removeCategory,
      addTransaction,
      updateTransaction,
      removeTransaction,
      addGoal,
      updateGoal,
      removeGoal,
      addSubscription,
      updateSubscription,
      removeSubscription,
      addAsset,
      updateAsset,
      removeAsset,
      addDebt,
      updateDebt,
      removeDebt,
      setDebtStrategy,
      setDebtExtraPayment,
      addRecurring,
      updateRecurring,
      removeRecurring,
      setHolidayCountry,
      resetAll,
      exportData,
      importData,
      applyAutoBudget,
    }),
    [
      state,
      hydrated,
      persistOk,
      setMonthlyIncome,
      setCurrency,
      setBudgetMethod,
      setOnboarded,
      addCategory,
      updateCategory,
      removeCategory,
      addTransaction,
      updateTransaction,
      removeTransaction,
      addGoal,
      updateGoal,
      removeGoal,
      addSubscription,
      updateSubscription,
      removeSubscription,
      addAsset,
      updateAsset,
      removeAsset,
      addDebt,
      updateDebt,
      removeDebt,
      setDebtStrategy,
      setDebtExtraPayment,
      addRecurring,
      updateRecurring,
      removeRecurring,
      setHolidayCountry,
      resetAll,
      exportData,
      importData,
      applyAutoBudget,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
