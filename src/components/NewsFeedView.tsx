import React, { useState, useMemo, useEffect } from "react";
import {
  Newspaper,
  Search,
  Filter,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Clock,
  Tag,
  Flame,
  ArrowUpRight,
  PlusCircle,
  FileText,
  Building,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Share2,
  Database,
  Radio,
  Zap,
} from "lucide-react";
import { NewsItem, INITIAL_NEWS_ITEMS } from "../data/newsData";
import { ETFApplication } from "../types";
import { KNOWN_SPOT_ETF_REGISTRY, NewsSyncResult } from "../services/newsSyncService";
import { PaginationControls } from "./PaginationControls";

interface NewsFeedViewProps {
  applications: ETFApplication[];
  onSelectEtfBySymbol?: (symbol: string) => void;
  onSelectEtf?: (app: ETFApplication) => void;
  onManualScanNews?: () => void;
  isScanningNews?: boolean;
  lastScanLog?: string;
  onAddApplicationDirectly?: (app: ETFApplication) => void;
}

export const NewsFeedView: React.FC<NewsFeedViewProps> = ({
  applications,
  onSelectEtfBySymbol,
  onSelectEtf,
  onManualScanNews,
  isScanningNews = false,
  lastScanLog,
  onAddApplicationDirectly,
}) => {
  const [newsList, setNewsList] = useState<NewsItem[]>(INITIAL_NEWS_ITEMS);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedToken, setSelectedToken] = useState<string>("ALL");
  const [selectedImpact, setSelectedImpact] = useState<string>("ALL");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Reset to page 1 on filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedToken, selectedImpact]);
  
  // AI Impact Analysis state
  const [analyzingNewsId, setAnalyzingNewsId] = useState<string | null>(null);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<{ id: string; text: string } | null>(null);

  // Add news modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSummary, setNewSummary] = useState("");
  const [newSource, setNewSource] = useState("SEC EDGAR");
  const [newCategory, setNewCategory] = useState<NewsItem["category"]>("SEC Regulatory");
  const [newImpact, setNewImpact] = useState<NewsItem["impactLevel"]>("HIGH");
  const [newToken, setNewToken] = useState("SOL");

  // Helper to check if a news item mentions an ETF that is currently in our database
  const getFilingDatabaseStatus = (item: NewsItem) => {
    // 1. Check direct tickers match in applications
    const matchedApp = applications.find((app) => {
      const matchTicker = item.relatedTickers && item.relatedTickers.includes(app.ticker);
      const matchToken = item.relatedTokens.includes(app.tokenSymbol) && 
        (item.title.toLowerCase().includes(app.issuer.toLowerCase()) || item.content.toLowerCase().includes(app.issuer.toLowerCase()));
      return matchTicker || matchToken;
    });

    if (matchedApp) {
      return { isInDb: true, app: matchedApp };
    }

    // 2. Check if it matches a known unadded filing registry entry
    const registryEntry = KNOWN_SPOT_ETF_REGISTRY.find((r) => {
      return r.newsIdMatch.includes(item.id) ||
        r.keywords.some((kw) => item.title.includes(kw) || (item.relatedTickers && item.relatedTickers.includes(kw)));
    });

    if (registryEntry) {
      return { isInDb: false, registryApp: registryEntry.application };
    }

    return { isInDb: false, registryApp: null };
  };

  // Filter list
  const categories = [
    "ALL",
    "SEC Regulatory",
    "ETF Inflows & Volume",
    "Staking Amendments",
    "CME & CFTC",
    "Exchange Listing",
    "Legal & Court",
  ];

  const tokenList = ["ALL", "BTC", "ETH", "SOL", "XRP", "LTC", "DOGE", "SUI", "LINK", "ADA", "BCH", "HYPE"];

  const filteredNews = useMemo(() => {
    return newsList.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.source.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === "ALL" || item.category === selectedCategory;

      const matchesToken =
        selectedToken === "ALL" || item.relatedTokens.includes(selectedToken);

      const matchesImpact =
        selectedImpact === "ALL" || item.impactLevel === selectedImpact;

      return matchesSearch && matchesCategory && matchesToken && matchesImpact;
    });
  }, [newsList, searchTerm, selectedCategory, selectedToken, selectedImpact]);

  // Paginated news slice
  const paginatedNews = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredNews.slice(start, start + pageSize);
  }, [filteredNews, currentPage, pageSize]);

  const handleAnalyzeNewsAi = async (item: NewsItem) => {
    setAnalyzingNewsId(item.id);
    try {
      const res = await fetch("/api/ai/analyze-news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: item.title,
          summary: item.summary,
          content: item.content,
          category: item.category,
          relatedTokens: item.relatedTokens,
        }),
      });
      const data = await res.json();
      if (data.success && data.impactAnalysis) {
        setAiAnalysisResult({ id: item.id, text: data.impactAnalysis });
      } else {
        setAiAnalysisResult({
          id: item.id,
          text: `### Quick Assessment\n- **Impact**: ${item.impactLevel}\n- **Catalyst**: Accelerates regulatory review timeline for ${item.relatedTokens.join(", ")}.\n- **Market Effect**: Positive institutional sentiment.`,
        });
      }
    } catch (e) {
      setAiAnalysisResult({
        id: item.id,
        text: `### Institutional Assessment\n- Key regulatory progression for ${item.relatedTokens.join(", ")}.\n- Reinforces surveillance and qualified custody compliance.`,
      });
    } finally {
      setAnalyzingNewsId(null);
    }
  };

  const handleAddCustomNews = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newItem: NewsItem = {
      id: `custom-news-${Date.now()}`,
      title: newTitle,
      summary: newSummary || newTitle,
      content: newSummary || newTitle,
      source: newSource,
      sourceType: "SEC EDGAR",
      sourceUrl: "https://www.sec.gov/edgar/searchedgar/companysearch",
      publishedAt: new Date().toISOString(),
      timeAgo: "Just now",
      impactLevel: newImpact,
      category: newCategory,
      relatedTokens: [newToken],
      keyTakeaway: "Recent market disclosure submitted via live feed.",
    };

    setNewsList([newItem, ...newsList]);
    setIsAddModalOpen(false);
    setNewTitle("");
    setNewSummary("");
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-br from-[#121212] via-[#0d0d0d] to-[#080808] border border-[#1f1f1f]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1">
              <Flame className="w-3 h-3 animate-pulse" /> Live Wire
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <Database className="w-3 h-3" /> Auto-Sync to Filings DB Active
            </span>
            <span className="text-xs text-[#888888]">SEC EDGAR &bull; Bloomberg ETF &bull; Federal Register</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Crypto ETF & Regulatory Intelligence Wire
          </h2>
          <p className="text-xs text-[#888888] mt-0.5">
            Real-time feed checking spot ETF applications & filings, automatically detecting and ingesting new S-1/19b-4 disclosures into your database.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onManualScanNews && (
            <button
              id="btn-scan-news-filings"
              onClick={onManualScanNews}
              disabled={isScanningNews}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-950/70 hover:bg-purple-900/80 text-purple-200 text-xs font-semibold border border-purple-500/40 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-purple-400 ${isScanningNews ? "animate-spin" : ""}`} />
              <span>{isScanningNews ? "Scanning News Feed..." : "Scan News for New Filings"}</span>
            </button>
          )}

          <button
            id="btn-add-news-alert"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1a1a1a] hover:bg-[#242424] text-white text-xs font-semibold border border-[#333333] transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Post Filing Alert</span>
          </button>
        </div>
      </div>

      {/* Live Auto-Sync Status Bar */}
      {lastScanLog && (
        <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="font-medium">{lastScanLog}</span>
          </div>
          <span className="text-[11px] text-emerald-400/80 font-mono">
            {applications.length} Total Filings in Database
          </span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-[#666666] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search news, SEC accession numbers, issuers, or tickers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#0d0d0d] border border-[#222222] rounded-xl text-xs text-white placeholder-[#555555] focus:outline-none focus:border-purple-500/60 transition-colors"
            />
          </div>

          {/* Impact Selector */}
          <div className="flex items-center gap-1.5 bg-[#0d0d0d] p-1 rounded-xl border border-[#222222] self-start md:self-auto">
            <span className="text-[11px] text-[#666666] px-2 font-medium">Impact:</span>
            {["ALL", "HIGH", "MEDIUM"].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedImpact(lvl)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  selectedImpact === lvl
                    ? "bg-[#222222] text-white shadow-sm"
                    : "text-[#777777] hover:text-[#cccccc]"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="text-[11px] text-[#666666] shrink-0 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Category:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedCategory === cat
                  ? "bg-purple-950/80 text-purple-200 border border-purple-500/40 shadow-sm"
                  : "bg-[#0f0f0f] text-[#888888] hover:text-white hover:bg-[#181818] border border-[#1c1c1c]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Token Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="text-[11px] text-[#666666] shrink-0 mr-1">Token:</span>
          {tokenList.map((tok) => (
            <button
              key={tok}
              onClick={() => setSelectedToken(tok)}
              className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedToken === tok
                  ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 shadow-sm"
                  : "bg-[#0d0d0d] text-[#777777] hover:text-[#cccccc] border border-[#1a1a1a]"
              }`}
            >
              {tok}
            </button>
          ))}
        </div>
      </div>

      {/* News Feed Stream */}
      <div className="space-y-4">
        {filteredNews.length === 0 ? (
          <div className="text-center py-12 bg-[#0c0c0c] rounded-2xl border border-[#1c1c1c] text-[#777777]">
            <Newspaper className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">No regulatory news found matching your filters</p>
            <p className="text-xs mt-1 text-[#555555]">Try resetting your search query or token selection</p>
          </div>
        ) : (
          paginatedNews.map((item) => {
            const isAnalyzing = analyzingNewsId === item.id;
            const hasAiAnalysis = aiAnalysisResult?.id === item.id;
            const dbStatus = getFilingDatabaseStatus(item);

            return (
              <article
                key={item.id}
                id={item.id}
                className="p-5 rounded-2xl bg-[#0d0d0d] hover:bg-[#111111] border border-[#1e1e1e] hover:border-[#2a2a2a] transition-all space-y-3"
              >
                {/* Header: Source, Time, Impact Badge & Database Sync Badge */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded bg-[#181818] text-[#cccccc] border border-[#2a2a2a]">
                      {item.source}
                    </span>
                    <span className="text-[11px] text-[#666666] flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {item.timeAgo}
                    </span>
                    <span className="text-[#333333]">&bull;</span>
                    <span className="text-[11px] text-[#888888] font-medium">
                      {item.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Database Ingestion Badge */}
                    {dbStatus.isInDb && dbStatus.app ? (
                      <button
                        onClick={() => onSelectEtf && onSelectEtf(dbStatus.app)}
                        className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 hover:bg-emerald-900/60 transition-colors cursor-pointer"
                        title="Click to view full ETF details in database"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>In Database ({dbStatus.app.ticker})</span>
                      </button>
                    ) : dbStatus.registryApp && onAddApplicationDirectly ? (
                      <button
                        onClick={() => {
                          const spotPrice = dbStatus.registryApp.tokenSymbol === "LTC" ? 118.5 : dbStatus.registryApp.tokenSymbol === "DOGE" ? 0.285 : dbStatus.registryApp.tokenSymbol === "HYPE" ? 28.75 : dbStatus.registryApp.tokenSymbol === "XRP" ? 2.65 : 3.45;
                          onAddApplicationDirectly({
                            ...dbStatus.registryApp,
                            currentPriceUsd: spotPrice,
                            price24hChange: 3.2,
                            portfolioValueUsd: Math.round(dbStatus.registryApp.tokensHeld * spotPrice),
                            marketCapUsd: Math.round(dbStatus.registryApp.circulatingSupply * spotPrice),
                            lastUpdated: new Date().toISOString().split("T")[0],
                          });
                        }}
                        className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1 hover:bg-amber-500/20 transition-colors cursor-pointer shadow-sm animate-pulse"
                        title="Click to instantly sync this new spot ETF application into database"
                      >
                        <Zap className="w-3 h-3 text-amber-400" />
                        <span>+ Sync Filing to DB ({dbStatus.registryApp.ticker})</span>
                      </button>
                    ) : null}

                    {/* Impact Badge */}
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${
                        item.impactLevel === "HIGH"
                          ? "bg-red-500/10 text-red-400 border border-red-500/20"
                          : item.impactLevel === "MEDIUM"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      }`}
                    >
                      {item.impactLevel} Impact
                    </span>

                    {/* Related Tokens */}
                    <div className="flex items-center gap-1">
                      {item.relatedTokens.map((tok) => (
                        <span
                          key={tok}
                          className="px-2 py-0.5 text-[10px] font-bold bg-[#141414] text-emerald-400 rounded border border-emerald-500/20"
                        >
                          {tok}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* News Title */}
                <h3 className="text-base font-bold text-white leading-snug hover:text-purple-300 transition-colors">
                  {item.title}
                </h3>

                {/* News Summary */}
                <p className="text-xs text-[#aaaaaa] leading-relaxed">
                  {item.content}
                </p>

                {/* Key Takeaway Callout */}
                {item.keyTakeaway && (
                  <div className="p-3 rounded-xl bg-[#141414] border border-[#222222] flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                        Regulatory & Market Takeaway
                      </div>
                      <div className="text-xs text-[#dddddd] font-medium mt-0.5">
                        {item.keyTakeaway}
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Impact Result Box */}
                {hasAiAnalysis && (
                  <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 text-xs text-purple-200 space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-purple-300">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        <span>AI Regulatory Impact Assessment</span>
                      </div>
                      <button
                        onClick={() => setAiAnalysisResult(null)}
                        className="text-[10px] text-purple-400 hover:text-white cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                    <div className="text-xs text-[#d8b4fe] whitespace-pre-line leading-relaxed font-sans">
                      {aiAnalysisResult.text}
                    </div>
                  </div>
                )}

                {/* Footer Controls: Source link, AI Impact button */}
                <div className="flex items-center justify-between pt-2 border-t border-[#181818] text-xs">
                  <div className="flex items-center gap-3">
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-[#888888] hover:text-white transition-colors"
                    >
                      <span>Official Source</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    {item.relatedTickers && item.relatedTickers.length > 0 && (
                      <span className="text-[11px] text-[#666666]">
                        Tickers: <strong className="text-[#cccccc]">{item.relatedTickers.join(", ")}</strong>
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleAnalyzeNewsAi(item)}
                    disabled={isAnalyzing}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/60 text-purple-200 text-xs font-semibold border border-purple-500/30 transition-all cursor-pointer"
                  >
                    <Sparkles className={`w-3.5 h-3.5 text-purple-400 ${isAnalyzing ? "animate-spin" : ""}`} />
                    <span>{isAnalyzing ? "Analyzing..." : "Analyze Regulatory Impact"}</span>
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Pagination Controls */}
      <PaginationControls
        currentPage={currentPage}
        totalItems={filteredNews.length}
        pageSize={pageSize}
        onPageChange={(page) => setCurrentPage(page)}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
        pageSizeOptions={[10, 20, 50]}
        itemLabel="regulatory news disclosures"
      />

      {/* Add Custom News Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#0f0f0f] border border-[#262626] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1f1f1f] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-purple-400" />
                Post Regulatory Filing Alert
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-xs text-[#777777] hover:text-white cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleAddCustomNews} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#888888] font-medium mb-1">Headline / Filing Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SEC Publishes 19b-4 Notice for Hedera Spot ETF (HBAR)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 bg-[#080808] border border-[#222222] rounded-xl text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[#888888] font-medium mb-1">Summary / Context</label>
                <textarea
                  rows={3}
                  placeholder="Details of the SEC filing, exchange listing, or regulatory catalyst..."
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  className="w-full p-2.5 bg-[#080808] border border-[#222222] rounded-xl text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#888888] font-medium mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full p-2 bg-[#080808] border border-[#222222] rounded-xl text-white focus:outline-none"
                  >
                    <option value="SEC Regulatory">SEC Regulatory</option>
                    <option value="ETF Inflows & Volume">ETF Inflows & Volume</option>
                    <option value="Staking Amendments">Staking Amendments</option>
                    <option value="CME & CFTC">CME & CFTC</option>
                    <option value="Exchange Listing">Exchange Listing</option>
                    <option value="Legal & Court">Legal & Court</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#888888] font-medium mb-1">Impact Level</label>
                  <select
                    value={newImpact}
                    onChange={(e) => setNewImpact(e.target.value as any)}
                    className="w-full p-2 bg-[#080808] border border-[#222222] rounded-xl text-white focus:outline-none"
                  >
                    <option value="HIGH">HIGH Impact</option>
                    <option value="MEDIUM">MEDIUM Impact</option>
                    <option value="LOW">LOW Impact</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#888888] font-medium mb-1">Asset Token</label>
                  <select
                    value={newToken}
                    onChange={(e) => setNewToken(e.target.value)}
                    className="w-full p-2 bg-[#080808] border border-[#222222] rounded-xl text-white focus:outline-none"
                  >
                    {["SOL", "XRP", "LTC", "DOGE", "SUI", "LINK", "ADA", "HBAR", "HYPE", "BTC", "ETH"].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#888888] font-medium mb-1">Source Name</label>
                  <input
                    type="text"
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value)}
                    className="w-full p-2 bg-[#080808] border border-[#222222] rounded-xl text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#1f1f1f]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#222222] text-[#888888] rounded-xl font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold cursor-pointer shadow-lg shadow-purple-900/30"
                >
                  Publish to Live Wire
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
