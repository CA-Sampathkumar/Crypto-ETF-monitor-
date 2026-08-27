import React from "react";
import { FileText, Coins, Clock, CheckCircle2, TrendingUp, Vault, AlertTriangle } from "lucide-react";
import { ETFApplication } from "../types";

interface KpiStatsProps {
  applications: ETFApplication[];
  onFilterStatus?: (status: string) => void;
  onFilterToken?: (symbol: string) => void;
}

export const KpiStats: React.FC<KpiStatsProps> = ({ applications }) => {
  const totalFilings = applications.length;
  const approvedCount = applications.filter((a) => a.status === "Approved & Trading").length;
  const pendingCount = applications.filter((a) => a.status !== "Approved & Trading").length;

  const totalReservesUsd = applications.reduce((acc, a) => acc + a.portfolioValueUsd, 0);
  const pendingReservesUsd = applications
    .filter((a) => a.status !== "Approved & Trading")
    .reduce((acc, a) => acc + a.portfolioValueUsd, 0);

  // Find next nearest deadline among pending applications
  const pendingWithDeadlines = applications
    .filter((a) => a.status !== "Approved & Trading" && a.statutoryDeadlines.daysRemaining >= 0)
    .sort((a, b) => a.statutoryDeadlines.daysRemaining - b.statutoryDeadlines.daysRemaining);

  const nextDeadlineApp = pendingWithDeadlines[0];

  // Average approval odds of pending
  const pendingOdds = applications.filter((a) => a.status !== "Approved & Trading");
  const avgApprovalOdds = pendingOdds.length > 0
    ? Math.round(pendingOdds.reduce((sum, a) => sum + a.approvalProbabilityPercentage, 0) / pendingOdds.length)
    : 0;

  // Staking enabled applications count
  const stakingCount = applications.filter((a) => a.stakingEnabled).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Filings Tracked */}
      <div className="bg-[#0f0f0f] border border-[#1e1e1e] rounded-2xl p-4.5 shadow-sm hover:border-[#2a2a2a] transition-all">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-semibold text-[#888888] uppercase tracking-wider">
            Total ETF Applications
          </span>
          <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center border border-[#262626]">
            <FileText className="w-4 h-4 text-emerald-400" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white tracking-tight">{totalFilings}</span>
          <span className="text-xs text-[#a1a1aa] font-medium">
            {pendingCount} Pending SEC Review
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-[#888888] border-t border-[#181818] pt-2.5">
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {approvedCount} Approved & Active
          </span>
          <span className="text-purple-400 font-medium">{stakingCount} Staking-Enabled</span>
        </div>
      </div>

      {/* Institutional Token Holdings / Reserves */}
      <div className="bg-[#0f0f0f] border border-[#1e1e1e] rounded-2xl p-4.5 shadow-sm hover:border-[#2a2a2a] transition-all">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-semibold text-[#888888] uppercase tracking-wider">
            Total ETF Custody Reserves
          </span>
          <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center border border-[#262626]">
            <Vault className="w-4 h-4 text-emerald-400" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white tracking-tight">
            ${(totalReservesUsd / 1_000_000_000).toFixed(2)}B
          </span>
          <span className="text-xs text-emerald-400 font-medium">
            100% Segregated Cold Custody
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-[#888888] border-t border-[#181818] pt-2.5">
          <span>Pending Altcoin Seed Reserves:</span>
          <span className="text-white font-semibold">
            ${(pendingReservesUsd / 1_000_000).toFixed(1)}M
          </span>
        </div>
      </div>

      {/* Next SEC Statutory Deadline */}
      <div className="bg-[#0f0f0f] border border-[#1e1e1e] rounded-2xl p-4.5 shadow-sm hover:border-[#2a2a2a] transition-all">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-semibold text-[#888888] uppercase tracking-wider">
            Next SEC Decision Clock
          </span>
          <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center border border-[#262626]">
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
        </div>
        {nextDeadlineApp ? (
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-400 tracking-tight">
                {nextDeadlineApp.statutoryDeadlines.daysRemaining} Days
              </span>
              <span className="text-xs text-[#cccccc] font-semibold truncate max-w-[140px]">
                {nextDeadlineApp.issuer} ({nextDeadlineApp.tokenSymbol})
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-[#888888] border-t border-[#181818] pt-2.5 truncate">
              <span className="truncate">{nextDeadlineApp.statutoryDeadlines.nextDeadlineLabel}</span>
              <span className="text-[#cccccc] font-mono text-[11px] shrink-0 ml-1">
                {nextDeadlineApp.statutoryDeadlines.nextDeadlineDate}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-[#888888]">All current statutory dates acknowledged</div>
        )}
      </div>

      {/* Average Approval Probability */}
      <div className="bg-[#0f0f0f] border border-[#1e1e1e] rounded-2xl p-4.5 shadow-sm hover:border-[#2a2a2a] transition-all">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-semibold text-[#888888] uppercase tracking-wider">
            Approval Probability Index
          </span>
          <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center border border-[#262626]">
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white tracking-tight">{avgApprovalOdds}%</span>
          <span className="text-xs text-emerald-400 font-medium">
            Pro-Crypto Regulatory Precedent
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-[#888888] border-t border-[#181818] pt-2.5">
          <span>Highest Odds:</span>
          <span className="text-emerald-400 font-semibold">LTC (88%) &bull; XRP (86%) &bull; SOL (82%)</span>
        </div>
      </div>
    </div>
  );
};
