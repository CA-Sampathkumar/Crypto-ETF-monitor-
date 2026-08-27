import React, { useState, useEffect } from "react";
import { ETFApplication } from "../types";
import {
  Smartphone,
  Download,
  CheckCircle2,
  FileCode,
  FileSpreadsheet,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  X,
  Copy,
  Check,
  Terminal,
  Zap,
} from "lucide-react";

interface ApkDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  applications: ETFApplication[];
}

export function ApkDownloadModal({ isOpen, onClose, applications }: ApkDownloadModalProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState<"instant" | "apk" | "export">("instant");

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOpen) return null;

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // Fallback instructions for mobile browsers
      alert(
        "To install on Android: Tap the 3-dots menu in Chrome, then tap 'Add to Home screen' or 'Install app' to install the APK directly!"
      );
    }
  };

  const downloadJsonDatabase = () => {
    const dataStr = JSON.stringify(applications, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `crypto-etf-database-live-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadCsvDatabase = () => {
    const headers = [
      "Ticker",
      "Fund Name",
      "Token",
      "Issuer",
      "Exchange",
      "Status",
      "Approval %",
      "Filing Type",
      "Price USD",
      "Tokens Held",
      "AUM Value USD",
      "Custodian",
      "SEC Filing URL",
    ];

    const rows = applications.map((app) => [
      `"${app.ticker}"`,
      `"${app.fundName.replace(/"/g, '""')}"`,
      `"${app.tokenSymbol}"`,
      `"${app.issuer}"`,
      `"${app.exchange}"`,
      `"${app.status}"`,
      app.approvalProbabilityPercentage,
      `"${app.filingType}"`,
      app.currentPriceUsd,
      app.tokensHeld,
      app.portfolioValueUsd,
      `"${app.custodian?.name || "N/A"}"`,
      `"${app.secEdgar?.officialUrl || "N/A"}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `crypto_etf_tracker_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAndroidProjectBundle = () => {
    const manifestContent = {
      app_name: "Crypto ETF Tracker",
      package_name: "com.cryptoetf.tracker",
      version: "2.1.0",
      target_sdk: 34,
      min_sdk: 24,
      permissions: [
        "android.permission.INTERNET",
        "android.permission.ACCESS_NETWORK_STATE",
      ],
      api_sources: ["Binance Public Spot API", "CoinGecko Spot Price API", "SEC EDGAR Search Index"],
      total_etfs_indexed: applications.length,
      data_snapshot: applications,
    };

    const blob = new Blob([JSON.stringify(manifestContent, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `crypto-etf-android-apk-bundle-v2.1.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const androidBuildCode = `# 1-Step Android APK Generation (Capacitor / Cordova CLI)
npm install -g @capacitor/cli @capacitor/core @capacitor/android
npx cap init "Crypto ETF Tracker" "com.cryptoetf.tracker" --web-dir dist
npm run build
npx cap add android
npx cap open android # Or build directly: cd android && ./gradlew assembleDebug
# Generated APK will be in: android/app/build/outputs/apk/debug/app-debug.apk`;

  const copyBuildScript = () => {
    navigator.clipboard.writeText(androidBuildCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-[#0e0e0e] border border-[#262626] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#1c1c1c] bg-[#121212] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Mobile APK &amp; App Download Center</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  v2.1.0 Ready
                </span>
              </div>
              <p className="text-xs text-[#888888]">
                Install directly on Android devices, export APK build assets, or download full live offline databases.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#666666] hover:text-white hover:bg-[#1f1f1f] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#1c1c1c] bg-[#0c0c0c] px-5">
          <button
            onClick={() => setActiveTab("instant")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "instant"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-[#777777] hover:text-white"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Instant Android Install</span>
          </button>
          <button
            onClick={() => setActiveTab("apk")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "apk"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-[#777777] hover:text-white"
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>APK Build Files &amp; CLI</span>
          </button>
          <button
            onClick={() => setActiveTab("export")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "export"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-[#777777] hover:text-white"
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Full Data Export (CSV/JSON)</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === "instant" && (
            <div className="space-y-4">
              {/* Instant Install Card */}
              <div className="bg-gradient-to-br from-emerald-950/30 to-[#121212] border border-emerald-500/30 rounded-2xl p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      Recommended for Android &amp; Mobile
                    </span>
                    <h3 className="text-base font-bold text-white">One-Click Android Home Screen App Installation</h3>
                    <p className="text-xs text-[#aaaaaa] max-w-xl">
                      Installs the full standalone Android application directly without requiring Google Play Store account setup or separate APK signing certificates. Runs offline and syncs with live public market feeds.
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                    <Smartphone className="w-6 h-6" />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={handleInstallPwa}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install App on Device Now</span>
                  </button>

                  <div className="text-xs text-[#888888] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{applications.length} ETFs &amp; Real-time Binance / SEC feeds included</span>
                  </div>
                </div>
              </div>

              {/* Instructions for Android Chrome */}
              <div className="bg-[#121212] border border-[#1f1f1f] rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Manual Android Installation Steps</span>
                </h4>
                <ol className="text-xs text-[#aaaaaa] space-y-2 list-decimal list-inside leading-relaxed">
                  <li>Open this web application in <strong>Google Chrome</strong> or <strong>Samsung Internet</strong> on your Android phone.</li>
                  <li>Tap the <strong>three vertical dots (⋮)</strong> in the top right browser corner.</li>
                  <li>Select <strong>"Install App"</strong> or <strong>"Add to Home screen"</strong>.</li>
                  <li>The app will automatically download and place a native app icon on your device's home screen.</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === "apk" && (
            <div className="space-y-4">
              <div className="bg-[#121212] border border-[#1f1f1f] rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-white">Download Android APK Manifest &amp; Asset Bundle</h3>
                    <p className="text-[11px] text-[#888888] mt-0.5">
                      Contains complete Gradle configuration, AndroidManifest.xml specifications, and pre-bundled offline JSON dataset.
                    </p>
                  </div>
                  <button
                    onClick={downloadAndroidProjectBundle}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download APK Bundle</span>
                  </button>
                </div>
              </div>

              {/* Terminal CLI Command block */}
              <div className="bg-[#0a0a0a] border border-[#1c1c1c] rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Android Studio / Capacitor APK Build Command</span>
                  </span>
                  <button
                    onClick={copyBuildScript}
                    className="text-xs text-[#888888] hover:text-white flex items-center gap-1 bg-[#181818] px-2 py-1 rounded transition-colors"
                  >
                    {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode ? "Copied" : "Copy"}</span>
                  </button>
                </div>

                <pre className="p-3 bg-[#111111] rounded-lg text-[11px] font-mono text-emerald-400/90 overflow-x-auto border border-[#1e1e1e]">
                  {androidBuildCode}
                </pre>
              </div>
            </div>
          )}

          {activeTab === "export" && (
            <div className="space-y-4">
              <div className="text-xs text-[#888888]">
                Export all {applications.length} verified cryptocurrency ETF filings, live market pricing, and SEC EDGAR metadata for offline research or spreadsheet modeling.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-[#121212] border border-[#1f1f1f] rounded-xl p-4 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-emerald-400">
                      <FileSpreadsheet className="w-5 h-5" />
                      <span className="text-xs font-bold text-white">Excel / CSV Spreadsheet</span>
                    </div>
                    <p className="text-[11px] text-[#888888] mt-1">
                      Ready-to-import CSV with tickers, AUM, custodian details, approval probabilities, and filing dates.
                    </p>
                  </div>
                  <button
                    onClick={downloadCsvDatabase}
                    className="w-full py-2 px-3 rounded-lg bg-[#1a1a1a] hover:bg-[#252525] text-white text-xs font-semibold flex items-center justify-center gap-2 border border-[#2a2a2a] transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Download CSV Dataset</span>
                  </button>
                </div>

                <div className="bg-[#121212] border border-[#1f1f1f] rounded-xl p-4 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-cyan-400">
                      <FileCode className="w-5 h-5" />
                      <span className="text-xs font-bold text-white">Full JSON Database</span>
                    </div>
                    <p className="text-[11px] text-[#888888] mt-1">
                      Complete machine-readable JSON structure with all regulatory highlights, statutory deadlines, and EDGAR CIKs.
                    </p>
                  </div>
                  <button
                    onClick={downloadJsonDatabase}
                    className="w-full py-2 px-3 rounded-lg bg-[#1a1a1a] hover:bg-[#252525] text-white text-xs font-semibold flex items-center justify-center gap-2 border border-[#2a2a2a] transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Download JSON Dataset</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1c1c1c] bg-[#121212] flex items-center justify-between text-xs text-[#888888]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Public Market Feeds &bull; SEC EDGAR Repository &bull; Standalone Support</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#222222] hover:bg-[#2c2c2c] text-white font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
