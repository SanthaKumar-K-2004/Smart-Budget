"use client";

import React, { useState } from "react";
import { useStore } from "@/lib/store";
import { ShieldCheck, Unlock, Lock } from "lucide-react";

export default function VaultGuard({ children }: { children: React.ReactNode }) {
  const { vaultLocked, unlockVault, hydrated } = useStore();
  const [passphrase, setPassphrase] = useState("");
  const [loading, setLoading] = useState(false);

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="skeleton w-full max-w-md h-48 rounded-2xl" />
      </div>
    );
  }

  if (!vaultLocked) {
    return <>{children}</>;
  }

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase.trim()) return;
    setLoading(true);
    const success = await unlockVault(passphrase);
    setLoading(false);
    if (success) {
      setPassphrase("");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[50vh] px-4 py-8 animate-fade-in">
      <div className="glass-strong w-full max-w-md rounded-3xl p-6 sm:p-8 border border-[var(--border)] shadow-xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-[var(--brand)]/10 blur-xl pointer-events-none" />
        
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--brand)] to-[var(--brand-dark)] text-white flex items-center justify-center shadow-lg shadow-[var(--brand)]/20">
            <Lock size={26} />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-[var(--foreground)]">Vault is Locked</h2>
            <p className="text-xs text-[var(--muted)] max-w-xs">
              Your financial data is encrypted locally on this device. Enter your passphrase to decrypt and unlock.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="w-full space-y-3.5 pt-2">
            <div>
              <input
                type="password"
                className="input text-center text-sm font-semibold tracking-wider placeholder:tracking-normal placeholder:font-normal"
                placeholder="Enter Vault Passphrase"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                autoFocus
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !passphrase.trim()}
              className="btn-primary w-full py-2.5 rounded-xl justify-center font-semibold text-sm gap-2 shadow-md shadow-[var(--brand)]/15 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
            >
              {loading ? (
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <>
                  <Unlock size={15} /> Unlock Vault
                </>
              )}
            </button>
          </form>

          <div className="text-[10px] text-[var(--muted)] flex items-center gap-1.5 pt-3">
            <ShieldCheck size={12} className="text-emerald-500" />
            AES-GCM WebCrypto Encryption Active
          </div>
        </div>
      </div>
    </div>
  );
}
