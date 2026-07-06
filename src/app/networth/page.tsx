"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useStore } from "@/lib/store";
import { currencySymbol } from "@/lib/defaults";
import { formatCurrency, totalAssets, totalDebts, netWorth } from "@/lib/calc";
import { ASSET_TYPE_ICON } from "@/lib/icons";
import { AssetType } from "@/lib/types";
import { Plus, Trash2, Scale, TrendingUp, TrendingDown, RefreshCw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import AnimatedNumber from "@/components/ui/AnimatedNumber";
import { ASSET_CHART_COLORS } from "@/lib/theme";
import { fetchCoinPrices, POPULAR_COINS } from "@/lib/crypto";
import CurrencyConverter from "@/components/CurrencyConverter";
import CryptoTracker from "@/components/CryptoTracker";

const AssetBreakdownPie = dynamic(() => import("@/components/charts/AssetBreakdownPie"), {
  ssr: false,
  loading: () => <div className="skeleton h-[200px] w-full" />,
});

const ASSET_TYPES: { value: AssetType; label: string }[] = [
  { value: "cash", label: "Cash & Bank" },
  { value: "investment", label: "Investments" },
  { value: "property", label: "Property" },
  { value: "crypto", label: "Crypto" },
  { value: "other", label: "Other" },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function NetWorthPage() {
  const { state, addAsset, updateAsset, removeAsset, addDebt, removeDebt, hydrated } = useStore();
  const symbol = currencySymbol(state.currency);

  const [assetName, setAssetName] = useState("");
  const [assetValue, setAssetValue] = useState("");
  const [assetType, setAssetType] = useState<AssetType>("cash");
  const [cryptoCoinId, setCryptoCoinId] = useState(POPULAR_COINS[0].id);
  const [cryptoQty, setCryptoQty] = useState("");
  const [cryptoCostBasis, setCryptoCostBasis] = useState("");
  const [cryptoAcquiredDate, setCryptoAcquiredDate] = useState(todayIso());
  const [refreshingCrypto, setRefreshingCrypto] = useState(false);
  const [indiaCryptoTax, setIndiaCryptoTax] = useState(false);

  const [debtName, setDebtName] = useState("");
  const [debtBalance, setDebtBalance] = useState("");
  const [debtApr, setDebtApr] = useState("");
  const [debtMin, setDebtMin] = useState("");

  const [deleteAsset, setDeleteAsset] = useState<{ id: string; name: string } | null>(null);
  const [deleteDebt, setDeleteDebt] = useState<{ id: string; name: string } | null>(null);

  if (!hydrated) return <div className="skeleton h-64" />;

  const assets = totalAssets(state.assets);
  const debts = totalDebts(state.debts);
  const nw = netWorth(state.assets, state.debts);
  const cryptoAssets = state.assets.filter((a) => a.type === "crypto" && a.coinId);

  const assetsByType = ASSET_TYPES.map((t) => ({
    name: t.label,
    value: state.assets.filter((a) => a.type === t.value).reduce((s, a) => s + a.value, 0),
  })).filter((d) => d.value > 0);

  const handleAddAsset = () => {
    if (assetType === "crypto") {
      const qty = parseFloat(cryptoQty);
      if (!qty || qty <= 0) {
        toast.error("Enter a valid quantity held.");
        return;
      }
      const costBasisVal = parseFloat(cryptoCostBasis) || 0;
      const coin = POPULAR_COINS.find((c) => c.id === cryptoCoinId);
      addAsset({
        name: coin?.name || cryptoCoinId,
        type: "crypto",
        value: 0, // Will be computed live when refreshed, or defaults to 0 initially
        coinId: cryptoCoinId,
        quantity: qty,
        costBasis: costBasisVal > 0 ? costBasisVal : undefined,
        acquiredDate: cryptoAcquiredDate || undefined,
      });
      toast.success(`Added ${coin?.name || cryptoCoinId}. Click "Refresh Prices" below to calculate live value.`);
      setCryptoQty("");
      setCryptoCostBasis("");
      return;
    }
    const v = parseFloat(assetValue);
    if (!assetName.trim() || !v || v <= 0) {
      toast.error("Enter a valid asset name and value.");
      return;
    }
    addAsset({ name: assetName.trim(), value: v, type: assetType });
    toast.success(`Added asset "${assetName.trim()}".`);
    setAssetName("");
    setAssetValue("");
  };

  const handleRefreshCrypto = async () => {
    if (cryptoAssets.length === 0) {
      toast.error("Add a crypto asset first.");
      return;
    }
    setRefreshingCrypto(true);
    const ids = [...new Set(cryptoAssets.map((a) => a.coinId!))];
    const prices = await fetchCoinPrices(state.currency, ids);
    setRefreshingCrypto(false);
    if (!prices) {
      toast.error("Couldn't fetch live prices — check your connection.");
      return;
    }
    let updated = 0;
    for (const asset of cryptoAssets) {
      const price = prices.find((p) => p.id === asset.coinId);
      if (price && asset.quantity) {
        updateAsset(asset.id, { value: price.current_price * asset.quantity });
        updated++;
      }
    }
    toast.success(`Updated ${updated} crypto asset(s) with live prices.`);
  };

  const handleAddDebt = () => {
    const bal = parseFloat(debtBalance);
    const apr = parseFloat(debtApr) || 0;
    const min = parseFloat(debtMin) || 0;
    if (!debtName.trim() || !bal || bal <= 0) {
      toast.error("Enter a valid debt name and balance.");
      return;
    }
    addDebt({ name: debtName.trim(), balance: bal, apr, minPayment: min });
    toast.success(`Added debt "${debtName.trim()}".`);
    setDebtName("");
    setDebtBalance("");
    setDebtApr("");
    setDebtMin("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Net Worth</h1>
        <p className="text-[var(--muted)] text-sm">Assets minus debts — the single number that matters most long-term.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 text-[var(--muted)] text-xs font-medium mb-2">
            <span className="w-7 h-7 rounded-lg flex items-center justify-center bg-emerald-500/15 text-emerald-500">
              <TrendingUp size={16} />
            </span>
            Total Assets
          </div>
          <div className="text-xl font-bold"><AnimatedNumber value={assets} format={(n) => formatCurrency(n, symbol)} /></div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 text-[var(--muted)] text-xs font-medium mb-2">
            <span className="w-7 h-7 rounded-lg flex items-center justify-center bg-red-500/15 text-red-500">
              <TrendingDown size={16} />
            </span>
            Total Debts
          </div>
          <div className="text-xl font-bold"><AnimatedNumber value={debts} format={(n) => formatCurrency(n, symbol)} /></div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 text-[var(--muted)] text-xs font-medium mb-2">
            <span className="w-7 h-7 rounded-lg flex items-center justify-center bg-[var(--brand)]/15 text-[var(--brand)]">
              <Scale size={16} />
            </span>
            Net Worth
          </div>
          <div className={`text-xl font-bold ${nw < 0 ? "text-red-500" : ""}`}>
            <AnimatedNumber value={nw} format={(n) => formatCurrency(n, symbol)} />
          </div>
        </div>
      </div>

      <CryptoTracker currency={state.currency} symbol={symbol} />

      {assetsByType.length > 0 && (
        <div className="card p-5 animate-fade-in">
          <h2 className="font-semibold mb-2">Asset Breakdown</h2>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <AssetBreakdownPie data={assetsByType} symbol={symbol} />
            <div className="space-y-2 text-sm">
              {assetsByType.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: ASSET_CHART_COLORS[i % ASSET_CHART_COLORS.length] }} />
                  <span className="font-medium">{d.name}</span>
                  <span className="text-[var(--muted)]">{formatCurrency(d.value, symbol)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in">
        {/* Assets */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Assets</h2>
            <div className="flex items-center gap-2">
              {cryptoAssets.length > 0 && (
                <>
                  <label className="text-[10px] text-[var(--muted)] flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={indiaCryptoTax}
                      onChange={(e) => setIndiaCryptoTax(e.target.checked)}
                      className="rounded accent-[var(--brand)]"
                    />
                    India 30% Tax Warning
                  </label>
                  <button className="btn-secondary text-xs px-2.5 py-1.5 min-h-0 flex items-center gap-1" onClick={handleRefreshCrypto} disabled={refreshingCrypto}>
                    <RefreshCw size={12} className={refreshingCrypto ? "animate-spin" : ""} /> Refresh
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
            <select className="input sm:col-span-2" value={assetType} onChange={(e) => setAssetType(e.target.value as AssetType)}>
              {ASSET_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            {assetType === "crypto" ? (
              <>
                <select className="input" value={cryptoCoinId} onChange={(e) => setCryptoCoinId(e.target.value)}>
                  {POPULAR_COINS.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.symbol})</option>
                  ))}
                </select>
                <input type="number" className="input" placeholder="Quantity held" value={cryptoQty} onChange={(e) => setCryptoQty(e.target.value)} />
                <input type="number" className="input" placeholder={`Cost Basis (${symbol}/coin)`} value={cryptoCostBasis} onChange={(e) => setCryptoCostBasis(e.target.value)} />
                <input type="date" className="input sm:col-span-2" placeholder="Acquired Date" value={cryptoAcquiredDate} onChange={(e) => setCryptoAcquiredDate(e.target.value)} />
              </>
            ) : (
              <>
                <input className="input" placeholder="Name (e.g. Savings account)" value={assetName} onChange={(e) => setAssetName(e.target.value)} />
                <input type="number" className="input" placeholder={`Value (${symbol})`} value={assetValue} onChange={(e) => setAssetValue(e.target.value)} />
              </>
            )}
          </div>
          <button className="btn-primary w-full justify-center mb-3" onClick={handleAddAsset}>
            <Plus size={16} /> Add Asset
          </button>
          
          <div className="divide-y divide-[var(--border)]">
            {state.assets.length === 0 && <p className="text-sm text-[var(--muted)] text-center py-4">No assets added yet.</p>}
            {state.assets.map((a) => {
              const Icon = ASSET_TYPE_ICON[a.type];
              
              // Calculate Crypto P&L
              let pnlText = "";
              let pnlValue = 0;
              let isProfit = false;
              let taxWarning = 0;

              if (a.type === "crypto" && a.quantity && a.costBasis) {
                const costVal = a.costBasis * a.quantity;
                pnlValue = a.value - costVal;
                isProfit = pnlValue > 0;
                const pnlPct = costVal > 0 ? (pnlValue / costVal) * 100 : 0;
                pnlText = `P&L: ${isProfit ? "+" : ""}${formatCurrency(pnlValue, symbol)} (${isProfit ? "+" : ""}${pnlPct.toFixed(1)}%)`;
                
                if (isProfit && indiaCryptoTax) {
                  taxWarning = pnlValue * 0.3;
                }
              }

              return (
                <div key={a.id} className="py-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-8 h-8 rounded-full bg-[color-mix(in_srgb,var(--muted)_10%,transparent)] flex items-center justify-center text-[var(--muted)] shrink-0">
                        <Icon size={15} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{a.name}</p>
                        {a.type === "crypto" && a.quantity && (
                          <div className="text-[10px] text-[var(--muted)] flex flex-wrap gap-1.5 items-center">
                            <span>{a.quantity} units</span>
                            {a.costBasis && (
                              <>
                                <span>·</span>
                                <span>Cost: {formatCurrency(a.costBasis, symbol)}</span>
                              </>
                            )}
                            {a.acquiredDate && (
                              <>
                                <span>·</span>
                                <span>Bought: {new Date(a.acquiredDate).toLocaleDateString()}</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-semibold">{formatCurrency(a.value, symbol)}</span>
                      <button className="icon-btn danger" onClick={() => setDeleteAsset({ id: a.id, name: a.name })}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {pnlText && (
                    <div className="flex items-center justify-between text-[10px] pl-10 font-medium">
                      <span className={isProfit ? "text-emerald-500" : "text-red-500"}>{pnlText}</span>
                      {taxWarning > 0 && (
                        <span className="text-amber-500 flex items-center gap-0.5" title="India 30% flat crypto tax on profits (no offsets allowed)">
                          <AlertTriangle size={10} /> India Tax: -{formatCurrency(taxWarning, symbol)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Debts */}
        <div className="card p-5">
          <h2 className="font-semibold mb-3">Debts</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
            <input className="input sm:col-span-2" placeholder="Name (e.g. Credit Card)" value={debtName} onChange={(e) => setDebtName(e.target.value)} />
            <input type="number" className="input" placeholder={`Balance (${symbol})`} value={debtBalance} onChange={(e) => setDebtBalance(e.target.value)} />
            <input type="number" className="input" placeholder="APR %" value={debtApr} onChange={(e) => setDebtApr(e.target.value)} />
            <input type="number" className="input sm:col-span-2" placeholder={`Min. monthly payment (${symbol})`} value={debtMin} onChange={(e) => setDebtMin(e.target.value)} />
          </div>
          <button className="btn-primary w-full justify-center mb-3" onClick={handleAddDebt}>
            <Plus size={16} /> Add Debt
          </button>
          <div className="divide-y divide-[var(--border)]">
            {state.debts.length === 0 && <p className="text-sm text-[var(--muted)] text-center py-4">No debts added — nice!</p>}
            {state.debts.map((d) => (
              <div key={d.id} className="flex items-center justify-between py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{d.name}</p>
                  <p className="text-xs text-[var(--muted)]">{d.apr}% APR · Min {formatCurrency(d.minPayment, symbol)}/mo</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-semibold text-red-500">{formatCurrency(d.balance, symbol)}</span>
                  <button className="icon-btn danger" onClick={() => setDeleteDebt({ id: d.id, name: d.name })}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {state.debts.length > 0 && (
            <a href="/debt" className="text-xs text-[var(--brand)] font-medium mt-3 inline-block">
              Plan your payoff strategy →
            </a>
          )}
        </div>
      </div>

      <CurrencyConverter defaultFrom={state.currency} />

      <ConfirmDialog
        open={!!deleteAsset}
        onOpenChange={(o) => !o && setDeleteAsset(null)}
        title="Delete Asset"
        description={`Delete "${deleteAsset?.name}"?`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteAsset) {
            removeAsset(deleteAsset.id);
            toast.success("Asset deleted.");
          }
        }}
      />
      <ConfirmDialog
        open={!!deleteDebt}
        onOpenChange={(o) => !o && setDeleteDebt(null)}
        title="Delete Debt"
        description={`Delete "${deleteDebt?.name}"?`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteDebt) {
            removeDebt(deleteDebt.id);
            toast.success("Debt deleted.");
          }
        }}
      />
    </div>
  );
}
