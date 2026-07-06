"use client";

import React, { useState, useEffect, useRef } from "react";
import Modal from "./ui/Modal";
import { Key, RotateCcw, Save, ShieldAlert, ShieldCheck, HelpCircle, Lock, Download, Upload, LockKeyhole } from "lucide-react";
import { getApiConfig, setApiConfig } from "@/lib/config";
import { useStore } from "@/lib/store";
import { encryptData, decryptData } from "@/lib/encryption";
import { toast } from "sonner";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const {
    state,
    lockVault,
    setupVault,
    hasPassphrase,
    importData,
    resetAll,
  } = useStore();

  const [coinGeckoKey, setCoinGeckoKey] = useState("");
  const [frankfurterKey, setFrankfurterKey] = useState("");
  const [nagerKey, setNagerKey] = useState("");
  const [isResetConfirm, setIsResetConfirm] = useState(false);

  // Vault states
  const [newPassphrase, setNewPassphrase] = useState("");
  const [confirmPassphrase, setConfirmPassphrase] = useState("");
  const [showPassSection, setShowPassSection] = useState(false);

  // Restore encrypted file states
  const [showRestoreDecrypt, setShowRestoreDecrypt] = useState(false);
  const [restorePassphrase, setRestorePassphrase] = useState("");
  const [pendingRestoreJson, setPendingRestoreJson] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      const cfg = getApiConfig();
      setTimeout(() => {
        setCoinGeckoKey(cfg.coinGeckoKey || "");
        setFrankfurterKey(cfg.frankfurterKey || "");
        setNagerKey(cfg.nagerKey || "");
        setIsResetConfirm(false);
        setNewPassphrase("");
        setConfirmPassphrase("");
        setShowPassSection(false);
        setShowRestoreDecrypt(false);
        setRestorePassphrase("");
        setPendingRestoreJson("");
      }, 0);
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
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  const handleResetData = () => {
    if (!isResetConfirm) {
      setIsResetConfirm(true);
      return;
    }

    if (typeof window !== "undefined") {
      Object.keys(window.localStorage).forEach((key) => {
        if (key.startsWith("smartbudget:")) {
          window.localStorage.removeItem(key);
        }
      });
      sessionStorage.removeItem("smartbudget:passphrase");
      resetAll();
      toast.success("All local data has been erased.");
      onOpenChange(false);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  const handleSetupVault = async () => {
    if (!newPassphrase) {
      toast.error("Please enter a passphrase.");
      return;
    }
    if (newPassphrase !== confirmPassphrase) {
      toast.error("Passphrases do not match.");
      return;
    }
    await setupVault(newPassphrase);
    toast.success("Vault encryption enabled successfully!");
    setNewPassphrase("");
    setConfirmPassphrase("");
    setShowPassSection(false);
  };

  const handleDisableVault = async () => {
    if (confirm("Are you sure you want to disable vault encryption? Your data will be stored in plaintext in localStorage.")) {
      await setupVault(null);
      toast.success("Vault encryption disabled.");
    }
  };

  const handleExportBackup = async (encrypted: boolean) => {
    const rawJson = JSON.stringify(state, null, 2);
    let finalContent = rawJson;
    let filename = "smartbudget-backup.json";

    if (encrypted) {
      const pass = prompt("Enter a password to encrypt this backup file:");
      if (!pass) return;
      try {
        finalContent = await encryptData(rawJson, pass);
        filename = "smartbudget-backup.sbvault.json";
      } catch (e) {
        toast.error("Failed to encrypt backup file.");
        return;
      }
    }

    const blob = new Blob([finalContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Backup downloaded as ${filename}`);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      try {
        const parsed = JSON.parse(content);
        if (parsed.encrypted && parsed.ciphertext) {
          // Encrypted file, require password
          setPendingRestoreJson(content);
          setShowRestoreDecrypt(true);
        } else {
          // Plaintext backup
          const res = importData(content);
          if (res.ok) {
            toast.success("Backup restored successfully!");
            onOpenChange(false);
          } else {
            toast.error(res.error || "Failed to restore backup.");
          }
        }
      } catch {
        toast.error("Invalid file format — please upload a valid JSON backup.");
      }
    };
    reader.readAsText(file);
  };

  const handleDecryptAndRestore = async () => {
    try {
      const decrypted = await decryptData(pendingRestoreJson, restorePassphrase);
      const res = importData(decrypted);
      if (res.ok) {
        toast.success("Encrypted backup restored successfully!");
        setShowRestoreDecrypt(false);
        onOpenChange(false);
      } else {
        toast.error(res.error || "Failed to restore backup.");
      }
    } catch {
      toast.error("Incorrect decryption password. Try again.");
    }
  };

  return (
    <>
      <Modal
        open={open}
        onOpenChange={onOpenChange}
        title="App Settings"
        description="Manage API proxies, data security vaults, and backups."
        maxWidth="500px"
      >
        <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
          {/* Vault Security Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-1.5 text-[var(--foreground)] border-b border-[var(--border)] pb-2">
              <LockKeyhole size={16} className="text-[var(--brand)]" /> Vault Security (E2E Encrypted)
            </h3>

            {hasPassphrase ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.02] text-xs text-emerald-500">
                  <ShieldCheck size={18} />
                  <span>Vault encryption is currently ACTIVE. Your data is encrypted locally.</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleDisableVault}
                    className="btn-secondary text-xs flex-1 justify-center py-2 bg-red-500/5 text-red-500 border-red-500/10 hover:bg-red-500/10"
                  >
                    Disable Encryption
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      lockVault();
                      onOpenChange(false);
                    }}
                    className="btn-primary text-xs flex-1 justify-center py-2 bg-gradient-to-br from-[var(--brand)] to-[var(--brand-dark)]"
                  >
                    <Lock size={13} /> Lock Vault Now
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.02] text-xs text-amber-500 flex items-start gap-2">
                  <ShieldAlert size={18} className="shrink-0 mt-0.5" />
                  <span>Vault encryption is INACTIVE. Data is saved in plaintext. Enable encryption to secure your financial vault.</span>
                </div>

                {!showPassSection ? (
                  <button
                    type="button"
                    onClick={() => setShowPassSection(true)}
                    className="btn-primary w-full text-xs justify-center py-2 bg-gradient-to-br from-[var(--brand)] to-[var(--brand-dark)]"
                  >
                    Enable Vault Encryption
                  </button>
                ) : (
                  <div className="space-y-2.5 p-3.5 border border-[var(--border)] rounded-xl">
                    <div>
                      <label className="text-[10px] uppercase font-semibold text-[var(--muted)]">Choose Passphrase</label>
                      <input
                        type="password"
                        className="input text-xs mt-1"
                        placeholder="Must be memorized — cannot be reset"
                        value={newPassphrase}
                        onChange={(e) => setNewPassphrase(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-semibold text-[var(--muted)]">Confirm Passphrase</label>
                      <input
                        type="password"
                        className="input text-xs mt-1"
                        placeholder="Re-enter passphrase"
                        value={confirmPassphrase}
                        onChange={(e) => setConfirmPassphrase(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2 pt-1.5">
                      <button
                        type="button"
                        onClick={() => setShowPassSection(false)}
                        className="btn-secondary text-xs flex-1 justify-center py-2"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSetupVault}
                        className="btn-primary text-xs flex-1 justify-center py-2"
                      >
                        Secure Vault
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Backup & Restore Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-1.5 text-[var(--foreground)] border-b border-[var(--border)] pb-2">
              <Download size={16} className="text-[var(--brand)]" /> Backup & Restore
            </h3>
            <p className="text-xs text-[var(--muted)]">
              Export your data offline as a file or load an existing backup file to restore.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleExportBackup(false)}
                className="btn-secondary text-xs py-2 justify-center gap-1.5"
              >
                <Download size={13} /> Export Plain JSON
              </button>
              <button
                type="button"
                onClick={() => handleExportBackup(true)}
                className="btn-secondary text-xs py-2 justify-center gap-1.5"
              >
                <Download size={13} /> Export Encrypted
              </button>
            </div>
            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-primary w-full text-xs justify-center py-2 gap-1.5 bg-gradient-to-br from-[var(--brand)] to-[var(--brand-dark)]"
              >
                <Upload size={13} /> Upload & Restore Backup (.json)
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".json"
                onChange={handleImportBackup}
              />
            </div>
          </div>

          {/* API Keys Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-1.5 text-[var(--foreground)] border-b border-[var(--border)] pb-2">
              <Key size={16} className="text-[var(--brand)]" /> API proxies (Stored Locally)
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
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-[var(--muted)] flex items-center gap-1">
                    Frankfurter API Key
                    <span className="text-[9px] px-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-normal">Optional</span>
                  </label>
                </div>
                <input
                  type="password"
                  className="input text-xs"
                  placeholder="Frankfurter Key (if hosting custom instance)"
                  value={frankfurterKey}
                  onChange={(e) => setFrankfurterKey(e.target.value)}
                />
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
              </div>
            </div>
          </div>

          {/* India DPDP 2023 Notice & Reset */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-semibold flex items-center gap-1.5 text-[var(--foreground)] border-b border-[var(--border)] pb-2">
              <ShieldAlert size={16} className="text-[var(--danger)]" /> Data Privacy & DPDP Notice
            </h3>

            <div className="text-[10px] text-[var(--muted)] space-y-1.5 p-3 rounded-xl border border-[var(--border)]">
              <p><strong>India DPDP 2023 Compliance Policy Summary:</strong></p>
              <p>1. Data Minimization: SmartBudget runs 100% locally in your browser cache. No financial PII is uploaded to external servers.</p>
              <p>2. Right to Erase: You have complete control to wipe all stored financial information instantly with the button below.</p>
              <p>3. External API Calls: Requests for rates are proxies to protect your client IP. No tracking trackers exist.</p>
            </div>

            <div className="rounded-xl border border-red-500/10 bg-red-500/[0.01] p-3 space-y-2">
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
              className="btn-primary py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 bg-gradient-to-br from-[var(--brand)] to-[var(--brand-dark)] text-white shadow-md shadow-[var(--brand)]/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Save size={14} /> Save & Apply
            </button>
          </div>
        </div>
      </Modal>

      {/* Decrypting Backup Modal */}
      <Modal
        open={showRestoreDecrypt}
        onOpenChange={setShowRestoreDecrypt}
        title="Decrypt Backup File"
        description="This backup file is encrypted. Enter its decryption password to restore."
        maxWidth="400px"
      >
        <div className="space-y-4">
          <input
            type="password"
            className="input text-xs"
            placeholder="Enter decryption password"
            value={restorePassphrase}
            onChange={(e) => setRestorePassphrase(e.target.value)}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowRestoreDecrypt(false);
                setRestorePassphrase("");
                setPendingRestoreJson("");
              }}
              className="btn-secondary text-xs py-2 px-4"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDecryptAndRestore}
              className="btn-primary text-xs py-2 px-4 bg-gradient-to-br from-[var(--brand)] to-[var(--brand-dark)]"
            >
              Decrypt & Restore
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
