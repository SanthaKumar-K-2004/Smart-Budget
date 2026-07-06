import { AppState, Category, Transaction, Debt, Asset, DebtStrategy } from "./types";

export function currentMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function isSameMonth(iso: string, monthKey: string) {
  return iso.slice(0, 7) === monthKey;
}

export function totalAssigned(categories: Category[]) {
  return categories.reduce((sum, c) => sum + (c.assigned || 0), 0);
}

export function spentByCategory(transactions: Transaction[], monthKey: string) {
  const map = new Map<string, number>();
  transactions
    .filter((t) => t.type === "expense" && isSameMonth(t.date, monthKey))
    .forEach((t) => {
      if (!t.categoryId) return;
      map.set(t.categoryId, (map.get(t.categoryId) || 0) + t.amount);
    });
  return map;
}

export function totalSpent(transactions: Transaction[], monthKey: string) {
  return transactions
    .filter((t) => t.type === "expense" && isSameMonth(t.date, monthKey))
    .reduce((sum, t) => sum + t.amount, 0);
}

export function totalIncomeThisMonth(transactions: Transaction[], monthKey: string, fallback: number) {
  const logged = transactions
    .filter((t) => t.type === "income" && isSameMonth(t.date, monthKey))
    .reduce((sum, t) => sum + t.amount, 0);
  return logged > 0 ? logged : fallback;
}

export function groupTotals(categories: Category[]) {
  const totals: Record<string, number> = { needs: 0, wants: 0, savings: 0 };
  categories.forEach((c) => {
    totals[c.group] = (totals[c.group] || 0) + (c.assigned || 0);
  });
  return totals;
}

export function safeToSpend(income: number, categories: Category[]) {
  const assigned = totalAssigned(categories);
  return income - assigned;
}

export function budgetHealthScore(state: AppState, monthKey: string): {
  score: number;
  label: string;
  color: string;
} {
  const income = state.monthlyIncome || 1;
  const assigned = totalAssigned(state.categories);
  const spent = totalSpent(state.transactions, monthKey);
  const savingsGroup = state.categories.filter((c) => c.group === "savings");
  const savingsAssigned = savingsGroup.reduce((s, c) => s + c.assigned, 0);

  let score = 0;
  if (assigned > 0) {
    const overspendRatio = spent / assigned;
    score += Math.max(0, 40 - Math.max(0, overspendRatio - 1) * 80);
  } else {
    score += 20;
  }
  const savingsRate = savingsAssigned / income;
  score += Math.min(30, (savingsRate / 0.2) * 30);
  if (assigned > 0) {
    const allocRatio = assigned / income;
    if (allocRatio <= 1) score += allocRatio * 30;
    else score += Math.max(0, 30 - (allocRatio - 1) * 60);
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let label = "Needs Attention";
  let color = "#ef4444";
  if (score >= 80) {
    label = "Excellent";
    color = "#22c55e";
  } else if (score >= 60) {
    label = "Good";
    color = "#84cc16";
  } else if (score >= 40) {
    label = "Fair";
    color = "#f59e0b";
  }

  return { score, label, color };
}

export function monthlySubscriptionCost(
  subscriptions: { amount: number; cadence: "monthly" | "yearly" | "weekly"; active: boolean }[]
) {
  return subscriptions
    .filter((s) => s.active)
    .reduce((sum, s) => {
      if (s.cadence === "monthly") return sum + s.amount;
      if (s.cadence === "yearly") return sum + s.amount / 12;
      if (s.cadence === "weekly") return sum + s.amount * 4.33;
      return sum;
    }, 0);
}

export function formatCurrency(amount: number, symbol: string) {
  const rounded = Math.round(amount * 100) / 100;
  const sign = rounded < 0 ? "-" : "";
  const abs = Math.abs(rounded);
  return `${sign}${symbol}${abs.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

// ---------- Net Worth ----------
export function totalAssets(assets: Asset[]) {
  return assets.reduce((s, a) => s + a.value, 0);
}
export function totalDebts(debts: Debt[]) {
  return debts.reduce((s, d) => s + d.balance, 0);
}
export function netWorth(assets: Asset[], debts: Debt[]) {
  return totalAssets(assets) - totalDebts(debts);
}

// ---------- Debt Payoff Simulator (avalanche / snowball) ----------
export interface DebtPayoffResult {
  monthsToPayoff: number;
  totalInterestPaid: number;
  schedule: { month: number; totalBalance: number }[];
  order: string[]; // debt ids in payoff priority order
}

export function simulateDebtPayoff(
  debts: Debt[],
  extraPerMonth: number,
  strategy: DebtStrategy,
  maxMonths = 600
): DebtPayoffResult {
  if (debts.length === 0) {
    return { monthsToPayoff: 0, totalInterestPaid: 0, schedule: [], order: [] };
  }

  const working = debts.map((d) => ({ ...d }));
  const order = [...working]
    .sort((a, b) => (strategy === "avalanche" ? b.apr - a.apr : a.balance - b.balance))
    .map((d) => d.id);

  let month = 0;
  let totalInterest = 0;
  const schedule: { month: number; totalBalance: number }[] = [];

  while (working.some((d) => d.balance > 0.01) && month < maxMonths) {
    month++;
    let freedUpExtra = extraPerMonth;

    // apply interest & min payments
    for (const d of working) {
      if (d.balance <= 0) continue;
      const monthlyRate = d.apr / 100 / 12;
      const interest = d.balance * monthlyRate;
      totalInterest += interest;
      d.balance += interest;
      const pay = Math.min(d.minPayment, d.balance);
      d.balance -= pay;
    }

    // apply extra to priority order
    for (const id of order) {
      if (freedUpExtra <= 0) break;
      const d = working.find((x) => x.id === id);
      if (!d || d.balance <= 0) continue;
      const pay = Math.min(freedUpExtra, d.balance);
      d.balance -= pay;
      freedUpExtra -= pay;
    }

    const totalBalance = working.reduce((s, d) => s + Math.max(0, d.balance), 0);
    schedule.push({ month, totalBalance: Math.round(totalBalance) });

    if (totalBalance <= 0.5) break;
  }

  return {
    monthsToPayoff: month,
    totalInterestPaid: Math.round(totalInterest),
    schedule,
    order,
  };
}

// ---------- Recurring transaction auto-posting ----------
export function shouldPostRecurring(lastPostedMonth: string | undefined, monthKey: string) {
  return lastPostedMonth !== monthKey;
}

// ---------- Spending trend (last N months) ----------
export function monthlyTrend(transactions: Transaction[], months = 6) {
  const now = new Date();
  const result: { month: string; label: string; income: number; expense: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = currentMonthKey(d);
    const label = d.toLocaleString("default", { month: "short" });
    const income = transactions
      .filter((t) => t.type === "income" && isSameMonth(t.date, key))
      .reduce((s, t) => s + t.amount, 0);
    const expense = transactions
      .filter((t) => t.type === "expense" && isSameMonth(t.date, key))
      .reduce((s, t) => s + t.amount, 0);
    result.push({ month: key, label, income, expense });
  }
  return result;
}
