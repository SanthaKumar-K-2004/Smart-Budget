"use client";

import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/calc";
import { GROUP_HEX } from "@/lib/theme";

export default function CategoryBreakdownBar({
  data,
  symbol,
}: {
  data: { name: string; value: number; group: string }[];
  symbol: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 36)}>
      <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 12, fill: "var(--muted)" }} />
        <Tooltip formatter={(v) => formatCurrency(Number(v) || 0, symbol)} />
        <Bar dataKey="value" radius={[0, 6, 6, 0]}>
          {data.map((c, i) => (
            <Cell key={i} fill={GROUP_HEX[c.group]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
