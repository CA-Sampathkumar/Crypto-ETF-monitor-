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
  Coins,
} from "lucide-react";
import { ETFApplication, AppNotification } from "../types";
import { NotificationCenter } from "./NotificationCenter";

interface NavbarProps {
  applications: ETFApplication[];
  onRefreshPrices: () => void;
  isRefreshing: boolean;
  onOpenOnlineTrackerModal?: () => void;
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
      <div className="bg-[#060606] border-b border-[#161616] px-3 sm:px-4 py-1.5 text-xs text-[#888888] flex items-center justify-between overflow-x-auto no-scrollbar scrollbar-none">
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <div className="flex items-center gap-1.5 font-medium text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${autoRefreshEnabled ? "bg-emerald-400 opacity-75" : "bg-neutral-500 opacity-25"}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${autoRefreshEnabled ? "bg-emerald-500" : "bg-neutral-600"}`}></span>
            </span>
            <span className="whitespace-nowrap">SEC EDGAR &amp; Live Market Stream {autoRefreshEnabled ? "Active" : "Paused"}</span>
          </div>
          {lastUpdatedTime && (
            <span className="text-[11px] text-[#666666] hidden md:inline font-mono whitespace-nowrap">
              Synced {lastUpdatedTime}
            </span>
          )}
          <span className="hidden sm:inline text-[#333333]">|</span>
          <button
            onClick={() => setActiveTab("today")}
            className="flex items-center gap-1 text-emerald-400 hover:underline font-semibold cursor-pointer whitespace-nowrap"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Today&apos;s Activity</span>
          </button>
          <span className="hidden sm:inline text-[#333333]">|</span>
          <span className="flex items-center gap-1 text-amber-400 font-medium whitespace-nowrap">
            <BellRing className="w-3.5 h-3.5" />
            <span>{imminentCount} Imminent Deadlines</span>
          </span>
        </div>

        <div className="flex items-center gap-3 text-[#777777] shrink-0 pl-3">
          <span className="hidden lg:inline text-[11px] whitespace-nowrap">
            Live Feeds: SEC EDGAR &bull; CoinGecko &bull; Spot Orderbooks &bull; CME CF Benchmarks
          </span>
        </div>
      </div>

      {/* Main Navigation Bar - Optimized for Mobile, Tablet (iPad portrait/landscape), and Desktop */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 flex flex-col gap-3">
        {/* Brand & Action Tools Row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 cursor-pointer" onClick={() => setActiveTab("today")}>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-neutral-800 via-neutral-900 to-black border border-[#2a2a2a] flex items-center justify-center shadow-lg text-white font-bold shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  Crypto ETF Official Filings Tracker
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                  SEC EDGAR &amp; Market Live
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[#888888] hidden md:block">
                Institutional Token Holdings &bull; Trading Charts &bull; Live News Wire &bull; Statutory Deadlines
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Real-time Notification Bell Center */}
            <NotificationCenter
              notifications={notifications}
              onMarkAsRead={onMarkNotificationAsRead || (() => {})}
              onMarkAllAsRead={onMarkAllNotificationsAsRead || (() => {})}
              onClearAll={onClearAllNotifications || (() => {})}
              onSelectEtfByTicker={onSelectEtfByTicker}
              onNavigateToTab={setActiveTab}
            />

            {onOpenOnlineTrackerModal && (
              <button
                onClick={onOpenOnlineTrackerModal}
                id="btn-online-trackers"
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition-all shadow-sm shadow-emerald-500/10 cursor-pointer whitespace-nowrap"
              >
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="hidden md:inline">Online Multi-Feeds</span>
                <span className="md:hidden">Feeds</span>
              </button>
            )}

            {onToggleAutoRefresh && (
              <button
                onClick={onToggleAutoRefresh}
                title={autoRefreshEnabled ? "Disable Auto Price & Filing Sync" : "Enable Auto Price & Filing Sync"}
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
                  autoRefreshEnabled
                    ? "bg-neutral-900 text-neutral-300 border-neutral-700 hover:bg-neutral-800"
                    : "bg-[#141414] text-[#888888] border-[#242424] hover:text-white"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${autoRefreshEnabled ? "bg-emerald-400" : "bg-neutral-600"}`} />
                <span className="hidden lg:inline">{autoRefreshEnabled ? "Auto 30s" : "Paused"}</span>
              </button>
            )}

            <button
              id="btn-refresh-prices"
              onClick={onRefreshPrices}
              disabled={isRefreshing}
              title="Refresh Live Token Prices & Portfolio Values"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#121212] hover:bg-[#1a1a1a] text-[#cccccc] hover:text-white text-xs font-medium border border-[#242424] transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#aaaaaa] ${isRefreshing ? "animate-spin text-purple-400" : ""}`} />
              <span className="hidden sm:inline">Sync Live</span>
            </button>
          </div>
        </div>

        {/* Responsive Navigation Tabs Bar - Tablet & Mobile Scrollable */}
        <nav aria-label="Main Navigation" className="w-full overflow-x-auto no-scrollbar scrollbar-none pb-0.5">
          <div className="flex items-center gap-1 p-1 bg-[#060606] rounded-xl border border-[#1e1e1e] w-max min-w-full">
            {/* 1. Today's Activity Dedicated Tab */}
            <button
              id="tab-today"
              onClick={() => setActiveTab("today")}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
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

            {/* 2. Tokens Price Monitor CoinMarketCap/CoinGecko Style Tab (Positioned next to Today's Activity) */}
            <button
              id="tab-price-monitor"
              onClick={() => setActiveTab("price-monitor")}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "price-monitor"
                  ? "bg-emerald-950/90 text-emerald-200 border border-emerald-500/50 shadow-md font-bold"
                  : "text-emerald-400 hover:text-emerald-200 hover:bg-emerald-950/40"
              }`}
            >
              <Coins className="w-3.5 h-3.5 text-emerald-400" />
              <span>Price Monitor</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-emerald-500 text-black">
                CMC &bull; SPOT
              </span>
            </button>

            {/* 3. Filing Directory */}
            <button
              id="tab-filings"
              onClick={() => setActiveTab("filings")}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "filings"
                  ? "bg-[#1c1c1c] text-white shadow-sm font-semibold border border-[#333333]"
                  : "text-[#888888] hover:text-[#e0e0e0] hover:bg-[#141414]"
              }`}
            >
              Filing Directory
            </button>

            {/* 4. Trading Charts */}
            <button
              id="tab-charts"
              onClick={() => setActiveTab("charts")}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "charts"
                  ? "bg-[#1c1c1c] text-white shadow-sm font-semibold border border-[#333333]"
                  : "text-[#888888] hover:text-[#e0e0e0] hover:bg-[#141414]"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-purple-400" />
              <span>Trading Charts</span>
            </button>

            {/* 5. Custody & Lock */}
            <button
              id="tab-custody-lock"
              onClick={() => setActiveTab("custody-lock")}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
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
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
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
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
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
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
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
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
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
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
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
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
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
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "issuers"
                  ? "bg-[#1c1c1c] text-white shadow-sm font-semibold border border-[#333333]"
                  : "text-[#888888] hover:text-[#e0e0e0] hover:bg-[#141414]"
              }`}
            >
              Issuers
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
};

