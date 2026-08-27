import React, { useMemo, useState, useEffect } from "react";
import {
  Vault,
  ShieldCheck,
  Coins,
  PieChart,
  TrendingUp,
  Lock,
  ArrowUpRight,
  CheckCircle2,
  Search,
} from "lucide-react";
import { ETFApplication, TokenSummary } from "../types";
import { PaginationControls } from "./PaginationControls";

interface PortfolioHoldingsViewProps {
  applications: ETFApplication[];
  onSelectEtf: (app: ETFApplication) => void;
}

export const PortfolioHoldingsView: React.FC<PortfolioHoldingsViewProps> = ({
  applications,
  onSelectEtf,
}) => {
  const [selectedTokenTab, setSelectedTokenTab] = useState<string>("ALL");
  const [holdingsSearch, setHoldingsSearch] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTokenTab, holdingsSearch]);

  // Token summaries
  const tokenSummaries: TokenSummary[] = useMemo(() => {
    const tokenMap = new Map<string, TokenSummary>();

    applications.forEach((app) => {
      const existing = tokenMap.get(app.tokenSymbol);
      if (existing) {
        existing.totalEtfHoldings += app.tokensHeld;
        existing.totalEtfHoldingsUsd += app.portfolioValueUsd;
        existing.totalFilingsCount += 1;
        if (app.status === "Approved & Trading") existing.approvedFilingsCount += 1;
        else existing.pendingFilingsCount += 1;
      } else {
        tokenMap.set(app.tokenSymbol, {
          symbol: app.tokenSymbol,
          name: app.tokenName,
          priceUsd: app.currentPriceUsd,
          price24hChange: app.price24hChange,
          totalEtfHoldings: app.tokensHeld,
          totalEtfHoldingsUsd: app.portfolioValueUsd,
          supplyPercentageLocked: (app.tokensHeld / app.circulatingSupply) * 100,
          totalFilingsCount: 1,
          approvedFilingsCount: app.status === "Approved & Trading" ? 1 : 0,
          pendingFilingsCount: app.status === "Approved & Trading" ? 0 : 1,
          averageApprovalProbability: app.approvalProbabilityPercentage,
        });
      }
    });

    return Array.from(tokenMap.values()).map((t) => {
      const appList = applications.filter((a) => a.tokenSymbol === t.symbol);
      const avgProb = Math.round(appList.reduce((sum, a) => sum + a.approvalProbabilityPercentage, 0) / appList.length);
      const supply = appList[0]?.circulatingSupply || 1;
      return {
        ...t,
        averageApprovalProbability: avgProb,
        supplyPercentageLocked: (t.totalEtfHoldings / supply) * 100,
      };
    });
  }, [applications]);

  // Custodian allocation breakdown
  const custodianBreakdown = useMemo(() => {
    const map = new Map<string, { name: string; totalUsd: number; count: number; coldStorage: number }>();
    applications.forEach((app) => {
      const key = app.custodian.name;
      const existing = map.get(key);
      if (existing) {
        existing.totalUsd += app.portfolioValueUsd;
        existing.count += 1;
      } else {
        map.set(key, {
          name: app.custodian.name,
          totalUsd: app.portfolioValueUsd,
          count: 1,
          coldStorage: app.custodian.coldStoragePercentage,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.totalUsd - a.totalUsd);
  }, [applications]);

  const totalVaultValueUsd = applications.reduce((sum, a) => sum + a.portfolioValueUsd, 0);

  const filteredApps = useMemo(() => {
    const q = holdingsSearch.toLowerCase().trim();
    let list = selectedTokenTab === "ALL" ? applications : applications.filter((a) => a.tokenSymbol === selectedTokenTab);
    if (q) {
      list = list.filter(
        (a) =>
          a.fundName.toLowerCase().includes(q) ||
          a.ticker.toLowerCase().includes(q) ||
          a.issuer.toLowerCase().includes(q) ||
          a.custodian.name.toLowerCase().includes(q) ||
          a.tokenSymbol.toLowerCase().includes(q)
      );
    }
    return list;
  }, [applications, selectedTokenTab, holdingsSearch]);

  const paginatedApps = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredApps.slice(start, start + pageSize);
  }, [filteredApps, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      {/* Top Banner Overview */}
      <div className="bg-gradient-to-r from-[#0d0d0d] via-[#111111] to-[#0d0d0d] border border-[#1e1e1e] rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              Qualified Institutional Custody Reserves
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Cryptocurrency ETF Holdings & Portfolio Balances
            </h2>
            <p className="text-xs text-[#888888] mt-1 max-w-2xl leading-relaxed">
              Track token reserve counts held in segregated cold-storage vaults across Coinbase Custody, BitGo, Gemini, and Fidelity. Includes active spot reserves and initial seed allocations.
            </p>
          </div>

          <div className="bg-[#080808] border border-[#1c1c1c] rounded-2xl p-4 shrink-0 min-w-[240px]">
            <div className="text-xs text-[#888888] font-semibold uppercase">Total Tracked Vault Valuation</div>
            <div className="text-3xl font-extrabold text-white mt-1">
              ${(totalVaultValueUsd / 1_000_000_000).toFixed(2)} Billion
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-emerald-400">
              <Lock className="w-3.5 h-3.5" />
              <span>100% Insured Qualified Custody</span>
            </div>
          </div>
        </div>
      </div>

      {/* Token Reserves Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Coins className="w-4 h-4 text-emerald-400" />
            <span>Token-by-Token Custody & Supply Lock Analysis</span>
          </h3>
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedTokenTab("ALL")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                selectedTokenTab === "ALL"
                  ? "bg-[#222222] text-white border border-[#3a3a3a]"
                  : "bg-[#0f0f0f] text-[#888888] hover:text-[#cccccc] border border-[#1e1e1e]"
              }`}
            >
              All Assets
            </button>
            {tokenSummaries.map((t) => (
              <button
                key={t.symbol}
                onClick={() => setSelectedTokenTab(t.symbol)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  selectedTokenTab === t.symbol
                    ? "bg-[#222222] text-white border border-[#3a3a3a]"
                    : "bg-[#0f0f0f] text-[#888888] hover:text-[#cccccc] border border-[#1e1e1e]"
                }`}
              >
                {t.symbol}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tokenSummaries.map((t) => {
            const tokenApps = applications.filter((a) => a.tokenSymbol === t.symbol);
            return (
              <div
                key={t.symbol}
                className="bg-[#0f0f0f] border border-[#1e1e1e] rounded-2xl p-5 hover:border-[#2a2a2a] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#181818] border border-[#2a2a2a] flex items-center justify-center font-bold text-white text-xs">
                        {t.symbol}
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm">{t.name}</div>
                        <div className="text-xs text-[#888888] flex items-center gap-1.5">
                          <span>${t.priceUsd.toLocaleString()}</span>
                          <span className={t.price24hChange >= 0 ? "text-emerald-400 font-medium" : "text-rose-400 font-medium"}>
                            {t.price24hChange >= 0 ? "+" : ""}{t.price24hChange}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {t.totalFilingsCount} Filings
                      </span>
                    </div>
                  </div>

                  {/* Portfolio Figures */}
                  <div className="bg-[#080808] rounded-xl p-3 border border-[#1c1c1c] mb-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#888888]">Total Tokens Held:</span>
                      <span className="font-semibold text-white font-mono">
                        {t.totalEtfHoldings.toLocaleString()} {t.symbol}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#888888]">USD Reserve Value:</span>
                      <span className="font-bold text-white font-mono">
                        {t.totalEtfHoldingsUsd >= 1_000_000_000
                          ? `$${(t.totalEtfHoldingsUsd / 1_000_000_000).toFixed(2)}B`
                          : `$${(t.totalEtfHoldingsUsd / 1_000_000).toFixed(2)}M`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#888888]">% Circulating Supply Locked:</span>
                      <span className="font-semibold text-emerald-400 font-mono">
                        {t.supplyPercentageLocked.toFixed(3)}%
                      </span>
                    </div>
                  </div>

                  {/* Supply Progress Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-[11px] text-[#888888] mb-1">
                      <span>ETF Supply Absorption</span>
                      <span className="text-[#cccccc]">{t.supplyPercentageLocked.toFixed(2)}% of supply</span>
                    </div>
                    <div className="w-full bg-[#181818] rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-400 h-full rounded-full"
                        style={{ width: `${Math.min(100, Math.max(5, t.supplyPercentageLocked * 20))}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Issuers listing */}
                <div className="pt-3 border-t border-[#181818] flex items-center justify-between text-xs text-[#888888]">
                  <div className="truncate max-w-[190px]">
                    <span className="text-[#666666]">Applicants: </span>
                    <span className="text-[#cccccc] font-medium">
                      {tokenApps.map((a) => a.issuer).join(", ")}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedTokenTab(t.symbol)}
                    className="text-[#aaaaaa] hover:text-white flex items-center gap-0.5 shrink-0 transition-colors"
                  >
                    View <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custodian Market Share Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-[#0f0f0f] border border-[#1e1e1e] rounded-2xl p-5 shadow-sm">
          <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Vault className="w-4 h-4 text-emerald-400" />
            <span>Qualified Custodian Market Share</span>
          </h4>
          <p className="text-xs text-[#888888] mb-4">
            Securities Exchange Act requires ETF trust reserves to be held in qualified institutional cold storage vaults.
          </p>

          <div className="space-y-3">
            {custodianBreakdown.map((cust) => {
              const share = (cust.totalUsd / totalVaultValueUsd) * 100;
              return (
                <div key={cust.name} className="bg-[#080808] border border-[#1c1c1c] rounded-xl p-3">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-[#e0e0e0]">{cust.name}</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      ${(cust.totalUsd / 1_000_000_000).toFixed(2)}B ({share.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#181818] rounded-full h-2 overflow-hidden mb-1.5">
                    <div className="bg-neutral-300 h-full rounded-full" style={{ width: `${share}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#777777]">
                    <span>{cust.count} ETF Trust Portfolios</span>
                    <span>{cust.coldStorage}% Cold Storage Segregation</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Application Portfolio Table */}
        <div className="bg-[#0f0f0f] border border-[#1e1e1e] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <PieChart className="w-4 h-4 text-purple-400" />
                <span>Filing-by-Filing Portfolio Balances ({filteredApps.length})</span>
              </h4>
              <div className="relative">
                <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#666666]" />
                <input
                  type="text"
                  placeholder="Search funds..."
                  value={holdingsSearch}
                  onChange={(e) => setHoldingsSearch(e.target.value)}
                  className="bg-[#080808] border border-[#222222] text-xs text-white rounded-lg pl-7 pr-2.5 py-1 focus:outline-none focus:border-emerald-500 w-full sm:w-36"
                />
              </div>
            </div>
            <p className="text-xs text-[#888888] mb-3">
              Click any filing to inspect the official Form S-1 / 19b-4 custody agreement details.
            </p>

            <div className="space-y-2 mb-4">
              {filteredApps.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#777777] bg-[#080808] rounded-xl border border-[#1c1c1c]">
                  No ETF portfolio holdings found matching query
                </div>
              ) : (
                paginatedApps.map((app) => (
                  <div
                    key={app.id}
                    onClick={() => onSelectEtf(app)}
                    className="bg-[#080808] border border-[#1c1c1c] hover:border-[#2a2a2a] rounded-xl p-3 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#181818] border border-[#2a2a2a] flex items-center justify-center text-xs font-bold text-white">
                        {app.tokenSymbol}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white">{app.fundName}</div>
                        <div className="text-[11px] text-[#777777]">
                          {app.issuer} &bull; Custodian: {app.custodian.name.split(" ")[0]}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-white font-mono">
                        {app.tokensHeld.toLocaleString()} {app.tokenSymbol}
                      </div>
                      <div className="text-[11px] text-emerald-400 font-semibold">
                        ${(app.portfolioValueUsd / (app.portfolioValueUsd >= 1e9 ? 1e9 : 1e6)).toFixed(1)}
                        {app.portfolioValueUsd >= 1e9 ? "B" : "M"}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pagination Controls */}
          {filteredApps.length > 0 && (
            <div className="pt-2 border-t border-[#181818]">
              <PaginationControls
                currentPage={currentPage}
                totalItems={filteredApps.length}
                pageSize={pageSize}
                onPageChange={(page) => setCurrentPage(page)}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
                pageSizeOptions={[10, 20, 50]}
                itemLabel="funds"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
