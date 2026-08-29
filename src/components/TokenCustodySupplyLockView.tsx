import React, { useState, useMemo } from "react";
import {
  ShieldCheck,
  Lock,
  Coins,
  TrendingUp,
  Building,
  Key,
  Layers,
  Search,
  Filter,
  Download,
  ExternalLink,
  Info,
  CheckCircle2,
  AlertTriangle,
  Zap,
  DollarSign,
  Percent,
} from "lucide-react";
import { TokenCustodyLockAnalysis, ETFApplication } from "../types";
import { TOKEN_CUSTODY_LOCK_ANALYSIS_DATA } from "../data/custodyAndPipelineData";
import { PaginationControls } from "./PaginationControls";

interface TokenCustodySupplyLockViewProps {
  applications: ETFApplication[];
  onSelectEtfBySymbol?: (symbol: string) => void;
}

export const TokenCustodySupplyLockView: React.FC<TokenCustodySupplyLockViewProps> = ({
  applications,
  onSelectEtfBySymbol,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedCustodian, setSelectedCustodian] = useState("ALL");
  const [stakingFilter, setStakingFilter] = useState("ALL"); // ALL, STAKING_ENABLED, STAKING_DISABLED
  const [selectedTokenDetail, setSelectedTokenDetail] = useState<TokenCustodyLockAnalysis | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const categories = ["ALL", "Store of Value", "Smart Contracts (L1)", "Payment & Settlements", "DeFi", "AI & Compute"];
  const custodiansList = [
    "ALL",
    "Coinbase Custody",
    "Fidelity Digital",
    "BitGo Trust",
    "Anchorage Digital Bank",
    "Gemini Trust",
  ];

  // Live dynamic token custody and supply data synchronized with Binance prices
  const liveCustodyData = useMemo(() => {
    const priceMap = new Map<string, { priceUsd: number; change24h: number }>();
    applications.forEach((a) => {
      if (a.currentPriceUsd > 0) {
        priceMap.set(a.tokenSymbol.toUpperCase(), {
          priceUsd: a.currentPriceUsd,
          change24h: a.price24hChange,
        });
      }
    });

    return TOKEN_CUSTODY_LOCK_ANALYSIS_DATA.map((item) => {
      const liveInfo = priceMap.get(item.tokenSymbol.toUpperCase());
      const priceUsd = liveInfo ? liveInfo.priceUsd : item.priceUsd;
      const price24hChange = liveInfo ? liveInfo.change24h : item.price24hChange;
      const marketCapUsd = Math.round(item.circulatingSupply * priceUsd);
      const totalUsdLockedInEtfs = Math.round(item.totalTokensHeldInEtfs * priceUsd);

      const updatedCustodians = item.custodians.map((c) => ({
        ...c,
        usdValue: Math.round(c.tokensHeld * priceUsd),
      }));

      return {
        ...item,
        priceUsd,
        price24hChange,
        marketCapUsd,
        totalUsdLockedInEtfs,
        custodians: updatedCustodians,
      };
    });
  }, [applications]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    let totalUsdLocked = 0;
    let totalFilings = 0;
    let totalApproved = 0;

    liveCustodyData.forEach((item) => {
      totalUsdLocked += item.totalUsdLockedInEtfs;
      totalFilings += item.etfFilingsCount;
      totalApproved += item.approvedFundsCount;
    });

    return {
      totalUsdLocked,
      totalFilings,
      totalApproved,
      topCustodian: "Coinbase Custody Trust Company LLC (~85% Market Share)",
    };
  }, [liveCustodyData]);

  // Filter list
  const filteredData = useMemo(() => {
    return liveCustodyData.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.tokenSymbol.toLowerCase().includes(q) ||
        item.tokenName.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.custodians.some((c) => c.name.toLowerCase().includes(q));

      const matchesCategory =
        selectedCategory === "ALL" || item.category === selectedCategory;

      const matchesCustodian =
        selectedCustodian === "ALL" ||
        item.custodians.some((c) => c.name.toLowerCase().includes(selectedCustodian.toLowerCase()));

      const matchesStaking =
        stakingFilter === "ALL" ||
        (stakingFilter === "STAKING_ENABLED" && item.stakingStatus.enabled) ||
        (stakingFilter === "STAKING_DISABLED" && !item.stakingStatus.enabled);

      return matchesSearch && matchesCategory && matchesCustodian && matchesStaking;
    });
  }, [liveCustodyData, searchQuery, selectedCategory, selectedCustodian, stakingFilter]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const formatUsd = (val: number) => {
    if (!val || isNaN(val)) return "$0";
    if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
    if (val >= 1e3) return `$${(val / 1e3).toFixed(0)}K`;
    return `$${val.toLocaleString()}`;
  };

  const handleExportCsv = () => {
    const headers = [
      "Token Symbol",
      "Token Name",
      "Category",
      "Live Price USD",
      "Circulating Supply",
      "Market Cap USD",
      "Total Tokens in ETFs",
      "Total USD Locked in ETFs",
      "Supply Locked %",
      "Primary Custodians",
      "Cold Storage %",
      "Staking Enabled",
      "Staking Yield %",
      "Insurance Coverage ($M)",
      "Multi-Sig Scheme",
    ];

    const rows = filteredData.map((item) => [
      item.tokenSymbol,
      `"${item.tokenName}"`,
      `"${item.category}"`,
      item.priceUsd,
      item.circulatingSupply,
      item.marketCapUsd,
      item.totalTokensHeldInEtfs,
      item.totalUsdLockedInEtfs,
      `${item.percentageCirculatingSupplyLocked}%`,
      `"${item.custodians.map((c) => c.name.split(" ")[0]).join(", ")}"`,
      "100%",
      item.stakingStatus.enabled ? "Yes" : "No",
      item.stakingStatus.yieldPercentage ? `${item.stakingStatus.yieldPercentage}%` : "N/A",
      item.custodians.reduce((acc, c) => acc + c.insuranceCoverageMillionUsd, 0),
      `"${item.securityAndAudits.multiSigScheme}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `token_custody_supply_lock_analysis.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="custody-supply-lock-container" className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-[#0f0f0f] border border-[#1e1e1e] rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-950/60 text-purple-300 border border-purple-500/30 flex items-center gap-1.5 shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                Institutional Custody &amp; Supply Lock Analysis
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#181818] text-[#cccccc] border border-[#2a2a2a]">
                100% Segregated Cold Storage Vaults
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Token-by-Token Custody Architecture &amp; Reserve Lockup
            </h2>
            <p className="text-xs text-[#888888] mt-1 max-w-3xl">
              Examines qualified custody providers, multi-sig key ceremonies, specie insurance policies, and the precise percentage of circulating supply locked in regulated spot ETF trusts.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              id="btn-export-custody-csv"
              onClick={handleExportCsv}
              className="px-3.5 py-2 rounded-2xl bg-[#181818] hover:bg-[#222222] text-[#cccccc] hover:text-white text-xs font-semibold border border-[#2a2a2a] transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Custody Report</span>
            </button>
          </div>
        </div>

        {/* Aggregate KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-[#1a1a1a]">
          <div className="bg-[#080808] border border-[#1c1c1c] rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs text-[#888888]">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Total USD Value Locked</span>
              <Lock className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-bold text-white font-mono">
              {formatUsd(metrics.totalUsdLocked)}
            </div>
            <div className="text-[11px] text-emerald-400 font-medium mt-0.5">
              Held across approved &amp; pending filings
            </div>
          </div>

          <div className="bg-[#080808] border border-[#1c1c1c] rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs text-[#888888]">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Top Qualified Custodian</span>
              <Building className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="mt-2 text-base font-bold text-white leading-tight">
              Coinbase Custody
            </div>
            <div className="text-[11px] text-cyan-400 font-medium mt-0.5">
              NYDFS Trust Company (~85% Market Share)
            </div>
          </div>

          <div className="bg-[#080808] border border-[#1c1c1c] rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs text-[#888888]">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Vault Security Standard</span>
              <Key className="w-4 h-4 text-purple-400" />
            </div>
            <div className="mt-2 text-base font-bold text-white leading-tight">
              100% Cold Storage
            </div>
            <div className="text-[11px] text-purple-400 font-medium mt-0.5">
              Air-Gapped HSMs &amp; MPC Shards
            </div>
          </div>

          <div className="bg-[#080808] border border-[#1c1c1c] rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs text-[#888888]">
              <span className="font-semibold uppercase tracking-wider text-[10px]">SEC Rule 15c3-3 Segregation</span>
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-2 text-base font-bold text-amber-400 leading-tight">
              100% Compliant
            </div>
            <div className="text-[11px] text-amber-400/80 font-medium mt-0.5">
              Bankruptcy-remote fiduciary accounts
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-[#0c0c0c] p-3 rounded-2xl border border-[#1a1a1a]">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#777777]" />
          <input
            id="input-search-custody"
            type="text"
            placeholder="Search token, category, or custodian..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#141414] border border-[#242424] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-[#666666] focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Custodian Filter */}
          <select
            id="select-custodian-filter"
            value={selectedCustodian}
            onChange={(e) => setSelectedCustodian(e.target.value)}
            aria-label="Filter by custodian"
            className="bg-[#141414] border border-[#242424] text-xs text-white rounded-xl px-3 py-1.5 focus:outline-none focus:border-purple-500 cursor-pointer"
          >
            {custodiansList.map((c) => (
              <option key={c} value={c}>
                {c === "ALL" ? "All Custodians" : c}
              </option>
            ))}
          </select>

          {/* Staking Status Filter */}
          <select
            id="select-staking-filter"
            value={stakingFilter}
            onChange={(e) => setStakingFilter(e.target.value)}
            aria-label="Filter by staking status"
            className="bg-[#141414] border border-[#242424] text-xs text-white rounded-xl px-3 py-1.5 focus:outline-none focus:border-purple-500 cursor-pointer"
          >
            <option value="ALL">All Staking Modes</option>
            <option value="STAKING_ENABLED">Staking Active / Staked</option>
            <option value="STAKING_DISABLED">Non-Staked / Pure Physical</option>
          </select>
        </div>
      </div>

      {/* Main Token Custody Table & Cards */}
      <div className="space-y-4">
        {paginatedData.map((item) => {
          const totalInsurance = item.custodians.reduce((acc, c) => acc + c.insuranceCoverageMillionUsd, 0);

          return (
            <div
              key={item.tokenSymbol}
              id={`custody-token-${item.tokenSymbol}`}
              className="bg-[#0d0d0d] border border-[#1e1e1e] hover:border-[#2a2a2a] rounded-2xl p-5 transition-all space-y-4 shadow-sm"
            >
              {/* Header: Token Info, Price, Market Cap, Supply Lock Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#181818] pb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={item.tokenIcon}
                    alt={item.tokenName}
                    className="w-10 h-10 rounded-full bg-[#181818] p-1 border border-[#262626]"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png";
                    }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">{item.tokenName}</h3>
                      <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-[#1a1a1a] text-emerald-400 border border-[#262626]">
                        {item.tokenSymbol}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] uppercase font-bold bg-[#141414] text-[#888888] border border-[#202020]">
                        {item.category}
                      </span>
                    </div>
                    <div className="text-xs text-[#777777] mt-0.5 flex items-center gap-3">
                      <span>Live Price: <strong className="text-white font-mono">${item.priceUsd.toLocaleString()}</strong></span>
                      <span>&bull;</span>
                      <span>Market Cap: <strong className="text-[#cccccc] font-mono">{formatUsd(item.marketCapUsd)}</strong></span>
                      <span>&bull;</span>
                      <span>Circulating: <strong className="text-[#aaaaaa] font-mono">{item.circulatingSupply.toLocaleString()} {item.tokenSymbol}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Supply Lock Stat Box */}
                <div className="flex items-center gap-4 bg-[#080808] px-4 py-2.5 rounded-2xl border border-[#222222]">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-[#888888]">Supply Locked in ETFs</div>
                    <div className="text-lg font-black font-mono text-purple-400">
                      {item.percentageCirculatingSupplyLocked.toFixed(3)}%
                    </div>
                  </div>
                  <div className="h-8 w-px bg-[#222222]" />
                  <div>
                    <div className="text-[10px] uppercase font-bold text-[#888888]">Total USD Locked</div>
                    <div className="text-lg font-black font-mono text-emerald-400">
                      {formatUsd(item.totalUsdLockedInEtfs)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Custody Architecture Matrix */}
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-[#888888] flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Qualified Custodian Allocation &amp; Cold Storage Protocols</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {item.custodians.map((cust, idx) => (
                    <div
                      key={idx}
                      className="bg-[#121212] border border-[#222222] rounded-xl p-3 flex flex-col justify-between text-xs space-y-2"
                    >
                      <div>
                        <div className="font-bold text-white flex items-center justify-between">
                          <span>{cust.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/70 text-emerald-400 border border-emerald-500/30">
                            {cust.coldStoragePercentage}% Cold
                          </span>
                        </div>
                        <div className="text-[11px] text-[#777777] mt-0.5">{cust.type} &bull; {cust.jurisdiction}</div>
                      </div>

                      <div className="flex items-center justify-between border-t border-[#1e1e1e] pt-2 text-[11px] font-mono">
                        <span className="text-[#888888]">
                          Held: <strong className="text-white">{cust.tokensHeld.toLocaleString()} {item.tokenSymbol}</strong>
                        </span>
                        <span className="text-emerald-400 font-bold">
                          {formatUsd(cust.usdValue)}
                        </span>
                      </div>

                      <div className="text-[10px] text-[#666666] flex items-center justify-between">
                        <span>Insurance Policy:</span>
                        <span className="text-cyan-300 font-semibold">${cust.insuranceCoverageMillionUsd}M USD</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security, Multi-Sig & Staking Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {/* Security and Audits */}
                <div className="bg-[#090909] border border-[#1b1b1b] rounded-xl p-3 space-y-2 text-xs">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-purple-400" />
                    <span>Cryptographic Architecture &amp; SOC Compliance</span>
                  </div>
                  <p className="text-[11px] text-[#aaaaaa]">
                    <strong className="text-white">Key Ceremony:</strong> {item.securityAndAudits.multiSigScheme}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="px-2 py-0.5 rounded bg-[#161616] text-[#cccccc] border border-[#252525] text-[10px] font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> SOC 1 Type II
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#161616] text-[#cccccc] border border-[#252525] text-[10px] font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> SOC 2 Type II
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#161616] text-[#cccccc] border border-[#252525] text-[10px] font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Rule 15c3-3 Segregation
                    </span>
                  </div>
                </div>

                {/* Staking Lock Mechanics */}
                <div className="bg-[#090909] border border-[#1b1b1b] rounded-xl p-3 space-y-2 text-xs">
                  <div className="font-bold text-white flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Validator Staking Mechanics</span>
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        item.stakingStatus.enabled
                          ? "bg-emerald-950/80 text-emerald-400 border border-emerald-500/40"
                          : "bg-[#181818] text-[#888888] border border-[#282828]"
                      }`}
                    >
                      {item.stakingStatus.enabled ? "Staking Active" : "Non-Staked Physical Reserve"}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#aaaaaa]">
                    {item.stakingStatus.notes}
                  </p>
                  {item.stakingStatus.yieldPercentage && (
                    <div className="text-[11px] font-mono text-amber-300 font-bold">
                      Estimated Pass-Through Staking Yield: {item.stakingStatus.yieldPercentage}% APR
                    </div>
                  )}
                </div>
              </div>

              {/* View Filings Button Footer */}
              {onSelectEtfBySymbol && (
                <div className="flex items-center justify-between pt-3 border-t border-[#181818] text-xs">
                  <div className="text-[11px] text-[#666666]">
                    Total Registered Filings: <strong className="text-[#cccccc]">{item.etfFilingsCount}</strong> ({item.approvedFundsCount} Approved, {item.pendingFundsCount} Pending)
                  </div>
                  <button
                    onClick={() => onSelectEtfBySymbol(item.tokenSymbol)}
                    className="px-3 py-1 rounded-xl bg-[#161616] hover:bg-[#202020] text-emerald-400 hover:text-emerald-300 border border-[#2a2a2a] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>View {item.tokenSymbol} Filings</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      <PaginationControls
        currentPage={currentPage}
        totalItems={filteredData.length}
        pageSize={pageSize}
        onPageChange={(page) => setCurrentPage(page)}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
        pageSizeOptions={[10, 20]}
        itemLabel="token custody analysis records"
      />
    </div>
  );
};
