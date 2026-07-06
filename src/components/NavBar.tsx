"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  LayoutDashboard,
  Wallet,
  Receipt,
  Target,
  Repeat,
  Info,
  TrendingUp,
  CreditCard,
  BarChart3,
  Grid2x2,
  Paintbrush,
  X,
  Settings,
} from "lucide-react";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ThemeToggle from "./ui/ThemeToggle";
import BrandLogo from "./BrandLogo";
import { useBrandTheme, type BrandVariant } from "./BrandThemeProvider";
import SettingsModal from "./SettingsModal";

const PRIMARY_LINKS = [
  { href: "/", label: "Intro", icon: Sparkles },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/budget", label: "Budget", icon: Wallet },
  { href: "/transactions", label: "Activity", icon: Receipt },
];

const MORE_LINKS = [
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/networth", label: "Net Worth", icon: TrendingUp },
  { href: "/debt", label: "Debt Payoff", icon: CreditCard },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/subscriptions", label: "Subscriptions", icon: Repeat },
  { href: "/about", label: "Research", icon: Info },
];

const ALL_LINKS = [...PRIMARY_LINKS, ...MORE_LINKS];

export default function NavBar() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { variant, setVariant } = useBrandTheme();
  const moreActive = MORE_LINKS.some((l) => l.href === pathname);

  const logoOptions: Array<{ key: BrandVariant; label: string }> = [
    { key: "signature", label: "Signature" },
    { key: "monoline", label: "Monoline" },
    { key: "emblem", label: "Emblem" },
  ];

  return (
    <>
      {/* Desktop / tablet top bar */}
      <header className="sticky top-0 z-30 px-3 pt-3 hidden lg:block">
        <div className="max-w-7xl mx-auto glass rounded-2xl">
          <div className="px-5 h-16 flex items-center justify-between">
            <Link href="/" className="shrink-0">
              <BrandLogo size={32} />
            </Link>

            <nav className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {ALL_LINKS.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                      active ? "text-white" : "text-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-active-desktop"
                        className="absolute inset-0 rounded-xl bg-gradient-to-br from-[var(--brand)] to-[var(--brand-dark)] shadow-md shadow-[var(--brand)]/30"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      />
                    )}
                    <Icon size={15} className="relative z-10" />
                    <span className="relative z-10">{label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2.5">
              <ThemeToggle />
              <button
                onClick={() => setSettingsOpen(true)}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all bg-[var(--surface)]/40 hover:bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:scale-105 active:scale-95 cursor-pointer"
                title="Settings"
              >
                <Settings size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile top bar — brand + theme only, kept minimal */}
      <header className="sticky top-0 z-30 px-3 pt-3 lg:hidden">
        <div className="glass rounded-2xl px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <BrandLogo size={24} withWordmark={false} />
            <span className="font-bold text-sm">SmartBudget</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSettingsOpen(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all bg-[var(--surface)]/40 hover:bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] active:scale-95 cursor-pointer"
              title="Settings"
            >
              <Settings size={16} />
            </button>
            <ThemeToggle compact />
          </div>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 px-3 pb-3">
        <div className="glass-strong rounded-2xl flex items-stretch justify-between px-1 py-1.5">
          {PRIMARY_LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="relative flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl"
              >
                {active && (
                  <motion.span
                    layoutId="nav-active-mobile"
                    className="absolute inset-0 rounded-xl bg-[var(--brand)]/12"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <Icon size={19} className="relative z-10" color={active ? "var(--brand)" : "var(--muted)"} />
                <span
                  className="relative z-10 text-[10.5px] font-medium"
                  style={{ color: active ? "var(--brand)" : "var(--muted)" }}
                >
                  {label}
                </span>
              </Link>
            );
          })}
          <button
            onClick={() => setMoreOpen(true)}
            className="relative flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl"
          >
            {moreActive && (
              <motion.span
                layoutId="nav-active-mobile"
                className="absolute inset-0 rounded-xl bg-[var(--brand)]/12"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <Grid2x2 size={19} className="relative z-10" color={moreActive ? "var(--brand)" : "var(--muted)"} />
            <span
              className="relative z-10 text-[10.5px] font-medium"
              style={{ color: moreActive ? "var(--brand)" : "var(--muted)" }}
            >
              More
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile "More" bottom sheet */}
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              className="lg:hidden fixed inset-0 z-50 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              className="lg:hidden fixed bottom-0 inset-x-0 z-50 glass-strong rounded-t-3xl p-4 pb-6"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 34 }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-sm text-[var(--muted)]">More</span>
                <button className="icon-btn" onClick={() => setMoreOpen(false)} aria-label="Close">
                  <X size={18} />
                </button>
              </div>

              <div className="mb-3 p-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/65">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--muted)] mb-2 uppercase tracking-[0.14em]">
                  <Paintbrush size={13} /> Logo Style
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {logoOptions.map((opt) => {
                    const active = variant === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setVariant(opt.key)}
                        className={`rounded-xl p-2 text-[10px] font-medium flex flex-col items-center gap-1.5 border ${
                          active
                            ? "border-[var(--brand)] bg-[color-mix(in_srgb,var(--brand)_10%,transparent)]"
                            : "border-[var(--border)]"
                        }`}
                      >
                        <BrandLogo size={19} withWordmark={false} variant={opt.key} />
                        <span className="text-[var(--muted)]">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {MORE_LINKS.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMoreOpen(false)}
                      className={`flex flex-col items-center justify-center gap-1.5 py-4 rounded-2xl text-xs font-medium ${
                        active ? "bg-[var(--brand)] text-white" : "bg-[var(--surface-2)] text-[var(--muted)]"
                      }`}
                    >
                      <Icon size={20} />
                      {label}
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}
