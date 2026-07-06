"use client";

import type { HTMLAttributes } from "react";
import { useBrandTheme, type BrandVariant } from "./BrandThemeProvider";

type BrandLogoProps = HTMLAttributes<HTMLDivElement> & {
  size?: number;
  withWordmark?: boolean;
  variant?: BrandVariant;
  wordmarkMode?: "default" | "alt";
};

export default function BrandLogo({
  size = 34,
  withWordmark = true,
  variant,
  wordmarkMode = "default",
  className,
  ...props
}: BrandLogoProps) {
  const { variant: globalVariant, hydrated } = useBrandTheme();
  const selectedVariant = variant ?? (hydrated ? globalVariant : "signature");
  const isAltWordmark = wordmarkMode === "alt" || selectedVariant === "monoline" || selectedVariant === "emblem";

  return (
    <div className={className} {...props}>
      <div className="flex items-center gap-2.5">
        {selectedVariant === "signature" && <SignatureIcon size={size} />}
        {selectedVariant === "monoline" && <MonolineIcon size={size} />}
        {selectedVariant === "emblem" && <EmblemIcon size={size} />}

        {withWordmark && (
          <div className="leading-none">
            {isAltWordmark ? (
              <>
                <span className="block text-[0.58rem] tracking-[0.25em] uppercase text-[var(--muted)] font-semibold">Local Finance Suite</span>
                <span className="block text-[0.96rem] tracking-[0.07em] uppercase text-[var(--foreground)] font-semibold">SmartBudget</span>
              </>
            ) : (
              <>
                <span className="block text-[0.63rem] tracking-[0.2em] uppercase text-[var(--muted)] font-semibold">Money OS</span>
                <span className="block text-[1.02rem] font-bold text-[var(--foreground)]">SmartBudget</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SignatureIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sbGradient" x1="7" y1="8" x2="56" y2="57" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22C55E" />
          <stop offset="0.56" stopColor="#0EA5E9" />
          <stop offset="1" stopColor="#2563EB" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="16" fill="url(#sbGradient)" />
      <path
        d="M20 38.5C20 43.75 24.2 48 29.4 48H34.6C39.8 48 44 43.75 44 38.5C44 33.25 39.8 29 34.6 29H29.4C27.15 29 25.3 27.15 25.3 24.9C25.3 22.65 27.15 20.8 29.4 20.8H34.6C36.85 20.8 38.7 22.65 38.7 24.9"
        stroke="white"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path d="M32 14V20" stroke="white" strokeWidth="5" strokeLinecap="round" />
      <path d="M32 48V54" stroke="white" strokeWidth="5" strokeLinecap="round" />
      <circle cx="50" cy="14" r="6" fill="rgba(255,255,255,0.28)" />
    </svg>
  );
}

function MonolineIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="4" y="4" width="56" height="56" rx="16" fill="var(--surface)" stroke="var(--brand)" strokeWidth="2" />
      <path d="M16 44L25 34L32 40L46 21" stroke="var(--brand)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M42 21H46V25" stroke="var(--brand)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 48H48" stroke="var(--border-strong)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function EmblemIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sbEmblem" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0F172A" />
          <stop offset="1" stopColor="#1E293B" />
        </linearGradient>
        <linearGradient id="sbEmblemGold" x1="18" y1="18" x2="47" y2="46" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FACC15" />
          <stop offset="1" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="16" fill="url(#sbEmblem)" />
      <rect x="9" y="9" width="46" height="46" rx="12" stroke="url(#sbEmblemGold)" strokeWidth="2" />
      <path d="M24 42V23H34.5C38.5 23 41 25 41 28.4C41 31.2 39.4 33 36.9 33.8L41.7 42H37.2L32.8 34.4H28.1V42H24Z" fill="url(#sbEmblemGold)" />
      <path d="M28.1 30.9H34.1C36 30.9 37 30 37 28.5C37 27 36 26.1 34.1 26.1H28.1V30.9Z" fill="url(#sbEmblem)" />
      <circle cx="46" cy="18" r="4" fill="url(#sbEmblemGold)" fillOpacity="0.75" />
    </svg>
  );
}
