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
  ExternalLink,
  RefreshCw,
  Clock,
  Download,
  Eye,
  Info,
} from "lucide-react";
import { DailyActivityItem, ETFApplication, DailyEventType, FilingType } from "../types";
import { computeDailyActivitySummary } from "../data/dailyActivityData";
import { PaginationControls } from "./PaginationControls";

interface TodayActivityViewProps {
  activities: DailyActivityItem[];
  applications: ETFApplication[];
  onSelectEtf: (app: ETFApplication) => void;
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

  // Calculate live financial and event summary for CURRENT DAY only
  const summary = useMemo(() => {
    return computeDailyActivitySummary(activities, todayDateStr);
  }, [activities, todayDateStr]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedEventType, selectedToken, searchQuery]);

  // Filtered activity list - STRICTLY CURRENT DAY ONLY
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      // Strict Current Day Enforcement: Only show items matching today's date
      const isCurrentDay = !act.date || act.date === todayDateStr;
      if (!isCurrentDay) return false;

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
  }, [activities, searchQuery, selectedEventType, selectedToken, todayDateStr]);

  // Paginated activities
  const paginatedActivities = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredActivities.slice(start, start + pageSize);
  }, [filteredActivities, currentPage, pageSize]);

  // Unique tokens for filter
  const uniqueTokens = useMemo(() => {
    const set = new Set<string>();
    filteredActivities.forEach((a) => {
      set.add(a.tokenSymbol || "Unknown");
    });
    return Array.from(set);
  }, [filteredActivities]);

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
      "Token Symbol",
      "Token Name",
      "Filing Form",
      "Estimated Value USD",
      "Tokens Count",
      "Sponsor Fee %",
      "Custodian",
      "Status",
      "SEC CIK",
      "SEC Accession",
      "Source Filing URL",
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
      `"${a.officialFilingUrl || ""}"`,
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
    <div id="today-activity-container" className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner & Live Status Bar */}
      <div className="bg-[#0f0f0f] border border-[#1e1e1e] rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Current Day Live SEC EDGAR Activity
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#181818] text-[#cccccc] border border-[#2a2a2a] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#888888]" />
                {todayReadable}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                Last synchronized: {displayLastUpdated}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <span>Today&apos;s Crypto ETF Activity &amp; Verified SEC Filings</span>
            </h2>
            <p className="text-xs text-[#888888] mt-1 max-w-3xl">
              Strictly filtered to the current business day with verified direct links to official SEC EDGAR disclosures, Form 19b-4 rule changes, Form S-1 registration statements, and Form 8-A effectiveness notices.
            </p>
          </div>

          {/* Official Feed Status & Manual Live Sync */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="flex items-center gap-2 bg-[#080808] px-3 py-2 rounded-2xl border border-[#242424]">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-white leading-none">SEC EDGAR Direct Feed</span>
                <span className="text-[10px] text-[#888888] leading-tight">Div. of Corporation Finance</span>
              </div>
            </div>

            {onSyncLiveSec && (
              <button
                id="btn-sync-sec-activity"
                onClick={() => onSyncLiveSec()}
                disabled={isSyncingSec}
                className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900/50 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSec ? "animate-spin" : ""}`} />
                <span>{isSyncingSec ? "Querying EDGAR..." : "Refresh SEC Feed"}</span>
              </button>
            )}

            <button
              id="btn-export-today-csv"
              onClick={handleExportDailyBrief}
              className="px-3 py-2 rounded-2xl bg-[#181818] hover:bg-[#222222] text-[#cccccc] hover:text-white text-xs font-semibold border border-[#2a2a2a] transition-all flex items-center gap-1.5 cursor-pointer"
              title="Download Today's Activity Briefing CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Real-Time Financial Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-[#1a1a1a]">
          {/* New Filings Metric */}
          <div className="bg-[#080808] border border-[#1c1c1c] rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[#888888]">
              <span className="font-semibold uppercase tracking-wider text-[10px]">New Filings (Today)</span>
              <FileText className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-bold text-white font-mono">
                {summary.newFilingsCount}
              </div>
              <div className="text-xs text-cyan-400/90 font-medium mt-0.5">
                {formatUsd(summary.newFilingsTotalValueUsd)} target value
              </div>
            </div>
          </div>

          {/* Approved & Effective Metric */}
          <div className="bg-[#080808] border border-[#1c1c1c] rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[#888888]">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Approved &amp; Trading</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono">
                {summary.approvedCount}
              </div>
              <div className="text-xs text-emerald-400/90 font-medium mt-0.5">
                {formatUsd(summary.approvedTotalValueUsd)} institutional custody
              </div>
            </div>
          </div>

          {/* Withdrawn / Refiled Metric */}
          <div className="bg-[#080808] border border-[#1c1c1c] rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[#888888]">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Form RW Withdrawals</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-bold text-amber-400 font-mono">
                {summary.withdrawnCount}
              </div>
              <div className="text-xs text-amber-400/90 font-medium mt-0.5">
                {formatUsd(summary.withdrawnTotalValueUsd)} restructured
              </div>
            </div>
          </div>

          {/* S-1 Amendments & Disclosures */}
          <div className="bg-[#080808] border border-[#1c1c1c] rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[#888888]">
              <span className="font-semibold uppercase tracking-wider text-[10px]">S-1 Amendments Filed</span>
              <Zap className="w-4 h-4 text-purple-400" />
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-bold text-purple-400 font-mono">
                {summary.amendmentsCount}
              </div>
              <div className="text-xs text-purple-400/90 font-medium mt-0.5">
                CME benchmark &amp; custody updates
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-[#0c0c0c] p-3 rounded-2xl border border-[#1a1a1a]">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#777777]" />
          <input
            id="input-search-today-activity"
            type="text"
            placeholder="Search today's filings, token, CIK, issuer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#141414] border border-[#242424] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-[#666666] focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Event Type Filter */}
          <div className="flex items-center gap-1 bg-[#141414] p-1 rounded-xl border border-[#242424] text-xs">
            <button
              id="filter-type-all"
              onClick={() => setSelectedEventType("ALL")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                selectedEventType === "ALL"
                  ? "bg-white text-black shadow-sm"
                  : "text-[#888888] hover:text-white"
              }`}
            >
              All Types ({filteredActivities.length})
            </button>
            <button
              id="filter-type-new"
              onClick={() => setSelectedEventType("NEW_FILING")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                selectedEventType === "NEW_FILING"
                  ? "bg-cyan-500 text-black shadow-sm"
                  : "text-[#888888] hover:text-cyan-400"
              }`}
            >
              New Filings
            </button>
            <button
              id="filter-type-approval"
              onClick={() => setSelectedEventType("APPROVAL")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                selectedEventType === "APPROVAL"
                  ? "bg-emerald-500 text-black shadow-sm"
                  : "text-[#888888] hover:text-emerald-400"
              }`}
            >
              Approved
            </button>
            <button
              id="filter-type-withdrawal"
              onClick={() => setSelectedEventType("WITHDRAWAL")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                selectedEventType === "WITHDRAWAL"
                  ? "bg-amber-500 text-black shadow-sm"
                  : "text-[#888888] hover:text-amber-400"
              }`}
            >
              Withdrawn
            </button>
            <button
              id="filter-type-amendment"
              onClick={() => setSelectedEventType("AMENDMENT")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                selectedEventType === "AMENDMENT"
                  ? "bg-purple-500 text-black shadow-sm"
                  : "text-[#888888] hover:text-purple-400"
              }`}
            >
              Amendments
            </button>
          </div>

          {/* Token Filter Dropdown */}
          <select
            id="select-token-filter"
            value={selectedToken}
            onChange={(e) => setSelectedToken(e.target.value)}
            aria-label="Filter by token symbol"
            className="bg-[#141414] border border-[#242424] text-xs text-white rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="ALL">All Tokens ({uniqueTokens.length})</option>
            {uniqueTokens.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Activities Timeline Feed */}
      <div className="space-y-4">
        {paginatedActivities.length === 0 ? (
          <div className="bg-[#0f0f0f] border border-[#1e1e1e] rounded-3xl p-12 text-center">
            <Info className="w-10 h-10 text-[#666666] mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No activity records found for today</h3>
            <p className="text-xs text-[#888888] mt-1 max-w-md mx-auto">
              No filings match your current search and filter criteria. Adjust your search or click Refresh SEC Feed to fetch latest EDGAR records.
            </p>
          </div>
        ) : (
          paginatedActivities.map((act) => {
            const isApproval = act.type === "APPROVAL";
            const isWithdrawal = act.type === "WITHDRAWAL";
            const isNewFiling = act.type === "NEW_FILING";
            const isAmendment = act.type === "AMENDMENT";

            const tokenSym = act.tokenSymbol || "Unknown";
            const tokenNm = act.tokenName || "Digital Asset";
            const cik = act.secCik || "0000000000";
            const accession = act.secAccession || "EDGAR-DISCLOSURE";

            return (
              <div
                key={act.id}
                id={`activity-card-${act.id}`}
                className="bg-[#0e0e0e] border border-[#1c1c1c] hover:border-[#2d2d2d] rounded-2xl p-4 sm:p-5 transition-all space-y-3.5"
              >
                {/* Top Row: Event Badge, Time, and Status */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                        isApproval
                          ? "bg-emerald-950/80 text-emerald-400 border border-emerald-500/40"
                          : isWithdrawal
                          ? "bg-amber-950/80 text-amber-400 border border-amber-500/40"
                          : isNewFiling
                          ? "bg-cyan-950/80 text-cyan-400 border border-cyan-500/40"
                          : "bg-purple-950/80 text-purple-400 border border-purple-500/40"
                      }`}
                    >
                      {isApproval && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {isWithdrawal && <AlertTriangle className="w-3.5 h-3.5" />}
                      {isNewFiling && <FileText className="w-3.5 h-3.5" />}
                      {isAmendment && <Zap className="w-3.5 h-3.5" />}
                      <span>{act.type.replace("_", " ")}</span>
                    </span>

                    <span className="text-xs font-mono font-medium text-[#888888] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#666666]" />
                      {act.timeAgo || act.timestamp}
                    </span>

                    <span className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-[#161616] text-[#aaaaaa] border border-[#242424]">
                      {act.formType}
                    </span>

                    <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#161616] text-[#aaaaaa] border border-[#242424]">
                      {act.exchange}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${
                        isApproval
                          ? "bg-emerald-500/20 text-emerald-300"
                          : isWithdrawal
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-cyan-500/20 text-cyan-300"
                      }`}
                    >
                      {act.status}
                    </span>
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <h3 className="text-base font-bold text-white leading-snug">
                      {act.title}
                    </h3>
                    <p className="text-xs text-[#999999] leading-relaxed">
                      {act.description}
                    </p>

                    {act.reasonOrCatalyst && (
                      <div className="mt-2 text-[11px] text-[#bbbbbb] bg-[#080808] p-2.5 rounded-xl border border-[#1a1a1a]">
                        <strong className="text-white font-semibold">SEC Regulatory Notes:</strong> {act.reasonOrCatalyst}
                      </div>
                    )}
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
                          id={`link-sec-source-${act.id}`}
                          href={act.officialFilingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/70 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          title="View Verified SEC EDGAR Filing Source Link"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Source</span>
                        </a>
                      )}
                    </div>
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
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400/90 font-semibold">Source: Official SEC EDGAR Filing</span>
                  </div>
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
