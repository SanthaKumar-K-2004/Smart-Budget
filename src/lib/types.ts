export type BudgetMethod = "zero-based" | "50-30-20";

export type CategoryGroup = "needs" | "wants" | "savings";

export interface Category {
  id: string;
  name: string;
  group: CategoryGroup;
  assigned: number; // amount assigned/budgeted this month
  icon?: string;
}

export interface Transaction {
  id: string;
  date: string; // ISO date
  description: string;
  payee?: string; // merchant/recipient
  account?: string; // cash, bank account, credit card, etc.
  amount: number; // always positive, sign determined by `type`
  type: "expense" | "income";
  categoryId?: string; // undefined for income
  note?: string;
  tags?: string[];
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  targetDate?: string;
  icon?: string;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  cadence: "monthly" | "yearly" | "weekly";
  nextDate?: string;
  categoryId?: string;
  active: boolean;
}

export type AssetType = "cash" | "investment" | "property" | "crypto" | "other";
export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  value: number;
  /** Only used when type === "crypto": the CoinGecko coin id (e.g. "bitcoin") */
  coinId?: string;
  /** Only used when type === "crypto": quantity held; value is derived live from price × quantity */
  quantity?: number;
  costBasis?: number;
  acquiredDate?: string;
}

export type DebtStrategy = "avalanche" | "snowball";
export interface Debt {
  id: string;
  name: string;
  balance: number;
  apr: number; // annual interest rate, percent
  minPayment: number;
}

export interface RecurringTransaction {
  id: string;
  description: string;
  amount: number;
  type: "expense" | "income";
  categoryId?: string;
  cadence: "monthly" | "weekly" | "yearly";
  dayOfMonth?: number; // for monthly/yearly
  lastPostedMonth?: string; // "YYYY-MM" to avoid double posting
  active: boolean;
}

export type ThemeMode = "light" | "dark" | "system";

export interface AppState {
  version: number;
  currency: string;
  budgetMethod: BudgetMethod;
  monthlyIncome: number;
  categories: Category[];
  transactions: Transaction[];
  goals: Goal[];
  subscriptions: Subscription[];
  assets: Asset[];
  debts: Debt[];
  debtStrategy: DebtStrategy;
  debtExtraPayment: number;
  recurring: RecurringTransaction[];
  holidayCountry: string;
  onboarded: boolean;
}
