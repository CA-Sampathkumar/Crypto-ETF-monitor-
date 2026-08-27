import React, { useState, useMemo, useEffect } from "react";
import {
  Calendar,
  Zap,
  CheckCircle2,
  AlertTriangle,
  FileText,
  DollarSign,
  TrendingUp,
  Building2,
  ShieldCheck,
  Search,
  ArrowUpRight,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Clock,
  Coins,
  Radio,
  FileSpreadsheet,
  Download,
  Landmark,
  Eye,
  Info,
  Activity,
  Layers,
  HelpCircle,
} from "lucide-react";
import { DailyActivityItem, ETFApplication, DailyEventType, FilingType } from "../types";
import { computeDailyActivitySummary } from "../data/dailyActivityData";
import { PaginationControls } from "./PaginationControls";

interface TodayActivityViewProps {
  activities: DailyActivityItem[];
  applications: ETFApplication[];
  onSelectEtf: (app: ETFApplication) => void;
  onAnalyzeAi?: (app: ETFApplication) => void;
  onAddApplicationDirectly?: (app: ETFApplication) => void;
  onSelectEtfByTicker?: (ticker: string) => void;
  onSyncLiveSec?: () => Promise<void> | void;
  isSyncingSec?: boolean;
  lastUpdatedTimestamp?: string;
}

