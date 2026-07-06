"use client";

import { useStore } from "@/lib/store";
import { AlertTriangle } from "lucide-react";

export default function PersistenceBanner() {
  const { hydrated, persistOk } = useStore();
  if (!hydrated || persistOk) return null;
  return (
    <div className="glass rounded-xl px-4 py-2.5 flex items-center gap-2 text-xs text-amber-600 border-amber-300/40 mb-4 animate-in">
      <AlertTriangle size={14} className="shrink-0" />
      Storage is unavailable in this browser (e.g. private mode) — your data will not be saved after this session. Export a backup from the Research page before closing.
    </div>
  );
}
