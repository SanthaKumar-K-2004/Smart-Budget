"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatCurrency } from "@/lib/calc";
import { CHART_COLORS } from "@/lib/theme";

export default function TrendArea({
  data,
  symbol,
}: {
  data: { label: string; income: number; expense: number }[];
  symbol: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.4} />
            <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.danger} stopOpacity={0.4} />
            <stop offset="95%" stopColor={CHART_COLORS.danger} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: "var(--muted)" }} />
        <YAxis tick={{ fontSize: 12, fill: "var(--muted)" }} />
        <Tooltip formatter={(v) => formatCurrency(Number(v) || 0, symbol)} />
        <Legend />
        <Area type="monotone" dataKey="income" name="Income" stroke={CHART_COLORS.success} fill="url(#incomeGrad)" strokeWidth={2} />
        <Area type="monotone" dataKey="expense" name="Expense" stroke={CHART_COLORS.danger} fill="url(#expenseGrad)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
