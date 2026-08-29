import React, { useState, useMemo } from "react";
import {
  Wallet,
  Building,
  CheckCircle2,
  AlertTriangle,
  FilePlus,
  Zap,
  Search,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Download,
  Key,
  Layers,
  ArrowRight,
  Info,
  Sparkles,
  Sliders,
  DollarSign,
  PieChart,
  Copy,
  Check,
  Activity,
  Filter,
  RefreshCw,
} from "lucide-react";
import { ETFApplication, IssuerWalletInfo, UntappedTokenCandidate, ListingExchange, MasterWalletAddress, IssuerSupportedToken } from "../types";
import { KNOWN_ISSUER_WALLETS_DATA, UNTAPPED_TOKEN_CANDIDATES } from "../data/custodyAndPipelineData";

interface IssuerWalletsUntappedPipelineViewProps {
  applications: ETFApplication[];
  onAddApplicationDirectly?: (app: ETFApplication) => void;
  onSelectEtfBySymbol?: (symbol: string) => void;
}

export const IssuerWalletsUntappedPipelineView: React.FC<IssuerWalletsUntappedPipelineViewProps> = ({
  applications,
  onAddApplicationDirectly,
  onSelectEtfBySymbol,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"COMPARISON_MATRIX" | "UNAPPLIED_DASHBOARD" | "ISSUER_WALLETS">("ISSUER_WALLETS");
  const [selectedIssuer, setSelectedIssuer] = useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [selectedSimulationToken, setSelectedSimulationToken] = useState<UntappedTokenCandidate | null>(null);

  // Simulation Form State
  const [simIssuer, setSimIssuer] = useState<string>("Bitwise Asset Management");
  const [simExchange, setSimExchange] = useState<ListingExchange>("Nasdaq");
  const [simCustodian, setSimCustodian] = useState<string>("Coinbase Custody Trust Company LLC");
  const [simFee, setSimFee] = useState<number>(0.25);
  const [simTicker, setSimTicker] = useState<string>("");
  const [isSimulatedSuccess, setIsSimulatedSuccess] = useState<boolean>(false);

  // Build a Set of symbols currently in ETF applications database
  const activeEtfSymbols = useMemo(() => {
    const set = new Set<string>();
    applications.forEach((a) => set.add(a.tokenSymbol.toUpperCase()));
    return set;
  }, [applications]);

  // Copy wallet address helper
  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => {
      setCopiedAddress(null);
    }, 2000);
  };

  // Helper to determine token status in applications DB
  const getTokenFilingStatus = (symbol: string, issuerName?: string) => {
    const matchingApp = applications.find(
      (a) => a.tokenSymbol.toUpperCase() === symbol.toUpperCase() && (!issuerName || a.issuer === issuerName)
    );
    if (!matchingApp) {
      const anyApp = applications.find((a) => a.tokenSymbol.toUpperCase() === symbol.toUpperCase());
      if (!anyApp) return { hasActiveEtf: false, statusType: "UNTAPPED", label: "No Active ETF in Database", color: "amber" };
      return {
        hasActiveEtf: true,
        statusType: anyApp.status === "Approved & Trading" ? "APPROVED" : anyApp.filingType === "Form S-1" ? "APPLIED_S1" : "PENDING_240D",
        label: anyApp.status,
        color: anyApp.status === "Approved & Trading" ? "emerald" : "yellow",
        ticker: anyApp.ticker,
      };
    }

    const isApproved = matchingApp.status === "Approved & Trading" || matchingApp.approvalProbabilityPercentage === 100;
    const isS1 = matchingApp.filingType === "Form S-1" && !matchingApp.statutoryDeadlines?.federalRegisterDate;

    return {
      hasActiveEtf: true,
      statusType: isApproved ? "APPROVED" : isS1 ? "APPLIED_S1" : "PENDING_240D",
      label: matchingApp.status,
      color: isApproved ? "emerald" : isS1 ? "blue" : "yellow",
      ticker: matchingApp.ticker,
    };
  };

  // Aggregate Cross-Comparison Matrix across all issuers
  const crossComparisonRows = useMemo(() => {
    const rows: Array<{
      issuerId: string;
      issuerName: string;
      tokenSymbol: string;
      tokenName: string;
      tokensHeld: number;
      usdValue: number;
      walletAddress?: string;
      explorerUrl?: string;
      explorerName?: string;
      custodian?: string;
      verifiedOnChain?: boolean;
      hasActiveEtf: boolean;
      statusType: string;
      statusLabel: string;
      statusColor: string;
      etfTicker?: string;
    }> = [];

    KNOWN_ISSUER_WALLETS_DATA.forEach((issuer) => {
      if (selectedIssuer !== "ALL" && issuer.issuerId !== selectedIssuer) return;

      issuer.supportedTokens.forEach((token) => {
        const filingInfo = getTokenFilingStatus(token.symbol, issuer.issuerName);

        // Filter by ETF application status if selected
        if (selectedStatusFilter !== "ALL") {
          if (selectedStatusFilter === "UNTAPPED" && filingInfo.hasActiveEtf) return;
          if (selectedStatusFilter === "APPROVED" && filingInfo.statusType !== "APPROVED") return;
          if (selectedStatusFilter === "PENDING_240D" && filingInfo.statusType !== "PENDING_240D") return;
          if (selectedStatusFilter === "APPLIED_S1" && filingInfo.statusType !== "APPLIED_S1") return;
        }

        rows.push({
          issuerId: issuer.issuerId,
          issuerName: issuer.issuerName,
          tokenSymbol: token.symbol,
          tokenName: token.name,
          tokensHeld: token.tokensHeld,
          usdValue: token.usdValue,
          walletAddress: token.walletAddress,
          explorerUrl: token.explorerUrl,
          explorerName: token.explorerName,
          custodian: token.custodian,
          verifiedOnChain: token.verifiedOnChain,
          hasActiveEtf: filingInfo.hasActiveEtf,
          statusType: filingInfo.statusType,
          statusLabel: filingInfo.label,
          statusColor: filingInfo.color,
          etfTicker: filingInfo.ticker || token.etfTicker,
        });
      });
    });

    return rows.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      return (
        !q ||
        r.issuerName.toLowerCase().includes(q) ||
        r.tokenSymbol.toLowerCase().includes(q) ||
        r.tokenName.toLowerCase().includes(q) ||
        (r.walletAddress && r.walletAddress.toLowerCase().includes(q))
      );
    });
  }, [applications, selectedIssuer, selectedStatusFilter, searchQuery]);

  // Filtered Issuers dataset
  const filteredIssuers = useMemo(() => {
    return KNOWN_ISSUER_WALLETS_DATA.filter((issuer) => {
      const matchesIssuer = selectedIssuer === "ALL" || issuer.issuerId === selectedIssuer;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        issuer.issuerName.toLowerCase().includes(q) ||
        issuer.supportedTokens.some(
          (t) =>
            t.symbol.toLowerCase().includes(q) ||
            t.name.toLowerCase().includes(q) ||
            (t.walletAddress && t.walletAddress.toLowerCase().includes(q))
        ) ||
        (issuer.masterWalletAddresses &&
          issuer.masterWalletAddresses.some((w) => w.address.toLowerCase().includes(q) || w.network.toLowerCase().includes(q)));

      return matchesIssuer && matchesSearch;
    });
  }, [selectedIssuer, searchQuery]);

  // Untapped Tokens List (Tokens without an active ETF filing)
  const untappedTokens = useMemo(() => {
    return UNTAPPED_TOKEN_CANDIDATES.filter((cand) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        cand.symbol.toLowerCase().includes(q) ||
        cand.name.toLowerCase().includes(q) ||
        cand.category.toLowerCase().includes(q);

      return matchesSearch;
    });
  }, [searchQuery]);

  const formatUsd = (val: number) => {
    if (!val || isNaN(val)) return "$0";
    if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
    if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
    return `$${val.toLocaleString()}`;
  };

  const handleOpenSimulation = (cand: UntappedTokenCandidate, customIssuer?: string) => {
    setSelectedSimulationToken(cand);
    setSimTicker(`B${cand.symbol}`);
    setSimIssuer(customIssuer || "Bitwise Asset Management");
    setSimExchange(cand.suggestedListingExchange);
    setSimCustodian(cand.suggestedCustodian);
    setSimFee(0.25);
    setIsSimulatedSuccess(false);
  };

  const handleConfirmSimulationFiling = () => {
    if (!selectedSimulationToken || !onAddApplicationDirectly) return;

    const newApp: ETFApplication = {
      id: `${simIssuer.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${selectedSimulationToken.symbol.toLowerCase()}-spot-etf`,
      tokenSymbol: selectedSimulationToken.symbol,
      tokenName: selectedSimulationToken.name,
      tokenIcon: selectedSimulationToken.icon,
      tokenCategory: selectedSimulationToken.category,
      currentPriceUsd: selectedSimulationToken.priceUsd,
      price24hChange: selectedSimulationToken.price24hChange,
      circulatingSupply: Math.round(selectedSimulationToken.marketCapUsd / selectedSimulationToken.priceUsd),
      marketCapUsd: selectedSimulationToken.marketCapUsd,
      fundName: `${simIssuer} ${selectedSimulationToken.name} Spot ETF`,
      ticker: simTicker || `B${selectedSimulationToken.symbol}`,
      issuer: simIssuer,
      issuerLogo: simIssuer.substring(0, 3).toUpperCase(),
      exchange: simExchange,
      sponsorFeePercentage: simFee,
      tokensHeld: Math.round((50000000) / selectedSimulationToken.priceUsd),
      portfolioValueUsd: 50000000,
      percentageOfCirculatingSupply: 0.25,
      stakingEnabled: false,
      stakingStatusNote: "Non-staked direct physical reserve trust; staking yield pass-through disabled.",
      custodian: {
        name: simCustodian,
        type: "Qualified Custodian",
        coldStoragePercentage: 100,
        insuranceCoverageMillionUsd: 500,
        jurisdiction: "New York, USA",
      },
      cashCustodian: "The Bank of New York Mellon",
      status: "S-1 Registration Filed",
      approvalProbabilityPercentage: selectedSimulationToken.etfReadinessScore,
      filingType: "Form S-1",
      statutoryDeadlines: {
        filingDate: new Date().toISOString().split("T")[0],
        federalRegisterDate: new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0],
        firstDeadline45d: new Date(Date.now() + 45 * 86400000).toISOString().split("T")[0],
        secondDeadline90d: new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0],
        thirdDeadline180d: new Date(Date.now() + 180 * 86400000).toISOString().split("T")[0],
        finalDeadline240d: new Date(Date.now() + 240 * 86400000).toISOString().split("T")[0],
        nextDeadlineDate: new Date(Date.now() + 45 * 86400000).toISOString().split("T")[0],
        nextDeadlineLabel: "Initial SEC 45-Day Staff Review",
        daysRemaining: 45,
        regulatoryPathway: "240-Day Section 19(b) Statutory Clock",
      },
      secEdgar: {
        cik: "0001994829",
        accessionNumber: `0001994829-${new Date().getFullYear().toString().slice(-2)}-000${Math.floor(100 + Math.random() * 900)}`,
        formType: "Form S-1",
        filingDate: new Date().toISOString().split("T")[0],
        officialUrl: "https://www.sec.gov/edgar/searchedgar/companysearch",
        filingTitle: `Form S-1 Registration Statement - ${selectedSimulationToken.name} Spot ETF`,
        trustName: `${simIssuer} ${selectedSimulationToken.name} Trust`,
      },
      regulatoryHighlights: [
        `Form S-1 registration statement submitted for ${selectedSimulationToken.name} spot trust.`,
        `100% cold-storage segregated custody via ${simCustodian}.`,
        `CME reference rate tracking & standard surveillance-sharing agreements.`,
      ],
      surveillanceSharingPartner: "Coinbase / CME Crypto Benchmarks",
      keyCatalysts: selectedSimulationToken.keyCatalysts || "Institutional demand and expanding regulated benchmark markets.",
      lastUpdated: new Date().toISOString().split("T")[0],
    };

    onAddApplicationDirectly(newApp);
    setIsSimulatedSuccess(true);
    setTimeout(() => {
      setSelectedSimulationToken(null);
      setIsSimulatedSuccess(false);
    }, 1500);
  };

  return (
    <div id="issuer-wallets-pipeline-container" className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-[#0f0f0f] border border-[#1e1e1e] rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-950/60 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 shadow-sm">
                <Wallet className="w-3.5 h-3.5 text-amber-400" />
                Asset Issuer Wallets &amp; Untapped Pipeline Tracker
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#181818] text-[#cccccc] border border-[#2a2a2a] flex items-center gap-1">
                <Activity className="w-3 h-3 text-emerald-400" />
                Live On-Chain Tracking &amp; Wallet Explorer Links
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Institutional Asset Issuers: Master Wallets, Token Holdings &amp; ETF Comparison
            </h2>
            <p className="text-xs text-[#888888] mt-1 max-w-3xl">
              Track real multi-billion dollar crypto reserves across BlackRock, Fidelity, Bitwise, Grayscale, VanEck, Canary Capital, Franklin Templeton, and 21Shares. Inspect verified multi-sig cold vaults with direct blockchain explorer links, filter by ETF application status, and instantly add untapped tokens into the SEC application pipeline.
            </p>
          </div>

          {/* Sub-Tab Navigation */}
          <div className="flex items-center gap-1.5 bg-[#141414] p-1 rounded-2xl border border-[#242424] shrink-0">
            <button
              onClick={() => setActiveSubTab("ISSUER_WALLETS")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === "ISSUER_WALLETS"
                  ? "bg-emerald-500 text-black shadow-sm"
                  : "text-[#888888] hover:text-white"
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Issuer Wallets &amp; Explorer ({KNOWN_ISSUER_WALLETS_DATA.length})</span>
            </button>
            <button
              onClick={() => setActiveSubTab("COMPARISON_MATRIX")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === "COMPARISON_MATRIX"
                  ? "bg-amber-500 text-black shadow-sm"
                  : "text-[#888888] hover:text-white"
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Comparison Matrix</span>
            </button>
            <button
              onClick={() => setActiveSubTab("UNAPPLIED_DASHBOARD")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === "UNAPPLIED_DASHBOARD"
                  ? "bg-purple-500 text-black shadow-sm"
                  : "text-[#888888] hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tokens to Apply for ETF ({untappedTokens.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* SUB-VIEW 1: ISSUER WALLETS & DIRECT EXPLORER LINKS */}
      {activeSubTab === "ISSUER_WALLETS" && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-[#0c0c0c] p-3 rounded-2xl border border-[#1a1a1a]">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#777777]" />
              <input
                type="text"
                placeholder="Search issuer, wallet address, token..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#141414] border border-[#242424] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-[#666666] focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
              {/* ETF Application Status Filter */}
              <div className="flex items-center gap-1 bg-[#141414] p-1 rounded-xl border border-[#242424] text-xs">
                <Filter className="w-3.5 h-3.5 text-[#777777] ml-1.5" />
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  aria-label="Filter tokens by ETF status"
                  className="bg-transparent text-white text-xs px-2 py-1 focus:outline-none cursor-pointer"
                >
                  <option value="ALL" className="bg-[#141414]">All ETF Statuses</option>
                  <option value="APPROVED" className="bg-[#141414]">Approved &amp; Trading Spot ETFs</option>
                  <option value="PENDING_240D" className="bg-[#141414]">240-Day Statutory Pending Review</option>
                  <option value="APPLIED_S1" className="bg-[#141414]">S-1 Registration Applied</option>
                  <option value="UNTAPPED" className="bg-[#141414]">⚠️ Untapped (Bought by Issuer - No ETF)</option>
                </select>
              </div>

              {/* Issuer Selector Filter */}
              <select
                value={selectedIssuer}
                onChange={(e) => setSelectedIssuer(e.target.value)}
                aria-label="Filter by asset issuer"
                className="bg-[#141414] border border-[#242424] text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="ALL">All 8 Asset Issuers</option>
                {KNOWN_ISSUER_WALLETS_DATA.map((iss) => (
                  <option key={iss.issuerId} value={iss.issuerId}>
                    {iss.issuerName} ({formatUsd(iss.totalCryptoHoldingsUsd)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Issuers Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {filteredIssuers.map((issuer) => (
              <div
                key={issuer.issuerId}
                className="bg-[#0d0d0d] border border-[#1e1e1e] hover:border-[#2a2a2a] rounded-3xl p-5 space-y-5 shadow-sm transition-all"
              >
                {/* Issuer Header */}
                <div className="flex items-start justify-between gap-3 border-b border-[#181818] pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white">{issuer.issuerName}</h3>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-emerald-950/70 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        Audited Custody
                      </span>
                    </div>
                    <p className="text-xs text-[#777777] mt-0.5">{issuer.trustStructure}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] uppercase font-bold text-[#888888]">Total Crypto Reserves</span>
                    <div className="text-lg font-black font-mono text-emerald-400">
                      {formatUsd(issuer.totalCryptoHoldingsUsd)}
                    </div>
                  </div>
                </div>

                {/* Master On-Chain Wallet Addresses */}
                {issuer.masterWalletAddresses && issuer.masterWalletAddresses.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-amber-400" />
                        <span>Master On-Chain Cold Vault Addresses:</span>
                      </span>
                      <span className="text-[10px] text-[#777777] font-mono">
                        {issuer.masterWalletAddresses.length} Verified Master Vaults
                      </span>
                    </div>

                    <div className="space-y-2">
                      {issuer.masterWalletAddresses.map((wallet, widx) => (
                        <div
                          key={widx}
                          className="bg-[#121212] p-3 rounded-2xl border border-[#1f1f1f] space-y-2"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded font-mono font-bold bg-[#181818] text-amber-400 border border-[#2a2a2a] text-[11px]">
                                {wallet.network}
                              </span>
                              <span className="text-white font-semibold">{wallet.label}</span>
                            </div>
                            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                              {wallet.verifiedOnChain ? "✓ Verified On-Chain" : "Custodian Shard"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2 bg-[#080808] p-2 rounded-xl border border-[#181818]">
                            <span className="font-mono text-xs text-[#cccccc] truncate select-all">
                              {wallet.address}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => handleCopy(wallet.address)}
                                title="Copy wallet address"
                                className="p-1 rounded-lg bg-[#181818] hover:bg-[#222222] text-[#888888] hover:text-white border border-[#282828] transition-colors cursor-pointer"
                              >
                                {copiedAddress === wallet.address ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <a
                                href={wallet.explorerUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1 rounded-lg bg-[#161616] hover:bg-[#222222] text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-sm"
                              >
                                <span>{wallet.explorerName}</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-[#777777] pt-0.5">
                            <span>Multisig: <strong className="text-[#aaaaaa]">{wallet.multisigScheme}</strong></span>
                            <span>Balance: <strong className="text-white font-mono">{wallet.balanceNative} ({formatUsd(wallet.balanceUsd)})</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tokens Bought / Custodied by this Issuer */}
                <div className="space-y-2 pt-2 border-t border-[#181818]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Tokens Bought &amp; Custodied by {issuer.issuerName}:</span>
                    </span>
                    <span className="text-[10px] text-[#777777]">
                      {issuer.supportedTokens.length} Tokens in Treasury
                    </span>
                  </div>

                  <div className="space-y-2">
                    {issuer.supportedTokens
                      .filter((t) => {
                        if (selectedStatusFilter === "ALL") return true;
                        const info = getTokenFilingStatus(t.symbol, issuer.issuerName);
                        if (selectedStatusFilter === "UNTAPPED") return !info.hasActiveEtf;
                        return info.statusType === selectedStatusFilter;
                      })
                      .map((t) => {
                        const filingInfo = getTokenFilingStatus(t.symbol, issuer.issuerName);

                        return (
                          <div
                            key={t.symbol}
                            className="bg-[#121212] p-3 rounded-2xl border border-[#1f1f1f] space-y-2 hover:border-[#2a2a2a] transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded font-mono font-bold bg-[#181818] text-emerald-400 border border-[#282828] text-xs">
                                  {t.symbol}
                                </span>
                                <span className="text-white font-semibold text-xs">{t.name}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-white text-xs">
                                  {formatUsd(t.usdValue)}
                                </span>
                                {filingInfo.hasActiveEtf ? (
                                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                                    {filingInfo.ticker || "Active ETF"}
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                    <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                                    No ETF Filing
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Token Specific Custody Wallet & Explorer */}
                            {t.walletAddress && (
                              <div className="flex items-center justify-between gap-2 bg-[#080808] px-2.5 py-1.5 rounded-xl border border-[#181818] text-[11px]">
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className="text-[#666666]">Vault:</span>
                                  <span className="font-mono text-[#aaaaaa] truncate">{t.walletAddress}</span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => handleCopy(t.walletAddress!)}
                                    title="Copy vault address"
                                    className="p-1 rounded bg-[#181818] text-[#888888] hover:text-white border border-[#282828] cursor-pointer"
                                  >
                                    {copiedAddress === t.walletAddress ? (
                                      <Check className="w-3 h-3 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                  {t.explorerUrl && (
                                    <a
                                      href={t.explorerUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="px-2 py-0.5 rounded bg-[#181818] hover:bg-[#222222] text-cyan-400 border border-cyan-500/20 text-[10px] font-semibold flex items-center gap-1"
                                    >
                                      <span>{t.explorerName || "Explorer"}</span>
                                      <ExternalLink className="w-2.5 h-2.5" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Action Row: View ETF or Add Missing Token */}
                            <div className="flex items-center justify-between text-[11px] pt-1">
                              <span className="text-[#777777]">
                                Holdings: <strong className="text-[#cccccc] font-mono">{t.tokensHeld.toLocaleString()} {t.symbol}</strong>
                              </span>

                              {filingInfo.hasActiveEtf && onSelectEtfBySymbol ? (
                                <button
                                  onClick={() => onSelectEtfBySymbol(t.symbol)}
                                  className="px-2.5 py-1 rounded-xl bg-[#161616] hover:bg-[#202020] text-emerald-300 hover:text-white border border-emerald-500/30 text-[10px] font-bold cursor-pointer inline-flex items-center gap-1"
                                >
                                  <span>View ETF Filing</span>
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    const cand = UNTAPPED_TOKEN_CANDIDATES.find((c) => c.symbol === t.symbol) || {
                                      symbol: t.symbol,
                                      name: t.name,
                                      icon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png",
                                      category: "Digital Asset",
                                      priceUsd: 50,
                                      price24hChange: 2.5,
                                      marketCapUsd: t.usdValue * 10,
                                      rank: 25,
                                      etfReadinessScore: 80,
                                      hasActiveEtfApplication: false,
                                      activeFilingCount: 0,
                                      activeTickers: [],
                                      commodityClassificationStatus: "Decentralized L1" as const,
                                      cmeFuturesAvailable: true,
                                      cmeReferenceRateAvailable: true,
                                      qualifiedCustodianSupport: [t.custodian || "Coinbase Custody"],
                                      spotLiquidityRating: "Tier 2 (Moderate Depth)" as const,
                                      issuersHoldingAsset: [issuer.issuerName],
                                      keyCatalysts: "Institutional treasury holding ready for Form S-1 registration.",
                                      suggestedListingExchange: "Nasdaq" as const,
                                      suggestedCustodian: t.custodian || "Coinbase Custody Trust Company LLC",
                                    };
                                    handleOpenSimulation(cand, issuer.issuerName);
                                  }}
                                  className="px-2.5 py-1 rounded-xl bg-purple-950/70 hover:bg-purple-900/90 text-purple-300 hover:text-white border border-purple-500/30 text-[10px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1 shadow-sm"
                                >
                                  <FilePlus className="w-3 h-3" />
                                  <span>Add Token &amp; Draft ETF</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Custodian & Admin Footer */}
                <div className="text-[11px] text-[#666666] border-t border-[#181818] pt-3 flex flex-wrap items-center justify-between gap-2">
                  <span>Primary Custodian: <strong className="text-[#aaaaaa]">{issuer.primaryCustodians.join(", ")}</strong></span>
                  <span>Cash Admin: <strong className="text-[#aaaaaa]">{issuer.cashAdministrator}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: CROSS-COMPARISON MATRIX */}
      {activeSubTab === "COMPARISON_MATRIX" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0c0c0c] p-3 rounded-2xl border border-[#1a1a1a]">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#777777]" />
              <input
                type="text"
                placeholder="Search issuer or token symbol..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#141414] border border-[#242424] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-[#666666] focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              {/* ETF Application Status Filter */}
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                aria-label="Filter by ETF status"
                className="bg-[#141414] border border-[#242424] text-xs text-white rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="ALL">All Application Statuses</option>
                <option value="APPROVED">Approved &amp; Trading Spot ETFs</option>
                <option value="PENDING_240D">240-Day Statutory Pending</option>
                <option value="APPLIED_S1">S-1 Registration Applied</option>
                <option value="UNTAPPED">⚠️ Untapped (No ETF Application)</option>
              </select>

              <select
                value={selectedIssuer}
                onChange={(e) => setSelectedIssuer(e.target.value)}
                aria-label="Filter by asset issuer"
                className="bg-[#141414] border border-[#242424] text-xs text-white rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="ALL">All Asset Issuers</option>
                {KNOWN_ISSUER_WALLETS_DATA.map((iss) => (
                  <option key={iss.issuerId} value={iss.issuerId}>
                    {iss.issuerName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cross-Comparison Table */}
          <div className="bg-[#0e0e0e] border border-[#1e1e1e] rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#141414] border-b border-[#222222] text-[#888888] uppercase tracking-wider font-semibold text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Asset Issuer</th>
                    <th className="py-3 px-4">Supported Token</th>
                    <th className="py-3 px-4">Issuer Holding Value</th>
                    <th className="py-3 px-4">Vault Address &amp; Explorer</th>
                    <th className="py-3 px-4">ETF Application Status</th>
                    <th className="py-3 px-4 text-right">Action / Pipeline</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#181818]">
                  {crossComparisonRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#121212] transition-colors">
                      <td className="py-3 px-4 font-bold text-white">
                        {row.issuerName}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-[#181818] text-emerald-400 border border-[#262626]">
                            {row.tokenSymbol}
                          </span>
                          <span className="text-white font-medium">{row.tokenName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-[#cccccc]">
                        {formatUsd(row.usdValue)}
                        <span className="text-[10px] text-[#777777] block font-normal">
                          {row.tokensHeld.toLocaleString()} {row.tokenSymbol}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {row.walletAddress ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[11px] text-[#888888] truncate max-w-[120px]">
                              {row.walletAddress}
                            </span>
                            <button
                              onClick={() => handleCopy(row.walletAddress!)}
                              title="Copy address"
                              className="p-1 rounded bg-[#181818] text-[#888888] hover:text-white border border-[#282828] cursor-pointer"
                            >
                              {copiedAddress === row.walletAddress ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                            {row.explorerUrl && (
                              <a
                                href={row.explorerUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 rounded bg-[#181818] hover:bg-[#222222] text-cyan-400 border border-cyan-500/30"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#555555]">Custodian Segregated</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {row.hasActiveEtf ? (
                          <div className="flex items-center gap-1.5">
                            <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-emerald-950/70 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>ACTIVE ETF FILED {row.etfTicker ? `(${row.etfTicker})` : ""}</span>
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-amber-950/70 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-400" />
                              <span>⚠️ NO ETF APPLICATION FILED</span>
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {row.hasActiveEtf && onSelectEtfBySymbol ? (
                          <button
                            onClick={() => onSelectEtfBySymbol(row.tokenSymbol)}
                            className="px-3 py-1 rounded-xl bg-[#161616] hover:bg-[#202020] text-[#cccccc] hover:text-white border border-[#282828] text-[11px] font-semibold transition-colors cursor-pointer inline-flex items-center gap-1"
                          >
                            <span>View ETF</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              const cand = UNTAPPED_TOKEN_CANDIDATES.find((c) => c.symbol === row.tokenSymbol) || {
                                symbol: row.tokenSymbol,
                                name: row.tokenName,
                                icon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png",
                                category: "Digital Asset",
                                priceUsd: 50,
                                price24hChange: 2.5,
                                marketCapUsd: row.usdValue * 10,
                                rank: 25,
                                etfReadinessScore: 80,
                                hasActiveEtfApplication: false,
                                activeFilingCount: 0,
                                activeTickers: [],
                                commodityClassificationStatus: "Decentralized L1" as const,
                                cmeFuturesAvailable: true,
                                cmeReferenceRateAvailable: true,
                                qualifiedCustodianSupport: ["Coinbase Custody", "BitGo"],
                                spotLiquidityRating: "Tier 2 (Moderate Depth)" as const,
                                issuersHoldingAsset: [row.issuerName],
                                keyCatalysts: "Institutional treasury holding ready for Form S-1 registration.",
                                suggestedListingExchange: "Nasdaq" as const,
                                suggestedCustodian: "Coinbase Custody Trust Company LLC",
                              };
                              handleOpenSimulation(cand, row.issuerName);
                            }}
                            className="px-3 py-1 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 hover:text-white border border-purple-500/30 text-[11px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1 shadow-sm"
                          >
                            <FilePlus className="w-3 h-3" />
                            <span>Add &amp; Draft ETF</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: UNAPPLIED TOKENS DASHBOARD */}
      {activeSubTab === "UNAPPLIED_DASHBOARD" && (
        <div className="space-y-4">
          <div className="bg-[#0c0c0c] p-4 rounded-2xl border border-[#1a1a1a] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Dashboard: Untapped High-Potential Crypto Tokens Ready for ETF Filings</span>
              </h3>
              <p className="text-xs text-[#888888] mt-0.5">
                Ranked by institutional ETF Readiness Score (CFTC classification, CME benchmark availability, and qualified custody).
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#777777]" />
              <input
                type="text"
                placeholder="Search candidates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#141414] border border-[#242424] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-[#666666] focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Untapped Candidate Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {untappedTokens.map((cand) => (
              <div
                key={cand.symbol}
                className="bg-[#0d0d0d] border border-[#1e1e1e] hover:border-[#2f2f2f] rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-all shadow-sm"
              >
                <div>
                  {/* Top Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <img
                        src={cand.icon}
                        alt={cand.name}
                        className="w-9 h-9 rounded-full bg-[#181818] p-1 border border-[#282828]"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png";
                        }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-white">{cand.name}</h4>
                          <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-[#181818] text-emerald-400 border border-[#262626]">
                            {cand.symbol}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#777777]">{cand.category}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold text-[#888888]">Readiness</div>
                      <div className="text-base font-black font-mono text-purple-400">
                        {cand.etfReadinessScore}%
                      </div>
                    </div>
                  </div>

                  {/* Readiness Progress Bar */}
                  <div className="w-full h-1.5 bg-[#181818] rounded-full overflow-hidden mt-3">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-emerald-400 rounded-full"
                      style={{ width: `${cand.etfReadinessScore}%` }}
                    />
                  </div>

                  {/* Key Stats Row */}
                  <div className="grid grid-cols-2 gap-2 mt-3 bg-[#080808] p-2.5 rounded-xl border border-[#181818] text-xs">
                    <div>
                      <span className="text-[10px] text-[#777777]">Live Price</span>
                      <div className="font-mono font-bold text-white">${cand.priceUsd.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#777777]">Market Cap</span>
                      <div className="font-mono font-bold text-cyan-300">{formatUsd(cand.marketCapUsd)}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#777777]">Commodity Test</span>
                      <div className="font-semibold text-[#cccccc] text-[11px] truncate">{cand.commodityClassificationStatus}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#777777]">CME Reference</span>
                      <div className="font-semibold text-emerald-400 text-[11px]">
                        {cand.cmeReferenceRateAvailable ? "Active Feed" : "OTC Spot Only"}
                      </div>
                    </div>
                  </div>

                  {/* Catalysts Note */}
                  <p className="text-[11px] text-[#aaaaaa] mt-3 leading-relaxed">
                    <strong className="text-white">Catalysts:</strong> {cand.keyCatalysts}
                  </p>
                </div>

                {/* Footer Action */}
                <div className="pt-3 border-t border-[#181818] flex items-center justify-between">
                  <div className="text-[10px] text-[#666666]">
                    Custodians: {cand.qualifiedCustodianSupport.join(", ")}
                  </div>
                  <button
                    onClick={() => handleOpenSimulation(cand)}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <FilePlus className="w-3.5 h-3.5" />
                    <span>Simulate ETF Application</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SIMULATE / ADD ETF APPLICATION MODAL */}
      {selectedSimulationToken && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e0e0e] border border-[#222222] rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-950/80 text-purple-300 border border-purple-500/30 mb-1 inline-block">
                  SEC Form S-1 &amp; 19b-4 Prospectus Generator
                </span>
                <h3 className="text-xl font-bold text-white">
                  Add {selectedSimulationToken.name} ({selectedSimulationToken.symbol}) to ETF Database
                </h3>
              </div>
              <button
                onClick={() => setSelectedSimulationToken(null)}
                className="p-1.5 rounded-xl bg-[#161616] text-[#888888] hover:text-white border border-[#262626] cursor-pointer"
              >
                ✕
              </button>
            </div>

            {isSimulatedSuccess ? (
              <div className="bg-emerald-950/50 border border-emerald-500/40 rounded-2xl p-6 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="text-base font-bold text-white">Filing Generated &amp; Added to Database!</h4>
                <p className="text-xs text-emerald-300">
                  {simIssuer} {selectedSimulationToken.name} Spot ETF ({simTicker}) has been successfully added to the active database.
                </p>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[#888888] font-bold mb-1">Asset Sponsor / Issuer</label>
                  <select
                    value={simIssuer}
                    onChange={(e) => setSimIssuer(e.target.value)}
                    className="w-full bg-[#141414] border border-[#262626] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Bitwise Asset Management">Bitwise Asset Management</option>
                    <option value="BlackRock / iShares">BlackRock / iShares</option>
                    <option value="Canary Capital">Canary Capital</option>
                    <option value="Grayscale Investments">Grayscale Investments</option>
                    <option value="VanEck">VanEck</option>
                    <option value="Franklin Templeton">Franklin Templeton</option>
                    <option value="21Shares">21Shares</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#888888] font-bold mb-1">Exchange Ticker</label>
                    <input
                      type="text"
                      value={simTicker}
                      onChange={(e) => setSimTicker(e.target.value.toUpperCase())}
                      className="w-full bg-[#141414] border border-[#262626] rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[#888888] font-bold mb-1">Listing Exchange</label>
                    <select
                      value={simExchange}
                      onChange={(e) => setSimExchange(e.target.value as ListingExchange)}
                      className="w-full bg-[#141414] border border-[#262626] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="Nasdaq">Nasdaq</option>
                      <option value="NYSE Arca">NYSE Arca</option>
                      <option value="Cboe BZX">Cboe BZX</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#888888] font-bold mb-1">Qualified Custodian</label>
                    <select
                      value={simCustodian}
                      onChange={(e) => setSimCustodian(e.target.value)}
                      className="w-full bg-[#141414] border border-[#262626] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="Coinbase Custody Trust Company LLC">Coinbase Custody</option>
                      <option value="Anchorage Digital Bank NA">Anchorage Digital Bank</option>
                      <option value="BitGo Trust Company">BitGo Trust</option>
                      <option value="Fidelity Digital Assets">Fidelity Digital</option>
                      <option value="Gemini Trust Company LLC">Gemini Trust</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#888888] font-bold mb-1">Sponsor Fee (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={simFee}
                      onChange={(e) => setSimFee(parseFloat(e.target.value) || 0.25)}
                      className="w-full bg-[#141414] border border-[#262626] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="bg-[#080808] p-3 rounded-xl border border-[#1c1c1c] text-[#888888] space-y-1 text-[11px]">
                  <div><strong className="text-white">Target Seed Capital:</strong> $50,000,000 USD physical reserve</div>
                  <div><strong className="text-white">Statutory Clock:</strong> 240-Day Review under Section 19(b)(2)</div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1a1a1a]">
                  <button
                    onClick={() => setSelectedSimulationToken(null)}
                    className="px-4 py-2 rounded-xl bg-[#161616] hover:bg-[#202020] text-white text-xs font-semibold border border-[#262626] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmSimulationFiling}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <FilePlus className="w-3.5 h-3.5" />
                    <span>Submit &amp; Add to Database</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
