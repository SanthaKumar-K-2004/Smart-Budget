import { AppState, Category } from "./types";

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "rent", name: "Rent / HRA", group: "needs", assigned: 0, icon: "Home" },
  { id: "groceries", name: "Groceries", group: "needs", assigned: 0, icon: "ShoppingCart" },
  { id: "utilities", name: "Utilities / Electricity", group: "needs", assigned: 0, icon: "Zap" },
  { id: "transport", name: "Transport / Fuel", group: "needs", assigned: 0, icon: "Car" },
  { id: "maid", name: "Maid / Staff Salaries", group: "needs", assigned: 0, icon: "Users" },
  { id: "insurance", name: "Insurance", group: "needs", assigned: 0, icon: "Shield" },
  { id: "healthcare", name: "Healthcare / Medical", group: "needs", assigned: 0, icon: "HeartPulse" },
  { id: "dining", name: "Dining / Zomato / Swiggy", group: "wants", assigned: 0, icon: "UtensilsCrossed" },
  { id: "entertainment", name: "Entertainment / OTTs", group: "wants", assigned: 0, icon: "Film" },
  { id: "shopping", name: "Shopping / UPI spend", group: "wants", assigned: 0, icon: "ShoppingBag" },
  { id: "subscriptions", name: "Subscriptions", group: "wants", assigned: 0, icon: "Repeat" },
  { id: "travel", name: "Travel / Commute", group: "wants", assigned: 0, icon: "Plane" },
  { id: "emergency", name: "Emergency Fund", group: "savings", assigned: 0, icon: "LifeBuoy" },
  { id: "sip", name: "Mutual Funds / SIP", group: "savings", assigned: 0, icon: "TrendingUp" },
  { id: "debt", name: "Debt Payoff", group: "savings", assigned: 0, icon: "CreditCard" },
  { id: "goals", name: "Savings Goals / Gold / PPF", group: "savings", assigned: 0, icon: "Target" },
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
