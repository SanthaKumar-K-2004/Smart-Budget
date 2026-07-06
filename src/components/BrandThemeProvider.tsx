"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { safeGetItem, safeSetItem } from "@/lib/storage";

export type BrandVariant = "signature" | "monoline" | "emblem";

const BRAND_VARIANT_KEY = "smartbudget:brand-variant:v1";

type BrandThemeApi = {
  variant: BrandVariant;
  setVariant: (variant: BrandVariant) => void;
  hydrated: boolean;
};

const BrandThemeContext = createContext<BrandThemeApi | null>(null);

export default function BrandThemeProvider({ children }: { children: React.ReactNode }) {
  const [variant, setVariantState] = useState<BrandVariant>("signature");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = safeGetItem(BRAND_VARIANT_KEY);
    if (saved === "signature" || saved === "monoline" || saved === "emblem") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVariantState(saved);
    }
    setHydrated(true);
  }, []);

  const setVariant = (next: BrandVariant) => {
    setVariantState(next);
    safeSetItem(BRAND_VARIANT_KEY, next);
  };

  const value = useMemo(
    () => ({
      variant,
      setVariant,
      hydrated,
    }),
    [variant, hydrated]
  );

  return <BrandThemeContext.Provider value={value}>{children}</BrandThemeContext.Provider>;
}

export function useBrandTheme() {
  const ctx = useContext(BrandThemeContext);
  if (!ctx) throw new Error("useBrandTheme must be used within BrandThemeProvider");
  return ctx;
}
