"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/calc";
import { CHART_COLORS } from "@/lib/theme";

export default function PayoffLineChart({
  data,
  symbol,
}: {
  data: { month: number; totalBalance: number }[];
  symbol: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: "var(--muted)" }}
          label={{ value: "Month", position: "insideBottom", offset: -3, fontSize: 11 }}
        />
        <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} />
        <Tooltip formatter={(v) => formatCurrency(Number(v) || 0, symbol)} labelFormatter={(l) => `Month ${l}`} />
        <Line type="monotone" dataKey="totalBalance" stroke={CHART_COLORS.brand} strokeWidth={2.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
