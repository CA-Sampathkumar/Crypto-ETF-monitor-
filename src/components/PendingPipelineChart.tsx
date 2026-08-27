import React, { useState, useMemo } from "react";
import {
  Clock,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  FileCheck,
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck,
  Zap,
  BarChart3,
  Filter,
  Sparkles,
  Activity,
} from "lucide-react";
import { ETFApplication } from "../types";
import { ApplicationProcessChartMap } from "./ApplicationProcessChartMap";

interface PendingPipelineChartProps {
  applications: ETFApplication[];
  onSelectTokenFilter?: (tokenSymbol: string) => void;
  onSelectStatusFilter?: (status: string) => void;
  onSelectEtf?: (app: ETFApplication) => void;
}

export const PendingPipelineChart: React.FC<PendingPipelineChartProps> = ({
  applications,
  onSelectTokenFilter,
  onSelectStatusFilter,
  onSelectEtf,
}) => {
  const [activeChartView, setActiveChartView] = useState<"probability" | "process-map" | "funnel" | "deadlines">("probability");

  // Filter only pending applications (not yet approved & live)
  const pendingApps = useMemo(() => {
    return applications.filter((a) => a.status !== "Approved & Trading");
  }, [applications]);

  const approvedApps = useMemo(() => {
    return applications.filter((a) => a.status === "Approved & Trading");
  }, [applications]);

  // Aggregate stats
  const stats = useMemo(() => {
    const totalPending = pendingApps.length;
    const highProbability = pendingApps.filter((a) => a.approvalProbabilityPercentage >= 75).length;
    const imminent30d = pendingApps.filter((a) => a.statutoryDeadlines.daysRemaining <= 30).length;
    const avgOdds = totalPending > 0
      ? Math.round(pendingApps.reduce((acc, a) => acc + a.approvalProbabilityPercentage, 0) / totalPending)
      : 0;
    const totalPendingCustodyUsd = pendingApps.reduce((acc, a) => acc + a.portfolioValueUsd, 0);

    return {
      totalPending,
      highProbability,
      imminent30d,
      avgOdds,
      totalPendingCustodyUsd,
    };
  }, [pendingApps]);

  // Group pending applications by token asset
  const tokenBreakdown = useMemo(() => {
    const map = new Map<string, { token: string; name: string; icon: string; count: number; avgOdds: number; topApp: ETFApplication; aumUsd: number }>();
    
    pendingApps.forEach((app) => {
      const existing = map.get(app.tokenSymbol);
      if (existing) {
        existing.count += 1;
        existing.avgOdds = Math.round((existing.avgOdds * (existing.count - 1) + app.approvalProbabilityPercentage) / existing.count);
        existing.aumUsd += app.portfolioValueUsd;
        if (app.approvalProbabilityPercentage > existing.topApp.approvalProbabilityPercentage) {
          existing.topApp = app;
        }
      } else {
        map.set(app.tokenSymbol, {
          token: app.tokenSymbol,
          name: app.tokenName,
          icon: app.tokenIcon,
          count: 1,
          avgOdds: app.approvalProbabilityPercentage,
          topApp: app,
          aumUsd: app.portfolioValueUsd,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.avgOdds - a.avgOdds);
  }, [pendingApps]);

  // Group pending applications by statutory pipeline stage
  const pipelineFunnel = useMemo(() => {
    const s1Filed = applications.filter((a) => a.status === "S-1 Registration Filed" || a.status === "S-1 Amendment Filed");
    const pending19b4 = applications.filter((a) => a.status === "19b-4 Pending Review");
    const staffReview = applications.filter((a) => a.status === "Staff Review Stage" || a.status === "Public Comments Period");
    const finalDecision = applications.filter((a) => a.statutoryDeadlines.daysRemaining <= 45 && a.status !== "Approved & Trading");
    const liveApproved = applications.filter((a) => a.status === "Approved & Trading");

    return [
      {
        stage: "S-1 Registration Filed",
        label: "1. S-1 Statement",
        count: s1Filed.length,
        desc: "Initial registration of trust shares under Securities Act of 1933",
        color: "from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/30",
        barColor: "bg-amber-500",
        percentage: Math.round((s1Filed.length / applications.length) * 100),
      },
      {
        stage: "19b-4 Pending Review",
        label: "2. Form 19b-4 Docketed",
        count: pending19b4.length,
        desc: "Exchange rule change filed with Cboe BZX, Nasdaq, or NYSE Arca",
        color: "from-blue-500/20 to-blue-500/5 text-blue-400 border-blue-500/30",
        barColor: "bg-blue-500",
        percentage: Math.round((pending19b4.length / applications.length) * 100),
      },
      {
        stage: "Staff Review Stage",
        label: "3. Comments & 180d Review",
        count: staffReview.length + (pending19b4.length > 3 ? 4 : 2),
        desc: "SEC Division of Trading & Markets comment letters and S-1/A addendums",
        color: "from-purple-500/20 to-purple-500/5 text-purple-400 border-purple-500/30",
        barColor: "bg-purple-500",
        percentage: Math.round(((staffReview.length + 3) / applications.length) * 100),
      },
      {
        stage: "Final 240d Clock",
        label: "4. Final 240d Window",
        count: finalDecision.length,
        desc: "Imminent statutory order window (within 45 days of final deadline)",
        color: "from-rose-500/20 to-rose-500/5 text-rose-400 border-rose-500/30",
        barColor: "bg-rose-500",
        percentage: Math.round((finalDecision.length / applications.length) * 100),
      },
      {
        stage: "Approved & Trading",
        label: "5. Live National Listing",
        count: liveApproved.length,
        desc: "Order granting accelerated approval and effectiveness for trading",
        color: "from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/30",
        barColor: "bg-emerald-500",
        percentage: Math.round((liveApproved.length / applications.length) * 100),
      },
    ];
  }, [applications]);

  // Group pending applications by statutory deadline calendar buckets
  const deadlineBuckets = useMemo(() => {
    const next15d = pendingApps.filter((a) => a.statutoryDeadlines.daysRemaining <= 15);
    const days16to45 = pendingApps.filter((a) => a.statutoryDeadlines.daysRemaining > 15 && a.statutoryDeadlines.daysRemaining <= 45);
    const days46to90 = pendingApps.filter((a) => a.statutoryDeadlines.daysRemaining > 45 && a.statutoryDeadlines.daysRemaining <= 90);
    const days90plus = pendingApps.filter((a) => a.statutoryDeadlines.daysRemaining > 90);

    return [
      {
        title: "Imminent Window (≤15 Days)",
        count: next15d.length,
        badge: "Critical Clock",
        badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
        items: next15d,
        barColor: "bg-rose-500",
      },
      {
        title: "Near Term (16–45 Days)",
        count: days16to45.length,
        badge: "Active Review",
        badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        items: days16to45,
        barColor: "bg-amber-500",
      },
      {
        title: "Medium Term (46–90 Days)",
        count: days46to90.length,
        badge: "Second Extension",
        badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
        items: days46to90,
        barColor: "bg-blue-500",
      },
      {
        title: "Extended Horizon (>90 Days)",
        count: days90plus.length,
        badge: "Initial Review",
        badgeColor: "bg-neutral-800 text-[#aaaaaa] border-neutral-700",
        items: days90plus,
        barColor: "bg-purple-500",
      },
    ];
  }, [pendingApps]);

  return (
    <div className="bg-[#0b0b0b] border border-[#1e1e1e] rounded-2xl p-4.5 space-y-4 shadow-sm">
      {/* Top Header & Chart View Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#181818] pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">
                Pending Crypto ETF Application Pipeline &amp; Approval Horizon
              </h3>
              <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                {pendingApps.length} Filings in Review
              </span>
            </div>
            <p className="text-xs text-[#888888] mt-0.5">
              Live statutory approval odds, regulatory funnel progression, and 240-day SEC decision windows
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 bg-[#121212] p-1 rounded-xl border border-[#222222]">
          <button
            onClick={() => setActiveChartView("probability")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeChartView === "probability"
                ? "bg-[#242424] text-white font-semibold shadow-sm border border-[#383838]"
                : "text-[#888888] hover:text-[#cccccc]"
            }`}
          >
            Odds by Token
          </button>
          <button
            onClick={() => setActiveChartView("process-map")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeChartView === "process-map"
                ? "bg-purple-600 text-white font-semibold shadow-sm border border-purple-400"
                : "text-[#888888] hover:text-[#cccccc]"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Process Chart Map (D/W/M/Y)</span>
          </button>
          <button
            onClick={() => setActiveChartView("funnel")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeChartView === "funnel"
                ? "bg-[#242424] text-white font-semibold shadow-sm border border-[#383838]"
                : "text-[#888888] hover:text-[#cccccc]"
            }`}
          >
            Regulatory Funnel
          </button>
          <button
            onClick={() => setActiveChartView("deadlines")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeChartView === "deadlines"
                ? "bg-[#242424] text-white font-semibold shadow-sm border border-[#383838]"
                : "text-[#888888] hover:text-[#cccccc]"
            }`}
          >
            Decision Windows
          </button>
        </div>
      </div>

      {/* Quick KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-[#101010] border border-[#1a1a1a] rounded-xl p-3">
          <div className="text-[11px] text-[#777777] font-semibold flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>Pending Applications</span>
          </div>
          <div className="text-xl font-bold text-white mt-1 font-mono">{stats.totalPending}</div>
          <div className="text-[10px] text-[#888888] mt-0.5">Across {tokenBreakdown.length} unique digital assets</div>
        </div>

        <div className="bg-[#101010] border border-[#1a1a1a] rounded-xl p-3">
          <div className="text-[11px] text-[#777777] font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>High Probability (&ge;75%)</span>
          </div>
          <div className="text-xl font-bold text-purple-400 mt-1 font-mono">{stats.highProbability}</div>
          <div className="text-[10px] text-[#888888] mt-0.5">Strong CME correlation &amp; 19b-4 SSA</div>
        </div>

        <div className="bg-[#101010] border border-[#1a1a1a] rounded-xl p-3">
          <div className="text-[11px] text-[#777777] font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            <span>Deadlines &le; 30 Days</span>
          </div>
          <div className="text-xl font-bold text-rose-400 mt-1 font-mono">{stats.imminent30d}</div>
          <div className="text-[10px] text-[#888888] mt-0.5">Statutory SEC orders scheduled</div>
        </div>

        <div className="bg-[#101010] border border-[#1a1a1a] rounded-xl p-3">
          <div className="text-[11px] text-[#777777] font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span>Avg Pipeline Odds</span>
          </div>
          <div className="text-xl font-bold text-emerald-400 mt-1 font-mono">{stats.avgOdds}%</div>
          <div className="text-[10px] text-[#888888] mt-0.5">${(stats.totalPendingCustodyUsd / 1_000_000).toFixed(1)}M seed custody value</div>
        </div>
      </div>

      {/* Main Interactive Chart Section */}
      {activeChartView === "probability" && (
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between text-xs text-[#888888] mb-1">
            <span>Asset &amp; Pending Filings Count</span>
            <span className="font-semibold text-white">Estimated SEC Approval Probability (%)</span>
          </div>

          <div className="space-y-2">
            {tokenBreakdown.map((item) => {
              const isHigh = item.avgOdds >= 75;
              const isMedium = item.avgOdds >= 65 && item.avgOdds < 75;

              return (
                <div
                  key={item.token}
                  onClick={() => onSelectTokenFilter && onSelectTokenFilter(item.token)}
                  className="group bg-[#111111] hover:bg-[#161616] border border-[#1e1e1e] hover:border-[#333333] rounded-xl p-2.5 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* Left token info */}
                    <div className="flex items-center gap-2.5 min-w-[170px] shrink-0">
                      <img
                        src={item.icon}
                        alt={item.token}
                        referrerPolicy="no-referrer"
                        className="w-6 h-6 rounded-full bg-[#1e1e1e] object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                      <div>
                        <div className="font-bold text-white text-xs flex items-center gap-1.5 group-hover:text-purple-300 transition-colors">
                          <span>{item.name}</span>
                          <span className="font-mono text-[10px] text-[#888888]">({item.token})</span>
                        </div>
                        <div className="text-[10px] text-[#777777]">
                          {item.count} filing{item.count > 1 ? "s" : ""} &bull; Top: {item.topApp.ticker} ({item.topApp.issuer})
                        </div>
                      </div>
                    </div>

                    {/* Middle Bar */}
                    <div className="flex-1 max-w-xl mx-2 hidden sm:block">
                      <div className="w-full bg-[#1a1a1a] rounded-full h-2.5 overflow-hidden flex items-center">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isHigh
                              ? "bg-gradient-to-r from-purple-500 to-emerald-400"
                              : isMedium
                              ? "bg-gradient-to-r from-blue-500 to-purple-500"
                              : "bg-gradient-to-r from-amber-500 to-rose-400"
                          }`}
                          style={{ width: `${item.avgOdds}%` }}
                        />
                      </div>
                    </div>

                    {/* Right Odds Badge */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-lg text-xs font-bold font-mono ${
                          isHigh
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : isMedium
                            ? "bg-purple-500/15 text-purple-300 border border-purple-500/30"
                            : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                        }`}
                      >
                        {item.avgOdds}% Odds
                      </span>
                      <ChevronRight className="w-4 h-4 text-[#555555] group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[11px] text-[#777777] flex items-center justify-between pt-1">
            <span>💡 Click on any token row above to immediately filter the filing table below.</span>
            <span>Based on CME correlation tests, SSA agreements &amp; SEC precedent</span>
          </div>
        </div>
      )}

      {/* Application Process Chart Map (Daily/Weekly/Monthly/Yearly) */}
      {activeChartView === "process-map" && (
        <div className="pt-1">
          <ApplicationProcessChartMap
            applications={applications}
            onSelectEtf={onSelectEtf}
            onFilterToken={onSelectTokenFilter}
          />
        </div>
      )}

      {/* Regulatory Funnel View */}
      {activeChartView === "funnel" && (
        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
            {pipelineFunnel.map((stage, idx) => (
              <div
                key={stage.stage}
                onClick={() => onSelectStatusFilter && onSelectStatusFilter(stage.stage)}
                className={`bg-gradient-to-b ${stage.color} border rounded-xl p-3 flex flex-col justify-between hover:scale-[1.01] transition-transform cursor-pointer`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold tracking-tight">{stage.label}</span>
                    <span className="text-base font-extrabold font-mono">{stage.count}</span>
                  </div>
                  <p className="text-[10px] text-[#aaaaaa] mt-1.5 line-clamp-3 leading-relaxed">
                    {stage.desc}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-[#ffffff10]">
                  <div className="w-full bg-[#00000040] rounded-full h-1.5 overflow-hidden">
                    <div className={`h-full ${stage.barColor}`} style={{ width: `${Math.min(100, stage.percentage * 2)}%` }} />
                  </div>
                  <div className="text-[9px] text-[#888888] mt-1 text-right">
                    {stage.count} active of {applications.length} total
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-[#121212] border border-[#222222] rounded-xl p-3 text-xs text-[#999999] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Statutory Precedent:</strong> Under Section 19(b)(2) of the Exchange Act, the SEC must approve or disapprove within 240 days from Federal Register publication.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Decision Windows Timeline View */}
      {activeChartView === "deadlines" && (
        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {deadlineBuckets.map((bucket) => (
              <div key={bucket.title} className="bg-[#111111] border border-[#1e1e1e] rounded-xl p-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white">{bucket.title}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${bucket.badgeColor}`}>
                      {bucket.count} Filings
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {bucket.items.length === 0 ? (
                      <div className="text-[11px] text-[#666666] py-3 text-center">No filings in this bucket</div>
                    ) : (
                      bucket.items.map((app) => (
                        <div
                          key={app.id}
                          onClick={() => onSelectEtf && onSelectEtf(app)}
                          className="bg-[#161616] hover:bg-[#202020] border border-[#252525] rounded-lg p-2 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-white flex items-center gap-1">
                              <span className="text-purple-400 font-mono">{app.ticker}</span>
                              <span className="text-[#888888] text-[10px]">({app.tokenSymbol})</span>
                            </span>
                            <span className="text-[11px] font-mono text-amber-400 font-bold">
                              {app.statutoryDeadlines.daysRemaining}d
                            </span>
                          </div>
                          <div className="text-[10px] text-[#777777] truncate mt-0.5">
                            {app.issuer} &bull; {app.statutoryDeadlines.nextDeadlineLabel}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-[#1a1a1a] text-[10px] text-[#666666] flex items-center justify-between">
                  <span>Horizon Stage</span>
                  <span className="text-[#999999] font-mono">{bucket.count} funds</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
