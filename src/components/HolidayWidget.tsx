"use client";

import { useEffect, useState } from "react";
import { fetchUpcomingHolidays, Holiday } from "@/lib/holidays";
import { CalendarDays, RefreshCw, WifiOff } from "lucide-react";

export default function HolidayWidget({ countryCode }: { countryCode: string }) {
  const [holidays, setHolidays] = useState<Holiday[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  // Fetches from the external Nager.Date API whenever the selected holiday
  // country changes.
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
     
    setFailed(false);
    fetchUpcomingHolidays(countryCode).then((res) => {
      if (cancelled) return;
      setLoading(false);
      if (!res) {
        setFailed(true);
        return;
      }
      setHolidays(res.slice(0, 3));
    });
    return () => {
      cancelled = true;
    };
  }, [countryCode]);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-semibold flex items-center gap-2">
          <CalendarDays size={16} className="text-[var(--brand)]" /> Upcoming Bank Holidays
        </h2>
        {loading && <RefreshCw size={13} className="animate-spin text-[var(--muted)]" />}
      </div>
      <p className="text-xs text-[var(--muted)] mb-3">
        Free open data via Nager.Date — plan around days when banks won&apos;t process transfers.
      </p>

      {failed ? (
        <div className="flex items-center gap-2 text-sm text-amber-500 py-2">
          <WifiOff size={15} />
          Couldn&apos;t load holiday data right now.
        </div>
      ) : holidays && holidays.length > 0 ? (
        <ul className="space-y-2">
          {holidays.map((h) => (
            <li key={h.date} className="flex items-center justify-between text-sm">
              <span className="font-medium">{h.localName}</span>
              <span className="text-[var(--muted)] text-xs">
                {new Date(h.date).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </li>
          ))}
        </ul>
      ) : holidays ? (
        <p className="text-sm text-[var(--muted)] py-2">No upcoming holidays found for this country.</p>
      ) : (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-5" />
          ))}
        </div>
      )}
    </div>
  );
}
