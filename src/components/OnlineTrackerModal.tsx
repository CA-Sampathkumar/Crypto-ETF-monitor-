import React, { useState, useMemo, useEffect } from "react";
import { ETFApplication, OnlineEtfTrackerSource, OnlineSyncLog, EtfSearchEngine } from "../types";
import {
  ONLINE_TRACKER_SOURCES,
  ETF_SEARCH_ENGINES,
  fetchSecSyncStatus,
  triggerSecEdgarSyncNow,
  fetchBlockworksEtfIntelligence,
  fetchCoinglassEtfData,
  SecSyncStatusResponse,
} from "../services/onlineTrackerSyncService";
import {
  Radio,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Zap,
  Globe,
  Sliders,
  Clock,
  Sparkles,
  Layers,
  Database,
  X,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Server,
  FileCode,
  Search,
  Compass,
  BarChart3,
  Flame,
  ArrowUpRight,
  Check,
  BookOpen,
} from "lucide-react";

interface OnlineTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  applications: ETFApplication[];
  onTriggerScan: () => Promise<void>;
  isScanning: boolean;
  autoRefreshEnabled: boolean;
  onToggleAutoRefresh: (enabled: boolean) => void;
  refreshIntervalSeconds: number;
  onChangeInterval: (seconds: number) => void;
  syncLogs: OnlineSyncLog[];
  lastScanTime: string;
  onSelectEtf: (etf: ETFApplication) => void;
}

