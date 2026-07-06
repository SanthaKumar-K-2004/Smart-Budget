"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BarChart3, CheckCircle2, Goal, ShieldCheck, WalletCards, Zap } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import { useBrandTheme, type BrandVariant } from "@/components/BrandThemeProvider";
import { safeGetItem, safeSetItem } from "@/lib/storage";
import { INTRO_FIRST_OPEN_KEY } from "@/lib/intro";
import { useEffect, useMemo, useState } from "react";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28 } },
};

const features = [
  {
    title: "Plan Every Rupee",
    body: "Build zero-based or 50/30/20 budgets and see exactly where money goes.",
    icon: WalletCards,
  },
  {
    title: "Track Reality",
    body: "Log transactions, recurring spends, subscriptions, and goals in one place.",
    icon: BarChart3,
  },
  {
    title: "Protect Privacy",
    body: "Everything stays local in your browser, with export and restore controls.",
    icon: ShieldCheck,
  },
];

const onboardingSteps = [
  {
    title: "Set Your Income Anchor",
    text: "Start with monthly income so every module reflects your real capacity.",
  },
  {
    title: "Assign Jobs to Money",
    text: "Distribute funds into categories and make spending intentional.",
  },
  {
    title: "Measure Progress Weekly",
    text: "Watch net worth, debt payoff, and savings goals move in one view.",
  },
];

export default function IntroPage() {
  const { variant, hydrated } = useBrandTheme();
  const [showSplash, setShowSplash] = useState(true);
  const [showFirstOpenOnboarding, setShowFirstOpenOnboarding] = useState(false);

  useEffect(() => {
    const seen = safeGetItem(INTRO_FIRST_OPEN_KEY) === "1";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowFirstOpenOnboarding(!seen);

    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1300);

    return () => clearTimeout(timer);
  }, []);



  return (
    <>
      <AnimatePresence>
        {showSplash && <SplashScreen variant={variant} />}
      </AnimatePresence>

      <AnimatePresence>
        {!showSplash && showFirstOpenOnboarding && (
          <FirstOpenSequence
            onDone={() => {
              safeSetItem(INTRO_FIRST_OPEN_KEY, "1");
              setShowFirstOpenOnboarding(false);
            }}
          />
        )}
      </AnimatePresence>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 sm:space-y-7">
        <motion.section variants={item} className="intro-hero rounded-3xl p-4 sm:p-8 md:p-10 overflow-hidden relative">
          <div className="intro-orb intro-orb-a" />
          <div className="intro-orb intro-orb-b" />

          <div className="relative z-10 max-w-3xl space-y-4 sm:space-y-5">
            <BrandLogo withWordmark className="w-fit" variant={hydrated ? variant : "signature"} />

            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold leading-tight text-balance">
              Your money command center.
              <span className="block text-[var(--brand)]">Fast daily decisions. Better long-term outcomes.</span>
            </h1>

            <p className="text-sm sm:text-base text-[var(--muted)] max-w-2xl">
              SmartBudget unifies planning, tracking, debt payoff, and wealth progress in a single clear interface.
              Built for momentum, not clutter.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <Link href="/dashboard" className="btn-primary">
                Open Dashboard <ArrowRight size={15} />
              </Link>
              <Link href="/budget" className="btn-secondary">
                Build My Budget
              </Link>
            </div>
          </div>
        </motion.section>



        <motion.section variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map(({ title, body, icon: Icon }) => (
            <article key={title} className="card p-5">
              <div className="w-10 h-10 rounded-xl bg-[color-mix(in_srgb,var(--brand)_12%,transparent)] text-[var(--brand)] flex items-center justify-center mb-3">
                <Icon size={18} />
              </div>
              <h2 className="font-semibold text-base mb-1">{title}</h2>
              <p className="text-sm text-[var(--muted)]">{body}</p>
            </article>
          ))}
        </motion.section>

        <motion.section variants={item} className="card p-5 sm:p-6">
          <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
            <div>
              <h3 className="font-semibold text-lg">Start in 3 steps</h3>
              <p className="text-sm text-[var(--muted)] mt-1">Set your income, assign category budgets, then track each expense.</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
              <Goal size={16} />
              Progress compounds when your plan is visible.
            </div>
          </div>
        </motion.section>
      </motion.div>
    </>
  );
}

function SplashScreen({ variant }: { variant: BrandVariant }) {
  return (
    <motion.div
      className="fixed inset-0 z-[90] splash-bg px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="h-full w-full flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: -8 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          className="splash-card w-full max-w-md rounded-3xl p-6 sm:p-7"
        >
          <div className="flex items-center justify-between">
            <BrandLogo variant={variant} size={30} withWordmark={false} />
            <span className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted)] font-semibold">Local Vault</span>
          </div>

          <div className="mt-6 space-y-2">
            <h2 className="text-xl font-semibold">Secure Session</h2>
            <p className="text-sm text-[var(--muted)]">Verifying local data store and loading your workspace.</p>
          </div>

          <div className="mt-6 h-2 rounded-full bg-[var(--border)] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[var(--brand)] to-[var(--accent)]"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.1, ease: "easeInOut" }}
            />
          </div>

          <div className="mt-3 text-xs text-[var(--muted)] flex items-center gap-2">
            <Zap size={14} />
            Starting SmartBudget...
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function FirstOpenSequence({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStep((s) => {
        if (s >= onboardingSteps.length - 1) return s;
        return s + 1;
      });
    }, 1450);

    return () => clearTimeout(timer);
  }, [step]);

  const progress = ((step + 1) / onboardingSteps.length) * 100;
  const item = onboardingSteps[step];

  return (
    <motion.div
      className="fixed inset-0 z-[80] bg-black/45 backdrop-blur-sm p-4 flex items-end sm:items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.25 }}
        className="glass-strong w-full max-w-lg rounded-3xl p-5 sm:p-7"
      >
        <div className="flex items-center justify-between gap-3">
          <BrandLogo withWordmark={false} size={28} />
          <span className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Quick Setup</span>
        </div>

        <div className="mt-5 h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
          <motion.div
            className="h-full bg-[var(--brand)] rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.35 }}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.2 }}
            className="mt-5"
          >
            <h3 className="text-lg font-semibold">{item.title}</h3>
            <p className="text-sm text-[var(--muted)] mt-2">{item.text}</p>
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button type="button" className="btn-secondary" onClick={onDone}>
            Skip
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              if (step >= onboardingSteps.length - 1) {
                onDone();
                return;
              }
              setStep((s) => Math.min(s + 1, onboardingSteps.length - 1));
            }}
          >
            {step >= onboardingSteps.length - 1 ? "Done" : "Next"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
