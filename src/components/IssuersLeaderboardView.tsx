import React, { useMemo, useState, useEffect } from "react";
import {
  Building2,
  Award,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Coins,
  ArrowRight,
  Search,
  ArrowUpDown,
} from "lucide-react";
import { ETFApplication, IssuerSummary } from "../types";
import { PaginationControls } from "./PaginationControls";

interface IssuersLeaderboardViewProps {
  applications: ETFApplication[];
  onSelectEtf: (app: ETFApplication) => void;
}

export const IssuersLeaderboardView: React.FC<IssuersLeaderboardViewProps> = ({
  applications,
  onSelectEtf,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"aum" | "filings" | "fee">("aum");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(6);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy]);

  const issuerSummaries: IssuerSummary[] = useMemo(() => {
    const map = new Map<string, IssuerSummary>();

    applications.forEach((app) => {
      const existing = map.get(app.issuer);
      if (existing) {
        existing.totalFilings += 1;
        if (app.status === "Approved & Trading") existing.approvedFunds += 1;
        else existing.pendingApplications += 1;
        existing.totalAumUsd += app.portfolioValueUsd;
        if (!existing.tokensCovered.includes(app.tokenSymbol)) {
          existing.tokensCovered.push(app.tokenSymbol);
        }
      } else {
        map.set(app.issuer, {
          issuerName: app.issuer,
          totalFilings: 1,
          approvedFunds: app.status === "Approved & Trading" ? 1 : 0,
          pendingApplications: app.status === "Approved & Trading" ? 0 : 1,
          totalAumUsd: app.portfolioValueUsd,
          avgSponsorFee: app.sponsorFeePercentage,
          primaryCustodian: app.custodian.name,
          tokensCovered: [app.tokenSymbol],
        });
      }
    });

    return Array.from(map.values())
      .map((summary) => {
        const issuerApps = applications.filter((a) => a.issuer === summary.issuerName);
        const avgFee =
          issuerApps.reduce((sum, a) => sum + a.sponsorFeePercentage, 0) / issuerApps.length;
        return {
          ...summary,
          avgSponsorFee: Number(avgFee.toFixed(2)),
        };
      })
      .sort((a, b) => {
        if (sortBy === "filings") return b.totalFilings - a.totalFilings;
        if (sortBy === "fee") return a.avgSponsorFee - b.avgSponsorFee;
        return b.totalAumUsd - a.totalAumUsd;
      });
  }, [applications, sortBy]);

  const filteredIssuers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return issuerSummaries;
    return issuerSummaries.filter(
      (iss) =>
        iss.issuerName.toLowerCase().includes(q) ||
        iss.primaryCustodian.toLowerCase().includes(q) ||
        iss.tokensCovered.some((tok) => tok.toLowerCase().includes(q))
    );
  }, [issuerSummaries, searchQuery]);

  const paginatedIssuers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredIssuers.slice(start, start + pageSize);
  }, [filteredIssuers, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0f0f0f] border border-[#1e1e1e] rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-neutral-900 text-[#cccccc] border border-[#2a2a2a] flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                Wall Street Institutional Issuers
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Applicant Issuers &amp; Fund Sponsors Intelligence
            </h2>
            <p className="text-xs text-[#888888] mt-1 max-w-2xl">
              Compare leading global asset managers applying for cryptocurrency spot and staking ETFs with the US Securities and Exchange Commission.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#666666]" />
              <input
                type="text"
                placeholder="Search issuer or token..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#080808] border border-[#242424] text-xs text-white rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:border-emerald-500 w-48 sm:w-56"
              />
            </div>

            {/* Sort Select */}
            <div className="flex items-center gap-1 bg-[#080808] px-2.5 py-1 rounded-xl border border-[#242424] text-xs">
              <ArrowUpDown className="w-3 h-3 text-[#888888]" />
              <span className="text-[#888888]">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-white focus:outline-none cursor-pointer"
              >
                <option value="aum" className="bg-[#121212]">Total AUM</option>
                <option value="filings" className="bg-[#121212]">Most Filings</option>
                <option value="fee" className="bg-[#121212]">Lowest Fee</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard Table / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredIssuers.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-[#0c0c0c] border border-[#1c1c1c] rounded-2xl text-[#777777]">
            <Building2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">No issuers found matching "{searchQuery}"</p>
          </div>
        ) : (
          paginatedIssuers.map((issuer, idx) => {
            const issuerApps = applications.filter((a) => a.issuer === issuer.issuerName);
            const globalIndex = (currentPage - 1) * pageSize + idx;

            return (
              <div
                key={issuer.issuerName}
                className="bg-[#0f0f0f] border border-[#1e1e1e] rounded-2xl p-5 hover:border-[#2a2a2a] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#181818] border border-[#2a2a2a] flex items-center justify-center font-bold text-white text-sm">
                        #{globalIndex + 1}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm">{issuer.issuerName}</h3>
                        <div className="text-[11px] text-[#888888]">
                          {issuer.totalFilings} Total Trust Applications
                        </div>
                      </div>
                    </div>

                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[#181818] text-[#cccccc] border border-[#262626]">
                      {issuer.avgSponsorFee}% Avg Fee
                    </span>
                  </div>

                  {/* Metrics */}
                  <div className="bg-[#080808] rounded-xl p-3 border border-[#1c1c1c] mb-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#888888]">Total Tracked AUM:</span>
                      <span className="font-bold text-white font-mono">
                        {issuer.totalAumUsd >= 1e9
                          ? `$${(issuer.totalAumUsd / 1e9).toFixed(2)} Billion`
                          : `$${(issuer.totalAumUsd / 1e6).toFixed(1)} Million`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#888888]">Approved vs Pending:</span>
                      <span className="font-semibold text-[#e0e0e0]">
                        <span className="text-emerald-400">{issuer.approvedFunds} Approved</span> &bull;{" "}
                        <span className="text-[#a1a1aa]">{issuer.pendingApplications} Pending</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#888888]">Primary Custodian:</span>
                      <span className="text-[#cccccc] font-medium truncate max-w-[150px]" title={issuer.primaryCustodian}>
                        {issuer.primaryCustodian.split(" ")[0]}
                      </span>
                    </div>
                  </div>

                  {/* Tokens covered badges */}
                  <div className="mb-3">
                    <div className="text-[11px] text-[#888888] mb-1.5">Assets In Registration:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {issuer.tokensCovered.map((tok) => (
                        <span
                          key={tok}
                          className="px-2 py-0.5 rounded-md bg-[#181818] text-[#e0e0e0] border border-[#262626] text-[11px] font-semibold font-mono"
                        >
                          {tok}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Fund list shortcuts */}
                <div className="pt-3 border-t border-[#181818]">
                  <div className="text-[11px] text-[#888888] mb-1">Applications:</div>
                  <div className="space-y-1">
                    {issuerApps.slice(0, 3).map((app) => (
                      <div
                        key={app.id}
                        onClick={() => onSelectEtf(app)}
                        className="text-xs text-[#cccccc] hover:text-white flex items-center justify-between cursor-pointer py-0.5 transition-colors"
                      >
                        <span className="truncate max-w-[180px]">{app.fundName}</span>
                        <span className="font-mono text-[10px] text-[#888888] shrink-0">
                          {app.ticker} &bull; {app.status === "Approved & Trading" ? "Approved" : `${app.statutoryDeadlines.daysRemaining}d`}
                        </span>
                      </div>
                    ))}
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
        totalItems={filteredIssuers.length}
        pageSize={pageSize}
        onPageChange={(page) => setCurrentPage(page)}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
        pageSizeOptions={[6, 9, 12, 18]}
        itemLabel="sponsors"
      />
    </div>
  );
};
