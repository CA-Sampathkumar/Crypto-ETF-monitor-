import React, { useState, useEffect } from "react";
import {
  Bell,
  TrendingUp,
  TrendingDown,
  Volume2,
  VolumeX,
  Check,
  X,
  Trash2,
  AlertCircle,
  Plus,
  ShieldCheck,
  Sparkles,
  Zap,
  Clock,
  Radio,
  Sliders,
} from "lucide-react";
import { LiveTokenPrice } from "../services/marketApi";
import { notificationAudio } from "../services/notificationAudioService";

export type BinanceAlertCondition =
  | "PRICE_RISES_ABOVE"
  | "PRICE_DROPS_BELOW"
  | "CHANGE_INCREASES_OVER"
  | "CHANGE_DROPS_BELOW";

export type BinanceAlertFrequency = "ONLY_ONCE" | "ONCE_A_DAY" | "RECURRING";

export interface BinancePriceAlert {
  id: string;
  symbol: string;
  tokenName: string;
  condition: BinanceAlertCondition;
  targetValue: number; // Target price in USD or % change
  initialPrice: number;
  frequency: BinanceAlertFrequency;
  soundEnabled: boolean;
  browserNotification: boolean;
  notes?: string;
  createdAt: string;
  isActive: boolean;
  triggeredCount: number;
  lastTriggeredAt?: string;
}

interface BinancePriceAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  tokenName: string;
  currentPrice: number;
  change24h: number;
  livePrices: Record<string, LiveTokenPrice>;
  alerts: BinancePriceAlert[];
  onSaveAlert: (alert: BinancePriceAlert) => void;
  onToggleAlert: (id: string, active: boolean) => void;
  onDeleteAlert: (id: string) => void;
  onClearTriggered: () => void;
}