export const TodayActivityView: React.FC<TodayActivityViewProps> = ({
  activities,
  applications,
  onSelectEtf,
  onAnalyzeAi,
  onAddApplicationDirectly,
  onSelectEtfByTicker,
  onSyncLiveSec,
  isSyncingSec = false,
  lastUpdatedTimestamp,
}) => {
  const [selectedEventType, setSelectedEventType] = useState<string>("ALL");
  const [selectedToken, setSelectedToken] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [showNetworkImpactGuide, setShowNetworkImpactGuide] = useState<boolean>(false);

  // Today's Date String
  const todayDateStr = new Date().toISOString().split("T")[0];
  const todayReadable = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const displayLastUpdated =
    lastUpdatedTimestamp ||
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  // Calculate live financial and event summary
  const summary = useMemo(() => {
    return computeDailyActivitySummary(activities, todayDateStr);
  }, [activities, todayDateStr]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedEventType, selectedToken, searchQuery]);

  // Filtered activity list
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      const q = searchQuery.toLowerCase().trim();
      const tokenSym = (act.tokenSymbol || "Unknown").toLowerCase();
      const tokenNm = (act.tokenName || "Unknown").toLowerCase();
      const tick = (act.ticker || "Unknown").toLowerCase();
      const fund = (act.fundName || "").toLowerCase();
      const iss = (act.issuer || "").toLowerCase();
      const cik = (act.secCik || "").toLowerCase();
      const adsh = (act.secAccession || "").toLowerCase();

      const matchesSearch =
        !q ||
        fund.includes(q) ||
        tick.includes(q) ||
        iss.includes(q) ||
        tokenSym.includes(q) ||
        tokenNm.includes(q) ||
        cik.includes(q) ||
        adsh.includes(q) ||
        act.title.toLowerCase().includes(q) ||
        act.description.toLowerCase().includes(q) ||
        (act.custodian && act.custodian.toLowerCase().includes(q));

      const matchesType =
        selectedEventType === "ALL" ||
        (selectedEventType === "NEW_FILING" && act.type === "NEW_FILING") ||
        (selectedEventType === "APPROVAL" && act.type === "APPROVAL") ||
        (selectedEventType === "WITHDRAWAL" && act.type === "WITHDRAWAL") ||
        (selectedEventType === "AMENDMENT" && act.type === "AMENDMENT");

      const actToken = act.tokenSymbol || "Unknown";
      const matchesToken =
        selectedToken === "ALL" || actToken.toUpperCase() === selectedToken.toUpperCase();

      return matchesSearch && matchesType && matchesToken;
    });
  }, [activities, searchQuery, selectedEventType, selectedToken]);

  // Paginated activities
  const paginatedActivities = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredActivities.slice(start, start + pageSize);
  }, [filteredActivities, currentPage, pageSize]);

  // Unique tokens for filter
  const uniqueTokens = useMemo(() => {
    const set = new Set<string>();
    activities.forEach((a) => {
      set.add(a.tokenSymbol || "Unknown");
    });
    return Array.from(set);
  }, [activities]);

  const formatUsd = (amount: number): string => {
    if (!amount || isNaN(amount)) return "$0";
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(2)}B`;
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`;
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(0)}K`;
    return `$${amount.toLocaleString()}`;
  };

  // Find linked application if exists
  const handleInspectFiling = (act: DailyActivityItem) => {
    const matched =
      applications.find((a) => a.id === act.etfApplicationId || a.ticker === act.ticker) ||
      applications.find((a) => a.tokenSymbol === act.tokenSymbol && a.issuer === act.issuer);

    if (matched) {
      onSelectEtf(matched);
    } else if (onSelectEtfByTicker && act.ticker && act.ticker !== "Unknown") {
      onSelectEtfByTicker(act.ticker);
    }
  };

  const handleExportDailyBrief = () => {
    const headers = [
      "Event Date",
      "Event Type",
      "Fund Name",
      "Ticker",
      "Issuer",
      "Affected Token Symbol",
      "Affected Token Name",
      "Filing Form",
      "Estimated Value USD",
      "Tokens Count",
      "Sponsor Fee %",
      "Custodian",
      "Status",
      "SEC CIK",
      "SEC Accession",
      "Relative Network Impact Rating",
      "Impact Estimate Label",
      "Reason / Catalyst",
    ];

    const rows = filteredActivities.map((a) => [
      a.date,
      a.type,
      `"${a.fundName}"`,
      a.ticker || "Unknown",
      `"${a.issuer}"`,
      a.tokenSymbol || "Unknown",
      a.tokenName || "Unknown",
      a.formType,
      a.estimatedValueUsd,
      a.tokensCount || 0,
      a.sponsorFeePercentage || 0,
      `"${a.custodian || "Qualified Custodian"}"`,
      `"${a.status}"`,
      a.secCik || "Unknown",
      a.secAccession || "Unknown",
      a.tokenNetworkImpact?.relativeImpactRating || "NEUTRAL",
      `"${a.tokenNetworkImpact?.impactLabel || "Estimated Market Impact (Non-Guaranteed)"}"`,
      `"${a.reasonOrCatalyst || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `crypto_etf_today_activity_${todayDateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner & Live Status Bar */}
      <div className="bg-[#0f0f0f] border border-[#1e1e1e] rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live SEC EDGAR Business Day Activity
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#181818] text-[#cccccc] border border-[#2a2a2a] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#888888]" />
                {todayReadable}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                Last updated: {displayLastUpdated}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <span>Today&apos;s Crypto ETF Activity &amp; Live SEC Disclosures</span>
            </h2>
            <p className="text-xs text-[#888888] mt-1 max-w-3xl">
              100% verified real-time stream querying official SEC EDGAR EFTS endpoints with no mock data. Tracks live Form S-1 applications, Form 19b-4 rule changes, Form 8-A approvals, and Form RW sponsor withdrawals with per-token network impact estimates.
            </p>
          </div>

          {/* Official Feed Status & Manual Live Sync */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="flex items-center gap-2 bg-[#080808] px-3 py-2 rounded-2xl border border-[#242424]">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-white leading-none">SEC EDGAR Repository Feed</span>
                <span className="text-[10px] text-[#888888] leading-tight">Div. of Corporation Finance &amp; Markets</span>
              </div>
            </div>

            {onSyncLiveSec && (
              <button
                onClick={() => onSyncLiveSec()}
                disabled={isSyncingSec}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                title="Trigger real-time query to SEC EDGAR full-text search index and log raw response to console"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSec ? "animate-spin" : ""}`} />
                <span>{isSyncingSec ? "Syncing SEC..." : "Sync Live SEC EDGAR"}</span>
              </button>
            )}

            <button
              onClick={handleExportDailyBrief}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#141414] hover:bg-[#1f1f1f] text-[#cccccc] hover:text-white text-xs font-medium border border-[#262626] transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Network Impact Notice Banner */}
      <div className="bg-[#0b1219] border border-cyan-500/25 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-cyan-200">
        <div className="flex items-center gap-2.5">
          <Activity className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            <strong>Network Impact Engine:</strong> Computes real-time liquidity and capitalization impact per underlying token using live market feeds. All relative impact indicators are labeled as <em>Estimated Market Impact (Non-Guaranteed)</em>.
          </span>
        </div>
        <button
          onClick={() => setShowNetworkImpactGuide(!showNetworkImpactGuide)}
          className="text-cyan-400 hover:text-cyan-300 font-semibold underline shrink-0 cursor-pointer flex items-center gap-1"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{showNetworkImpactGuide ? "Hide Guide" : "How is Impact Calculated?"}</span>
        </button>
      </div>

      {showNetworkImpactGuide && (
        <div className="bg-[#0e0e0e] border border-[#222222] rounded-2xl p-4 text-xs space-y-2 animate-in fade-in duration-200">
          <h4 className="font-bold text-white flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>Per-Token Network Impact Calculation Methodology</span>
          </h4>
          <p className="text-[#aaaaaa]">
            For every crypto ETF filing submitted to the SEC, our engine maps the underlying asset (e.g. BTC, ETH, SOL, XRP, LTC, SUI, HBAR, LINK, APT) and computes a relative market impact estimate based on:
          </p>
          <ul className="list-disc pl-5 text-[#999999] space-y-1">
            <li><strong>Live Asset Price &amp; 24h Delta:</strong> Retrieved directly from public spot market data feeds (Binance / CoinGecko).</li>
            <li><strong>Circulating Market Cap:</strong> Compares filing seed / AUM value against the asset&apos;s free-float market capitalization.</li>
            <li><strong>Relative Velocity Rating:</strong> High Impact (Tier 1 commodities or high free-float absorption), Medium Impact (moderate liquidity absorption), Low/Neutral Impact (preliminary or non-specified asset trusts).</li>
            <li><strong>Raw SEC Verification:</strong> If a token or ticker cannot be parsed from the SEC filing header, it is labeled as <span className="font-mono text-amber-300 font-bold">&quot;Unknown&quot;</span> and the raw JSON response is logged directly in the browser console for auditability.</li>
          </ul>
        </div>
      )}

      {/* Valuation KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Net Asset Worth Delta */}
        <div className="bg-[#0f0f0f] border border-[#1e1e1e] rounded-2xl p-4.5 hover:border-[#2a2a2a] transition-colors flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#888888]">Net Value Impact Today</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-white font-mono tracking-tight">
              {formatUsd(summary.netMarketValueDeltaUsd)}
            </div>
            <div className="text-[11px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
              <span>+ Net institutional flow across verified filings</span>
            </div>
          </div>
        </div>

        {/* 2. Applications Approved Today */}
        <div className="bg-[#0f0f0f] border border-emerald-500/30 rounded-2xl p-4.5 bg-gradient-to-br from-emerald-950/20 to-transparent transition-colors flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-emerald-300">Approved &amp; Effective Orders</span>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
              {formatUsd(summary.approvedTotalValueUsd)}
            </div>
            <div className="text-[11px] text-[#cccccc] mt-1 flex items-center justify-between">
              <span>
                <strong className="text-white">{summary.approvedCount}</strong> Fund{summary.approvedCount !== 1 ? "s" : ""} Granted SEC Orders
              </span>
              <span className="font-mono text-[10px] text-emerald-400">Live Spot</span>
            </div>
          </div>
        </div>

        {/* 3. New Applications Filed Today */}
        <div className="bg-[#0f0f0f] border border-cyan-500/30 rounded-2xl p-4.5 bg-gradient-to-br from-cyan-950/20 to-transparent transition-colors flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-cyan-300">New SEC Registrations</span>
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-cyan-400 font-mono tracking-tight">
              {formatUsd(summary.newFilingsTotalValueUsd)}
            </div>
            <div className="text-[11px] text-[#cccccc] mt-1 flex items-center justify-between">
              <span>
                <strong className="text-white">{summary.newFilingsCount}</strong> Registration Statement{summary.newFilingsCount !== 1 ? "s" : ""}
              </span>
              <span className="font-mono text-[10px] text-cyan-400">Form S-1 / 19b-4</span>
            </div>
          </div>
        </div>

        {/* 4. Withdrawals & Restructurings Today */}
        <div className="bg-[#0f0f0f] border border-amber-500/30 rounded-2xl p-4.5 bg-gradient-to-br from-amber-950/20 to-transparent transition-colors flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-amber-300">Form RW Withdrawals</span>
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-amber-400 font-mono tracking-tight">
              {formatUsd(summary.withdrawnTotalValueUsd)}
            </div>
            <div className="text-[11px] text-[#cccccc] mt-1 flex items-center justify-between">
              <span>
                <strong className="text-white">{summary.withdrawnCount}</strong> Form RW Withdrawal{summary.withdrawnCount !== 1 ? "s" : ""}
              </span>
              <span className="font-mono text-[10px] text-amber-400">Sponsor Notice</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#0c0c0c] border border-[#1e1e1e] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]" />
          <input
            type="text"
            placeholder="Search filings by token, ticker, issuer, CIK, Accession..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#141414] border border-[#242424] text-xs text-white rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-emerald-500 placeholder:text-[#666666]"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center bg-[#141414] p-1 rounded-xl border border-[#242424]">
            <button
              onClick={() => setSelectedEventType("ALL")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                selectedEventType === "ALL"
                  ? "bg-[#222222] text-white font-semibold shadow-xs"
                  : "text-[#888888] hover:text-[#cccccc]"
              }`}
            >
              All Events ({activities.length})
            </button>
            <button
              onClick={() => setSelectedEventType("APPROVAL")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                selectedEventType === "APPROVAL"
                  ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 font-semibold"
                  : "text-[#888888] hover:text-emerald-400"
              }`}
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Approved ({summary.approvedCount})
            </button>
            <button
              onClick={() => setSelectedEventType("NEW_FILING")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                selectedEventType === "NEW_FILING"
                  ? "bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 font-semibold"
                  : "text-[#888888] hover:text-cyan-400"
              }`}
            >
              <FileText className="w-3 h-3 text-cyan-400" />
              New Filings ({summary.newFilingsCount})
            </button>
            <button
              onClick={() => setSelectedEventType("WITHDRAWAL")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                selectedEventType === "WITHDRAWAL"
                  ? "bg-amber-950/80 text-amber-300 border border-amber-500/40 font-semibold"
                  : "text-[#888888] hover:text-amber-400"
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              Withdrawals ({summary.withdrawnCount})
            </button>
          </div>

          {/* Token selector */}
          <div className="flex items-center gap-1 bg-[#141414] px-2.5 py-1.5 rounded-xl border border-[#242424]">
            <span className="text-[#888888]">Asset:</span>
            <select
              value={selectedToken}
              onChange={(e) => setSelectedToken(e.target.value)}
              className="bg-transparent text-white focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-[#141414]">All Assets</option>
              {uniqueTokens.map((tok) => (
                <option key={tok} value={tok} className="bg-[#141414]">{tok}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Activity Cards List */}
      <div className="space-y-4">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-12 bg-[#0c0c0c] border border-[#1e1e1e] rounded-2xl text-[#777777]">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#aaaaaa]" />
            <p className="text-sm font-medium">No activity items match the specified filters</p>
            <p className="text-xs mt-1 text-[#555555]">Try resetting your filter or search query</p>
          </div>
        ) : (
          paginatedActivities.map((act) => {
            const isApproval = act.type === "APPROVAL";
            const isFiling = act.type === "NEW_FILING";
            const isWithdrawal = act.type === "WITHDRAWAL";
            const isAmendment = act.type === "AMENDMENT";

            const tokenSym = act.tokenSymbol || "Unknown";
            const tokenNm = act.tokenName || "Unknown";
            const ticker = act.ticker || "Unknown";
            const cik = act.secCik || "Unknown";
            const accession = act.secAccession || "Unknown";
            const impact = act.tokenNetworkImpact;

            return (
              <div
                key={act.id}
                className={`bg-[#0f0f0f] border rounded-2xl p-5 hover:border-[#333333] transition-all flex flex-col gap-4 ${
                  isApproval
                    ? "border-emerald-500/30 bg-gradient-to-r from-emerald-950/15 via-[#0f0f0f] to-[#0f0f0f]"
                    : isWithdrawal
                    ? "border-amber-500/30 bg-gradient-to-r from-amber-950/15 via-[#0f0f0f] to-[#0f0f0f]"
                    : isFiling
                    ? "border-cyan-500/30 bg-gradient-to-r from-cyan-950/15 via-[#0f0f0f] to-[#0f0f0f]"
                    : "border-[#1e1e1e]"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Left Info */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border ${
                        isApproval
                          ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                          : isWithdrawal
                          ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                          : isFiling
                          ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-400"
                          : "bg-purple-500/15 border-purple-500/30 text-purple-400"
                      }`}
                    >
                      {tokenSym}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        {/* Event Type Badge */}
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border flex items-center gap-1 ${
                            isApproval
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                              : isWithdrawal
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                              : isFiling
                              ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                              : "bg-purple-500/20 text-purple-300 border-purple-500/40"
                          }`}
                        >
                          {isApproval && <CheckCircle2 className="w-3 h-3" />}
                          {isWithdrawal && <AlertTriangle className="w-3 h-3" />}
                          {isFiling && <FileText className="w-3 h-3" />}
                          {isAmendment && <Zap className="w-3 h-3" />}
                          {isApproval
                            ? "Approved & Effective"
                            : isWithdrawal
                            ? "Filing Withdrawn"
                            : isFiling
                            ? "New S-1 / 19b-4 Filed"
                            : "Amendment / Order"}
                        </span>

                        {/* Form Badge */}
                        <span className="px-2 py-0.5 rounded bg-[#181818] text-[#cccccc] text-[10px] font-mono border border-[#262626]">
                          {act.formType}
                        </span>

                        {/* Ticker Badge */}
                        <span className="px-2 py-0.5 rounded bg-[#181818] text-white text-[10px] font-mono font-bold border border-[#2e2e2e]">
                          Ticker: {ticker}
                        </span>

                        {/* Token Badge */}
                        <span className="px-2 py-0.5 rounded bg-[#181818] text-cyan-300 text-[10px] font-mono border border-[#262626]">
                          Token: {tokenNm} ({tokenSym})
                        </span>

                        <span className="text-[10px] text-[#777777] font-mono ml-auto sm:ml-0">
                          {act.date} &bull; {act.timeAgo}
                        </span>
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
                        {act.title}
                      </h3>

                      <p className="text-xs text-[#999999] mt-1 leading-relaxed">
                        {act.description}
                      </p>

                      {act.reasonOrCatalyst && (
                        <div className="mt-2 text-[11px] text-[#bbbbbb] bg-[#080808] p-2.5 rounded-xl border border-[#1a1a1a]">
                          <strong className="text-white font-semibold">SEC Regulatory Notes:</strong> {act.reasonOrCatalyst}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Worth & Actions Box */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-[#1c1c1c]">
                    <div className="text-left sm:text-right">
                      <div className="text-[10px] uppercase font-bold text-[#888888]">
                        {isApproval ? "Custody Value Approved" : isWithdrawal ? "Value Impacted" : "Estimated Target Value"}
                      </div>
                      <div className="text-base sm:text-lg font-black font-mono text-white">
                        {formatUsd(act.estimatedValueUsd)}
                      </div>
                      {act.tokensCount && act.tokensCount > 0 ? (
                        <div className="text-[11px] font-mono text-emerald-400">
                          {act.tokensCount.toLocaleString()} {tokenSym}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleInspectFiling(act)}
                        className="px-3 py-1.5 rounded-xl bg-[#181818] hover:bg-[#222222] text-[#cccccc] hover:text-white text-xs font-semibold border border-[#2a2a2a] transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>

                      {act.officialFilingUrl && (
                        <a
                          href={act.officialFilingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-xl bg-[#141414] hover:bg-[#1f1f1f] text-[#888888] hover:text-white border border-[#242424] transition-colors"
                          title="View Official SEC EDGAR Filing Document"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Network Impact Per Token Card Area */}
                <div className="bg-[#090909] border border-[#1b1b1b] rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-cyan-950/60 text-cyan-400 border border-cyan-500/30 shrink-0">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">Affected Token: {tokenNm} ({tokenSym})</span>
                        <span
                          className={`px-2 py-0.2 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            impact?.relativeImpactRating === "HIGH"
                              ? "bg-emerald-950/80 text-emerald-400 border border-emerald-500/40"
                              : impact?.relativeImpactRating === "MEDIUM"
                              ? "bg-cyan-950/80 text-cyan-400 border border-cyan-500/40"
                              : "bg-[#181818] text-[#888888] border border-[#2a2a2a]"
                          }`}
                        >
                          {impact?.relativeImpactRating || "ESTIMATED"} Relative Impact
                        </span>
                      </div>
                      <p className="text-[11px] text-[#888888] mt-0.5">
                        {impact?.impactLabel || "Estimated network capitalization and liquidity impact"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-[#1a1a1a]">
                    {impact?.livePriceUsd !== undefined && impact.livePriceUsd > 0 && (
                      <div className="bg-[#121212] px-2.5 py-1 rounded-lg border border-[#222222]">
                        <span className="text-[#777777]">Live Price: </span>
                        <span className="font-mono font-bold text-white">
                          ${impact.livePriceUsd.toLocaleString(undefined, { maximumFractionDigits: impact.livePriceUsd < 1 ? 4 : 2 })}
                        </span>
                        {impact.price24hChange !== undefined && (
                          <span
                            className={`ml-1 font-mono font-bold ${
                              impact.price24hChange >= 0 ? "text-emerald-400" : "text-red-400"
                            }`}
                          >
                            {impact.price24hChange >= 0 ? "+" : ""}{impact.price24hChange}%
                          </span>
                        )}
                      </div>
                    )}

                    {impact?.marketCapUsd !== undefined && impact.marketCapUsd > 0 && (
                      <div className="bg-[#121212] px-2.5 py-1 rounded-lg border border-[#222222]">
                        <span className="text-[#777777]">Est. Market Cap: </span>
                        <span className="font-mono font-bold text-cyan-300">
                          {formatUsd(impact.marketCapUsd)}
                        </span>
                      </div>
                    )}

                    <span className="text-[10px] text-[#666666] italic bg-[#0e0e0e] px-2 py-0.5 rounded border border-[#1e1e1e]">
                      Estimated Market Impact (Non-Guaranteed)
                    </span>
                  </div>
                </div>

                {/* SEC EDGAR Identifiers Footer */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#666666] font-mono border-t border-[#181818] pt-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <span>SEC CIK: <strong className="text-[#aaaaaa]">{cik}</strong></span>
                    <span>&bull;</span>
                    <span>Accession No: <strong className="text-[#aaaaaa]">{accession}</strong></span>
                    <span>&bull;</span>
                    <span>Issuer: <strong className="text-[#aaaaaa]">{act.issuer}</strong></span>
                    <span>&bull;</span>
                    <span>Custodian: <strong className="text-[#aaaaaa]">{act.custodian?.split(" ")[0] || "Qualified Custodian"}</strong></span>
                  </div>
                  <span className="text-emerald-400/80">Source: Official SEC EDGAR EFTS</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Controls */}
      <PaginationControls
        currentPage={currentPage}
        totalItems={filteredActivities.length}
        pageSize={pageSize}
        onPageChange={(page) => setCurrentPage(page)}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
        pageSizeOptions={[10, 20, 50]}
        itemLabel="today's activity records"
      />
    </div>
  );
};
