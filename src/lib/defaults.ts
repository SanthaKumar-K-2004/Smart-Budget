import { AppState, Category } from "./types";

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "rent", name: "Rent / Mortgage", group: "needs", assigned: 0, icon: "Home" },
  { id: "groceries", name: "Groceries", group: "needs", assigned: 0, icon: "ShoppingCart" },
  { id: "utilities", name: "Utilities", group: "needs", assigned: 0, icon: "Zap" },
  { id: "transport", name: "Transport", group: "needs", assigned: 0, icon: "Car" },
  { id: "insurance", name: "Insurance", group: "needs", assigned: 0, icon: "Shield" },
  { id: "healthcare", name: "Healthcare", group: "needs", assigned: 0, icon: "HeartPulse" },
  { id: "dining", name: "Dining Out", group: "wants", assigned: 0, icon: "UtensilsCrossed" },
  { id: "entertainment", name: "Entertainment", group: "wants", assigned: 0, icon: "Film" },
  { id: "shopping", name: "Shopping", group: "wants", assigned: 0, icon: "ShoppingBag" },
  { id: "subscriptions", name: "Subscriptions", group: "wants", assigned: 0, icon: "Repeat" },
  { id: "travel", name: "Travel", group: "wants", assigned: 0, icon: "Plane" },
  { id: "emergency", name: "Emergency Fund", group: "savings", assigned: 0, icon: "LifeBuoy" },
  { id: "investing", name: "Investing", group: "savings", assigned: 0, icon: "TrendingUp" },
  { id: "debt", name: "Debt Payoff", group: "savings", assigned: 0, icon: "CreditCard" },
  { id: "goals", name: "Savings Goals", group: "savings", assigned: 0, icon: "Target" },
];

export const INITIAL_STATE: AppState = {
  version: 2,
  currency: "INR",
  budgetMethod: "50-30-20",
  monthlyIncome: 0,
  categories: DEFAULT_CATEGORIES,
  transactions: [],
  goals: [],
  subscriptions: [],
  assets: [],
  debts: [],
  debtStrategy: "avalanche",
  debtExtraPayment: 0,
  recurring: [],
  holidayCountry: "IN",
  onboarded: false,
};

export const CURRENCIES = [
  { code: "INR", symbol: "₹", label: "Indian Rupee" },
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "GBP", symbol: "£", label: "British Pound" },
  { code: "JPY", symbol: "¥", label: "Japanese Yen" },
  { code: "AUD", symbol: "A$", label: "Australian Dollar" },
  { code: "CAD", symbol: "C$", label: "Canadian Dollar" },
  { code: "SGD", symbol: "S$", label: "Singapore Dollar" },
];

export function currencySymbol(code: string) {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? code;
}
