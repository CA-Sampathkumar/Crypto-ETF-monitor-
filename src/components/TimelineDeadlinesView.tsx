import React, { useState, useMemo, useEffect } from "react";
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Info,
  ArrowRight,
  Sparkles,
  Activity,
  Zap,
  Landmark,
  Layers,
  ChevronDown,
  ChevronUp,
  Search,
} from "lucide-react";
import { ETFApplication, RegulatoryPathway } from "../types";
import { ApplicationProcessChartMap } from "./ApplicationProcessChartMap";
import { PaginationControls } from "./PaginationControls";

interface TimelineDeadlinesViewProps {
  applications: ETFApplication[];
  onSelectEtf: (app: ETFApplication) => void;
  onAnalyzeAi: (app: ETFApplication) => void;
}

export const TimelineDeadlinesView: React.FC<TimelineDeadlinesViewProps> = ({
  applications,
  onSelectEtf,
  onAnalyzeAi,
}) => {
  const [filterToken, setFilterToken] = useState<string>("ALL");
  const [filterPathway, setFilterPathway] = useState<"ALL" | "75_DAYS" | "240_DAYS">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showProcessMap, setShowProcessMap] = useState<boolean>(true);
  const [showDualFrameworkInfo, setShowDualFrameworkInfo] = useState<boolean>(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Reset to page 1 on filter/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterToken, filterPathway, searchQuery]);

  const uniqueTokens = Array.from(new Set(applications.map((a) => a.tokenSymbol)));

  // Helper to determine if an application qualifies for 75-day generic listing standards
  const isGenericListingEligible = (app: ETFApplication): boolean => {
    if (app.statutoryDeadlines.genericListingEligible !== undefined) {
      return app.statutoryDeadlines.genericListingEligible;
    }
    // Spot crypto ETFs without staking and with CFTC reference rates or non-novel structures qualify for generic 75-day track
    const hasStaking = app.stakingEnabled;
    const isMultiAsset = app.tokenCategory === "Multi-Asset Index";
    const hasCftcCommodityPrecedent = ["LTC", "DOGE", "XRP", "BTC", "ETH", "SOL"].includes(app.tokenSymbol);
    
    return !hasStaking && !isMultiAsset && hasCftcCommodityPrecedent;
  };

  const getPathwayDetails = (app: ETFApplication) => {
    const eligible = isGenericListingEligible(app);
    if (eligible) {
      return {
        pathway: "75-Day Generic Listing (Rule 19b-4(e))" as RegulatoryPathway,
        badge: "⚡ 75-Day Fast Track",
        badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
        targetDays: 75,
        criteriaNote: "Qualifies under Rule 19b-4(e) generic commodity standards (CFTC reference rate & qualified custody).",
      };
    }
    return {
      pathway: "240-Day Section 19(b) Statutory Clock" as RegulatoryPathway,
      badge: "🏛️ 240-Day Full Review",
      badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      targetDays: 240,
      criteriaNote: app.stakingEnabled
        ? "Requires full 240-day review due to native validator staking yield structure."
        : app.tokenCategory === "Multi-Asset Index"
        ? "Requires full 240-day review due to multi-token composite basket evaluation."
        : "Novel asset / formal 19b-4 rule filing under Section 19(b)(2).",
    };
  };

  const filteredPendingApps = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return applications
      .filter((a) => a.status !== "Approved & Trading")
      .filter((a) => filterToken === "ALL" || a.tokenSymbol === filterToken)
      .filter((a) => {
        if (filterPathway === "ALL") return true;
        const eligible = isGenericListingEligible(a);
        return filterPathway === "75_DAYS" ? eligible : !eligible;
      })
      .filter((a) => {
        if (!q) return true;
        return (
          a.fundName.toLowerCase().includes(q) ||
          a.ticker.toLowerCase().includes(q) ||
          a.issuer.toLowerCase().includes(q) ||
          a.tokenSymbol.toLowerCase().includes(q) ||
          a.tokenName.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.statutoryDeadlines.daysRemaining - b.statutoryDeadlines.daysRemaining);
  }, [applications, filterToken, filterPathway, searchQuery]);

  const genericEligibleCount = useMemo(
    () => applications.filter((a) => a.status !== "Approved & Trading" && isGenericListingEligible(a)).length,
    [applications]
  );
  const fullReviewCount = useMemo(
    () => applications.filter((a) => a.status !== "Approved & Trading" && !isGenericListingEligible(a)).length,
    [applications]
  );

  // Pagination slice
  const paginatedPendingApps = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPendingApps.slice(start, start + pageSize);
  }, [filteredPendingApps, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      {/* Live Application Process Trajectory Chart Map */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white">
              Application Intake &amp; Approval Process Map
            </h3>
          </div>
          <button
            onClick={() => setShowProcessMap(!showProcessMap)}
            className="text-xs px-3 py-1 rounded-xl bg-[#141414] hover:bg-[#1f1f1f] text-[#aaaaaa] hover:text-white border border-[#262626] transition-colors cursor-pointer"
          >
            {showProcessMap ? "Collapse Process Map" : "Expand Process Map"}
          </button>
        </div>

        {showProcessMap && (
          <ApplicationProcessChartMap
            applications={applications}
            onSelectEtf={onSelectEtf}
            onFilterToken={(t) => setFilterToken(t)}
          />
        )}
      </div>

      {/* Dual Framework Explainer: 75-Day Generic Standards vs 240-Day Statutory Clock */}
      <div className="bg-gradient-to-br from-[#121212] via-[#0e0e0e] to-[#080808] border border-[#222222] rounded-3xl p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1c1c1c] pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <Zap className="w-3 h-3" /> SEC Rule 19b-4(e) Reform
              </span>
              <span className="text-xs text-[#888888]">Generic Listing Standards vs Exchange Act § 19(b)(2)</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Dual Regulatory Framework: 75-Day Fast-Track vs. 240-Day Statutory Review
            </h2>
            <p className="text-xs text-[#aaaaaa] mt-1 max-w-3xl leading-relaxed">
              Why did the timeline change? The SEC approved <strong>Generic Listing Standards</strong> for crypto commodity ETPs, reducing the review timeline to <strong>60–75 days</strong> for qualifying assets. However, novel, staking-enabled, or index products still require the traditional <strong>240-day statutory clock</strong>.
            </p>
          </div>

          <button
            onClick={() => setShowDualFrameworkInfo(!showDualFrameworkInfo)}
            className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors self-start sm:self-auto cursor-pointer"
          >
            <span>{showDualFrameworkInfo ? "Hide Comparison" : "Show Comparison"}</span>
            {showDualFrameworkInfo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showDualFrameworkInfo && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Pathway A: 75-Day Generic Listing */}
            <div className="bg-[#090909] border border-emerald-500/30 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">⚡ 75-Day Fast-Track Pathway</h4>
                    <div className="text-[10px] text-emerald-400 font-mono">SEC Rule 19b-4(e) Generic Standards</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/40">
                  {genericEligibleCount} Eligible Filings
                </span>
              </div>

              <p className="text-[11px] text-[#aaaaaa] leading-relaxed">
                National exchanges (Nasdaq Rule 5711, NYSE Arca Rule 8.201-E, Cboe BZX Rule 14.11) can list qualifying crypto commodity ETPs <strong>without an individual 19b-4 approval order</strong>. The timeline relies purely on SEC Form S-1 registration statement review.
              </p>

              <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                <div className="bg-[#121212] p-2.5 rounded-xl border border-[#202020]">
                  <div className="text-emerald-400 font-bold">Day 30</div>
                  <div className="text-white font-semibold mt-0.5">Staff Comments</div>
                  <div className="text-[10px] text-[#777777] mt-0.5">Initial S-1 review</div>
                </div>
                <div className="bg-[#121212] p-2.5 rounded-xl border border-[#202020]">
                  <div className="text-emerald-400 font-bold">Day 50</div>
                  <div className="text-white font-semibold mt-0.5">S-1/A Amendment</div>
                  <div className="text-[10px] text-[#777777] mt-0.5">Custody/fee edits</div>
                </div>
                <div className="bg-[#121212] p-2.5 rounded-xl border border-emerald-500/30">
                  <div className="text-emerald-400 font-bold">Day 75</div>
                  <div className="text-white font-semibold mt-0.5">Effectiveness</div>
                  <div className="text-[10px] text-emerald-300 mt-0.5">Live trading starts</div>
                </div>
              </div>

              <div className="text-[10px] text-[#777777] bg-[#121212] p-2.5 rounded-xl border border-[#1f1f1f]">
                <strong>Eligibility:</strong> CFTC-regulated futures history, Intermarket Surveillance Group (ISG) tracking, qualified custody, non-staking single-commodity trusts (e.g. LTC, DOGE, XRP).
              </div>
            </div>

            {/* Pathway B: 240-Day Full Statutory Clock */}
            <div className="bg-[#090909] border border-amber-500/30 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                    <Landmark className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">🏛️ 240-Day Statutory Review Clock</h4>
                    <div className="text-[10px] text-amber-400 font-mono">1934 Exchange Act § 19(b)(2)</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-950/60 text-amber-300 border border-amber-500/40">
                  {fullReviewCount} Active Filings
                </span>
              </div>

              <p className="text-[11px] text-[#aaaaaa] leading-relaxed">
                Legally mandatory for any ETF application containing novel features, staking yield pass-through, multi-asset baskets, or assets lacking standardized CFTC futures. The SEC has up to 240 calendar days to approve or disapprove.
              </p>

              <div className="grid grid-cols-4 gap-1.5 pt-1 text-[11px]">
                <div className="bg-[#121212] p-2 rounded-xl border border-[#202020] text-center">
                  <div className="text-amber-400 font-bold text-[10px]">Day 45</div>
                  <div className="text-white text-[10px] font-semibold mt-0.5">1st Ext</div>
                </div>
                <div className="bg-[#121212] p-2 rounded-xl border border-[#202020] text-center">
                  <div className="text-amber-400 font-bold text-[10px]">Day 90</div>
                  <div className="text-white text-[10px] font-semibold mt-0.5">2nd Ext</div>
                </div>
                <div className="bg-[#121212] p-2 rounded-xl border border-[#202020] text-center">
                  <div className="text-amber-400 font-bold text-[10px]">Day 180</div>
                  <div className="text-white text-[10px] font-semibold mt-0.5">Rebuttal</div>
                </div>
                <div className="bg-[#121212] p-2 rounded-xl border border-amber-500/30 text-center">
                  <div className="text-amber-400 font-bold text-[10px]">Day 240</div>
                  <div className="text-amber-300 text-[10px] font-semibold mt-0.5">Final Order</div>
                </div>
              </div>

              <div className="text-[10px] text-[#777777] bg-[#121212] p-2.5 rounded-xl border border-[#1f1f1f]">
                <strong>Applies To:</strong> Staking reward structures (Solana/Ethereum Staking, Grayscale Hyperliquid), multi-token indexes (Bitwise 10), and new protocol architectures.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Deadlines Master List & Countdown */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Upcoming Statutory Deadlines Calendar (Chronological Order)</span>
            </h3>
            <p className="text-xs text-[#888888]">
              Track real-time statutory decision clocks across both the 75-Day Fast-Track and 240-Day Full Review tracks.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#666666]" />
              <input
                type="text"
                placeholder="Search ETF, ticker, sponsor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#0e0e0e] border border-[#242424] text-xs text-white rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:border-emerald-500 w-44 sm:w-52"
              />
            </div>

            {/* Pathway Filter Tabs */}
            <div className="flex items-center bg-[#0e0e0e] p-1 rounded-xl border border-[#242424]">
              <button
                onClick={() => setFilterPathway("ALL")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  filterPathway === "ALL"
                    ? "bg-[#222222] text-white shadow-sm"
                    : "text-[#777777] hover:text-[#cccccc]"
                }`}
              >
                All ({applications.filter((a) => a.status !== "Approved & Trading").length})
              </button>
              <button
                onClick={() => setFilterPathway("75_DAYS")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                  filterPathway === "75_DAYS"
                    ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 shadow-sm"
                    : "text-[#777777] hover:text-emerald-400"
                }`}
              >
                <Zap className="w-3 h-3" /> 75-Day ({genericEligibleCount})
              </button>
              <button
                onClick={() => setFilterPathway("240_DAYS")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                  filterPathway === "240_DAYS"
                    ? "bg-amber-950/80 text-amber-300 border border-amber-500/40 shadow-sm"
                    : "text-[#777777] hover:text-amber-400"
                }`}
              >
                <Landmark className="w-3 h-3" /> 240-Day ({fullReviewCount})
              </button>
            </div>

            {/* Token Filter */}
            <div className="flex items-center gap-1 bg-[#0e0e0e] px-2 py-1 rounded-xl border border-[#242424]">
              <span className="text-[#888888]">Asset:</span>
              <select
                value={filterToken}
                onChange={(e) => setFilterToken(e.target.value)}
                aria-label="Filter timeline by cryptocurrency asset"
                className="bg-transparent text-[#cccccc] focus:outline-none text-xs"
              >
                <option value="ALL" className="bg-[#121212]">All Assets</option>
                {uniqueTokens.map((tok) => {
                  const count = applications.filter((a) => a.tokenSymbol === tok && a.status !== "Approved & Trading").length;
                  if (count === 0) return null;
                  return (
                    <option key={tok} value={tok} className="bg-[#121212]">
                      {tok} ({count})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {filteredPendingApps.length === 0 ? (
            <div className="text-center py-10 bg-[#0c0c0c] border border-[#1e1e1e] rounded-2xl text-[#777777]">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">No applications match this filter criteria</p>
            </div>
          ) : (
            paginatedPendingApps.map((app) => {
              const isImminent = app.statutoryDeadlines.daysRemaining <= 30;
              const pathwayInfo = getPathwayDetails(app);

              return (
                <div
                  key={app.id}
                  onClick={() => onSelectEtf(app)}
                  className="bg-[#0f0f0f] border border-[#1e1e1e] hover:border-[#2a2a2a] rounded-2xl p-4.5 transition-all cursor-pointer group space-y-3"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Token & Fund Info */}
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#181818] border border-[#2a2a2a] flex items-center justify-center font-bold text-white text-xs shrink-0">
                        {app.tokenSymbol}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-sm group-hover:text-[#ffffff] transition-colors">
                            {app.fundName}
                          </span>
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#181818] text-[#cccccc] font-semibold border border-[#262626]">
                            {app.ticker} &bull; {app.exchange}
                          </span>
                          
                          {/* Pathway Badge */}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${pathwayInfo.badgeClass}`}>
                            {pathwayInfo.badge}
                          </span>

                          {app.stakingEnabled && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                              Staking Yield
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-[#888888] mt-1 flex items-center gap-2 flex-wrap">
                          <span>Issuer: <strong className="text-[#cccccc]">{app.issuer}</strong></span>
                          <span>&bull;</span>
                          <span>Filing Date: <span className="font-mono text-[#cccccc]">{app.statutoryDeadlines.filingDate}</span></span>
                          <span>&bull;</span>
                          <span>Custody: <span className="text-[#cccccc]">{app.custodian.name.split(" ")[0]}</span> ({app.tokensHeld.toLocaleString()} {app.tokenSymbol})</span>
                        </div>

                        <p className="text-[11px] text-[#666666] mt-0.5">
                          {pathwayInfo.criteriaNote}
                        </p>
                      </div>
                    </div>

                    {/* Right: Milestone Countdown Clock & Action */}
                    <div className="flex items-center justify-between lg:justify-end gap-4 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#1c1c1c]">
                      <div className="text-left lg:text-right">
                        <div className="text-[11px] text-[#888888]">
                          {app.statutoryDeadlines.nextDeadlineLabel}
                        </div>
                        <div className="flex items-baseline lg:justify-end gap-1.5 mt-0.5">
                          <span
                            className={`text-xl font-bold font-mono ${
                              isImminent ? "text-rose-400 animate-pulse" : "text-amber-400"
                            }`}
                          >
                            {app.statutoryDeadlines.daysRemaining} Days Left
                          </span>
                          <span className="text-xs text-[#888888] font-mono">
                            ({app.statutoryDeadlines.nextDeadlineDate})
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onAnalyzeAi(app)}
                          className="px-3 py-1.5 rounded-lg bg-purple-950/80 hover:bg-purple-900 text-purple-200 border border-purple-500/40 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3 text-purple-400" />
                          <span>AI Odds</span>
                        </button>
                        <button
                          onClick={() => onSelectEtf(app)}
                          className="px-3 py-1.5 rounded-lg bg-[#181818] hover:bg-[#222222] text-[#cccccc] hover:text-white border border-[#2a2a2a] text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Dossier
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Statutory Milestones Bar */}
                  <div className="pt-2 border-t border-[#181818] grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div className="bg-[#080808] p-2 rounded-lg border border-[#1a1a1a]">
                      <div className="text-[#666666]">1st Milestone (Day 45):</div>
                      <div className="font-mono text-[#cccccc] font-semibold">{app.statutoryDeadlines.firstDeadline45d}</div>
                    </div>
                    <div className="bg-[#080808] p-2 rounded-lg border border-[#1a1a1a]">
                      <div className="text-[#666666]">2nd Milestone (Day 90):</div>
                      <div className="font-mono text-[#cccccc] font-semibold">{app.statutoryDeadlines.secondDeadline90d}</div>
                    </div>
                    <div className="bg-[#080808] p-2 rounded-lg border border-[#1a1a1a]">
                      <div className="text-[#666666]">3rd Milestone (Day 180):</div>
                      <div className="font-mono text-[#cccccc] font-semibold">{app.statutoryDeadlines.thirdDeadline180d}</div>
                    </div>
                    <div className="bg-[#080808] p-2 rounded-lg border border-emerald-900/30">
                      <div className="text-emerald-400 font-medium">Final Statutory Order:</div>
                      <div className="font-mono text-emerald-300 font-bold">{app.statutoryDeadlines.finalDeadline240d}</div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Controls */}
        <div className="mt-4">
          <PaginationControls
            currentPage={currentPage}
            totalItems={filteredPendingApps.length}
            pageSize={pageSize}
            onPageChange={(page) => setCurrentPage(page)}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
            pageSizeOptions={[10, 20, 50]}
            itemLabel="statutory filings"
          />
        </div>
      </div>
    </div>
  );
};
