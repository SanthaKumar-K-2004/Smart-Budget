"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/calc";
import { GROUP_HEX } from "@/lib/theme";

export default function AllocationPie({
  data,
  symbol,
}: {
  data: { name: string; value: number; key: string }[];
  symbol: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={200} className="sm:w-1/2">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
          {data.map((d) => (
            <Cell key={d.key} fill={GROUP_HEX[d.key]} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => formatCurrency(Number(v) || 0, symbol)} />
      </PieChart>
    </ResponsiveContainer>
  );
}