export const BinancePriceAlertModal: React.FC<BinancePriceAlertModalProps> = ({
  isOpen,
  onClose,
  symbol,
  tokenName,
  currentPrice,
  change24h,
  livePrices,
  alerts,
  onSaveAlert,
  onToggleAlert,
  onDeleteAlert,
  onClearTriggered,
}) => {
  const [activeTab, setActiveTab] = useState<"create" | "manage">("create");
  const [condition, setCondition] = useState<BinanceAlertCondition>("PRICE_RISES_ABOVE");
  const [targetPriceInput, setTargetPriceInput] = useState<string>(
    (currentPrice * 1.03).toFixed(currentPrice < 1 ? 4 : 2)
  );
  const [frequency, setFrequency] = useState<BinanceAlertFrequency>("ONLY_ONCE");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [browserNotification, setBrowserNotification] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>("");
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );

  // Update default target price when modal opens or symbol changes
  useEffect(() => {
    if (currentPrice > 0) {
      if (condition === "PRICE_RISES_ABOVE") {
        setTargetPriceInput((currentPrice * 1.03).toFixed(currentPrice < 1 ? 4 : 2));
      } else if (condition === "PRICE_DROPS_BELOW") {
        setTargetPriceInput((currentPrice * 0.97).toFixed(currentPrice < 1 ? 4 : 2));
      } else if (condition === "CHANGE_INCREASES_OVER") {
        setTargetPriceInput("5.0");
      } else if (condition === "CHANGE_DROPS_BELOW") {
        setTargetPriceInput("-5.0");
      }
    }
  }, [symbol, condition, currentPrice]);

  if (!isOpen) return null;

  const currentTokenAlerts = alerts.filter((a) => a.symbol.toUpperCase() === symbol.toUpperCase());
  const activeAlertsCount = alerts.filter((a) => a.isActive).length;

  const handleRequestNotificationPermission = async () => {
    if (typeof Notification !== "undefined" && Notification.requestPermission) {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
    }
  };

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(targetPriceInput);
    if (isNaN(val) || val <= 0 && (condition === "PRICE_RISES_ABOVE" || condition === "PRICE_DROPS_BELOW")) {
      return;
    }

    // Play test audio confirmation if sound enabled
    if (soundEnabled) {
      notificationAudio.playActivityChime();
    }

    const newAlert: BinancePriceAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      symbol: symbol.toUpperCase(),
      tokenName,
      condition,
      targetValue: val,
      initialPrice: currentPrice,
      frequency,
      soundEnabled,
      browserNotification,
      notes: notes.trim() || undefined,
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      isActive: true,
      triggeredCount: 0,
    };

    onSaveAlert(newAlert);
    setActiveTab("manage");
  };

  const applyPercentPreset = (pct: number) => {
    if (currentPrice <= 0) return;
    const target = currentPrice * (1 + pct / 100);
    setTargetPriceInput(target.toFixed(target < 1 ? 5 : 2));
    if (pct > 0) {
      setCondition("PRICE_RISES_ABOVE");
    } else {
      setCondition("PRICE_DROPS_BELOW");
    }
  };

  const formatPrice = (val?: number | null) => {
    if (val === undefined || val === null || isNaN(val)) return "$0.00";
    if (val >= 1000) return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (val >= 1) return `$${val.toFixed(3)}`;
    if (val >= 0.0001) return `$${val.toFixed(5)}`;
    if (val > 0) {
      try {
        return `$${val.toPrecision(4)}`;
      } catch {
        return `$${val.toFixed(6)}`;
      }
    }
    return `$${val}`;
  };

  const getConditionLabel = (cond: BinanceAlertCondition, val: number) => {
    switch (cond) {
      case "PRICE_RISES_ABOVE":
        return `Price rises above ${formatPrice(val)}`;
      case "PRICE_DROPS_BELOW":
        return `Price drops below ${formatPrice(val)}`;
      case "CHANGE_INCREASES_OVER":
        return `24h change rises above +${val}%`;
      case "CHANGE_DROPS_BELOW":
        return `24h change drops below ${val}%`;
      default:
        return `Target: ${val}`;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-[#0e0e15] border border-[#262638] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden text-[#e0e0e0] flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#1f1f30] flex items-center justify-between bg-[#0b0b12]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Live Price Alerts &amp; Triggers
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {symbol}/USDT
                </span>
              </div>
              <p className="text-xs text-[#888899]">
                Spot Price: <strong className="text-white font-mono">{formatPrice(currentPrice)}</strong> ({change24h >= 0 ? "+" : ""}{change24h.toFixed(2)}%)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#161622] hover:bg-[#202030] text-[#888899] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation: Set Alert vs Manage Alerts */}
        <div className="flex border-b border-[#1f1f30] bg-[#0c0c14] text-xs font-semibold">
          <button
            onClick={() => setActiveTab("create")}
            className={`flex-1 py-3 text-center border-b-2 transition-all cursor-pointer ${
              activeTab === "create"
                ? "border-amber-400 text-amber-300 bg-amber-500/5 font-bold"
                : "border-transparent text-[#888899] hover:text-white hover:bg-[#141420]"
            }`}
          >
            + Create New Alert
          </button>
          <button
            onClick={() => setActiveTab("manage")}
            className={`flex-1 py-3 text-center border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "manage"
                ? "border-amber-400 text-amber-300 bg-amber-500/5 font-bold"
                : "border-transparent text-[#888899] hover:text-white hover:bg-[#141420]"
            }`}
          >
            <span>Active Alerts</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-[#222234] text-white">
              {currentTokenAlerts.length}
            </span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === "create" ? (
            <form onSubmit={handleCreateAlert} className="space-y-4 text-xs">
              {/* Alert Condition Type */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#888899] block">
                  Alert Condition
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "PRICE_RISES_ABOVE", label: "Price Rises Above", icon: TrendingUp, color: "text-emerald-400" },
                    { id: "PRICE_DROPS_BELOW", label: "Price Drops Below", icon: TrendingDown, color: "text-red-400" },
                    { id: "CHANGE_INCREASES_OVER", label: "24h Change Rises Over %", icon: Zap, color: "text-amber-400" },
                    { id: "CHANGE_DROPS_BELOW", label: "24h Change Drops Below %", icon: AlertCircle, color: "text-purple-400" },
                  ].map((c) => {
                    const Icon = c.icon;
                    const isSelected = condition === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCondition(c.id as BinanceAlertCondition)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? "bg-amber-950/40 border-amber-500/60 text-white font-bold shadow-sm shadow-amber-500/10"
                            : "bg-[#141420] border-[#242436] text-[#9999aa] hover:bg-[#1a1a2c] hover:text-white"
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${c.color}`} />
                        <span className="text-[11px]">{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Price or % Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-[#888899]">
                    {condition.includes("CHANGE") ? "Target 24h Percentage (%)" : "Target Price (USD)"}
                  </label>
                  <span className="text-[10px] text-[#666677] font-mono">
                    Current: {formatPrice(currentPrice)}
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    required
                    value={targetPriceInput}
                    onChange={(e) => setTargetPriceInput(e.target.value)}
                    placeholder={condition.includes("CHANGE") ? "5.0" : "Target price"}
                    className="w-full bg-[#13131e] border border-[#262638] rounded-xl px-3.5 py-2.5 font-mono text-base font-bold text-white focus:outline-none focus:border-amber-400"
                  />
                  <div className="absolute right-3 top-2.5 text-xs text-[#888899] font-mono">
                    {condition.includes("CHANGE") ? "%" : "USD"}
                  </div>
                </div>

                {/* Quick % Offset Preset Buttons */}
                {!condition.includes("CHANGE") && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-[#666677] mr-1">Quick Target:</span>
                    {[
                      { label: "+1%", val: 1 },
                      { label: "+3%", val: 3 },
                      { label: "+5%", val: 5 },
                      { label: "+10%", val: 10 },
                      { label: "-1%", val: -1 },
                      { label: "-3%", val: -3 },
                      { label: "-5%", val: -5 },
                      { label: "-10%", val: -10 },
                    ].map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => applyPercentPreset(p.val)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                          p.val > 0
                            ? "bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/20"
                            : "bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/20"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Alert Frequency */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#888899] block">
                  Alert Frequency
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "ONLY_ONCE", label: "Only Once" },
                    { id: "ONCE_A_DAY", label: "Once a Day" },
                    { id: "RECURRING", label: "Always (Recurring)" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFrequency(f.id as BinanceAlertFrequency)}
                      className={`py-2 px-2 rounded-xl text-center text-[11px] font-medium border transition-all cursor-pointer ${
                        frequency === f.id
                          ? "bg-amber-500 text-black font-bold border-amber-400 shadow-sm"
                          : "bg-[#141420] text-[#888899] border-[#242436] hover:text-white"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notification Toggles */}
              <div className="p-3 bg-[#13131f] border border-[#222234] rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="font-semibold text-white text-[11px] block">Sound Alert</span>
                      <span className="text-[10px] text-[#777788]">Play audio chime tone upon trigger</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={soundEnabled}
                    onChange={(e) => setSoundEnabled(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#1a1a2a]">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-blue-400" />
                    <div>
                      <span className="font-semibold text-white text-[11px] block">Browser Desktop Push</span>
                      <span className="text-[10px] text-[#777788]">Send instant OS push notification</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {notificationPermission !== "granted" && (
                      <button
                        type="button"
                        onClick={handleRequestNotificationPermission}
                        className="text-[10px] bg-blue-950/60 hover:bg-blue-900 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30"
                      >
                        Enable OS Alerts
                      </button>
                    )}
                    <input
                      type="checkbox"
                      checked={browserNotification}
                      onChange={(e) => setBrowserNotification(e.target.checked)}
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Optional Notes */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#888899] block">
                  Remarks / Note (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Resistance breakout, Take profit, Buy dip"
                  className="w-full bg-[#13131e] border border-[#262638] rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <Bell className="w-4 h-4" />
                <span>Save Live Price Alert</span>
              </button>
            </form>
          ) : (
            /* Manage Alerts List */
            <div className="space-y-3">
              {alerts.length === 0 ? (
                <div className="p-8 text-center space-y-2 text-[#777788]">
                  <Bell className="w-8 h-8 mx-auto text-[#444455]" />
                  <p className="text-xs font-semibold text-white">No Active Alerts Configured</p>
                  <p className="text-[11px]">
                    Create a price alert to be notified instantly via live market ticks.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("create")}
                    className="mt-3 px-4 py-1.5 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400"
                  >
                    + Create Alert for {symbol}
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs pb-1">
                    <span className="text-[#888899] font-medium">
                      All Configured Alerts ({alerts.length})
                    </span>
                    <button
                      type="button"
                      onClick={onClearTriggered}
                      className="text-[11px] text-red-400 hover:text-red-300 underline cursor-pointer"
                    >
                      Clear Inactive
                    </button>
                  </div>

                  <div className="space-y-2">
                    {alerts.map((al) => {
                      const isThisToken = al.symbol.toUpperCase() === symbol.toUpperCase();
                      return (
                        <div
                          key={al.id}
                          className={`p-3.5 rounded-2xl border transition-all ${
                            al.isActive
                              ? isThisToken
                                ? "bg-[#141424] border-amber-500/40"
                                : "bg-[#12121c] border-[#222234]"
                              : "bg-[#0d0d14] border-[#181824] opacity-60"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-xs">{al.symbol}/USDT</span>
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                    al.isActive
                                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                      : "bg-[#222230] text-[#777788]"
                                  }`}
                                >
                                  {al.isActive ? "ACTIVE" : "PAUSED"}
                                </span>
                                <span className="text-[10px] text-[#666677] font-mono">
                                  {al.frequency.replace("_", " ")}
                                </span>
                              </div>

                              <p className="text-xs font-semibold text-[#cccccc]">
                                {getConditionLabel(al.condition, al.targetValue)}
                              </p>

                              {al.notes && (
                                <p className="text-[11px] text-[#8888aa] italic">
                                  &ldquo;{al.notes}&rdquo;
                                </p>
                              )}

                              <div className="flex items-center gap-3 text-[10px] text-[#666677] font-mono pt-1">
                                <span>Created: {al.createdAt}</span>
                                {al.triggeredCount > 0 && (
                                  <span className="text-amber-400 font-bold">
                                    Triggered {al.triggeredCount}x
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => onToggleAlert(al.id, !al.isActive)}
                                title={al.isActive ? "Pause Alert" : "Resume Alert"}
                                className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                                  al.isActive
                                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30"
                                    : "bg-[#1e1e2c] text-[#888899] hover:text-white"
                                }`}
                              >
                                {al.isActive ? "Active" : "Paused"}
                              </button>

                              <button
                                type="button"
                                onClick={() => onDeleteAlert(al.id)}
                                title="Delete Alert"
                                className="p-1.5 rounded-xl bg-[#1a1a28] hover:bg-red-950/40 text-[#888899] hover:text-red-400 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#08080f] border-t border-[#1a1a28] flex items-center justify-between text-[11px] text-[#777788]">
          <div className="flex items-center gap-1.5 text-emerald-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Live Spot Market Stream</span>
          </div>
          <span>100% Free Public APIs • Zero Simulations</span>
        </div>
      </div>
    </div>
  );
};
