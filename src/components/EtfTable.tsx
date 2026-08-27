import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Filter,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Shield,
  Clock,
  Sparkles,
  Layers,
  CheckCircle,
  AlertCircle,
  Copy,
  Check,
  Eye,
  SlidersHorizontal,
  Flame,
  ArrowUpDown,
  FileCheck2,
  HelpCircle,
  Scale,
  Building2,
  TrendingUp,
  Info,
  Star,
  BarChart2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ETFApplication, EtfStatus } from "../types";
import { RegulatoryExplainerModal } from "./RegulatoryExplainerModal";
import { PendingPipelineChart } from "./PendingPipelineChart";
import { PaginationControls } from "./PaginationControls";

interface EtfTableProps {
  applications: ETFApplication[];
  onSelectEtf: (app: ETFApplication) => void;
  onAnalyzeAi: (app: ETFApplication) => void;
  watchlistIds?: Set<string>;
  onToggleWatchlist?: (id: string) => void;
}

export const EtfTable: React.FC<EtfTableProps> = ({
  applications,
  onSelectEtf,
  onAnalyzeAi,
  watchlistIds = new Set(),
  onToggleWatchlist,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedToken, setSelectedToken] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedIssuer, setSelectedIssuer] = useState<string>("ALL");
  const [marketFilter, setMarketFilter] = useState<"ALL" | "WATCHLIST" | "LIVE_ETF" | "OTC_TRUST" | "PENDING_SEC" | "STAKING">("ALL");
  const [stakingOnly, setStakingOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"daysRemaining" | "approvalProbability" | "tokensHeld" | "filingDate">("daysRemaining");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExplainerOpen, setIsExplainerOpen] = useState(false);
  const [showPipelineChart, setShowPipelineChart] = useState(true);

  // Pagination state (default 10 per page as requested)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Reset to page 1 whenever any filter, search, or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, marketFilter, selectedToken, selectedStatus, selectedIssuer, stakingOnly, sortBy, sortOrder]);

  // Available unique tokens
  const uniqueTokens = useMemo(() => {
    const set = new Set<string>();
    applications.forEach((a) => set.add(a.tokenSymbol));
    return Array.from(set);
  }, [applications]);

  // Available unique issuers
  const uniqueIssuers = useMemo(() => {
    const set = new Set<string>();
    applications.forEach((a) => set.add(a.issuer));
    return Array.from(set);
  }, [applications]);

  // Counts for market segment tabs
  const marketCounts = useMemo(() => {
    const liveEtfs = applications.filter((a) => a.status === "Approved & Trading" || a.tradingCategory === "Live Spot ETF").length;
    const otcTrusts = applications.filter((a) => a.tradingCategory === "Active OTC Trust" || a.issuer.includes("Grayscale") || a.issuer.includes("Bitwise 10")).length;
    const pendingSec = applications.filter((a) => a.status !== "Approved & Trading").length;
    const staking = applications.filter((a) => a.stakingEnabled).length;
    const watchlist = applications.filter((a) => watchlistIds.has(a.id)).length;
    return {
      all: applications.length,
      watchlist,
      liveEtfs,
      otcTrusts,
      pendingSec,
      staking,
    };
  }, [applications, watchlistIds]);

  const handleCopyAccession = (e: React.MouseEvent, accession: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(accession);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredApplications = useMemo(() => {
    return applications
      .filter((app) => {
        // Search
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          app.fundName.toLowerCase().includes(query) ||
          app.tokenName.toLowerCase().includes(query) ||
          app.tokenSymbol.toLowerCase().includes(query) ||
          app.issuer.toLowerCase().includes(query) ||
          app.ticker.toLowerCase().includes(query) ||
          app.secEdgar.accessionNumber.includes(query) ||
          app.custodian.name.toLowerCase().includes(query);

        // Market Category Filter
        let matchesMarket = true;
        if (marketFilter === "WATCHLIST") {
          matchesMarket = watchlistIds.has(app.id);
        } else if (marketFilter === "LIVE_ETF") {
          matchesMarket = app.status === "Approved & Trading" || app.tradingCategory === "Live Spot ETF";
        } else if (marketFilter === "OTC_TRUST") {
          matchesMarket = app.tradingCategory === "Active OTC Trust" || app.issuer.includes("Grayscale") || app.ticker.startsWith("G") || app.ticker === "BITW";
        } else if (marketFilter === "PENDING_SEC") {
          matchesMarket = app.status !== "Approved & Trading";
        } else if (marketFilter === "STAKING") {
          matchesMarket = app.stakingEnabled;
        }

        // Token filter
        const matchesToken = selectedToken === "ALL" || app.tokenSymbol === selectedToken;

        // Status filter
        const matchesStatus = selectedStatus === "ALL" || app.status === selectedStatus;

        // Issuer filter
        const matchesIssuer = selectedIssuer === "ALL" || app.issuer === selectedIssuer;

        // Staking filter
        const matchesStaking = !stakingOnly || app.stakingEnabled;

        return matchesSearch && matchesMarket && matchesToken && matchesStatus && matchesIssuer && matchesStaking;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === "daysRemaining") {
          diff = a.statutoryDeadlines.daysRemaining - b.statutoryDeadlines.daysRemaining;
        } else if (sortBy === "approvalProbability") {
          diff = b.approvalProbabilityPercentage - a.approvalProbabilityPercentage;
        } else if (sortBy === "tokensHeld") {
          diff = b.portfolioValueUsd - a.portfolioValueUsd;
        } else if (sortBy === "filingDate") {
          diff = new Date(b.statutoryDeadlines.filingDate).getTime() - new Date(a.statutoryDeadlines.filingDate).getTime();
        }
        return sortOrder === "asc" ? diff : -diff;
      });
  }, [applications, searchQuery, marketFilter, selectedToken, selectedStatus, selectedIssuer, stakingOnly, sortBy, sortOrder, watchlistIds]);

  // Pagination Computations (Strict limit: max 10 per page by default)
  const totalPages = Math.max(1, Math.ceil(filteredApplications.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredApplications.length);

  const paginatedApplications = useMemo(() => {
    return filteredApplications.slice(startIndex, startIndex + pageSize);
  }, [filteredApplications, startIndex, pageSize]);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      const tableElem = document.getElementById("etf-master-table-container");
      if (tableElem) {
        tableElem.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const getStatusBadge = (app: ETFApplication) => {
    if (app.status === "Approved & Trading") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <CheckCircle className="w-3 h-3" />
          Live Spot ETF
        </span>
      );
    }
    if (app.tradingCategory === "Active OTC Trust") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
          <Building2 className="w-3 h-3" />
          OTCQX Public Trust
        </span>
      );
    }
    switch (app.status) {
      case "19b-4 Pending Review":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <Clock className="w-3 h-3" />
            19b-4 Review
          </span>
        );
      case "S-1 Registration Filed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <FileCheck2 className="w-3 h-3" />
            S-1 Registration
          </span>
        );
      case "S-1 Amendment Filed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/30">
            <Sparkles className="w-3 h-3" />
            S-1/A Amendment
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#181818] text-[#cccccc] border border-[#2c2c2c]">
            {app.status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Interactive Educational Explainer Banner */}
      <div className="bg-gradient-to-r from-neutral-900 via-[#141414] to-neutral-900 border border-[#2a2a2a] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-xs">
                Why are only 2 tokens (BTC &amp; ETH) approved for Spot ETF trading on US national exchanges?
              </span>
              <span className="hidden sm:inline-block px-2 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                SEC Precedent
              </span>
            </div>
            <p className="text-[11px] text-[#9ca3af] mt-0.5">
              Learn about the CME futures 2-year correlation test, the 2025 S-1/19b-4 altcoin wave, and why over 15 other tokens already trade as OTC Trusts (LINK, BCH, SUI, NEAR, LTC).
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowPipelineChart(!showPipelineChart)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1c1c1c] hover:bg-[#282828] text-white text-xs font-semibold border border-[#333333] transition-colors cursor-pointer"
          >
            <BarChart2 className="w-3.5 h-3.5 text-purple-400" />
            <span>{showPipelineChart ? "Hide Pipeline Chart" : "Show Pipeline Chart"}</span>
            {showPipelineChart ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setIsExplainerOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-colors shadow-sm cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>SEC Analysis</span>
          </button>
        </div>
      </div>

      {/* Interactive Pending Applications & Approval Pipeline Chart */}
      {showPipelineChart && (
        <PendingPipelineChart
          applications={applications}
          onSelectTokenFilter={(tok) => {
            setSelectedToken(tok);
            setMarketFilter("PENDING_SEC");
          }}
          onSelectStatusFilter={(stat) => {
            setSelectedStatus(stat);
          }}
          onSelectEtf={onSelectEtf}
        />
      )}

      {/* Primary Market Filter Tabs Bar */}
      <div className="flex flex-wrap items-center gap-2 bg-[#0c0c0c] border border-[#1e1e1e] p-1.5 rounded-2xl">
        <button
          onClick={() => setMarketFilter("ALL")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            marketFilter === "ALL"
              ? "bg-white text-black shadow-md"
              : "text-[#888888] hover:text-[#cccccc] hover:bg-[#161616]"
          }`}
        >
          <span>All Products</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${marketFilter === "ALL" ? "bg-neutral-200 text-black font-bold" : "bg-[#181818] text-[#777777]"}`}>
            {marketCounts.all}
          </span>
        </button>

        {/* Watchlist Filter Tab */}
        <button
          onClick={() => setMarketFilter("WATCHLIST")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            marketFilter === "WATCHLIST"
              ? "bg-amber-400 text-black shadow-md font-bold"
              : "text-[#888888] hover:text-amber-300 hover:bg-[#161616]"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Star className={`w-3.5 h-3.5 ${marketFilter === "WATCHLIST" ? "fill-black text-black" : "fill-amber-400 text-amber-400"}`} />
            <span>Starred Watchlist</span>
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${marketFilter === "WATCHLIST" ? "bg-black text-amber-300 font-bold" : "bg-[#181818] text-[#777777]"}`}>
            {marketCounts.watchlist}
          </span>
        </button>

        <button
          onClick={() => setMarketFilter("LIVE_ETF")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            marketFilter === "LIVE_ETF"
              ? "bg-emerald-500 text-black shadow-md"
              : "text-[#888888] hover:text-emerald-400 hover:bg-[#161616]"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            🟢 Live Spot ETFs
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${marketFilter === "LIVE_ETF" ? "bg-emerald-600 text-white font-bold" : "bg-[#181818] text-[#777777]"}`}>
            {marketCounts.liveEtfs}
          </span>
        </button>

        <button
          onClick={() => setMarketFilter("OTC_TRUST")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            marketFilter === "OTC_TRUST"
              ? "bg-blue-600 text-white shadow-md"
              : "text-[#888888] hover:text-blue-400 hover:bg-[#161616]"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            📈 Active OTCQX Trading Trusts
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${marketFilter === "OTC_TRUST" ? "bg-blue-700 text-white font-bold" : "bg-[#181818] text-[#777777]"}`}>
            {marketCounts.otcTrusts}
          </span>
        </button>

        <button
          onClick={() => setMarketFilter("PENDING_SEC")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            marketFilter === "PENDING_SEC"
              ? "bg-amber-500 text-black shadow-md"
              : "text-[#888888] hover:text-amber-400 hover:bg-[#161616]"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            ⏳ Pending SEC Review
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${marketFilter === "PENDING_SEC" ? "bg-amber-600 text-black font-bold" : "bg-[#181818] text-[#777777]"}`}>
            {marketCounts.pendingSec}
          </span>
        </button>

        <button
          onClick={() => setMarketFilter("STAKING")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            marketFilter === "STAKING"
              ? "bg-purple-600 text-white shadow-md"
              : "text-[#888888] hover:text-purple-400 hover:bg-[#161616]"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            🥩 Staking Yield Enabled
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${marketFilter === "STAKING" ? "bg-purple-700 text-white font-bold" : "bg-[#181818] text-[#777777]"}`}>
            {marketCounts.staking}
          </span>
        </button>
      </div>

      {/* Search & Secondary Filter Toolbar */}
      <div className="bg-[#0f0f0f] border border-[#1e1e1e] rounded-2xl p-4 shadow-sm space-y-3">
        {/* Top Row: Search Input & Primary Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[280px]">
            <Search className="w-4 h-4 text-[#777777] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="input-search-filings"
              type="text"
              placeholder="Search by token, issuer, fund name, ticker, or CIK..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9.5 pr-16 py-2.5 bg-[#080808] border border-[#242424] rounded-xl text-xs text-white placeholder-[#666666] focus:outline-none focus:border-[#444444] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-[#181818] hover:bg-[#222222] text-[11px] text-[#888888] hover:text-white border border-[#2a2a2a] transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter Dropdowns Grid */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            {/* Issuer Filter Dropdown */}
            <div className="flex items-center gap-1.5 bg-[#080808] border border-[#242424] rounded-xl px-3 py-1.5">
              <label htmlFor="select-issuer-filter" className="text-[#777777] text-[11px] font-semibold shrink-0">
                Issuer:
              </label>
              <select
                id="select-issuer-filter"
                value={selectedIssuer}
                onChange={(e) => setSelectedIssuer(e.target.value)}
                aria-label="Filter by Applicant Issuer"
                className="bg-transparent text-[#e0e0e0] font-medium focus:outline-none text-xs cursor-pointer max-w-[150px] truncate"
              >
                <option value="ALL" className="bg-[#0f0f0f] text-white">All Issuers ({applications.length})</option>
                {uniqueIssuers.map((iss) => {
                  const count = applications.filter((a) => a.issuer === iss).length;
                  return (
                    <option key={iss} value={iss} className="bg-[#0f0f0f] text-[#cccccc]">
                      {iss} ({count})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Filing Status Filter Dropdown */}
            <div className="flex items-center gap-1.5 bg-[#080808] border border-[#242424] rounded-xl px-3 py-1.5">
              <label htmlFor="select-status-filter" className="text-[#777777] text-[11px] font-semibold shrink-0">
                Status:
              </label>
              <select
                id="select-status-filter"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                aria-label="Filter by Filing Status"
                className="bg-transparent text-[#e0e0e0] font-medium focus:outline-none text-xs cursor-pointer max-w-[160px] truncate"
              >
                <option value="ALL" className="bg-[#0f0f0f] text-white">All Statuses ({applications.length})</option>
                <option value="Approved & Trading" className="bg-[#0f0f0f] text-emerald-400">
                  Approved & Active ({applications.filter((a) => a.status === "Approved & Trading").length})
                </option>
                <option value="19b-4 Pending Review" className="bg-[#0f0f0f] text-blue-400">
                  19b-4 Review ({applications.filter((a) => a.status === "19b-4 Pending Review").length})
                </option>
                <option value="S-1 Registration Filed" className="bg-[#0f0f0f] text-amber-400">
                  S-1 Filed ({applications.filter((a) => a.status === "S-1 Registration Filed").length})
                </option>
                <option value="S-1 Amendment Filed" className="bg-[#0f0f0f] text-purple-400">
                  S-1 Amendment ({applications.filter((a) => a.status === "S-1 Amendment Filed").length})
                </option>
              </select>
            </div>

            {/* Token / Asset Selector */}
            <div className="flex items-center gap-1.5 bg-[#080808] border border-[#242424] rounded-xl px-3 py-1.5">
              <label htmlFor="select-token-filter" className="text-[#777777] text-[11px] font-semibold shrink-0">
                Asset:
              </label>
              <select
                id="select-token-filter"
                value={selectedToken}
                onChange={(e) => setSelectedToken(e.target.value)}
                aria-label="Filter by Cryptocurrency Asset"
                className="bg-transparent text-[#e0e0e0] font-medium focus:outline-none text-xs cursor-pointer"
              >
                <option value="ALL" className="bg-[#0f0f0f] text-white">All Assets</option>
                {uniqueTokens.map((tok) => (
                  <option key={tok} value={tok} className="bg-[#0f0f0f] text-[#cccccc]">
                    {tok} ({applications.filter((a) => a.tokenSymbol === tok).length})
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1 bg-[#080808] border border-[#242424] rounded-xl px-2.5 py-1.5">
              <span className="text-[#777777] text-[11px] font-semibold">Sort:</span>
              <select
                id="select-sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sort filings by field"
                className="bg-transparent text-[#e0e0e0] focus:outline-none text-xs cursor-pointer"
              >
                <option value="daysRemaining" className="bg-[#0f0f0f] text-white">Deadline Days</option>
                <option value="approvalProbability" className="bg-[#0f0f0f] text-white">Approval Odds</option>
                <option value="tokensHeld" className="bg-[#0f0f0f] text-white">Custody AUM</option>
                <option value="filingDate" className="bg-[#0f0f0f] text-white">Filing Date</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="p-1 text-[#888888] hover:text-white transition-colors cursor-pointer"
                title={`Sort ${sortOrder === "asc" ? "Ascending" : "Descending"}`}
              >
                <ArrowUpDown className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Filter Token Chips & Active Filter Indicators */}
        <div className="pt-2 border-t border-[#181818] flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Quick Token Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[#666666] text-[11px] uppercase tracking-wider font-semibold mr-1 shrink-0">
              Filter Token:
            </span>
            <button
              onClick={() => {
                setSelectedToken("ALL");
                setSelectedStatus("ALL");
                setSelectedIssuer("ALL");
                setMarketFilter("ALL");
                setStakingOnly(false);
                setSearchQuery("");
              }}
              className={`px-2.5 py-1 rounded-lg text-xs shrink-0 transition-colors cursor-pointer ${
                selectedToken === "ALL" && selectedStatus === "ALL" && selectedIssuer === "ALL" && marketFilter === "ALL" && !stakingOnly && !searchQuery
                  ? "bg-white text-black font-semibold shadow-sm"
                  : "bg-[#111111] text-[#888888] hover:bg-[#181818] hover:text-[#cccccc] border border-[#1e1e1e]"
              }`}
            >
              All ({applications.length})
            </button>
            {uniqueTokens.map((tok) => {
              const count = applications.filter((a) => a.tokenSymbol === tok).length;
              const isSelected = selectedToken === tok;
              return (
                <button
                  key={tok}
                  onClick={() => setSelectedToken(isSelected ? "ALL" : tok)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs shrink-0 transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-[#242424] text-white font-medium border border-[#3a3a3a]"
                      : "bg-[#111111] text-[#888888] hover:bg-[#181818] hover:text-[#cccccc] border border-[#1e1e1e]"
                  }`}
                >
                  <span>{tok}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? "bg-[#383838] text-white" : "bg-[#080808] text-[#777777]"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Results Counter & Active Filters Tag summary */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="text-xs text-[#888888]">
              Showing <strong className="text-white font-mono">{filteredApplications.length === 0 ? 0 : startIndex + 1}–{endIndex}</strong> of <strong className="text-white font-mono">{filteredApplications.length}</strong> filings
              {totalPages > 1 && (
                <span className="text-[#666666] ml-1.5 font-sans">
                  (Page <strong className="text-emerald-400 font-mono">{currentPage}</strong> of {totalPages})
                </span>
              )}
            </span>

            {(searchQuery || selectedToken !== "ALL" || selectedStatus !== "ALL" || selectedIssuer !== "ALL" || marketFilter !== "ALL" || stakingOnly) && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedToken("ALL");
                  setSelectedStatus("ALL");
                  setSelectedIssuer("ALL");
                  setMarketFilter("ALL");
                  setStakingOnly(false);
                }}
                className="px-2.5 py-1 rounded-lg bg-[#181818] hover:bg-[#222222] text-[#aaaaaa] hover:text-white border border-[#2a2a2a] text-[11px] font-semibold transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Applications Master Table */}
      <div id="etf-master-table-container" className="bg-[#0f0f0f] border border-[#1e1e1e] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#080808] border-b border-[#1c1c1c] text-[#777777] font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-3 text-center w-10">★</th>
                <th className="py-3.5 px-4">Token &amp; Asset</th>
                <th className="py-3.5 px-4">Fund Name &amp; Issuer</th>
                <th className="py-3.5 px-4">Ticker / Exch</th>
                <th className="py-3.5 px-4">Tokens Held &amp; Custodian</th>
                <th className="py-3.5 px-4">Filing Date &amp; Form</th>
                <th className="py-3.5 px-4">SEC Accession / CIK</th>
                <th className="py-3.5 px-4">Status &amp; Odds</th>
                <th className="py-3.5 px-4">Next Statutory Deadline</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#161616]">
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-[#777777]">
                    {marketFilter === "WATCHLIST" ? (
                      <div className="max-w-md mx-auto space-y-2">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                          <Star className="w-6 h-6 fill-amber-400/30" />
                        </div>
                        <p className="text-sm font-semibold text-white">Your Starred Watchlist is Empty</p>
                        <p className="text-xs text-[#888888]">
                          Click the star icon (<span className="text-amber-400">★</span>) on any ETF application row to pin it to your personal watchlist for fast tracking.
                        </p>
                        <button
                          onClick={() => setMarketFilter("ALL")}
                          className="mt-3 px-3.5 py-1.5 rounded-xl bg-[#1e1e1e] hover:bg-[#282828] text-white text-xs font-semibold border border-[#333333] transition-colors cursor-pointer"
                        >
                          Explore All Filings
                        </button>
                      </div>
                    ) : (
                      <div>
                        <AlertCircle className="w-8 h-8 text-[#444444] mx-auto mb-2" />
                        <p className="text-sm font-medium text-[#cccccc]">No crypto ETF filings match your criteria</p>
                        <p className="text-xs text-[#666666] mt-1">Try resetting filters or search query</p>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedApplications.map((app) => {
                  const isApproved = app.status === "Approved & Trading";
                  const isStarred = watchlistIds.has(app.id);
                  return (
                    <tr
                      key={app.id}
                      onClick={() => onSelectEtf(app)}
                      className="hover:bg-[#141414] transition-colors cursor-pointer group"
                    >
                      {/* Star Watchlist Toggle */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onToggleWatchlist && onToggleWatchlist(app.id)}
                          title={isStarred ? "Remove from Starred Watchlist" : "Add to Starred Watchlist"}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isStarred
                              ? "text-amber-400 hover:text-amber-300 bg-amber-500/15 border border-amber-500/30"
                              : "text-[#444444] hover:text-amber-400 hover:bg-[#1c1c1c] border border-transparent"
                          }`}
                        >
                          <Star className={`w-3.5 h-3.5 ${isStarred ? "fill-amber-400" : ""}`} />
                        </button>
                      </td>

                      {/* Token Asset */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={app.tokenIcon}
                            alt={app.tokenSymbol}
                            referrerPolicy="no-referrer"
                            className="w-7 h-7 rounded-full bg-[#181818] p-0.5 object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                          <div>
                            <div className="font-bold text-white flex items-center gap-1">
                              <span>{app.tokenSymbol}</span>
                              {app.stakingEnabled && (
                                <span className="px-1.5 py-0.2 text-[9px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded">
                                  Yield
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#888888] flex items-center gap-1.5">
                              <span>${app.currentPriceUsd.toLocaleString()}</span>
                              <span className={app.price24hChange >= 0 ? "text-emerald-400 font-medium" : "text-rose-400 font-medium"}>
                                {app.price24hChange >= 0 ? "+" : ""}{app.price24hChange}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Fund Name & Issuer */}
                      <td className="py-3.5 px-4">
                        <div className="max-w-[210px]">
                          <div className="font-semibold text-[#e0e0e0] group-hover:text-white transition-colors truncate">
                            {app.fundName}
                          </div>
                          <div className="text-[11px] text-[#777777] flex items-center gap-1.5 mt-0.5">
                            <span className="font-medium text-[#aaaaaa]">{app.issuer}</span>
                            <span className="text-[#444444]">&bull;</span>
                            <span className="text-[#777777]">{app.sponsorFeePercentage}% fee</span>
                          </div>
                        </div>
                      </td>

                      {/* Ticker & Exchange */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-white flex items-center gap-1">
                          <span>{app.ticker}</span>
                          {isApproved && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Actively Trading ETF" />
                          )}
                        </div>
                        <div className="text-[11px] text-[#777777]">{app.exchange}</div>
                      </td>

                      {/* Tokens Held & Custody */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div>
                          <div className="font-semibold text-[#e0e0e0]">
                            {app.tokensHeld.toLocaleString()} {app.tokenSymbol}
                          </div>
                          <div className="text-[11px] text-[#777777] flex items-center gap-1.5">
                            <span className="text-[#aaaaaa]">
                              {app.portfolioValueUsd >= 1_000_000_000
                                ? `$${(app.portfolioValueUsd / 1_000_000_000).toFixed(2)}B`
                                : `$${(app.portfolioValueUsd / 1_000_000).toFixed(1)}M`}
                            </span>
                            <span className="text-[#444444]">&bull;</span>
                            <span className="text-[#777777] truncate max-w-[100px]" title={app.custodian.name}>
                              {app.custodian.name.replace("Trust Company", "").replace("LLC", "").trim()}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Filing Date & Form */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-[#e0e0e0] font-mono">{app.statutoryDeadlines.filingDate}</div>
                        <div className="text-[11px] text-[#888888] font-semibold">{app.filingType}</div>
                      </td>

                      {/* SEC EDGAR Accession & CIK */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[#cccccc] text-[11px]">
                            CIK: {app.secEdgar.cik}
                          </span>
                          <button
                            onClick={(e) => handleCopyAccession(e, app.secEdgar.accessionNumber, app.id)}
                            title="Copy SEC EDGAR Accession Number"
                            className="p-1 rounded bg-[#181818] hover:bg-[#222222] text-[#888888] hover:text-white transition-colors border border-[#2a2a2a] cursor-pointer"
                          >
                            {copiedId === app.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <a
                          href={app.secEdgar.officialUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[10px] text-[#888888] hover:text-white flex items-center gap-1 mt-0.5 transition-colors"
                        >
                          Official SEC Filing <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </td>

                      {/* Status & Approval Odds */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="mb-1">{getStatusBadge(app)}</div>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-[#1e1e1e] rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                app.approvalProbabilityPercentage >= 85
                                  ? "bg-emerald-500"
                                  : app.approvalProbabilityPercentage >= 70
                                  ? "bg-purple-500"
                                  : "bg-amber-500"
                              }`}
                              style={{ width: `${app.approvalProbabilityPercentage}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-semibold text-[#cccccc]">
                            {app.approvalProbabilityPercentage}%
                          </span>
                        </div>
                      </td>

                      {/* Next Statutory Deadline Clock */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isApproved ? (
                          <div className="text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Live &amp; Trading</span>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`font-bold font-mono ${
                                  app.statutoryDeadlines.daysRemaining <= 15
                                    ? "text-rose-400 animate-pulse"
                                    : app.statutoryDeadlines.daysRemaining <= 45
                                    ? "text-amber-400"
                                    : "text-[#e0e0e0]"
                                }`}
                              >
                                {app.statutoryDeadlines.daysRemaining}d left
                              </span>
                              <span className="text-[10px] text-[#777777]">
                                ({app.statutoryDeadlines.nextDeadlineDate})
                              </span>
                            </div>
                            <div className="text-[10px] text-[#777777] truncate max-w-[130px]" title={app.statutoryDeadlines.nextDeadlineLabel}>
                              {app.statutoryDeadlines.nextDeadlineLabel}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => onAnalyzeAi(app)}
                            title="AI Regulatory Legal Analysis"
                            className="p-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-500/30 transition-colors cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onSelectEtf(app)}
                            title="View Full SEC Filing Dossier"
                            className="p-1.5 rounded-lg bg-[#181818] hover:bg-[#242424] text-[#cccccc] hover:text-white border border-[#2a2a2a] transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls Bar */}
        {filteredApplications.length > 0 && (
          <div className="bg-[#0b0b0b] border-t border-[#1c1c1c] p-4">
            <PaginationControls
              currentPage={currentPage}
              totalItems={filteredApplications.length}
              pageSize={pageSize}
              onPageChange={(page) => handlePageChange(page)}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              pageSizeOptions={[10, 20, 50]}
              itemLabel="filings"
            />
          </div>
        )}
      </div>

      {/* Regulatory Explainer Modal */}
      <RegulatoryExplainerModal
        isOpen={isExplainerOpen}
        onClose={() => setIsExplainerOpen(false)}
      />
    </div>
  );
};
