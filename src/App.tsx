import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "./components/Navbar";
import { KpiStats } from "./components/KpiStats";
import { TodayActivityView } from "./components/TodayActivityView";
import { EtfTable } from "./components/EtfTable";
import { PortfolioHoldingsView } from "./components/PortfolioHoldingsView";
import { TimelineDeadlinesView } from "./components/TimelineDeadlinesView";
import { IssuersLeaderboardView } from "./components/IssuersLeaderboardView";
import { TradingChartsView } from "./components/TradingChartsView";
import { NewsFeedView } from "./components/NewsFeedView";
import { ApplicationProcessChartMap } from "./components/ApplicationProcessChartMap";
import { AiFilingAnalyst } from "./components/AiFilingAnalyst";
import { EtfDetailModal } from "./components/EtfDetailModal";
import { OnlineTrackerModal } from "./components/OnlineTrackerModal";
import { ApkDownloadModal } from "./components/ApkDownloadModal";
import { INITIAL_ETF_APPLICATIONS } from "./data/etfData";
import { INITIAL_TODAY_ACTIVITIES, generateInitialNotifications } from "./data/dailyActivityData";
import { notificationAudio } from "./services/notificationAudioService";
import { fetchLiveCryptoPrices } from "./services/marketApi";
import { syncNewsAndFilings } from "./services/newsSyncService";
import { performOnlineTrackerScan } from "./services/onlineTrackerSyncService";
import { fetchLiveSecEdgarActivities } from "./services/secLiveActivityService";
import { ETFApplication, OnlineSyncLog, DailyActivityItem, AppNotification } from "./types";
import { Download, FileSpreadsheet, Sparkles, ExternalLink, ShieldCheck, BellRing, BarChart3, Newspaper, Zap, CheckCircle2, X, Radio, RefreshCw, CalendarCheck2 } from "lucide-react";

