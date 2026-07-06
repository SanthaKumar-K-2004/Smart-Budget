"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/calc";
import { CHART_COLORS } from "@/lib/theme";

export default function TopCategoriesBar({
  data,
  symbol,
}: {
  data: { name: string; spent: number }[];
  symbol: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12, fill: "var(--muted)" }} />
        <Tooltip formatter={(v) => formatCurrency(Number(v) || 0, symbol)} />
        <Bar dataKey="spent" radius={[0, 6, 6, 0]} fill={CHART_COLORS.brand} />
      </BarChart>
    </ResponsiveContainer>
  );
}