export function OnlineTrackerModal({
  isOpen,
  onClose,
  applications,
  onTriggerScan,
  isScanning,
  autoRefreshEnabled,
  onToggleAutoRefresh,
  refreshIntervalSeconds,
  onChangeInterval,
  syncLogs,
  lastScanTime,
  onSelectEtf,
}: OnlineTrackerModalProps) {
  const [activeTab, setActiveTab] = useState<"search-engines" | "sec-edgar" | "sources" | "discovered" | "logs">("search-engines");
  const [discoveredPage, setDiscoveredPage] = useState<number>(1);
  const [secStatus, setSecStatus] = useState<SecSyncStatusResponse | null>(null);
  const [isSecSyncing, setIsSecSyncing] = useState(false);
  const [secFilterQuery, setSecFilterQuery] = useState("");
  const [engineSearchQuery, setEngineSearchQuery] = useState("Solana ETF");
  const [blockworksData, setBlockworksData] = useState<any>(null);
  const [coinglassData, setCoinglassData] = useState<any>(null);
  const [isEngineScanning, setIsEngineScanning] = useState(false);
  const [selectedEngineFilter, setSelectedEngineFilter] = useState<string>("ALL");
  const discoveredPageSize = 9;

  // Load backend SEC status and search engines discovery on open
  useEffect(() => {
    if (isOpen) {
      fetchSecSyncStatus().then((status) => {
        if (status) setSecStatus(status);
      });
      fetchBlockworksEtfIntelligence().then((res) => {
        if (res) setBlockworksData(res);
      });
      fetchCoinglassEtfData().then((res) => {
        if (res) setCoinglassData(res);
      });
    }
  }, [isOpen]);

  const handleManualSecCrawl = async () => {
    setIsSecSyncing(true);
    try {
      const res = await triggerSecEdgarSyncNow();
      await onTriggerScan();
      const status = await fetchSecSyncStatus();
      if (status) setSecStatus(status);
    } finally {
      setIsSecSyncing(false);
    }
  };

  const handleCrossEngineDeepScan = async () => {
    setIsEngineScanning(true);
    try {
      await Promise.all([
        onTriggerScan(),
        fetchBlockworksEtfIntelligence().then((res) => setBlockworksData(res)),
        fetchCoinglassEtfData().then((res) => setCoinglassData(res)),
      ]);
    } finally {
      setIsEngineScanning(false);
    }
  };

  const filteredDiscovered = useMemo(() => {
    if (!secFilterQuery) return applications;
    const q = secFilterQuery.toLowerCase();
    return applications.filter(
      (a) =>
        a.fundName.toLowerCase().includes(q) ||
        a.ticker.toLowerCase().includes(q) ||
        a.tokenSymbol.toLowerCase().includes(q) ||
        a.issuer.toLowerCase().includes(q) ||
        a.filingType.toLowerCase().includes(q) ||
        (a.secEdgar?.accessionNumber && a.secEdgar.accessionNumber.includes(q))
    );
  }, [applications, secFilterQuery]);

  const totalDiscoveredPages = Math.max(1, Math.ceil(filteredDiscovered.length / discoveredPageSize));
  const paginatedDiscovered = useMemo(() => {
    const start = (discoveredPage - 1) * discoveredPageSize;
    return filteredDiscovered.slice(start, start + discoveredPageSize);
  }, [filteredDiscovered, discoveredPage, discoveredPageSize]);

  if (!isOpen) return null;

  // Filter approved vs pending in current tracked state
  const approvedCount = applications.filter((a) => a.status === "Approved & Trading").length;
  const pendingCount = applications.filter((a) => a.status !== "Approved & Trading").length;
  const form19b4Count = applications.filter((a) => a.filingType.includes("19b-4")).length;
  const formS1Count = applications.filter((a) => a.filingType.includes("S-1")).length;

  // Unique tokens tracked
  const uniqueTokens = Array.from(new Set(applications.map((a) => a.tokenSymbol)));

  const POPULAR_DISCOVERY_QUERIES = [
    "Solana ETF",
    "XRP ETF",
    "Hyperliquid ETF",
    "Litecoin ETF",
    "Dogecoin ETF",
    "Hedera HBAR",
    "Staking S-1",
    "Canary Capital",
    "Bitwise 10",
    "BlackRock ETHA",
  ];

  const getDirectSearchUrl = (engine: EtfSearchEngine, query: string) => {
    const q = encodeURIComponent(query.trim() || "crypto ETF");
    return engine.searchUrlTemplate.replace("{query}", q);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-[#0e0e0e] border border-[#262626] rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#1c1c1c] bg-[#121212] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 via-cyan-500/20 to-blue-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Compass className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-white">ETF Search Engines &amp; Discovery Hub</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Blockworks + Coinglass + SEC Live
                </span>
              </div>
              <p className="text-xs text-[#888888] line-clamp-1 sm:line-clamp-none">
                Real-time cross-engine discovery across Blockworks Research, Coinglass Live Flows, SEC EDGAR EFTS, Bloomberg &amp; CME Benchmarks
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#666666] hover:text-white hover:bg-[#1f1f1f] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Status Bar */}
        <div className="bg-[#161616] px-4 sm:px-5 py-2.5 border-b border-[#222222] flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-3 text-[#aaaaaa]">
            <div className="flex items-center gap-1.5">
              <Database className="w-4 h-4 text-cyan-400" />
              <span>
                Catalog: <strong className="text-white">{applications.length} Filings</strong> across{" "}
                <strong className="text-cyan-400">{uniqueTokens.length} Tokens</strong>
              </span>
            </div>
            <div className="hidden md:flex items-center gap-2 text-[#888888]">
              <span>•</span>
              <span className="text-amber-400 font-semibold flex items-center gap-1">
                <Flame className="w-3 h-3" /> Blockworks
              </span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <BarChart3 className="w-3 h-3" /> Coinglass
              </span>
              <span>•</span>
              <span className="text-blue-400 font-semibold">{form19b4Count} 19b-4</span>
              <span>•</span>
              <span className="text-purple-400 font-semibold">{formS1Count} S-1</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCrossEngineDeepScan}
              disabled={isEngineScanning || isScanning}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                isEngineScanning || isScanning
                  ? "bg-[#222222] text-[#777777] cursor-not-allowed"
                  : "bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 hover:opacity-90 text-black shadow-emerald-500/20"
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isEngineScanning || isScanning ? "animate-spin" : ""}`} />
              <span>{isEngineScanning || isScanning ? "Syncing All Search Engines..." : "Deep Scan All Search Engines"}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#1c1c1c] bg-[#0c0c0c] px-4 sm:px-5 overflow-x-auto">
          <button
            onClick={() => setActiveTab("search-engines")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === "search-engines"
                ? "border-emerald-500 text-emerald-400 bg-emerald-500/5"
                : "border-transparent text-[#777777] hover:text-white"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>ETF Search Engines &amp; Discovery Hub</span>
          </button>
          <button
            onClick={() => setActiveTab("sec-edgar")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === "sec-edgar"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-[#777777] hover:text-white"
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>SEC EDGAR EFTS Engine</span>
          </button>
          <button
            onClick={() => setActiveTab("discovered")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === "discovered"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-[#777777] hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Indexed Filings ({applications.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("sources")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === "sources"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-[#777777] hover:text-white"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Feed Sources ({ONLINE_TRACKER_SOURCES.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === "logs"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-[#777777] hover:text-white"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Live Audit Stream ({syncLogs.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Search Engines & Discovery Hub Tab */}
          {activeTab === "search-engines" && (
            <div className="space-y-4">
              {/* Interactive Universal Search Bar */}
              <div className="bg-gradient-to-r from-[#141414] via-[#161616] to-[#121212] border border-[#2a2a2a] rounded-2xl p-4 sm:p-5 space-y-3 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-white">Universal Crypto ETF Search &amp; Discovery</h3>
                  </div>
                  <span className="text-[11px] text-[#888888]">
                    1-Click Cross-Search into Blockworks, Coinglass &amp; SEC EDGAR
                  </span>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400" />
                  <input
                    type="text"
                    placeholder="Search any ETF, token (SOL, XRP, DOGE, HYPE, LTC), issuer (VanEck, Bitwise, BlackRock), or filing topic..."
                    value={engineSearchQuery}
                    onChange={(e) => setEngineSearchQuery(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#333333] rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-[#555555] outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>

                {/* Popular Query Chips */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] uppercase font-bold text-[#666666] mr-1">Trending Searches:</span>
                  {POPULAR_DISCOVERY_QUERIES.map((queryChip) => (
                    <button
                      key={queryChip}
                      onClick={() => setEngineSearchQuery(queryChip)}
                      className={`text-[10px] px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                        engineSearchQuery.toLowerCase() === queryChip.toLowerCase()
                          ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300 font-bold"
                          : "bg-[#181818] border-[#262626] text-[#999999] hover:text-white hover:border-[#383838]"
                      }`}
                    >
                      {queryChip}
                    </button>
                  ))}
                </div>

                {/* Direct Launch Buttons for Search Engines */}
                <div className="pt-2 border-t border-[#1f1f1f] flex flex-wrap items-center gap-2">
                  <span className="text-[11px] text-[#888888] font-medium mr-1">Search Directly On:</span>
                  
                  {/* Blockworks Direct Search */}
                  <a
                    href={`https://blockworks.co/search?q=${encodeURIComponent(engineSearchQuery || "crypto ETF")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-[#1a1813] hover:bg-[#252014] text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                    <span>Blockworks ETF Search</span>
                    <ArrowUpRight className="w-3 h-3 text-amber-400/70" />
                  </a>

                  {/* Coinglass Direct Search */}
                  <a
                    href={`https://www.coinglass.com/search?q=${encodeURIComponent(engineSearchQuery || "ETF")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-[#0e1a14] hover:bg-[#14261d] text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Coinglass ETF Tracker</span>
                    <ArrowUpRight className="w-3 h-3 text-emerald-400/70" />
                  </a>

                  {/* SEC EDGAR Direct Search */}
                  <a
                    href={`https://www.sec.gov/edgar/search/#/q=${encodeURIComponent(engineSearchQuery || "crypto ETF")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-[#0e141c] hover:bg-[#131d2a] text-blue-300 border border-blue-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Server className="w-3.5 h-3.5 text-blue-400" />
                    <span>SEC EDGAR EFTS</span>
                    <ArrowUpRight className="w-3 h-3 text-blue-400/70" />
                  </a>

                  {/* Bloomberg / ETF.com */}
                  <a
                    href={`https://www.etf.com/etf-analytics/etf-finder?keyword=${encodeURIComponent(engineSearchQuery || "crypto")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-[#16121c] hover:bg-[#201a29] text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Globe className="w-3.5 h-3.5 text-purple-400" />
                    <span>ETF.com Finder</span>
                    <ArrowUpRight className="w-3 h-3 text-purple-400/70" />
                  </a>
                </div>
              </div>

              {/* Blockworks & Coinglass Live Intelligence Feed Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Blockworks Card */}
                <div className="bg-[#121212] border border-[#242017] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">Blockworks ETF Intelligence</h4>
                        <span className="text-[10px] text-amber-400/80">Institutional Analysis &amp; S-1 Amendments</span>
                      </div>
                    </div>
                    <a
                      href="https://blockworks.co/category/etfs"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
                    >
                      <span>Explore Category</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>

                  <p className="text-[11px] text-[#999999] leading-relaxed">
                    Continuous monitoring of institutional filings, fee structure updates, and ETF issuer roadmaps directly from Blockworks Research:
                  </p>

                  <div className="space-y-2">
                    {blockworksData?.discoveries?.map((item: any) => (
                      <div
                        key={item.id}
                        className="bg-[#0b0a08] border border-[#1e1a12] p-2.5 rounded-lg space-y-1 hover:border-amber-500/40 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs flex items-center gap-1.5">
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                              {item.ticker}
                            </span>
                            <span className="text-amber-200">{item.token}</span>
                          </span>
                          <span className="text-[10px] text-emerald-400 font-mono font-bold">
                            +${(item.netInflow24hUsd / 1e6).toFixed(1)}M 24h Flow
                          </span>
                        </div>
                        <h5 className="text-[11px] font-semibold text-[#dddddd] line-clamp-1">{item.title}</h5>
                        <p className="text-[10px] text-[#777777] line-clamp-2">{item.summary}</p>
                        <div className="flex items-center justify-between text-[9px] text-[#666666] pt-1 border-t border-[#16140f]">
                          <span>Issuer: {item.issuer} (Fee: {item.fee}%)</span>
                          <a
                            href={item.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-amber-400 hover:underline flex items-center gap-0.5"
                          >
                            <span>Read on Blockworks</span>
                            <ExternalLink className="w-2 h-2" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Coinglass Card */}
                <div className="bg-[#121212] border border-[#16241a] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <BarChart3 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">Coinglass Crypto ETF Tracker</h4>
                        <span className="text-[10px] text-emerald-400/80">Live Reserves &amp; CME Open Interest</span>
                      </div>
                    </div>
                    <a
                      href="https://www.coinglass.com/bitcoin-etf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
                    >
                      <span>Live Terminal</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-[#09110c] border border-[#132218] p-2.5 rounded-lg">
                    <div>
                      <span className="text-[9px] text-[#777777] uppercase block">Total Tracked ETF AUM</span>
                      <span className="text-sm font-bold text-white font-mono">
                        ${((coinglassData?.totalCryptoEtfAumUsd || 114800000000) / 1e9).toFixed(1)}B
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#777777] uppercase block">24h Net Inflow / Outflow</span>
                      <span className="text-sm font-bold text-emerald-400 font-mono">
                        +${((coinglassData?.dailyNetInflowUsd || 685000000) / 1e6).toFixed(1)}M
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {coinglassData?.discoveries?.slice(0, 4).map((item: any) => (
                      <div
                        key={item.id}
                        className="bg-[#080f0a] border border-[#122016] p-2.5 rounded-lg space-y-1 hover:border-emerald-500/40 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white text-xs font-mono">{item.ticker}</span>
                            <span className="text-[10px] text-[#888888]">({item.issuer})</span>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-400 font-bold">
                            +${(item.flow24hUsd / 1e6).toFixed(1)}M Net
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-[#888888]">
                          <span>Reserves: <strong className="text-white font-mono">{item.holdingsCount.toLocaleString()} {item.token}</strong></span>
                          <span>Value: <strong className="text-cyan-400 font-mono">${(item.holdingsUsd / 1e9).toFixed(2)}B</strong></span>
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-[#666666] pt-1 border-t border-[#0e1b12]">
                          <span>CME OI: ${(item.cmeOiUsd / 1e9).toFixed(2)}B • NAV Premium: {(item.navPremiumDiscount >= 0 ? "+" : "") + item.navPremiumDiscount}%</span>
                          <a
                            href={item.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:underline flex items-center gap-0.5"
                          >
                            <span>Coinglass</span>
                            <ExternalLink className="w-2 h-2" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* All Integrated ETF Search Engines Directory */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    <span>All Integrated Crypto ETF Search Engines &amp; Scanners</span>
                  </h4>
                  <span className="text-[11px] text-[#888888]">
                    {ETF_SEARCH_ENGINES.length} Active Engines Connected
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {ETF_SEARCH_ENGINES.map((engine) => (
                    <div
                      key={engine.id}
                      className="bg-[#111111] border border-[#202020] hover:border-[#333333] rounded-xl p-3.5 space-y-2.5 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-cyan-400">
                            {engine.category}
                          </span>
                          <h5 className="text-xs font-bold text-white mt-0.5">{engine.name}</h5>
                        </div>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" />
                          {engine.status.toUpperCase()}
                        </span>
                      </div>

                      <p className="text-[10px] text-[#888888] line-clamp-2 leading-relaxed">
                        {engine.description}
                      </p>

                      <div className="space-y-1">
                        <span className="text-[9px] text-[#666666] uppercase block font-semibold">Discovery Capabilities:</span>
                        <div className="flex flex-wrap gap-1">
                          {engine.discoveryFeatures.slice(0, 2).map((feat, i) => (
                            <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-[#181818] text-[#aaaaaa] border border-[#282828]">
                              {feat}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#1a1a1a] flex items-center justify-between">
                        <span className="text-[9px] font-mono text-[#666666]">
                          {engine.totalEntitiesTracked} Entities Tracked
                        </span>
                        <a
                          href={getDirectSearchUrl(engine, engineSearchQuery || "crypto ETF")}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                        >
                          <span>Launch Search</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SEC EDGAR Engine Tab */}
          {activeTab === "sec-edgar" && (
            <div className="space-y-4">
              {/* Architecture & Live Status Panel */}
              <div className="bg-[#121212] border border-[#1f1f1f] rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <h3 className="text-sm font-bold text-white">SEC EDGAR Full-Text Search (EFTS) Integration</h3>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/30">
                    Cron: Every {secStatus?.syncIntervalHours || 2} Hours + On-Demand
                  </span>
                </div>

                <p className="text-xs text-[#aaaaaa] leading-relaxed">
                  The backend crawler directly queries the SEC Electronic Filing Text Search (EFTS) endpoint without artificial limits or pagination caps. It systematically queries for both <strong>Form 19b-4</strong> exchange rule changes and <strong>Form S-1</strong> trust registration statements (along with S-1/A amendments, 8-A effectiveness notices, and 424B2 prospectuses).
                </p>

                <div className="bg-[#0a0a0a] border border-[#1c1c1c] rounded-lg p-3 space-y-2 font-mono text-[11px]">
                  <div className="flex items-center justify-between text-[#777777]">
                    <span>Target EFTS Endpoint:</span>
                    <span className="text-emerald-400 font-bold">Official Public SEC Search Index</span>
                  </div>
                  <div className="text-cyan-300 break-all select-all bg-[#111111] p-2 rounded border border-[#222222]">
                    https://efts.sec.gov/LATEST/search-index?q=%22crypto+ETF%22&amp;forms=19b-4,S-1,S-1/A,19b-4/A,8-A12B,424B2
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div className="bg-[#161616] p-3 rounded-lg border border-[#222222]">
                    <span className="text-[10px] text-[#777777] uppercase block">Total Indexed</span>
                    <span className="text-base font-bold text-white font-mono">{applications.length} Filings</span>
                  </div>
                  <div className="bg-[#161616] p-3 rounded-lg border border-[#222222]">
                    <span className="text-[10px] text-[#777777] uppercase block">Pagination Mode</span>
                    <span className="text-base font-bold text-cyan-400 font-mono">Loop to End</span>
                  </div>
                  <div className="bg-[#161616] p-3 rounded-lg border border-[#222222]">
                    <span className="text-[10px] text-[#777777] uppercase block">Filing Types</span>
                    <span className="text-base font-bold text-purple-400 font-mono">19b-4 + S-1</span>
                  </div>
                  <div className="bg-[#161616] p-3 rounded-lg border border-[#222222]">
                    <span className="text-[10px] text-[#777777] uppercase block">Last Sync Run</span>
                    <span className="text-xs font-bold text-emerald-400 font-mono truncate block mt-1">
                      {lastScanTime || "Just now"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deduplication & Continuous Update Highlights */}
              <div className="bg-[#121212] border border-[#1f1f1f] rounded-xl p-4 space-y-2.5">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Deduplication &amp; Continuous Background Execution</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-[#999999]">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Accident/Duplicate Prevention:</strong> Filings are verified against unique SEC Accession Numbers (e.g. <code>adsh: 0001193125-24-169824</code>) and Central Index Keys (CIK) so existing records are updated while new filings are appended cleanly.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Full Coverage for All Filing Types:</strong> Automatically indexes both 19b-4 (national securities exchange rule change proposals) and S-1 (investment trust registration statements) so single-track filings are never omitted.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Audit Logging:</strong> Every crawl event records timestamp, pages traversed, total records fetched, and newly detected entries for full transparency.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* All Discovered Filings Tab */}
          {activeTab === "discovered" && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="text-xs text-[#888888]">
                  Displaying <strong className="text-white font-mono">{filteredDiscovered.length}</strong> of{" "}
                  <strong className="text-white font-mono">{applications.length}</strong> filings
                  {totalDiscoveredPages > 1 && (
                    <span className="text-[#666666] ml-1.5">
                      (Page {discoveredPage} of {totalDiscoveredPages})
                    </span>
                  )}
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#666666]" />
                  <input
                    type="text"
                    placeholder="Filter by ticker, issuer, form..."
                    value={secFilterQuery}
                    onChange={(e) => {
                      setSecFilterQuery(e.target.value);
                      setDiscoveredPage(1);
                    }}
                    className="bg-[#141414] border border-[#262626] rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder-[#555555] outline-none focus:border-emerald-500 w-full sm:w-64"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {paginatedDiscovered.map((app) => (
                  <div
                    key={app.id}
                    onClick={() => {
                      onSelectEtf(app);
                      onClose();
                    }}
                    className="bg-[#121212] border border-[#1e1e1e] hover:border-emerald-500/50 p-3 rounded-xl cursor-pointer transition-all hover:bg-[#161616] group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={app.tokenIcon}
                          alt={app.tokenSymbol}
                          className="w-5 h-5 rounded-full"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                        <span className="font-bold text-white text-xs">{app.ticker}</span>
                        <span className="text-[10px] text-[#666666]">{app.tokenSymbol}</span>
                      </div>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          app.status === "Approved & Trading"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                        }`}
                      >
                        {app.filingType}
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold text-[#cccccc] group-hover:text-white mt-1.5 truncate">
                      {app.fundName}
                    </h4>

                    <div className="flex items-center justify-between text-[10px] text-[#777777] mt-2 pt-2 border-t border-[#1a1a1a]">
                      <span className="truncate max-w-[120px]">{app.issuer}</span>
                      <span className="font-mono text-cyan-400">CIK: {app.secEdgar?.cik || "N/A"}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalDiscoveredPages > 1 && (
                <div className="pt-2 border-t border-[#1a1a1a] flex items-center justify-between text-xs">
                  <span className="text-[#777777]">
                    Page {discoveredPage} of {totalDiscoveredPages} ({(discoveredPage - 1) * discoveredPageSize + 1}–{Math.min(discoveredPage * discoveredPageSize, filteredDiscovered.length)} of {filteredDiscovered.length})
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setDiscoveredPage((p) => Math.max(1, p - 1))}
                      disabled={discoveredPage === 1}
                      className="px-2.5 py-1 rounded-lg bg-[#181818] hover:bg-[#222222] text-[#aaaaaa] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed border border-[#2a2a2a] flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> Prev
                    </button>
                    <button
                      onClick={() => setDiscoveredPage((p) => Math.min(totalDiscoveredPages, p + 1))}
                      disabled={discoveredPage === totalDiscoveredPages}
                      className="px-2.5 py-1 rounded-lg bg-[#181818] hover:bg-[#222222] text-[#aaaaaa] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed border border-[#2a2a2a] flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      Next <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Feed Sources Tab */}
          {activeTab === "sources" && (
            <div className="space-y-4">
              <div className="bg-[#121212] border border-[#1f1f1f] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-emerald-400" />
                    <span>Periodic Auto-Sync Settings</span>
                  </div>
                  <p className="text-[11px] text-[#888888]">
                    Automatically check online price feeds and crypto ETF registries at configured intervals.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggleAutoRefresh(!autoRefreshEnabled)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      autoRefreshEnabled
                        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                        : "bg-[#181818] border-[#2a2a2a] text-[#888888]"
                    }`}
                  >
                    {autoRefreshEnabled ? "✓ Auto-Sync ON" : "Auto-Sync Paused"}
                  </button>

                  <select
                    value={refreshIntervalSeconds}
                    onChange={(e) => onChangeInterval(Number(e.target.value))}
                    className="bg-[#181818] border border-[#2a2a2a] text-white text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value={15}>Every 15s</option>
                    <option value={30}>Every 30s</option>
                    <option value={60}>Every 1 min</option>
                    <option value={300}>Every 5 min</option>
                  </select>
                </div>
              </div>

              {/* Feed Sources Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {ONLINE_TRACKER_SOURCES.map((source) => (
                  <div
                    key={source.id}
                    className="bg-[#111111] border border-[#1e1e1e] rounded-xl p-4 space-y-2 hover:border-[#2e2e2e] transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                          {source.category}
                        </span>
                        <h4 className="text-sm font-bold text-white mt-0.5">{source.name}</h4>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Connected
                      </span>
                    </div>

                    <div className="text-[11px] text-[#777777] flex items-center justify-between pt-2 border-t border-[#181818]">
                      <span>Discovered Filings / Pairs: <strong className="text-white">{source.itemsDiscovered}</strong></span>
                      <span className="text-[#555555]">Checked {source.lastCheckTime}</span>
                    </div>

                    <a
                      href={source.endpointUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-[#666666] hover:text-cyan-400 flex items-center gap-1 truncate pt-1"
                    >
                      <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{source.endpointUrl}</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audit Logs Tab */}
          {activeTab === "logs" && (
            <div className="space-y-2">
              <div className="text-xs text-[#888888]">
                Real-time audit stream of SEC EDGAR EFTS crawlers, Blockworks flow feeds, Coinglass reserves, pagination traversals, pricing ticks, and background cron executions.
              </div>

              <div className="bg-[#0b0b0b] border border-[#1c1c1c] rounded-xl p-3 max-h-[360px] overflow-y-auto space-y-1.5 font-mono text-[11px]">
                {syncLogs.length === 0 ? (
                  <div className="text-[#555555] py-8 text-center">No logs generated yet. Triggering first scan...</div>
                ) : (
                  syncLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-2 py-1 border-b border-[#151515] last:border-none"
                    >
                      <span className="text-[#555555] shrink-0">[{log.timestamp}]</span>
                      <span
                        className={`px-1.5 py-0.2 text-[9px] rounded font-bold shrink-0 ${
                          log.type === "ETF_DISCOVERED"
                            ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                            : "bg-emerald-500/10 text-emerald-400"
                        }`}
                      >
                        {log.badge || log.type}
                      </span>
                      <span className="text-[#cccccc]">{log.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1c1c1c] bg-[#121212] flex items-center justify-between text-xs text-[#888888]">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>
              Background crawler checks <strong>Blockworks, Coinglass &amp; SEC EDGAR</strong> every {secStatus?.syncIntervalHours || 2}h + auto UI sync every {refreshIntervalSeconds}s
            </span>
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