export default function App() {
  const [applications, setApplications] = useState<ETFApplication[]>(() => {
    const saved = localStorage.getItem("crypto_etf_applications");
    if (saved) {
      try {
        const parsed: ETFApplication[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((a) => a.id));
          const missingDefaults = INITIAL_ETF_APPLICATIONS.filter((a) => !existingIds.has(a.id));
          return [...parsed, ...missingDefaults];
        }
      } catch (e) {
        console.error("Failed to load saved ETF data", e);
      }
    }
    return INITIAL_ETF_APPLICATIONS;
  });

  // Daily Activity State - Initialized from verified SEC records and sanitized
  const [activities, setActivities] = useState<DailyActivityItem[]>(() => {
    const saved = localStorage.getItem("crypto_etf_daily_activities");
    if (saved) {
      try {
        const parsed: DailyActivityItem[] = JSON.parse(saved);
        const nonSimulated = parsed.filter(
          (a) => !a.id.includes("act-sim") && !a.id.includes("sim-") && !a.id.includes("dummy")
        );
        if (Array.isArray(nonSimulated) && nonSimulated.length > 0) {
          return nonSimulated;
        }
      } catch (e) {
        console.error("Failed to load daily activities", e);
      }
    }
    return INITIAL_TODAY_ACTIVITIES;
  });

  // Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem("crypto_etf_notifications");
    if (saved) {
      try {
        const parsed: AppNotification[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to load notifications", e);
      }
    }
    return generateInitialNotifications(INITIAL_TODAY_ACTIVITIES);
  });

  const [activeTab, setActiveTab] = useState<string>("today");
  const [selectedEtf, setSelectedEtf] = useState<ETFApplication | null>(null);
  const [targetAiEtf, setTargetAiEtf] = useState<ETFApplication | null>(null);
  const [isOnlineTrackerModalOpen, setIsOnlineTrackerModalOpen] = useState(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isScanningNews, setIsScanningNews] = useState(false);
  const [isSyncingSec, setIsSyncingSec] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [refreshIntervalSeconds, setRefreshIntervalSeconds] = useState<number>(30);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>("");
  const [lastScanLog, setLastScanLog] = useState<string>("Online Tracker Engine: 60+ crypto ETFs synchronized across SEC EDGAR, CoinGecko & Binance");
  const [newFilingsAlert, setNewFilingsAlert] = useState<{ count: number; tickers: string[] } | null>(null);
  const [syncLogs, setSyncLogs] = useState<OnlineSyncLog[]>([
    {
      id: "init-log",
      timestamp: new Date().toLocaleTimeString(),
      type: "SYSTEM_INIT",
      message: `System initialized with ${INITIAL_ETF_APPLICATIONS.length} verified crypto ETFs. Online monitoring active.`,
      badge: "Registry Ready",
    },
  ]);

  // Persist activities & notifications
  useEffect(() => {
    localStorage.setItem("crypto_etf_daily_activities", JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem("crypto_etf_notifications", JSON.stringify(notifications));
  }, [notifications]);

  // Real-time SEC EDGAR Live Sync Handler (Free EFTS API - Zero API Keys)
  const handleSyncSecLive = useCallback(async () => {
    setIsSyncingSec(true);
    try {
      const result = await fetchLiveSecEdgarActivities();
      if (result.success && result.activities.length > 0) {
        setActivities(result.activities);
        setLastUpdatedTime(result.lastUpdated);
        console.log(`[SEC Live Activity Sync Success]: ${result.activities.length} verified filings synchronized from ${result.source}`);
      }
    } catch (err) {
      console.error("[SEC Live Activity Sync Failed]:", err);
    } finally {
      setIsSyncingSec(false);
    }
  }, []);

  // Initial load sync
  useEffect(() => {
    handleSyncSecLive();
  }, [handleSyncSecLive]);

  // Starred Watchlist State with LocalStorage Persistence
  const [watchlistIds, setWatchlistIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem("crypto_etf_watchlist");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return new Set(parsed);
        }
      } catch (e) {
        console.error("Failed to load watchlist", e);
      }
    }
    // Pre-populate with top notable active applications
    return new Set([
      "vaneck-solana-trust",
      "bitwise-xrp-etf",
      "canary-litecoin-etf",
      "grayscale-hyperliquid-staking-etf",
    ]);
  });

  const toggleWatchlist = useCallback((id: string) => {
    setWatchlistIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      localStorage.setItem("crypto_etf_watchlist", JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  // Save applications to localStorage
  useEffect(() => {
    localStorage.setItem("crypto_etf_applications", JSON.stringify(applications));
  }, [applications]);

  // Notification action handlers
  const handleMarkNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  // Find ETF by Ticker
  const handleSelectEtfByTicker = (ticker: string) => {
    const found = applications.find(
      (a) => a.ticker.toUpperCase() === ticker.toUpperCase() || a.tokenSymbol.toUpperCase() === ticker.toUpperCase()
    );
    if (found) {
      setSelectedEtf(found);
    } else {
      setActiveTab("filings");
    }
  };

  // Unified Live Price & SEC EDGAR Filing Discovery Sync Engine
  const syncLivePricesAndNews = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Perform online tracker scan including SEC EDGAR EFTS backend filings and live price feeds
      const scanResult = await performOnlineTrackerScan(applications);
      setApplications(scanResult.updatedApplications);
      setSyncLogs((prev) => [scanResult.log, ...prev.slice(0, 49)]);

      if (scanResult.newlyAddedCount > 0) {
        setNewFilingsAlert({
          count: scanResult.newlyAddedCount,
          tickers: scanResult.newTickersAdded,
        });
        setLastScanLog(`✨ SEC EDGAR EFTS discovered & added ${scanResult.newlyAddedCount} new filing(s): ${scanResult.newTickersAdded.join(", ")}`);

        // Trigger notification and chime
        const notif: AppNotification = {
          id: `notif-scan-${Date.now()}`,
          timestamp: new Date().toISOString(),
          timeAgo: "Just now",
          category: "FILING",
          title: `🆕 SEC EDGAR Discovery: ${scanResult.newlyAddedCount} New Spot ETF(s) Found`,
          message: `Discovered and synchronized ${scanResult.newTickersAdded.join(", ")} into live database.`,
          isRead: false,
          priority: "HIGH",
          relatedTicker: scanResult.newTickersAdded[0],
        };
        setNotifications((prev) => [notif, ...prev]);
        notificationAudio.playChime("FILING");
      } else {
        setLastScanLog(`✅ All ${scanResult.updatedApplications.length} spot ETF applications & SEC EDGAR disclosures are fully synchronized.`);
      }

      setLastUpdatedTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch (err) {
      console.warn("Failed to sync live data:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [applications]);

  // Initial load sync
  useEffect(() => {
    syncLivePricesAndNews();
  }, []);

  // Recurring 30s auto-refresh timer
  useEffect(() => {
    if (!autoRefreshEnabled) return;
    const interval = setInterval(() => {
      syncLivePricesAndNews();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefreshEnabled, syncLivePricesAndNews]);

  // Explicit News Scan Action
  const handleManualScanNews = async () => {
    setIsScanningNews(true);
    try {
      const result = await syncNewsAndFilings(applications);
      if (result.newFilingsAdded.length > 0) {
        setApplications((prev) => {
          const existingIds = new Set(prev.map((a) => a.id));
          const toAdd = result.newFilingsAdded.filter((a) => !existingIds.has(a.id));
          return [...toAdd, ...prev];
        });
        setNewFilingsAlert({
          count: result.newFilingsAdded.length,
          tickers: result.newFilingsAdded.map((a) => a.ticker),
        });
        setLastScanLog(`⚡ Found ${result.newFilingsAdded.length} new filing(s) in news: ${result.newFilingsAdded.map(a => a.ticker).join(", ")}`);
        notificationAudio.playChime("NEWS");
      } else {
        setLastScanLog(`✅ All ${applications.length} spot ETF applications in news feed are up-to-date in database.`);
      }
    } finally {
      setIsScanningNews(false);
    }
  };

  const handleTriggerOnlineTrackerScan = async () => {
    setIsRefreshing(true);
    try {
      const scanResult = await performOnlineTrackerScan(applications);
      setApplications(scanResult.updatedApplications);
      setSyncLogs((prev) => [scanResult.log, ...prev.slice(0, 49)]);
      setLastUpdatedTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));

      if (scanResult.newlyAddedCount > 0) {
        setNewFilingsAlert({
          count: scanResult.newlyAddedCount,
          tickers: scanResult.newTickersAdded,
        });
        setLastScanLog(`✨ Online scanner discovered & added ${scanResult.newlyAddedCount} new verified crypto ETF(s): ${scanResult.newTickersAdded.join(", ")}`);
      } else {
        setLastScanLog(`✅ All ${scanResult.updatedApplications.length} crypto ETFs synchronized with Binance & CoinGecko public feeds.`);
      }
    } catch (e) {
      console.warn("Online tracker scan error:", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSelectEtf = (app: ETFApplication) => {
    setSelectedEtf(app);
  };

  const handleAnalyzeAi = (app: ETFApplication) => {
    setTargetAiEtf(app);
    setActiveTab("ai-analyst");
  };

  const handleAddApplication = (newApp: ETFApplication) => {
    setApplications((prev) => [newApp, ...prev]);
    // Also create activity item and notification
    const newAct: DailyActivityItem = {
      id: `act-manual-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      date: new Date().toISOString().split("T")[0],
      timeAgo: "Just now",
      type: newApp.status === "Approved & Trading" ? "APPROVAL" : "NEW_FILING",
      title: `${newApp.issuer} Registered ${newApp.fundName} (${newApp.ticker})`,
      description: `Form ${newApp.filingType} filed on ${newApp.exchange} backed by ${newApp.custodian.name}.`,
      fundName: newApp.fundName,
      ticker: newApp.ticker,
      issuer: newApp.issuer,
      tokenSymbol: newApp.tokenSymbol,
      tokenName: newApp.tokenName,
      formType: newApp.filingType,
      exchange: newApp.exchange,
      estimatedValueUsd: newApp.portfolioValueUsd,
      tokensCount: newApp.tokensHeld,
      sponsorFeePercentage: newApp.sponsorFeePercentage,
      custodian: newApp.custodian.name,
      secCik: newApp.secEdgar.cik,
      secAccession: newApp.secEdgar.accessionNumber,
      officialFilingUrl: newApp.secEdgar.officialUrl,
      impactLevel: "HIGH",
      status: newApp.status,
      etfApplicationId: newApp.id,
    };
    setActivities((prev) => [newAct, ...prev]);

    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      timeAgo: "Just now",
      category: newApp.status === "Approved & Trading" ? "APPROVAL" : "FILING",
      title: `Added Filing: ${newApp.fundName} (${newApp.ticker})`,
      message: `Initial portfolio worth: $${(newApp.portfolioValueUsd / 1e6).toFixed(1)}M USD with ${newApp.custodian.name}.`,
      isRead: false,
      priority: "HIGH",
      relatedTicker: newApp.ticker,
      relatedToken: newApp.tokenSymbol,
      valueUsd: newApp.portfolioValueUsd,
      etfId: newApp.id,
    };
    setNotifications((prev) => [notif, ...prev]);
    notificationAudio.playChime(newApp.status === "Approved & Trading" ? "APPROVAL" : "FILING");
  };

  // Export to CSV
  const handleExportCsv = () => {
    const headers = [
      "Token Symbol",
      "Token Name",
      "Fund Name",
      "Ticker",
      "Issuer",
      "Exchange",
      "Status",
      "Tokens Held in Custody",
      "Portfolio Value USD",
      "Sponsor Fee %",
      "Custodian",
      "Filing Date",
      "Final 240d Deadline",
      "Days Remaining",
      "Approval Probability %",
      "SEC EDGAR CIK",
      "SEC Accession Number",
    ];

    const rows = applications.map((a) => [
      a.tokenSymbol,
      `"${a.tokenName}"`,
      `"${a.fundName}"`,
      a.ticker,
      `"${a.issuer}"`,
      a.exchange,
      `"${a.status}"`,
      a.tokensHeld,
      a.portfolioValueUsd,
      a.sponsorFeePercentage,
      `"${a.custodian.name}"`,
      a.statutoryDeadlines.filingDate,
      a.statutoryDeadlines.finalDeadline240d,
      a.statutoryDeadlines.daysRemaining,
      a.approvalProbabilityPercentage,
      a.secEdgar.cik,
      a.secEdgar.accessionNumber,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `crypto_etf_official_filings_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#080808] text-[#e0e0e0] font-sans antialiased selection:bg-neutral-800 selection:text-white">
      {/* Navigation Header */}
      <Navbar
        applications={applications}
        onRefreshPrices={syncLivePricesAndNews}
        isRefreshing={isRefreshing}
        onOpenOnlineTrackerModal={() => setIsOnlineTrackerModalOpen(true)}
        onOpenApkModal={() => setIsApkModalOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSelectEtf={handleSelectEtf}
        autoRefreshEnabled={autoRefreshEnabled}
        onToggleAutoRefresh={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
        lastUpdatedTime={lastUpdatedTime}
        notifications={notifications}
        onMarkNotificationAsRead={handleMarkNotificationAsRead}
        onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
        onClearAllNotifications={handleClearAllNotifications}
        onSelectEtfByTicker={handleSelectEtfByTicker}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Dynamic New Filings Discovery Alert Banner */}
        {newFilingsAlert && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-emerald-900/40 to-[#0f0f0f] border border-emerald-500/40 text-emerald-200 shadow-xl flex items-center justify-between gap-4 animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                <Zap className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Live News Filing Auto-Discovery
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    +{newFilingsAlert.count} New Application{newFilingsAlert.count > 1 ? "s" : ""} Added
                  </span>
                </div>
                <p className="text-xs text-white/90 mt-0.5">
                  Detected new spot ETF registration news and automatically synchronized filings to database:{" "}
                  <strong>{newFilingsAlert.tickers.join(", ")}</strong> with live spot pricing and SEC EDGAR accessions.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveTab("today");
                  setNewFilingsAlert(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                View Today&apos;s Activity
              </button>
              <button
                onClick={() => setNewFilingsAlert(null)}
                className="p-1.5 text-emerald-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* KPI Stat Cards */}
        <KpiStats applications={applications} />

        {/* Today's Activity Dedicated Tab */}
        {activeTab === "today" && (
          <TodayActivityView
            activities={activities}
            applications={applications}
            onSelectEtf={handleSelectEtf}
            onAnalyzeAi={handleAnalyzeAi}
            onAddApplicationDirectly={handleAddApplication}
            onSelectEtfByTicker={handleSelectEtfByTicker}
            onSyncLiveSec={handleSyncSecLive}
            isSyncingSec={isSyncingSec}
            lastUpdatedTimestamp={lastUpdatedTime}
          />
        )}

        {/* View Switcher Container */}
        {activeTab === "filings" && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Master Crypto ETF Applications & Statutory Filings
                </h2>
                <p className="text-xs text-[#888888]">
                  Official SEC Form S-1 / 19b-4 submissions, tokens held in segregated qualified custody, and statutory deadlines.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="btn-export-csv"
                  onClick={handleExportCsv}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#111111] hover:bg-[#181818] text-[#cccccc] hover:text-white text-xs font-medium border border-[#222222] transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            <EtfTable
              applications={applications}
              onSelectEtf={handleSelectEtf}
              onAnalyzeAi={handleAnalyzeAi}
              watchlistIds={watchlistIds}
              onToggleWatchlist={toggleWatchlist}
            />
          </div>
        )}

        {activeTab === "charts" && (
          <TradingChartsView
            applications={applications}
          />
        )}

        {activeTab === "process-map" && (
          <ApplicationProcessChartMap
            applications={applications}
            onSelectEtf={handleSelectEtf}
          />
        )}

        {activeTab === "news" && (
          <NewsFeedView
            applications={applications}
            onSelectEtf={handleSelectEtf}
            onManualScanNews={handleManualScanNews}
            isScanningNews={isScanningNews}
            lastScanLog={lastScanLog}
            onAddApplicationDirectly={handleAddApplication}
          />
        )}

        {activeTab === "holdings" && (
          <PortfolioHoldingsView
            applications={applications}
            onSelectEtf={handleSelectEtf}
          />
        )}

        {activeTab === "timeline" && (
          <TimelineDeadlinesView
            applications={applications}
            onSelectEtf={handleSelectEtf}
            onAnalyzeAi={handleAnalyzeAi}
          />
        )}

        {activeTab === "issuers" && (
          <IssuersLeaderboardView
            applications={applications}
            onSelectEtf={handleSelectEtf}
          />
        )}

        {activeTab === "ai-analyst" && (
          <AiFilingAnalyst
            applications={applications}
            selectedApplication={targetAiEtf}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#181818] bg-[#0a0a0a]/90 py-6 mt-12 text-xs text-[#666666]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-[#888888]">Crypto ETF Official SEC EDGAR Filing Intelligence & Portfolio Reserve Tracker</span>
          </div>
          <div className="flex items-center gap-4 text-[#777777]">
            <a
              href="https://www.sec.gov/edgar/searchedgar/companysearch"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#cccccc] flex items-center gap-1 transition-colors"
            >
              SEC EDGAR Search <ExternalLink className="w-3 h-3" />
            </a>
            <span>&bull;</span>
            <span>Commodity Trust Exchange Act &bull; Rule 19b-4 &bull; Form S-1</span>
          </div>
        </div>
      </footer>

      {/* ETF Deep-Dive Modal */}
      {selectedEtf && (
        <EtfDetailModal
          application={selectedEtf}
          onClose={() => setSelectedEtf(null)}
          onAnalyzeAi={handleAnalyzeAi}
          isStarred={watchlistIds.has(selectedEtf.id)}
          onToggleWatchlist={toggleWatchlist}
        />
      )}

      {/* Online ETF Trackers & Live Multi-Source Sync Modal */}
      {isOnlineTrackerModalOpen && (
        <OnlineTrackerModal
          isOpen={isOnlineTrackerModalOpen}
          onClose={() => setIsOnlineTrackerModalOpen(false)}
          applications={applications}
          onTriggerScan={handleTriggerOnlineTrackerScan}
          isScanning={isRefreshing}
          autoRefreshEnabled={autoRefreshEnabled}
          onToggleAutoRefresh={(enabled) => setAutoRefreshEnabled(enabled)}
          refreshIntervalSeconds={refreshIntervalSeconds}
          onChangeInterval={(sec) => setRefreshIntervalSeconds(sec)}
          syncLogs={syncLogs}
          lastScanTime={lastUpdatedTime}
          onSelectEtf={handleSelectEtf}
        />
      )}

      {/* Mobile App & APK Download Center Modal */}
      {isApkModalOpen && (
        <ApkDownloadModal
          isOpen={isApkModalOpen}
          onClose={() => setIsApkModalOpen(false)}
          applications={applications}
        />
      )}
    </div>
  );
}


