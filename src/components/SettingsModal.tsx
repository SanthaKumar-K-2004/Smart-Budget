"use client";

import React, { useState, useEffect } from "react";
import Modal from "./ui/Modal";
import { Key, RotateCcw, Save, ShieldAlert, HelpCircle } from "lucide-react";
import { getApiConfig, setApiConfig } from "@/lib/config";
import { toast } from "sonner";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [coinGeckoKey, setCoinGeckoKey] = useState("");
  const [frankfurterKey, setFrankfurterKey] = useState("");
  const [nagerKey, setNagerKey] = useState("");
  const [isResetConfirm, setIsResetConfirm] = useState(false);

  useEffect(() => {
    if (open) {
      const cfg = getApiConfig();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCoinGeckoKey(cfg.coinGeckoKey || "");
      setFrankfurterKey(cfg.frankfurterKey || "");
      setNagerKey(cfg.nagerKey || "");
      setIsResetConfirm(false);
    }
  }, [open]);

  const handleSave = () => {
    setApiConfig({
      coinGeckoKey: coinGeckoKey.trim() || undefined,
      frankfurterKey: frankfurterKey.trim() || undefined,
      nagerKey: nagerKey.trim() || undefined,
    });
    toast.success("API keys updated successfully!");
    onOpenChange(false);
    // Reload page to refresh data fetching components with new keys
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  const handleResetData = () => {
    if (!isResetConfirm) {
      setIsResetConfirm(true);
      return;
    }

    // Clear all LocalStorage data related to smartbudget
    if (typeof window !== "undefined") {
      Object.keys(window.localStorage).forEach((key) => {
        if (key.startsWith("smartbudget:")) {
          window.localStorage.removeItem(key);
        }
      });
      toast.success("All data reset successfully!");
      onOpenChange(false);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="App Settings"
      description="Manage API keys, local storage, and reset options."
      maxWidth="500px"
    >
      <div className="space-y-5">
        {/* API Keys Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5 text-[var(--foreground)] border-b border-[var(--border)] pb-2">
            <Key size={16} className="text-[var(--brand)]" /> API Keys (Stored Locally)
          </h3>

          <div className="space-y-3.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-[var(--muted)] flex items-center gap-1">
                  CoinGecko API Key
                  <span className="text-[9px] px-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-normal">Optional</span>
                </label>
                <a 
                  href="https://www.coingecko.com/en/api" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[10px] text-[var(--brand)] hover:underline flex items-center gap-0.5"
                >
                  Get Key <HelpCircle size={10} />
                </a>
              </div>
              <input
                type="password"
                className="input text-xs"
                placeholder="e.g. CG-xxxxxxxxxxxxxxxx"
                value={coinGeckoKey}
                onChange={(e) => setCoinGeckoKey(e.target.value)}
              />
              <p className="text-[10px] text-[var(--muted)] mt-1">
                Used to fetch cryptocurrency rates. Defaults to rate-limited public API if left blank.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-[var(--muted)] flex items-center gap-1">
                  Frankfurter API Key
                  <span className="text-[9px] px-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-normal">Optional</span>
                </label>
                <a 
                  href="https://frankfurter.dev" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[10px] text-[var(--brand)] hover:underline flex items-center gap-0.5"
                >
                  Info <HelpCircle size={10} />
                </a>
              </div>
              <input
                type="password"
                className="input text-xs"
                placeholder="Frankfurter Key (if hosting custom instance)"
                value={frankfurterKey}
                onChange={(e) => setFrankfurterKey(e.target.value)}
              />
              <p className="text-[10px] text-[var(--muted)] mt-1">
                Used for currency conversions. Defaults to public endpoint.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-[var(--muted)] flex items-center gap-1">
                  Nager.Date API Key
                  <span className="text-[9px] px-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-normal">Optional</span>
                </label>
              </div>
              <input
                type="password"
                className="input text-xs"
                placeholder="Nager.Date Key (if using custom endpoint)"
                value={nagerKey}
                onChange={(e) => setNagerKey(e.target.value)}
              />
              <p className="text-[10px] text-[var(--muted)] mt-1">
                Used for bank holiday detection. Defaults to public endpoint.
              </p>
            </div>
          </div>
        </div>

        {/* Local Storage & Reset Section */}
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-semibold flex items-center gap-1.5 text-[var(--foreground)] border-b border-[var(--border)] pb-2">
            <ShieldAlert size={16} className="text-[var(--danger)]" /> Data Control
          </h3>

          <div className="rounded-xl border border-[var(--border)] bg-red-500/[0.02] p-3.5 space-y-2">
            <p className="text-xs text-[var(--muted)]">
              All your budget, transaction, and goals data is stored completely locally in your browser. 
              You can wipe it clean below. **This action cannot be undone.**
            </p>
            
            <button
              type="button"
              onClick={handleResetData}
              className={`w-full py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1.5 ${
                isResetConfirm 
                  ? "bg-[var(--danger)] text-white hover:bg-[var(--danger)]/90" 
                  : "bg-red-500/10 text-[var(--danger)] hover:bg-red-500/20"
              }`}
            >
              <RotateCcw size={14} />
              {isResetConfirm ? "Confirm: Erase All Data" : "Wipe All Local Storage Data"}
            </button>
            
            {isResetConfirm && (
              <button 
                type="button"
                onClick={() => setIsResetConfirm(false)}
                className="w-full text-center text-[10px] text-[var(--muted)] hover:underline mt-1"
              >
                Cancel Wipe
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end pt-3 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="btn-secondary py-2 px-4 rounded-xl text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="btn-primary py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 bg-gradient-to-br from-[var(--brand)] to-[var(--brand-dark)] text-white shadow-md shadow-[var(--brand)]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Save size={14} /> Save & Apply
          </button>
        </div>
      </div>
    </Modal>
  );
}
