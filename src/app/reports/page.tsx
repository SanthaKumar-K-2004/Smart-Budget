"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { useStore } from "@/lib/store";
import { currencySymbol } from "@/lib/defaults";
import { formatCurrency, monthlyTrend, currentMonthKey, spentByCategory } from "@/lib/calc";
import { TrendingUp, TrendingDown } from "lucide-react";

const TrendArea = dynamic(() => import("@/components/charts/TrendArea"), {
  ssr: false,
  loading: () => <div className="skeleton h-[280px] w-full" />,
});
const CategoryBreakdownBar = dynamic(() => import("@/components/charts/CategoryBreakdownBar"), {
  ssr: false,
  loading: () => <div className="skeleton h-[220px] w-full" />,
});

export default function ReportsPage() {
  const { state, hydrated } = useStore();
  const symbol = currencySymbol(state.currency);

  const trend = useMemo(() => monthlyTrend(state.transactions, 6), [state.transactions]);
  const monthKey = currentMonthKey();

  const categorySpend = useMemo(() => {
    const map = spentByCategory(state.transactions, monthKey);
    return state.categories
      .map((c) => ({ name: c.name, value: map.get(c.id) || 0, group: c.group }))
      .filter((c) => c.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [state.categories, state.transactions, monthKey]);

  if (!hydrated) return <ReportsSkeleton />;

  const avgIncome = trend.reduce((s, t) => s + t.income, 0) / (trend.length || 1);
  const avgExpense = trend.reduce((s, t) => s + t.expense, 0) / (trend.length || 1);
  const savingsRate = avgIncome > 0 ? ((avgIncome - avgExpense) / avgIncome) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Reports & Trends</h1>
        <p className="text-[var(--muted)] text-sm">Six-month income vs. expense trend and category breakdown.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <p className="text-xs text-[var(--muted)] font-medium">Avg. Monthly Income</p>
          <p className="text-xl font-bold mt-1">{formatCurrency(avgIncome, symbol)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-[var(--muted)] font-medium">Avg. Monthly Expense</p>
          <p className="text-xl font-bold mt-1">{formatCurrency(avgExpense, symbol)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-[var(--muted)] font-medium">Avg. Savings Rate</p>
          <p className={`text-xl font-bold mt-1 flex items-center gap-1 ${savingsRate >= 20 ? "text-emerald-500" : "text-amber-500"}`}>
            {savingsRate >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {savingsRate.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-semibold mb-2">Income vs. Expenses (Last 6 Months)</h2>
        {trend.every((t) => t.income === 0 && t.expense === 0) ? (
          <p className="text-sm text-[var(--muted)] text-center py-10">
            No transaction history yet — add transactions to see trends over time.
          </p>
        ) : (
          <TrendArea data={trend} symbol={symbol} />
        )}
      </div>

      <div className="card p-5">
        <h2 className="font-semibold mb-2">This Month by Category</h2>
        {categorySpend.length === 0 ? (
          <p className="text-sm text-[var(--muted)] text-center py-10">No spending logged this month yet.</p>
        ) : (
          <CategoryBreakdownBar data={categorySpend} symbol={symbol} />
        )}
      </div>
    </div>
  );
}

function ReportsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="skeleton h-8 w-56" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton h-20" />
        ))}
      </div>
      <div className="skeleton h-72" />
      <div className="skeleton h-52" />
    </div>
  );
}
