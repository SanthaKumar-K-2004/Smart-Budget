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
import { encryptData, decryptData } from "./encryption";
import { toast } from "sonner";

const STORAGE_KEY = "smartbudget:v2";
const LEGACY_KEY = "smartbudget:v1";

interface StoreApi {
  state: AppState;
  hydrated: boolean;
  persistOk: boolean;
  vaultLocked: boolean;
  hasPassphrase: boolean;
  selectedMonth: string;
  setSelectedMonth: (m: string) => void;
  unlockVault: (pass: string) => Promise<boolean>;
  setupVault: (pass: string | null) => Promise<void>;
  lockVault: () => void;
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
    if (raw.includes('"encrypted":true')) {
      return INITIAL_STATE; // Handled separately via unlockVault
    }
    return sanitizeState(JSON.parse(raw));
  } catch {
    return INITIAL_STATE;
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [persistOk, setPersistOk] = useState(true);

  // Vault/Encryption state
  const [vaultLocked, setVaultLocked] = useState(false);
  const [passphrase, setPassphrase] = useState<string | null>(null);
  const [hasPassphrase, setHasPassphrase] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey());

  // Initial load and auto-unlock check
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sessionPass = sessionStorage.getItem("smartbudget:passphrase");
    const raw = safeGetItem(STORAGE_KEY) ?? safeGetItem(LEGACY_KEY);
    
    setTimeout(() => {
      if (raw && raw.includes('"encrypted":true')) {
        setHasPassphrase(true);
        if (sessionPass) {
          decryptData(raw, sessionPass)
            .then((decrypted) => {
              setState(sanitizeState(JSON.parse(decrypted)));
              setPassphrase(sessionPass);
              setVaultLocked(false);
              setHydrated(true);
            })
            .catch(() => {
              // Decryption failed (e.g. stale session pass)
              setVaultLocked(true);
              setHydrated(true);
            });
        } else {
          setVaultLocked(true);
          setHydrated(true);
        }
      } else {
        setHasPassphrase(false);
        setState(loadState());
        setHydrated(true);
      }
    }, 0);
  }, []);

  // Auto-post recurring transactions once per month, per item.
  useEffect(() => {
    if (!hydrated || vaultLocked) return;
    const monthKey = currentMonthKey();
    setTimeout(() => {
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
        setTimeout(() => toast.success(`Auto-posted ${due.length} recurring item(s).`), 300);
        return { ...s, transactions: [...newTx, ...s.transactions], recurring: updatedRecurring };
      });
    }, 0);
  }, [hydrated, vaultLocked]);

  // Persist state to localStorage (encrypted or plain text)
  useEffect(() => {
    if (!hydrated || vaultLocked) return;

    const save = async () => {
      const json = JSON.stringify(state);
      if (passphrase) {
        try {
          const encrypted = await encryptData(json, passphrase);
          const ok = safeSetItem(STORAGE_KEY, encrypted);
          setPersistOk(ok);
        } catch (e) {
          console.error("Failed to encrypt state on save:", e);
          setPersistOk(false);
        }
      } else {
        const ok = safeSetItem(STORAGE_KEY, json);
        setPersistOk(ok);
      }
    };

    save();
  }, [state, hydrated, passphrase, vaultLocked]);

  // Auto-lock vault on 5 minutes inactivity
  useEffect(() => {
    if (!passphrase || typeof window === "undefined") return;

    let timer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setVaultLocked(true);
        setPassphrase(null);
        sessionStorage.removeItem("smartbudget:passphrase");
        toast.info("Vault auto-locked due to 5 min inactivity.");
      }, 5 * 60 * 1000);
    };

    const events = ["mousemove", "keydown", "mousedown", "touchstart"];
    events.forEach((evt) => window.addEventListener(evt, resetTimer));

    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach((evt) => window.removeEventListener(evt, resetTimer));
    };
  }, [passphrase]);

  const unlockVault = useCallback(async (pass: string): Promise<boolean> => {
    try {
      const raw = safeGetItem(STORAGE_KEY) ?? safeGetItem(LEGACY_KEY);
      if (!raw) return false;
      const decrypted = await decryptData(raw, pass);
      const parsed = sanitizeState(JSON.parse(decrypted));
      setState(parsed);
      setPassphrase(pass);
      setVaultLocked(false);
      sessionStorage.setItem("smartbudget:passphrase", pass);
      toast.success("Vault unlocked successfully!");
      return true;
    } catch {
      toast.error("Incorrect vault passphrase.");
      return false;
    }
  }, []);

  const setupVault = useCallback(async (pass: string | null) => {
    if (pass === null) {
      setPassphrase(null);
      sessionStorage.removeItem("smartbudget:passphrase");
      setHasPassphrase(false);
      // Next auto-save will write plain text
    } else {
      setPassphrase(pass);
      sessionStorage.setItem("smartbudget:passphrase", pass);
      setHasPassphrase(true);
      try {
        const json = JSON.stringify(state);
        const encrypted = await encryptData(json, pass);
        safeSetItem(STORAGE_KEY, encrypted);
      } catch (e) {
        console.error(e);
      }
    }
  }, [state]);

  const lockVault = useCallback(() => {
    setVaultLocked(true);
    setPassphrase(null);
    sessionStorage.removeItem("smartbudget:passphrase");
    toast.info("Vault locked manually.");
  }, []);

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
    setState((s) => {
      const newTx = { ...t, id: uuid() };
      let updatedAssets = s.assets;
      let updatedDebts = s.debts;
      if (t.account) {
        const lowerAccount = t.account.toLowerCase().trim();
        updatedAssets = s.assets.map((a) => {
          if (a.name.toLowerCase().trim() === lowerAccount) {
            const diff = t.type === "income" ? t.amount : -t.amount;
            return { ...a, value: Math.max(0, a.value + diff) };
          }
          return a;
        });
        updatedDebts = s.debts.map((d) => {
          if (d.name.toLowerCase().trim() === lowerAccount) {
            const diff = t.type === "expense" ? t.amount : -t.amount;
            return { ...d, balance: Math.max(0, d.balance + diff) };
          }
          return d;
        });
      }
      return {
        ...s,
        transactions: [newTx, ...s.transactions],
        assets: updatedAssets,
        debts: updatedDebts,
      };
    });
  }, []);

  const updateTransaction = useCallback((id: string, patch: Partial<Transaction>) => {
    setState((s) => ({ ...s, transactions: s.transactions.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
  }, []);

  const removeTransaction = useCallback((id: string) => {
    setState((s) => {
      const t = s.transactions.find((tx) => tx.id === id);
      if (!t) return s;
      let updatedAssets = s.assets;
      let updatedDebts = s.debts;
      if (t.account) {
        const lowerAccount = t.account.toLowerCase().trim();
        updatedAssets = s.assets.map((a) => {
          if (a.name.toLowerCase().trim() === lowerAccount) {
            const diff = t.type === "income" ? -t.amount : t.amount;
            return { ...a, value: Math.max(0, a.value + diff) };
          }
          return a;
        });
        updatedDebts = s.debts.map((d) => {
          if (d.name.toLowerCase().trim() === lowerAccount) {
            const diff = t.type === "expense" ? -t.amount : t.amount;
            return { ...d, balance: Math.max(0, d.balance + diff) };
          }
          return d;
        });
      }
      return {
        ...s,
        transactions: s.transactions.filter((tx) => tx.id !== id),
        assets: updatedAssets,
        debts: updatedDebts,
      };
    });
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
    setState((s) => {
      const subId = uuid();
      const newSub = { ...sub, id: subId };
      const newRec: RecurringTransaction = {
        id: subId,
        description: sub.name,
        amount: sub.amount,
        type: "expense",
        cadence: sub.cadence,
        active: sub.active,
      };
      return {
        ...s,
        subscriptions: [...s.subscriptions, newSub],
        recurring: [...s.recurring, newRec],
      };
    });
  }, []);

  const updateSubscription = useCallback((id: string, patch: Partial<Subscription>) => {
    setState((s) => {
      const subscriptions = s.subscriptions.map((sub) => (sub.id === id ? { ...sub, ...patch } : sub));
      const recurring = s.recurring.map((r) => {
        if (r.id === id) {
          return {
            ...r,
            description: patch.name !== undefined ? patch.name : r.description,
            amount: patch.amount !== undefined ? patch.amount : r.amount,
            cadence: patch.cadence !== undefined ? patch.cadence : r.cadence,
            active: patch.active !== undefined ? patch.active : r.active,
          };
        }
        return r;
      });
      return { ...s, subscriptions, recurring };
    });
  }, []);

  const removeSubscription = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      subscriptions: s.subscriptions.filter((sub) => sub.id !== id),
      recurring: s.recurring.filter((r) => r.id !== id),
    }));
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
      vaultLocked,
      hasPassphrase,
      unlockVault,
      setupVault,
      lockVault,
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
      selectedMonth,
      setSelectedMonth,
      resetAll,
      exportData,
      importData,
      applyAutoBudget,
    }),
    [
      state,
      hydrated,
      persistOk,
      vaultLocked,
      hasPassphrase,
      unlockVault,
      setupVault,
      lockVault,
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
      selectedMonth,
      setSelectedMonth,
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
