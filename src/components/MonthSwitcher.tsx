"use client";

import React from "react";
import { useStore } from "@/lib/store";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

export default function MonthSwitcher() {
  const { selectedMonth, setSelectedMonth } = useStore();

  // Parse YYYY-MM
  const [year, month] = selectedMonth.split("-").map(Number);
  const currentDate = new Date(year, month - 1, 1);

  const formatMonth = currentDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const handlePrev = () => {
    const prevDate = new Date(year, month - 2, 1);
    const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
    setSelectedMonth(prevKey);
  };

  const handleNext = () => {
    const nextDate = new Date(year, month, 1);
    const nextKey = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;
    setSelectedMonth(nextKey);
  };

  return (
    <div className="flex items-center gap-2 bg-[var(--surface)] border border-[var(--border)] rounded-2xl px-3 py-1.5 shadow-sm w-fit shrink-0">
      <button
        onClick={handlePrev}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--border)] active:scale-95 transition-all cursor-pointer"
        aria-label="Previous Month"
      >
        <ChevronLeft size={16} />
      </button>
      
      <div className="flex items-center gap-1.5 px-1 font-medium text-xs text-[var(--foreground)] select-none">
        <Calendar size={13} className="text-[var(--brand)]" />
        <span>{formatMonth}</span>
      </div>

      <button
        onClick={handleNext}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--border)] active:scale-95 transition-all cursor-pointer"
        aria-label="Next Month"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
