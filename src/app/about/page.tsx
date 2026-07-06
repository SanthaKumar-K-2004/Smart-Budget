"use client";

import { useRef } from "react";
import { useStore } from "@/lib/store";
import { Download, Upload, RotateCcw, CheckCircle2, Globe } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { HOLIDAY_COUNTRIES } from "@/lib/holidays";
import { replayIntroSequence } from "@/lib/intro";

export default function AboutPage() {
  const { state, exportData, importData, resetAll, setHolidayCountry } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleExport = () => {
    const blob = new Blob([exportData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `smartbudget-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup downloaded.");
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = importData(String(reader.result));
      if (result.ok) {
        toast.success("Data imported successfully.");
      } else {
        toast.error(result.error || "Import failed.");
      }
    };
    reader.onerror = () => toast.error("Could not read the selected file.");
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">The Research Behind SmartBudget</h1>
        <p className="text-[var(--muted)] text-sm mt-1">
          Why this app is built the way it is — a synthesis of the best personal finance tools
          and methods available today, rebuilt to an enterprise-grade standard.
        </p>
      </div>

      <section className="card p-5 space-y-3">
        <h2 className="font-semibold">1. What we studied</h2>
        <p className="text-sm text-[var(--muted)]">
          We analyzed the leading budgeting apps of 2025–2026 — YNAB, Monarch Money, PocketGuard,
          Rocket Money, Quicken Simplifi, EveryDollar, and the now-discontinued Mint — to identify
          what actually makes people stick with a budget and improve their finances.
        </p>
        <ul className="text-sm text-[var(--muted)] list-disc pl-5 space-y-1">
          <li><b>YNAB</b> — &ldquo;give every dollar a job&rdquo; zero-based budgeting; best for tight control and debt payoff.</li>
          <li><b>PocketGuard</b> — the &ldquo;how much can I safely spend today?&rdquo; view, reducing decision fatigue.</li>
          <li><b>Monarch Money</b> — clean dashboards, savings goals, and net-worth-style visibility.</li>
          <li><b>Rocket Money</b> — surfacing recurring subscriptions, which quietly drain 5-10% of most budgets.</li>
          <li><b>EveryDollar / 50-30-20 rule</b> — simple percentage-based budgeting for low-maintenance structure.</li>
        </ul>
      </section>

      <section className="card p-5 space-y-3">
        <h2 className="font-semibold">2. Zero-Based vs. 50/30/20 — the core decision</h2>
        <p className="text-sm text-[var(--muted)]">
          There is no single &ldquo;best&rdquo; method — the right one depends on income stability and how
          much time you want to invest:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b border-[var(--border)]">
                <th className="py-2 pr-4">Aspect</th>
                <th className="py-2 pr-4">Zero-Based Budgeting</th>
                <th className="py-2">50 / 30 / 20 Rule</th>
              </tr>
            </thead>
            <tbody className="text-[var(--muted)]">
              <tr className="border-b border-[var(--border)]">
                <td className="py-2 pr-4 font-medium text-[var(--foreground)]">Best for</td>
                <td className="py-2 pr-4">Variable income, aggressive debt payoff, tight control</td>
                <td className="py-2">Stable income, low-maintenance budgeting</td>
              </tr>
              <tr className="border-b border-[var(--border)]">
                <td className="py-2 pr-4 font-medium text-[var(--foreground)]">Effort</td>
                <td className="py-2 pr-4">High — rebuild monthly, track every category</td>
                <td className="py-2">Low — roughly 5-10 minutes per month</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-medium text-[var(--foreground)]">Overspend risk</td>
                <td className="py-2 pr-4">Low</td>
                <td className="py-2">Higher if categories are misused</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-[var(--muted)]">
          SmartBudget lets you switch between the two anytime, so you can start simple and graduate
          to full zero-based control as your needs change.
        </p>
      </section>

      <section className="card p-5 space-y-3">
        <h2 className="font-semibold">3. Enterprise-grade upgrade — what changed</h2>
        <div className="space-y-2 text-sm text-[var(--muted)]">
          <FeatureRow text="Glassmorphism UI with light/dark/system theme, smooth Framer Motion animations, and a spring-based active nav indicator." />
          <FeatureRow text="Full CRUD everywhere — every category, transaction, goal, subscription, asset, and debt can now be edited, not just added/deleted." />
          <FeatureRow text="Accessible Radix UI dialogs replace browser confirm()/alert() calls; every destructive action has a proper confirmation modal." />
          <FeatureRow text="Toast notifications (via sonner) confirm every action — add, edit, delete, import, export." />
          <FeatureRow text="Safe storage layer — the app no longer crashes in private browsing or storage-restricted environments; it falls back gracefully and warns you." />
          <FeatureRow text="New: Net Worth tracker (assets vs. debts) with breakdown chart." />
          <FeatureRow text="New: Debt Payoff Planner simulating Avalanche vs. Snowball strategies with a payoff timeline chart." />
          <FeatureRow text="New: Reports page with 6-month income vs. expense trends and category breakdowns." />
          <FeatureRow text="New: Recurring transactions that auto-post monthly/weekly/yearly (rent, salary, subscriptions) without manual re-entry." />
          <FeatureRow text="CSV export for transactions, in addition to full JSON backup/restore with validation." />
          <FeatureRow text="Orphaned data handled correctly — deleting a category un-links its transactions instead of losing history." />
          <FeatureRow text="100% local storage, zero backend, zero tracking, works offline." />
        </div>
      </section>

      <section className="card p-5 space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <Globe size={16} className="text-[var(--brand)]" /> 4. Live Open Data — Free, Key-Free APIs
        </h2>
        <p className="text-sm text-[var(--muted)]">
          Beyond static research, SmartBudget integrates three genuinely free, open-source public
          APIs (no API keys, no sign-up, no vendor lock-in) discovered via the community-maintained{" "}
          <a className="underline" href="https://github.com/public-apis/public-apis" target="_blank" rel="noreferrer">
            public-apis
          </a>{" "}
          directory:
        </p>
        <div className="space-y-2 text-sm text-[var(--muted)]">
          <FeatureRow text="Frankfurter (ECB reference exchange rates) — powers the live currency converter on the Net Worth page." />
          <FeatureRow text="CoinGecko public market data — powers live crypto prices and auto-valuation of crypto assets in Net Worth." />
          <FeatureRow text="Nager.Date public holiday API — powers the 'Upcoming Bank Holidays' widget on the Dashboard, since holidays affect when transfers clear." />
        </div>
        <div className="pt-1">
          <label className="text-xs font-medium text-[var(--muted)]">Holiday calendar country</label>
          <select
            className="input mt-1 max-w-xs"
            value={state.holidayCountry}
            onChange={(e) => {
              setHolidayCountry(e.target.value);
              toast.success("Holiday calendar updated.");
            }}
          >
            {HOLIDAY_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <p className="text-xs text-[var(--muted)]">
          All three integrations degrade gracefully offline — if the network is unavailable, the
          widgets show a clear message and the rest of SmartBudget keeps working normally, since
          your core budgeting data never depends on a network connection.
        </p>
      </section>

      <section className="card p-5 space-y-2">
        <h2 className="font-semibold">Sources</h2>
        <ul className="text-xs text-[var(--muted)] space-y-1 list-disc pl-5">
          <li><a className="underline" href="https://www.forbes.com/financial-services/best-budgeting-apps-2/" target="_blank" rel="noreferrer">Forbes — Best Budgeting Apps of 2026</a></li>
          <li><a className="underline" href="https://bountisphere.com/blog/personal-finance-apps-2025-review" target="_blank" rel="noreferrer">Bountisphere — State of Personal Finance Apps 2025</a></li>
          <li><a className="underline" href="https://useorigin.com/resources/blog/7-best-personal-finance-management-tools-for-2026-expert-review" target="_blank" rel="noreferrer">Origin — 7 Best Personal Finance Tools for 2026</a></li>
          <li><a className="underline" href="https://the-credit-scout.com/zero-based-budgeting-vs-50-30-20-rule/" target="_blank" rel="noreferrer">Zero-Based Budgeting vs 50/30/20 Rule — Comparative Analysis</a></li>
          <li><a className="underline" href="https://www.heygotrade.com/en/blog/zero-based-budget-explained-how-it-works-and-comparison" target="_blank" rel="noreferrer">Zero-Based Budget Explained: How It Works and Comparison</a></li>
        </ul>
      </section>

      <section className="card p-5 space-y-3">
        <h2 className="font-semibold">Your Data</h2>
        <p className="text-sm text-[var(--muted)]">
          Everything lives in your browser&apos;s local storage on this device only. Export a backup or
          move it to another browser anytime.
        </p>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary" onClick={handleExport}>
            <Download size={14} /> Export Backup (JSON)
          </button>
          <button className="btn-secondary" onClick={() => fileRef.current?.click()}>
            <Upload size={14} /> Import Backup
          </button>
          <button
            className="btn-secondary"
            onClick={() => {
              replayIntroSequence();
              toast.success("Intro sequence reset. Open Intro to replay it.");
            }}
          >
            <RotateCcw size={14} /> Replay Intro Sequence
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])}
          />
          <button className="btn-danger" onClick={() => setConfirmReset(true)}>
            <RotateCcw size={14} /> Reset All Data
          </button>
        </div>
      </section>

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Reset All Data"
        description="This permanently erases all local data — categories, transactions, goals, subscriptions, assets, and debts. This cannot be undone. Consider exporting a backup first."
        confirmLabel="Erase Everything"
        onConfirm={() => {
          resetAll();
          toast.success("All data has been reset.");
        }}
      />
    </div>
  );
}

function FeatureRow({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2">
      <CheckCircle2 size={14} className="text-[var(--brand)] mt-0.5 shrink-0" />
      <span>{text}</span>
    </div>
  );
}
