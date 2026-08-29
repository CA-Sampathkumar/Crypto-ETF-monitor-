import React from "react";
import {
  ShieldCheck,
  RefreshCw,
  FileSpreadsheet,
  PlusCircle,
  BellRing,
  BarChart3,
  Newspaper,
  Radio,
  Activity,
  Smartphone,
  CalendarCheck2,
  Zap,
} from "lucide-react";
import { ETFApplication, AppNotification } from "../types";
import { NotificationCenter } from "./NotificationCenter";

interface NavbarProps {
  applications: ETFApplication[];
  onRefreshPrices: () => void;
  isRefreshing: boolean;
  onOpenOnlineTrackerModal?: () => void;
  onOpenApkModal?: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSelectEtf: (app: ETFApplication) => void;
  autoRefreshEnabled?: boolean;
  onToggleAutoRefresh?: () => void;
  lastUpdatedTime?: string;
  notifications?: AppNotification[];
  onMarkNotificationAsRead?: (id: string) => void;
  onMarkAllNotificationsAsRead?: () => void;
  onClearAllNotifications?: () => void;
  onSelectEtfByTicker?: (ticker: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  applications,
  onRefreshPrices,
  isRefreshing,
  onOpenOnlineTrackerModal,
  onOpenApkModal,
  activeTab,
  setActiveTab,
  autoRefreshEnabled = true,
  onToggleAutoRefresh,
  lastUpdatedTime,
  notifications = [],
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
  onClearAllNotifications,
  onSelectEtfByTicker,
}) => {
  const pendingCount = applications.filter((a) => a.status !== "Approved & Trading").length;
  const imminentCount = applications.filter((a) => a.statutoryDeadlines.daysRemaining <= 30 && a.status !== "Approved & Trading").length;
  const unreadNotifCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="sticky top-0 z-40 bg-[#0c0c0c]/90 backdrop-blur-md border-b border-[#1c1c1c] text-[#e0e0e0] transition-all">
      {/* Top Banner / Live Ticker Strip */}
      <div className="bg-[#060606] border-b border-[#161616] px-4 py-1.5 text-xs text-[#888888] flex items-center justify-between overflow-x-auto">
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-1.5 font-medium text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${autoRefreshEnabled ? "bg-emerald-400 opacity-75" : "bg-neutral-500 opacity-25"}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${autoRefreshEnabled ? "bg-emerald-500" : "bg-neutral-600"}`}></span>
            </span>
            <span>SEC EDGAR &amp; Live Price Stream {autoRefreshEnabled ? "Active" : "Paused"}</span>
          </div>
          {lastUpdatedTime && (
            <span className="text-[11px] text-[#666666] hidden sm:inline font-mono">
              Synced {lastUpdatedTime}
            </span>
          )}
          <span className="hidden sm:inline text-[#333333]">|</span>
          <button
            onClick={() => setActiveTab("today")}
            className="flex items-center gap-1 text-emerald-400 hover:underline font-semibold cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Today&apos;s Activity Live</span>
          </button>
          <span className="hidden sm:inline text-[#333333]">|</span>
          <span className="text-[#cccccc]">
            <strong className="text-white font-semibold">{pendingCount}</strong> Active Spot Filings
          </span>
          <span className="hidden sm:inline text-[#333333]">|</span>
          <span className="flex items-center gap-1 text-amber-400 font-medium">
            <BellRing className="w-3.5 h-3.5" />
            <span>{imminentCount} Imminent Deadlines (&le; 30 Days)</span>
          </span>
        </div>

        <div className="flex items-center gap-3 text-[#777777] shrink-0 pl-4">
          <span className="hidden md:inline text-[11px]">
            Live Feeds: SEC EDGAR &bull; CoinGecko &bull; CME CF Benchmarks &bull; Bloomberg ETF
          </span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Brand & Title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab("today")}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neutral-800 via-neutral-900 to-black border border-[#2a2a2a] flex items-center justify-center shadow-lg text-white font-bold">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  Crypto ETF Official Filings Tracker
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  SEC EDGAR &amp; Market Live
                </span>
              </div>
              <p className="text-xs text-[#888888]">
                Institutional Token Holdings &bull; Trading Charts &bull; Live News Wire &bull; Statutory 240d Deadlines
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-[#060606] rounded-xl border border-[#1e1e1e]">
          {/* Today's Activity Dedicated Tab */}
          <button
            id="tab-today"
            onClick={() => setActiveTab("today")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "today"
                ? "bg-emerald-950/80 text-emerald-200 border border-emerald-500/40 shadow-sm font-semibold"
                : "text-emerald-400 hover:text-emerald-200 hover:bg-emerald-950/30"
            }`}
          >
            <CalendarCheck2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Today&apos;s Activity</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-emerald-500 text-black">
              LIVE
            </span>
          </button>

          <button
            id="tab-filings"
            onClick={() => setActiveTab("filings")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "filings"
                ? "bg-[#1c1c1c] text-white shadow-sm font-semibold border border-[#333333]"
                : "text-[#888888] hover:text-[#e0e0e0] hover:bg-[#141414]"
            }`}
          >
            Filing Directory
          </button>

          <button
            id="tab-charts"
            onClick={() => setActiveTab("charts")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "charts"
                ? "bg-[#1c1c1c] text-white shadow-sm font-semibold border border-[#333333]"
                : "text-[#888888] hover:text-[#e0e0e0] hover:bg-[#141414]"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-purple-400" />
            <span>Trading Charts</span>
          </button>

          <button
            id="tab-custody-lock"
            onClick={() => setActiveTab("custody-lock")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === "custody-lock"
                ? "bg-purple-950/80 text-purple-200 border border-purple-500/40 shadow-sm font-semibold"
                : "text-[#888888] hover:text-[#e0e0e0] hover:bg-[#141414]"
            }`}
          >
            <span>Custody &amp; Lock</span>
          </button>

          <button
            id="tab-tokens-map"
            onClick={() => setActiveTab("tokens-map")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === "tokens-map"
                ? "bg-cyan-950/80 text-cyan-200 border border-cyan-500/40 shadow-sm font-semibold"
                : "text-[#888888] hover:text-[#e0e0e0] hover:bg-[#141414]"
            }`}
          >
            <span>Tokens Map Chart</span>
          </button>

          <button
            id="tab-issuer-wallets"
            onClick={() => setActiveTab("issuer-wallets")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === "issuer-wallets"
                ? "bg-amber-950/80 text-amber-200 border border-amber-500/40 shadow-sm font-semibold"
                : "text-[#888888] hover:text-[#e0e0e0] hover:bg-[#141414]"
            }`}
          >
            <span>Issuer Wallets</span>
          </button>

          <button
            id="tab-process-map"
            onClick={() => setActiveTab("process-map")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "process-map"
                ? "bg-[#1c1c1c] text-white shadow-sm font-semibold border border-[#333333]"
                : "text-[#888888] hover:text-[#e0e0e0] hover:bg-[#141414]"
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Process Map</span>
          </button>

          <button
            id="tab-news"
            onClick={() => setActiveTab("news")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "news"
                ? "bg-[#1c1c1c] text-white shadow-sm font-semibold border border-[#333333]"
                : "text-[#888888] hover:text-[#e0e0e0] hover:bg-[#141414]"
            }`}
          >
            <Newspaper className="w-3.5 h-3.5 text-red-400" />
            <span>News &amp; Wire</span>
          </button>

          <button
            id="tab-holdings"
            onClick={() => setActiveTab("holdings")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "holdings"
                ? "bg-[#1c1c1c] text-white shadow-sm font-semibold border border-[#333333]"
                : "text-[#888888] hover:text-[#e0e0e0] hover:bg-[#141414]"
            }`}
          >
            Reserves
          </button>

          <button
            id="tab-timeline"
            onClick={() => setActiveTab("timeline")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "timeline"
                ? "bg-[#1c1c1c] text-white shadow-sm font-semibold border border-[#333333]"
                : "text-[#888888] hover:text-[#e0e0e0] hover:bg-[#141414]"
            }`}
          >
            Deadlines
          </button>

          <button
            id="tab-issuers"
            onClick={() => setActiveTab("issuers")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "issuers"
                ? "bg-[#1c1c1c] text-white shadow-sm font-semibold border border-[#333333]"
                : "text-[#888888] hover:text-[#e0e0e0] hover:bg-[#141414]"
            }`}
          >
            Issuers
          </button>
        </div>

        {/* Actions (Notifications, Refresh, Auto-Sync toggle, Online Tracker Modal, Download App/APK) */}
        <div className="flex items-center gap-2">
          {/* Real-time Notification Bell Center */}
          <NotificationCenter
            notifications={notifications}
            onMarkAsRead={onMarkNotificationAsRead || (() => {})}
            onMarkAllAsRead={onMarkAllNotificationsAsRead || (() => {})}
            onClearAll={onClearAllNotifications || (() => {})}
            onSelectEtfByTicker={onSelectEtfByTicker}
            onNavigateToTab={setActiveTab}
          />

          {onOpenApkModal && (
            <button
              onClick={onOpenApkModal}
              id="btn-download-apk"
              title="Download Android APK & Mobile App Package"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 text-xs font-semibold border border-cyan-500/30 transition-all shadow-sm shadow-cyan-500/10 cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Mobile (APK)</span>
              <span className="sm:hidden">APK</span>
            </button>
          )}

          {onOpenOnlineTrackerModal && (
            <button
              onClick={onOpenOnlineTrackerModal}
              id="btn-online-trackers"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition-all shadow-sm shadow-emerald-500/10 cursor-pointer"
            >
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Online Feeds ({applications.length})</span>
            </button>
          )}

          {onToggleAutoRefresh && (
            <button
              onClick={onToggleAutoRefresh}
              title={autoRefreshEnabled ? "Disable Auto Price & Filing Sync" : "Enable Auto Price & Filing Sync"}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                autoRefreshEnabled
                  ? "bg-neutral-900 text-neutral-300 border-neutral-700 hover:bg-neutral-800"
                  : "bg-[#141414] text-[#888888] border-[#242424] hover:text-white"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${autoRefreshEnabled ? "bg-emerald-400" : "bg-neutral-600"}`} />
              <span className="hidden xl:inline">{autoRefreshEnabled ? "Auto 30s" : "Paused"}</span>
            </button>
          )}

          <button
            id="btn-refresh-prices"
            onClick={onRefreshPrices}
            disabled={isRefreshing}
            title="Refresh Live Token Prices & Portfolio Values"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#121212] hover:bg-[#1a1a1a] text-[#cccccc] hover:text-white text-xs font-medium border border-[#242424] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#aaaaaa] ${isRefreshing ? "animate-spin text-purple-400" : ""}`} />
            <span className="hidden sm:inline">Sync Live</span>
          </button>
        </div>
      </div>
    </header>
  );
};

