"use client";

import dynamic from "next/dynamic";
import { useStore } from "@/lib/store";
import Onboarding from "@/components/Onboarding";
import PersistenceBanner from "@/components/PersistenceBanner";
import {
  currentMonthKey,
  totalSpent,
  groupTotals,
  budgetHealthScore,
  monthlySubscriptionCost,
  formatCurrency,
  spentByCategory,
  safeToSpend,
  netWorth,
} from "@/lib/calc";
import { currencySymbol } from "@/lib/defaults";
import { CategoryIcon } from "@/lib/icons";
import { CHART_COLORS } from "@/lib/theme";
import { TrendingUp, TrendingDown, Wallet, PiggyBank, AlertTriangle, ArrowRight, Scale } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import AnimatedNumber from "@/components/ui/AnimatedNumber";
import HolidayWidget from "@/components/HolidayWidget";

const AllocationPie = dynamic(() => import("@/components/charts/AllocationPie"), {
  ssr: false,
  loading: () => <div className="skeleton h-[200px] w-full" />,
});
const TopCategoriesBar = dynamic(() => import("@/components/charts/TopCategoriesBar"), {
  ssr: false,
  loading: () => <div className="skeleton h-[220px] w-full" />,
});

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export default function DashboardPage() {
  const { state, hydrated } = useStore();
  const symbol = currencySymbol(state.currency);
  const monthKey = currentMonthKey();

  if (!hydrated) return <DashboardSkeleton />;

  const spent = totalSpent(state.transactions, monthKey);
  const sts = safeToSpend(state.monthlyIncome, state.categories);
  const health = budgetHealthScore(state, monthKey);
  const gTotals = groupTotals(state.categories);
  const subCost = monthlySubscriptionCost(state.subscriptions);
  const spentMap = spentByCategory(state.transactions, monthKey);
  const nw = netWorth(state.assets, state.debts);

  const pieData = [
    { name: "Needs", value: gTotals.needs, key: "needs" },
    { name: "Wants", value: gTotals.wants, key: "wants" },
    { name: "Savings", value: gTotals.savings, key: "savings" },
  ].filter((d) => d.value > 0);

  const topCategories = [...state.categories]
    .map((c) => ({ ...c, spent: spentMap.get(c.id) || 0 }))
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 6);

  const recentTx = state.transactions.slice(0, 5);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5 md:space-y-6">
      <Onboarding />
      <PersistenceBanner />

      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Dashboard</h1>
          <p className="text-[var(--muted)] text-sm">
            Overview for {new Date().toLocaleString("default", { month: "long", year: "numeric" })}
          </p>
        </div>
        <Link href="/budget" className="btn-primary text-sm w-fit">
          Manage Budget <ArrowRight size={14} />
        </Link>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 [&>*:last-child]:col-span-2 lg:[&>*:last-child]:col-span-1">
        <StatCard
          icon={<Wallet size={18} />}
          label="Monthly Income"
          value={state.monthlyIncome}
          symbol={symbol}
          tint={CHART_COLORS.brand}
        />
        <StatCard
          icon={sts >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
          label="Safe to Spend"
          value={sts}
          symbol={symbol}
          tint={sts >= 0 ? CHART_COLORS.wants : CHART_COLORS.danger}
          sub="Income minus assigned"
        />
        <StatCard icon={<PiggyBank size={18} />} label="Spent This Month" value={spent} symbol={symbol} tint={CHART_COLORS.savings} />
        <StatCard
          icon={<AlertTriangle size={18} />}
          label="Subscriptions / mo"
          value={subCost}
          symbol={symbol}
          tint={CHART_COLORS.danger}
        />
        <StatCard
          icon={<Scale size={18} />}
          label="Net Worth"
          value={nw}
          symbol={symbol}
          tint={nw >= 0 ? CHART_COLORS.success : CHART_COLORS.danger}
          link="/networth"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div variants={item} className="card p-5 flex flex-col items-center justify-center">
          <div className="relative w-32 h-32">
            <svg viewBox="0 0 36 36" className="w-32 h-32 -rotate-90">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="var(--border-strong)"
                strokeWidth="3"
              />
              <motion.path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={health.color}
                strokeWidth="3"
                strokeLinecap="round"
                initial={{ strokeDasharray: "0, 100" }}
                animate={{ strokeDasharray: `${health.score}, 100` }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold">
                <AnimatedNumber value={health.score} format={(n) => Math.round(n).toString()} />
              </span>
              <span className="text-[10px] text-[var(--muted)]">/ 100</span>
            </div>
          </div>
          <div className="mt-3 font-semibold" style={{ color: health.color }}>
            {health.label}
          </div>
          <p className="text-xs text-[var(--muted)] text-center mt-1">Budget Health Score</p>
        </motion.div>

        <motion.div variants={item} className="card p-5 lg:col-span-2">
          <h2 className="font-semibold mb-2">Budget Allocation</h2>
          {pieData.length === 0 ? (
            <EmptyState text="Assign amounts to categories in Budget to see your allocation." />
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <AllocationPie data={pieData} symbol={symbol} />
              <div className="space-y-2 text-sm">
                {pieData.map((d) => (
                  <div key={d.key} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: `var(--${d.key})` }} />
                    <span className="font-medium">{d.name}</span>
                    <span className="text-[var(--muted)]">{formatCurrency(d.value, symbol)}</span>
                    <span className="text-[var(--muted)]">
                      ({state.monthlyIncome > 0 ? Math.round((d.value / state.monthlyIncome) * 100) : 0}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div variants={item} className="card p-5">
          <h2 className="font-semibold mb-3">Top Spending Categories</h2>
          {topCategories.every((c) => c.spent === 0) ? (
            <EmptyState text="No transactions logged yet this month." />
          ) : (
            <TopCategoriesBar data={topCategories} symbol={symbol} />
          )}
        </motion.div>

        <motion.div variants={item} className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Recent Transactions</h2>
            <Link href="/transactions" className="text-xs text-[var(--brand)] font-medium">
              View all
            </Link>
          </div>
          {recentTx.length === 0 ? (
            <EmptyState text="Add your first transaction to get started." />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {recentTx.map((t) => {
                const cat = state.categories.find((c) => c.id === t.categoryId);
                return (
                  <li key={t.id} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-8 h-8 rounded-full bg-[color-mix(in_srgb,var(--muted)_10%,transparent)] flex items-center justify-center text-[var(--muted)] shrink-0">
                        <CategoryIcon name={cat?.icon} size={15} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{t.description}</p>
                        <p className="text-xs text-[var(--muted)]">
                          {cat?.name || (t.type === "income" ? "Income" : "Uncategorized")} {" "}
                          {new Date(t.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={`text-sm font-semibold shrink-0 ${t.type === "income" ? "text-emerald-500" : ""}`}>
                      {t.type === "income" ? "+" : "-"}
                      {formatCurrency(t.amount, symbol)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </motion.div>

        <motion.div variants={item}>
          <HolidayWidget countryCode={state.holidayCountry} />
        </motion.div>
      </div>
    </motion.div>
  );
}

function StatCard({
  icon,
  label,
  value,
  symbol,
  tint,
  sub,
  link,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  symbol: string;
  tint: string;
  sub?: string;
  link?: string;
}) {
  const content = (
    <motion.div variants={item} whileHover={{ y: -3 }} className="card p-3.5 sm:p-4 h-full">
      <div className="flex items-center gap-2 text-[var(--muted)] text-[11px] sm:text-xs font-medium mb-2">
        <span
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${tint}1f`, color: tint }}
        >
          {icon}
        </span>
        <span className="truncate">{label}</span>
      </div>
      <div className="text-base sm:text-xl font-bold truncate">
        <AnimatedNumber value={value} format={(n) => formatCurrency(n, symbol)} />
      </div>
      {sub && <div className="text-[11px] text-[var(--muted)] mt-1 hidden sm:block">{sub}</div>}
    </motion.div>
  );
  return link ? <Link href={link} className="h-full block">{content}</Link> : content;
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-sm text-[var(--muted)] text-center py-8 border border-dashed border-[var(--border-strong)] rounded-xl">
      {text}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="skeleton h-8 w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 [&>*:last-child]:col-span-2 lg:[&>*:last-child]:col-span-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-20 sm:h-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="skeleton h-52" />
        <div className="skeleton h-52 lg:col-span-2" />
      </div>
    </div>
  );
}
