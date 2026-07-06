import { AppState, Category, Transaction, Debt, Asset, DebtStrategy, Subscription } from "./types";

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

export interface SafeToSpendBreakdown {
  total: number;
  income: number;
  spentMtd: number;
  scheduledRecurringRemaining: number;
  assignedSavingsBuffer: number;
}

export function safeToSpend(state: AppState, monthKey: string): SafeToSpendBreakdown {
  const income = state.monthlyIncome;
  const spentMtd = totalSpent(state.transactions, monthKey);

  // Find active recurring expenses that have not posted yet this month
  const scheduledRecurringRemaining = state.recurring
    .filter((r) => r.active && r.type === "expense" && r.lastPostedMonth !== monthKey)
    .reduce((sum, r) => sum + r.amount, 0);

  // Sum of assigned amounts in savings group
  const savingsGroup = state.categories.filter((c) => c.group === "savings");
  const assignedSavingsBuffer = savingsGroup.reduce((sum, c) => sum + (c.assigned || 0), 0);

  const total = Math.max(0, income - spentMtd - scheduledRecurringRemaining - assignedSavingsBuffer);

  return {
    total,
    income,
    spentMtd,
    scheduledRecurringRemaining,
    assignedSavingsBuffer,
  };
}

export interface HealthScoreBreakdown {
  assignedCoverage: number;
  savingsCoverage: number;
  ageOfMoney: number;
  overspendDiscipline: number;
}

export function budgetHealthScore(state: AppState, monthKey: string): {
  score: number | null;
  label: string;
  color: string;
  breakdown?: HealthScoreBreakdown;
} {
  const income = state.monthlyIncome;
  const assigned = totalAssigned(state.categories);
  const spent = totalSpent(state.transactions, monthKey);

  // Null state checks: if no income setup or categories have zero assigned budget
  if (income <= 0 && state.transactions.length === 0 && assigned <= 0) {
    return {
      score: null,
      label: "Set Up to Score",
      color: "var(--muted)",
    };
  }

  // 1. Assigned Coverage (35%): Ideal is 100% of income assigned to categories
  const assignedRatio = income > 0 ? assigned / income : 0;
  const assignedCoverage = Math.max(0, 35 * (1 - Math.abs(1 - assignedRatio)));

  // 2. Savings/True Expenses Funded (25%): Target 20% of income assigned to savings
  const savingsGroup = state.categories.filter((c) => c.group === "savings");
  const savingsAssigned = savingsGroup.reduce((sum, c) => sum + (c.assigned || 0), 0);
  const savingsRate = income > 0 ? savingsAssigned / income : 0;
  const savingsCoverage = 25 * Math.min(1, savingsRate / 0.20);

  // 3. Age of Money / Cash Buffer (20%): Liquid cash vs. average daily spend
  const liquidAssets = state.assets
    .filter((a) => a.type === "cash" || a.type === "investment")
    .reduce((sum, a) => sum + a.value, 0);
  
  // Calculate average daily spend for the month
  const averageDailySpend = spent > 0 ? spent / 30 : (income > 0 ? income / 30 : 0);
  const ageOfMoneyDays = averageDailySpend > 0 ? liquidAssets / averageDailySpend : 0;
  const ageOfMoney = 20 * Math.min(1, ageOfMoneyDays / 30); // Max score at 30 days buffer

  // 4. Overspend Discipline (20%): Penalize overspent category assignments
  const spentMap = spentByCategory(state.transactions, monthKey);
  const totalOverspent = state.categories.reduce(
    (sum, c) => sum + Math.max(0, (spentMap.get(c.id) || 0) - c.assigned),
    0
  );
  const overspendRatio = assigned > 0 ? totalOverspent / assigned : 0;
  const overspendDiscipline = 20 * Math.max(0, 1 - overspendRatio);

  const rawScore = assignedCoverage + savingsCoverage + ageOfMoney + overspendDiscipline;
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));

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

  return {
    score,
    label,
    color,
    breakdown: {
      assignedCoverage: Math.round(assignedCoverage),
      savingsCoverage: Math.round(savingsCoverage),
      ageOfMoney: Math.round(ageOfMoney),
      overspendDiscipline: Math.round(overspendDiscipline),
    },
  };
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

export interface DetectedSubscription {
  name: string;
  amount: number;
  cadence: "monthly" | "weekly" | "yearly";
}

export function detectSubscriptions(transactions: Transaction[], existingSubs: Subscription[]): DetectedSubscription[] {
  const expenseTx = transactions.filter((t) => t.type === "expense" && t.amount > 0);
  
  // Group by lowercased payee or description
  const groups = new Map<string, Transaction[]>();
  expenseTx.forEach((t) => {
    const key = (t.payee || t.description).toLowerCase().trim();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  });

  const detected: DetectedSubscription[] = [];

  for (const [key, txs] of groups.entries()) {
    if (txs.length < 2) continue;

    // Check if it already exists as a subscription
    const alreadySub = existingSubs.some((s) => s.name.toLowerCase().trim() === key);
    if (alreadySub) continue;

    // Sort by date ascending
    txs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Check interval between consecutive transactions
    let isRecurring = false;
    let detectedCadence: "monthly" | "weekly" | "yearly" = "monthly";
    let detectedAmount = txs[txs.length - 1].amount;

    for (let i = 1; i < txs.length; i++) {
      const t1 = new Date(txs[i - 1].date);
      const t2 = new Date(txs[i].date);
      const diffDays = (t2.getTime() - t1.getTime()) / (1000 * 60 * 60 * 24);
      const amtDiffRatio = Math.abs(txs[i].amount - txs[i - 1].amount) / txs[i - 1].amount;

      if (amtDiffRatio < 0.05) { // 5% allowance
        if (diffDays >= 25 && diffDays <= 35) {
          isRecurring = true;
          detectedCadence = "monthly";
          detectedAmount = txs[i].amount;
          break;
        } else if (diffDays >= 5 && diffDays <= 9) {
          isRecurring = true;
          detectedCadence = "weekly";
          detectedAmount = txs[i].amount;
          break;
        } else if (diffDays >= 350 && diffDays <= 380) {
          isRecurring = true;
          detectedCadence = "yearly";
          detectedAmount = txs[i].amount;
          break;
        }
      }
    }

    if (isRecurring) {
      const displayName = txs[0].payee || txs[0].description;
      detected.push({
        name: displayName,
        amount: detectedAmount,
        cadence: detectedCadence,
      });
    }
  }

  return detected;
}
