"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/calc";
import { ASSET_CHART_COLORS } from "@/lib/theme";

export default function AssetBreakdownPie({
  data,
  symbol,
}: {
  data: { name: string; value: number }[];
  symbol: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={200} className="sm:w-1/2">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
          {data.map((_, i) => (
            <Cell key={i} fill={ASSET_CHART_COLORS[i % ASSET_CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => formatCurrency(Number(v) || 0, symbol)} />
      </PieChart>
    </ResponsiveContainer>
  );
}
