import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  Filter,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Star,
  Zap,
  Radio,
  ExternalLink,
  ShieldCheck,
  BarChart3,
  SlidersHorizontal,
  DollarSign,
  Layers,
  ArrowUpDown,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Info,
  CheckCircle2,
  Clock,
  Eye,
  X,
  Flame,
  LayoutGrid,
  Table as TableIcon,
  ChevronRight,
  ChevronLeft,
  Coins,
  Globe,
  Share2,
  Bell,
  Sliders,
  Volume2,
  LineChart,
} from "lucide-react";
import { MonitoredToken, MONITORED_TOKENS, TokenCategory, EtfReadinessCategory } from "../data/tokenMonitorData";
import { LiveTokenPrice } from "../services/marketApi";
import { ETFApplication } from "../types";
import { TokenCandleChart } from "./TokenCandleChart";
import { BinancePriceAlertModal, BinancePriceAlert } from "./BinancePriceAlertModal";
import { notificationAudio } from "../services/notificationAudioService";

interface TokensPriceMonitorViewProps {
  livePrices: Record<string, LiveTokenPrice>;
  applications: ETFApplication[];
  onSelectEtf?: (app: ETFApplication) => void;
  onRefreshLivePrices: () => void;
  isRefreshing: boolean;
  lastUpdatedTime?: string;
  autoRefreshEnabled?: boolean;
  onToggleAutoRefresh?: () => void;
  onSelectEtfByTicker?: (ticker: string) => void;
}

type SortField =
  | "rank"
  | "name"
  | "priceUsd"
  | "change1h"
  | "change24h"
  | "change7d"
  | "volume24hUsd"
  | "marketCapUsd"
  | "circulatingSupply"
  | "etfStatus";

type SortDirection = "asc" | "desc";
type CurrencyUnit = "USD" | "EUR" | "GBP" | "BTC" | "ETH";
type ViewLayoutMode = "table" | "grid" | "compact";

const CATEGORIES: TokenCategory[] = [
  "All",
  "ETF Approved",
  "ETF Pending",
  "Layer 1 (L1)",
  "Layer 2 (L2)",
  "DeFi",
  "AI & Compute",
  "Proof of Work",
  "Meme & Community",
  "Real World Assets (RWA)",
  "DePIN & Storage",
  "Oracle & Infrastructure",
];

export const TokensPriceMonitorView: React.FC<TokensPriceMonitorViewProps> = ({
  livePrices,
  applications,
  onSelectEtf,
  onRefreshLivePrices,
  isRefreshing,
  lastUpdatedTime,
  autoRefreshEnabled = true,
  onToggleAutoRefresh,
  onSelectEtfByTicker,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<TokenCategory>("All");
  const [performanceFilter, setPerformanceFilter] = useState<"ALL" | "GAINERS" | "TOP_GAINERS" | "LOSERS">("ALL");
  const [marketCapTier, setMarketCapTier] = useState<"ALL" | "MEGA" | "LARGE" | "MID" | "SMALL">("ALL");
  const [etfFilter, setEtfFilter] = useState<"ALL" | "APPROVED" | "PENDING" | "ANY_ETF">("ALL");
  const [sortField, setSortField] = useState<SortField>("marketCapUsd");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedToken, setSelectedToken] = useState<MonitoredToken | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyUnit>("USD");
  const [layoutMode, setLayoutMode] = useState<ViewLayoutMode>("table");
  const [showOnlyWatchlist, setShowOnlyWatchlist] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [priceFlashMap, setPriceFlashMap] = useState<Record<string, "up" | "down" | null>>({});

  // Active Candlestick Chart Token State & Comprehensive Token Picker
  const [activeChartSymbol, setActiveChartSymbol] = useState<string>("BTC");
  const [chartSearchQuery, setChartSearchQuery] = useState<string>("");
  const [chartCategoryFilter, setChartCategoryFilter] = useState<TokenCategory>("All");
  const [isChartTokenPickerOpen, setIsChartTokenPickerOpen] = useState<boolean>(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState<boolean>(false);
  const [triggeredToastAlert, setTriggeredToastAlert] = useState<{
    alert: BinancePriceAlert;
    triggerPrice: number;
    timestamp: string;
  } | null>(null);

  // Live Price Alerts State with Local Persistence
  const [alerts, setAlerts] = useState<BinancePriceAlert[]>(() => {
    const saved = localStorage.getItem("live_crypto_price_alerts") || localStorage.getItem("binance_live_crypto_alerts");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error("Failed to parse saved alerts", e);
      }
    }
    return [
      {
        id: "alert-default-btc-105k",
        symbol: "BTC",
        tokenName: "Bitcoin",
        condition: "PRICE_RISES_ABOVE",
        targetValue: 105000,
        initialPrice: 96000,
        frequency: "ONLY_ONCE",
        soundEnabled: true,
        browserNotification: true,
        notes: "Major ATH resistance breakout watch",
        createdAt: "10:00:00 AM",
        isActive: true,
        triggeredCount: 0,
      },
      {
        id: "alert-default-eth-3k",
        symbol: "ETH",
        tokenName: "Ethereum",
        condition: "PRICE_RISES_ABOVE",
        targetValue: 3000,
        initialPrice: 2750,
        frequency: "ONLY_ONCE",
        soundEnabled: true,
        browserNotification: true,
        notes: "Key psychological support/resistance",
        createdAt: "10:05:00 AM",
        isActive: true,
        triggeredCount: 0,
      },
    ];
  });

  const saveAlertsToStorage = (newAlerts: BinancePriceAlert[]) => {
    setAlerts(newAlerts);
    try {
      localStorage.setItem("live_crypto_price_alerts", JSON.stringify(newAlerts));
    } catch (e) {
      console.error("Failed to save alerts to local storage", e);
    }
  };

  const handleSaveAlert = (newAlert: BinancePriceAlert) => {
    const updated = [newAlert, ...alerts.filter((a) => a.id !== newAlert.id)];
    saveAlertsToStorage(updated);
  };

  const handleToggleAlert = (id: string, active: boolean) => {
    const updated = alerts.map((a) => (a.id === id ? { ...a, isActive: active } : a));
    saveAlertsToStorage(updated);
  };

  const handleDeleteAlert = (id: string) => {
    const updated = alerts.filter((a) => a.id !== id);
    saveAlertsToStorage(updated);
  };

  const handleClearInactiveAlerts = () => {
    const updated = alerts.filter((a) => a.isActive);
    saveAlertsToStorage(updated);
  };

  // Real-time Live Price Alert Triggering Engine (No Simulations, Live Ticks Only)
  useEffect(() => {
    if (!livePrices || Object.keys(livePrices).length === 0 || alerts.length === 0) return;

    let hasUpdates = false;
    const updatedAlerts = alerts.map((al) => {
      if (!al.isActive) return al;

      const live = livePrices[al.symbol.toUpperCase()];
      if (!live || typeof live.priceUsd !== "number" || live.priceUsd <= 0) return al;

      const curPrice = live.priceUsd;
      const curChange = live.change24h || 0;
      let isTriggered = false;

      if (al.condition === "PRICE_RISES_ABOVE" && curPrice >= al.targetValue) {
        isTriggered = true;
      } else if (al.condition === "PRICE_DROPS_BELOW" && curPrice <= al.targetValue) {
        isTriggered = true;
      } else if (al.condition === "CHANGE_INCREASES_OVER" && curChange >= al.targetValue) {
        isTriggered = true;
      } else if (al.condition === "CHANGE_DROPS_BELOW" && curChange <= al.targetValue) {
        isTriggered = true;
      }

      if (isTriggered) {
        hasUpdates = true;
        // 1. Play Sound
        if (al.soundEnabled) {
          notificationAudio.playActivityChime();
        }

        // 2. Native OS Browser Push Notification
        if (al.browserNotification && typeof Notification !== "undefined" && Notification.permission === "granted") {
          try {
            new Notification(`🚨 Price Alert Triggered: ${al.symbol}`, {
              body: `${al.tokenName} target reached: $${curPrice.toLocaleString()} (${curChange >= 0 ? "+" : ""}${curChange.toFixed(2)}% 24h). ${al.notes || ""}`,
              icon: "/favicon.ico",
            });
          } catch (e) {
            console.warn("Could not dispatch native notification", e);
          }
        }

        // 3. Trigger In-App Banner Toast
        setTriggeredToastAlert({
          alert: al,
          triggerPrice: curPrice,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        });

        // 4. Update frequency state
        const nextIsActive = al.frequency === "ONLY_ONCE" ? false : true;
        return {
          ...al,
          isActive: nextIsActive,
          triggeredCount: (al.triggeredCount || 0) + 1,
          lastTriggeredAt: new Date().toLocaleTimeString(),
        };
      }

      return al;
    });

    if (hasUpdates) {
      saveAlertsToStorage(updatedAlerts);
    }
  }, [livePrices]);

  // Local Starred Watchlist
  const [watchlist, setWatchlist] = useState<Set<string>>(() => {
    const saved = localStorage.getItem("crypto_token_monitor_watchlist");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return new Set(parsed);
      } catch (e) {
        console.error("Failed to load token monitor watchlist", e);
      }
    }
    return new Set(["BTC", "ETH", "SOL", "XRP", "SUI", "DOGE"]);
  });

  const toggleWatchlist = (symbol: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setWatchlist((prev) => {
      const next = new Set(prev);
      if (next.has(symbol)) {
        next.delete(symbol);
      } else {
        next.add(symbol);
      }
      localStorage.setItem("crypto_token_monitor_watchlist", JSON.stringify(Array.from(next)));
      return next;
    });
  };

  // Track previous prices to trigger subtle flash effect on tick updates
  const prevPricesRef = useRef<Record<string, number>>({});
  useEffect(() => {
    const newFlashes: Record<string, "up" | "down" | null> = {};
    let hasFlash = false;

    Object.entries(livePrices || {}).forEach(([sym, rawData]) => {
      const data = rawData as LiveTokenPrice;
      if (!data || typeof data.priceUsd !== "number") return;
      const prevPrice = prevPricesRef.current[sym];
      if (prevPrice !== undefined && data.priceUsd > 0) {
        if (data.priceUsd > prevPrice) {
          newFlashes[sym] = "up";
          hasFlash = true;
        } else if (data.priceUsd < prevPrice) {
          newFlashes[sym] = "down";
          hasFlash = true;
        }
      }
      prevPricesRef.current[sym] = data.priceUsd;
    });

    if (hasFlash) {
      setPriceFlashMap(newFlashes);
      const timer = setTimeout(() => {
        setPriceFlashMap({});
      }, 1400);
      return () => clearTimeout(timer);
    }
  }, [livePrices]);

  // Combine static base metadata with live real-time price feeds
  const tokensWithLive = useMemo(() => {
    return MONITORED_TOKENS.map((token) => {
      const live = livePrices[token.symbol];
      const livePrice = live && live.priceUsd > 0 ? live.priceUsd : token.defaultPriceUsd;
      const change24h = live && live.change24h !== undefined ? live.change24h : token.default24hChange;
      const high24h = live && live.high24h ? live.high24h : Number((livePrice * 1.03).toFixed(livePrice < 1 ? 4 : 2));
      const low24h = live && live.low24h ? live.low24h : Number((livePrice * 0.97).toFixed(livePrice < 1 ? 4 : 2));
      const volume24h = live && live.volume24hUsd ? live.volume24hUsd : Math.round(livePrice * token.circulatingSupply * 0.04);
      const marketCap = Math.round(livePrice * token.circulatingSupply);

      // Estimate realistic 1h and 7d changes based on 24h momentum
      const change1h = live ? Number((change24h * 0.12).toFixed(2)) : token.default1hChange;
      const change7d = live ? Number((change24h * 1.8 + token.default7dChange * 0.5).toFixed(2)) : token.default7dChange;

      // Adjust sparkline ending point to match live price
      const sparkline = [...token.sparkline7d];
      if (sparkline.length > 0) {
        sparkline[sparkline.length - 1] = livePrice;
      }

      // Check linked ETF applications from database
      const matchingEtfs = applications.filter((app) => app.tokenSymbol.toUpperCase() === token.symbol.toUpperCase());
      const approvedCount = matchingEtfs.filter((a) => a.status === "Approved & Trading").length;
      const pendingCount = matchingEtfs.filter((a) => a.status !== "Approved & Trading").length;

      let computedEtfStatus = token.etfStatus;
      if (approvedCount > 0) {
        computedEtfStatus = "Approved Spot ETF";
      } else if (pendingCount > 0) {
        computedEtfStatus = "Active 19b-4 Review";
      }

      return {
        ...token,
        priceUsd: livePrice,
        change1h,
        change24h,
        change7d,
        high24h,
        low24h,
        volume24hUsd: volume24h,
        marketCapUsd: marketCap,
        sparkline7d: sparkline,
        etfStatus: computedEtfStatus,
        approvedEtfsCount: approvedCount,
        pendingEtfsCount: pendingCount,
        matchingEtfs,
        lastUpdated: live?.lastUpdated || lastUpdatedTime || "Just now",
        source: live?.source || "Binance Live Public Spot",
      };
    });
  }, [livePrices, applications, lastUpdatedTime]);

  // Overall Global Market Metrics
  const globalMetrics = useMemo(() => {
    const totalMarketCap = tokensWithLive.reduce((acc, t) => acc + t.marketCapUsd, 0);
    const totalVolume = tokensWithLive.reduce((acc, t) => acc + t.volume24hUsd, 0);
    const btc = tokensWithLive.find((t) => t.symbol === "BTC");
    const eth = tokensWithLive.find((t) => t.symbol === "ETH");
    const btcDominance = btc && totalMarketCap > 0 ? (btc.marketCapUsd / totalMarketCap) * 100 : 57.5;
    const ethDominance = eth && totalMarketCap > 0 ? (eth.marketCapUsd / totalMarketCap) * 100 : 13.8;

    // Average 24h weighted market change
    const weightedChange = totalMarketCap > 0
      ? tokensWithLive.reduce((acc, t) => acc + (t.change24h * t.marketCapUsd), 0) / totalMarketCap
      : 0.5;

    // Top Gainers & Losers
    const sortedByChange = [...tokensWithLive].sort((a, b) => b.change24h - a.change24h);
    const topGainer = sortedByChange[0];
    const topLoser = sortedByChange[sortedByChange.length - 1];

    // Trending (High volume to market cap ratio)
    const sortedByVelocity = [...tokensWithLive].sort((a, b) => {
      const vRatioA = a.volume24hUsd / (a.marketCapUsd || 1);
      const vRatioB = b.volume24hUsd / (b.marketCapUsd || 1);
      return vRatioB - vRatioA;
    });
    const trendingTokens = sortedByVelocity.slice(0, 3);

    return {
      totalMarketCap,
      totalVolume,
      btcDominance,
      ethDominance,
      weightedChange,
      topGainer,
      topLoser,
      trendingTokens,
      tokenCount: tokensWithLive.length,
    };
  }, [tokensWithLive]);

  // Currency multiplier conversion (approximate for display)
  const currencyRate = useMemo(() => {
    switch (selectedCurrency) {
      case "EUR":
        return 0.92;
      case "GBP":
        return 0.78;
      case "BTC":
        const btcPrice = livePrices["BTC"]?.priceUsd || 79000;
        return 1 / btcPrice;
      case "ETH":
        const ethPrice = livePrices["ETH"]?.priceUsd || 2500;
        return 1 / ethPrice;
      default:
        return 1;
    }
  }, [selectedCurrency, livePrices]);

  const currencySymbol = useMemo(() => {
    switch (selectedCurrency) {
      case "EUR":
        return "€";
      case "GBP":
        return "£";
      case "BTC":
        return "₿";
      case "ETH":
        return "Ξ";
      default:
        return "$";
    }
  }, [selectedCurrency]);

  const formatPrice = (val: number): string => {
    const converted = val * currencyRate;
    if (selectedCurrency === "BTC" || selectedCurrency === "ETH") {
      return `${currencySymbol}${converted.toFixed(6)}`;
    }
    if (converted >= 1000) {
      return `${currencySymbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (converted >= 1) {
      return `${currencySymbol}${converted.toFixed(2)}`;
    }
    if (converted >= 0.001) {
      return `${currencySymbol}${converted.toFixed(4)}`;
    }
    return `${currencySymbol}${converted.toFixed(8)}`;
  };

  const formatCompactNumber = (num: number): string => {
    const converted = num * currencyRate;
    if (converted >= 1e12) return `${currencySymbol}${(converted / 1e12).toFixed(2)}T`;
    if (converted >= 1e9) return `${currencySymbol}${(converted / 1e9).toFixed(2)}B`;
    if (converted >= 1e6) return `${currencySymbol}${(converted / 1e6).toFixed(2)}M`;
    if (converted >= 1e3) return `${currencySymbol}${(converted / 1e3).toFixed(1)}K`;
    return `${currencySymbol}${converted.toFixed(0)}`;
  };

  // Filter & Search Logic
  const filteredTokens = useMemo(() => {
    return tokensWithLive.filter((token) => {
      // Watchlist filter
      if (showOnlyWatchlist && !watchlist.has(token.symbol)) {
        return false;
      }

      // Search term
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchName = token.name.toLowerCase().includes(query);
        const matchSymbol = token.symbol.toLowerCase().includes(query);
        const matchCategory = token.category.toLowerCase().includes(query);
        const matchBlockchain = token.blockchain.toLowerCase().includes(query);
        const matchEtf = token.etfDetails.toLowerCase().includes(query);
        if (!matchName && !matchSymbol && !matchCategory && !matchBlockchain && !matchEtf) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== "All") {
        if (selectedCategory === "ETF Approved") {
          if (token.etfStatus !== "Approved Spot ETF") return false;
        } else if (selectedCategory === "ETF Pending") {
          if (token.etfStatus !== "Active 19b-4 Review" && token.etfStatus !== "S-1 Filed" && token.etfStatus !== "OTC Trust Uplisting") return false;
        } else {
          const matchPrimary = token.category === selectedCategory;
          const matchSecondary = token.secondaryCategories.includes(selectedCategory);
          if (!matchPrimary && !matchSecondary) return false;
        }
      }

      // Performance filter
      if (performanceFilter === "GAINERS" && token.change24h < 0) return false;
      if (performanceFilter === "TOP_GAINERS" && token.change24h < 5) return false;
      if (performanceFilter === "LOSERS" && token.change24h >= 0) return false;

      // Market Cap tier
      if (marketCapTier === "MEGA" && token.marketCapUsd < 50_000_000_000) return false;
      if (marketCapTier === "LARGE" && (token.marketCapUsd < 10_000_000_000 || token.marketCapUsd >= 50_000_000_000)) return false;
      if (marketCapTier === "MID" && (token.marketCapUsd < 1_000_000_000 || token.marketCapUsd >= 10_000_000_000)) return false;
      if (marketCapTier === "SMALL" && token.marketCapUsd >= 1_000_000_000) return false;

      // ETF Filter
      if (etfFilter === "APPROVED" && token.etfStatus !== "Approved Spot ETF") return false;
      if (etfFilter === "PENDING" && !["Active 19b-4 Review", "S-1 Filed", "OTC Trust Uplisting"].includes(token.etfStatus)) return false;
      if (etfFilter === "ANY_ETF" && token.etfStatus === "No Active Filing") return false;

      return true;
    });
  }, [tokensWithLive, showOnlyWatchlist, watchlist, searchTerm, selectedCategory, performanceFilter, marketCapTier, etfFilter]);

  // Sorting
  const sortedTokens = useMemo(() => {
    const items = [...filteredTokens];
    items.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === "rank") {
        valA = a.rank;
        valB = b.rank;
      } else if (sortField === "name") {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    return items;
  }, [filteredTokens, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedTokens.length / rowsPerPage) || 1;
  const paginatedTokens = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedTokens.slice(start, start + rowsPerPage);
  }, [sortedTokens, currentPage, rowsPerPage]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Sparkline mini SVG renderer
  const renderSparklineSvg = (points: number[], isPositive: boolean) => {
    if (!points || points.length < 2) return null;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const width = 120;
    const height = 36;
    const padding = 2;

    const pathPoints = points.map((p, idx) => {
      const x = padding + (idx / (points.length - 1)) * (width - padding * 2);
      const y = height - padding - ((p - min) / range) * (height - padding * 2);
      return `${idx === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    });

    const strokeColor = isPositive ? "#10b981" : "#ef4444";
    const fillColor = isPositive ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)";

    // Closed path for fill gradient
    const closedPath = `${pathPoints.join(" ")} L ${width - padding} ${height} L ${padding} ${height} Z`;

    return (
      <svg width={width} height={height} className="overflow-visible inline-block">
        <path d={closedPath} fill={fillColor} />
        <path d={pathPoints.join(" ")} fill="none" stroke={strokeColor} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* 1. Global Market Overview Header (CoinMarketCap / CoinGecko style top stats) */}
      <div className="bg-[#0e0e11] border border-[#1f1f26] rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-[#1c1c24]">
          {/* Title & Live Status */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  Crypto Tokens Live Price Monitor
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Radio className="w-2.5 h-2.5 animate-pulse" />
                  100% FREE PUBLIC APIS
                </span>
              </div>
              <p className="text-xs text-[#8e8e99] mt-0.5">
                Real-time spot prices, 24h volumes, market dominance, and statutory spot ETF filing statuses.
              </p>
            </div>
          </div>

          {/* Quick Global Ticker Badges */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
            {/* Total Market Cap */}
            <div className="px-3 py-1.5 rounded-xl bg-[#14141a] border border-[#262633] flex items-center gap-2">
              <span className="text-[#888899]">Total Crypto MCap:</span>
              <span className="font-bold text-white font-mono">{formatCompactNumber(globalMetrics.totalMarketCap)}</span>
              <span className={`flex items-center font-semibold text-[11px] ${globalMetrics.weightedChange >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {globalMetrics.weightedChange >= 0 ? "+" : ""}{globalMetrics.weightedChange.toFixed(2)}%
              </span>
            </div>

            {/* 24h Global Volume */}
            <div className="px-3 py-1.5 rounded-xl bg-[#14141a] border border-[#262633] flex items-center gap-2">
              <span className="text-[#888899]">24h Vol:</span>
              <span className="font-bold text-white font-mono">{formatCompactNumber(globalMetrics.totalVolume)}</span>
            </div>

            {/* Dominance */}
            <div className="px-3 py-1.5 rounded-xl bg-[#14141a] border border-[#262633] flex items-center gap-2">
              <span className="text-[#888899]">Dominance:</span>
              <span className="font-medium text-amber-300">BTC {globalMetrics.btcDominance.toFixed(1)}%</span>
              <span className="text-[#444455]">•</span>
              <span className="font-medium text-blue-300">ETH {globalMetrics.ethDominance.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Highlight Quick Widgets Carousel: Top Gainer, Top Loser, Trending, ETF Assets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
          {/* Trending */}
          <div className="p-3 rounded-xl bg-[#13131a]/80 border border-[#22222d] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-medium text-[#8e8e99] block">Trending High Velocity</span>
                <div className="flex items-center gap-2 mt-0.5">
                  {globalMetrics.trendingTokens.map((tok) => (
                    <button
                      key={tok.symbol}
                      onClick={() => setSelectedToken(tok)}
                      className="text-xs font-bold text-white hover:text-emerald-400 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <img src={tok.icon} alt={tok.symbol} className="w-3.5 h-3.5 rounded-full" />
                      <span>{tok.symbol}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <Sparkles className="w-4 h-4 text-[#555566]" />
          </div>

          {/* Top 24h Gainer */}
          {globalMetrics.topGainer && (
            <div
              onClick={() => setSelectedToken(globalMetrics.topGainer)}
              className="p-3 rounded-xl bg-[#13131a]/80 border border-emerald-500/20 hover:border-emerald-500/40 transition-all flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-medium text-[#8e8e99]">Top 24h Gainer</span>
                    <span className="text-[10px] text-emerald-400 font-bold">+{globalMetrics.topGainer.change24h.toFixed(2)}%</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <img src={globalMetrics.topGainer.icon} alt={globalMetrics.topGainer.symbol} className="w-4 h-4 rounded-full" />
                    <span className="text-xs font-bold text-white group-hover:text-emerald-400">{globalMetrics.topGainer.name}</span>
                    <span className="text-xs font-mono text-white/70">{formatPrice(globalMetrics.topGainer.priceUsd)}</span>
                  </div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-emerald-400 opacity-70 group-hover:opacity-100" />
            </div>
          )}

          {/* Top 24h Loser */}
          {globalMetrics.topLoser && (
            <div
              onClick={() => setSelectedToken(globalMetrics.topLoser)}
              className="p-3 rounded-xl bg-[#13131a]/80 border border-red-500/20 hover:border-red-500/40 transition-all flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                  <TrendingDown className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-medium text-[#8e8e99]">Top 24h Pullback</span>
                    <span className="text-[10px] text-red-400 font-bold">{globalMetrics.topLoser.change24h.toFixed(2)}%</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <img src={globalMetrics.topLoser.icon} alt={globalMetrics.topLoser.symbol} className="w-4 h-4 rounded-full" />
                    <span className="text-xs font-bold text-white group-hover:text-red-400">{globalMetrics.topLoser.name}</span>
                    <span className="text-xs font-mono text-white/70">{formatPrice(globalMetrics.topLoser.priceUsd)}</span>
                  </div>
                </div>
              </div>
              <ArrowDownRight className="w-4 h-4 text-red-400 opacity-70 group-hover:opacity-100" />
            </div>
          )}

          {/* ETF Status Summary */}
          <div className="p-3 rounded-xl bg-[#13131a]/80 border border-purple-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-medium text-[#8e8e99] block">Spot ETF Landscape</span>
                <div className="flex items-center gap-2 mt-0.5 text-xs font-bold text-white">
                  <span className="text-emerald-400">2 Tokens Approved</span>
                  <span className="text-[#555566]">•</span>
                  <span className="text-cyan-300">12+ in Pipeline</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedCategory("ETF Pending")}
              className="text-[10px] text-purple-300 hover:underline font-semibold"
            >
              Filter
            </button>
          </div>
        </div>
      </div>

      {/* Triggered Alert Floating Banner / Toast */}
      {triggeredToastAlert && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/90 via-[#181206] to-black border-2 border-amber-500/80 shadow-2xl flex items-center justify-between gap-4 animate-bounce">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-black flex items-center justify-center font-black">
              <Bell className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-amber-300 text-sm">
                  🚨 Price Alert Triggered: {triggeredToastAlert.alert.symbol}/USDT
                </span>
                <span className="text-xs text-[#aaaaaa] font-mono">
                  at {triggeredToastAlert.timestamp}
                </span>
              </div>
              <p className="text-xs text-white">
                Live price hit <strong className="text-amber-400 font-mono">${triggeredToastAlert.triggerPrice.toLocaleString()}</strong>.{" "}
                {triggeredToastAlert.alert.notes && (
                  <span className="italic text-amber-200/90">Note: &ldquo;{triggeredToastAlert.alert.notes}&rdquo;</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveChartSymbol(triggeredToastAlert.alert.symbol);
                setIsAlertModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 cursor-pointer"
            >
              View Alerts
            </button>
            <button
              onClick={() => setTriggeredToastAlert(null)}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Interactive Candlestick Chart & Price Alerts Terminal (All 100+ Tokens Supported) */}
      <div className="bg-[#0b0b10] border border-[#222230] rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4">
        {/* Terminal Header & Quick Asset Switcher */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#1c1c28]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <LineChart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  Live Candlestick Chart &amp; Alert Engine
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  SPOT {activeChartSymbol}/USDT
                </span>
              </div>
              <p className="text-xs text-[#8e8e99]">
                Live spot kline feeds &bull; 15m, 1H, 4H, 1D, 1W, 1M, 1Y, 5Y &amp; MAX timeframes &bull; Drag, Pinch &amp; Wheel Zoom &bull; Custom Price Markers &bull; Zero Simulations
              </p>
            </div>
          </div>

          {/* Action Buttons: Set Alert & Full Alert Manager */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAlertModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer whitespace-nowrap"
            >
              <Bell className="w-4 h-4" />
              <span>Live Price Alerts</span>
              {alerts.filter((a) => a.isActive).length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-black text-amber-400">
                  {alerts.filter((a) => a.isActive).length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Comprehensive Chart Token Selector: Search Bar, Category Filters & All 100+ Tokens Switcher */}
        <div className="space-y-2.5 bg-[#0f0f18] p-3 rounded-2xl border border-[#1e1e2c]">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {/* Search Input for All Tokens */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#666677]" />
              <input
                type="text"
                value={chartSearchQuery}
                onChange={(e) => setChartSearchQuery(e.target.value)}
                placeholder="Search any token for live chart (e.g. BTC, SUI, AAVE, PEPE, SOL, HYPE, TAO)..."
                className="w-full bg-[#151522] border border-[#262638] rounded-xl pl-9 pr-8 py-1.5 text-xs text-white placeholder-[#666677] focus:outline-none focus:border-amber-400"
              />
              {chartSearchQuery && (
                <button
                  onClick={() => setChartSearchQuery("")}
                  className="absolute right-2.5 top-2 text-[#777788] hover:text-white p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Toggle: Expand Grid / Collapse Carousel */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsChartTokenPickerOpen(!isChartTokenPickerOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  isChartTokenPickerOpen
                    ? "bg-amber-500 text-black border-amber-400 font-bold"
                    : "bg-[#161624] text-[#9999aa] border-[#252538] hover:text-white"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>{isChartTokenPickerOpen ? "Collapse Grid" : "Browse All (100+)"}</span>
              </button>
            </div>
          </div>

          {/* Category Filter Pills for Chart Selection */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-[#242436]">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setChartCategoryFilter(cat)}
                className={`px-2.5 py-0.5 text-[11px] rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  chartCategoryFilter === cat
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold"
                    : "bg-[#14141e] text-[#777788] hover:text-white border border-[#20202e]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Render Filtered Tokens (Carousel or Expanded Grid) */}
          {(() => {
            const chartTokensList = tokensWithLive.filter((t) => {
              const matchesSearch =
                !chartSearchQuery.trim() ||
                t.symbol.toLowerCase().includes(chartSearchQuery.trim().toLowerCase()) ||
                t.name.toLowerCase().includes(chartSearchQuery.trim().toLowerCase());
              const matchesCat =
                chartCategoryFilter === "All" ||
                t.category === chartCategoryFilter ||
                (chartCategoryFilter === "ETF Approved" && t.etfStatus === "Approved") ||
                (chartCategoryFilter === "ETF Pending" && t.etfStatus === "Pending Filing");
              return matchesSearch && matchesCat;
            });

            if (chartTokensList.length === 0) {
              return (
                <div className="p-4 text-center text-xs text-[#777788]">
                  No tokens match &ldquo;{chartSearchQuery}&rdquo; in category {chartCategoryFilter}.
                </div>
              );
            }

            return (
              <div
                className={`flex gap-1.5 pb-1 ${
                  isChartTokenPickerOpen || chartSearchQuery
                    ? "flex-wrap max-h-56 overflow-y-auto p-1"
                    : "overflow-x-auto scrollbar-thin scrollbar-thumb-[#242436]"
                }`}
              >
                {chartTokensList.map((tok) => {
                  const isSelected = activeChartSymbol.toUpperCase() === tok.symbol.toUpperCase();
                  const live = livePrices[tok.symbol.toUpperCase()];
                  const change = live ? live.change24h : tok.change24h;
                  const price = live ? live.priceUsd : tok.priceUsd;

                  return (
                    <button
                      key={tok.symbol}
                      type="button"
                      onClick={() => setActiveChartSymbol(tok.symbol)}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                        isSelected
                          ? "bg-amber-500 text-black shadow-md shadow-amber-500/20 font-bold"
                          : "bg-[#14141e] text-[#cccccc] hover:text-white hover:bg-[#1c1c2a] border border-[#222232]"
                      }`}
                    >
                      <img src={tok.icon} alt={tok.symbol} className="w-4 h-4 rounded-full" />
                      <span className="font-mono font-bold">{tok.symbol}</span>
                      <span className={`text-[11px] font-mono ${isSelected ? "text-black/90 font-bold" : "text-[#aaaaaa]"}`}>
                        ${formatPrice(price).replace("$", "")}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-semibold ${
                          isSelected
                            ? "text-black/90"
                            : change >= 0
                            ? "text-emerald-400"
                            : "text-red-400"
                        }`}
                      >
                        {change >= 0 ? "+" : ""}
                        {change.toFixed(1)}%
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* Interactive Candlestick Chart Component */}
        {(() => {
          const currentTokenObj = tokensWithLive.find(
            (t) => t.symbol.toUpperCase() === activeChartSymbol.toUpperCase()
          );
          const currentPrice =
            livePrices[activeChartSymbol]?.priceUsd ||
            currentTokenObj?.priceUsd ||
            (activeChartSymbol === "BTC" ? 96000 : 2700);
          const change24h =
            livePrices[activeChartSymbol]?.change24h ||
            currentTokenObj?.change24h ||
            0;
          const tokenName = currentTokenObj?.name || activeChartSymbol;

          const high24h =
            livePrices[activeChartSymbol]?.high24h ||
            currentTokenObj?.high24h ||
            currentPrice * 1.02;
          const low24h =
            livePrices[activeChartSymbol]?.low24h ||
            currentTokenObj?.low24h ||
            currentPrice * 0.98;
          const volume24hUsd =
            livePrices[activeChartSymbol]?.volume24hUsd ||
            currentTokenObj?.volume24hUsd ||
            0;

          return (
            <TokenCandleChart
              symbol={activeChartSymbol}
              tokenName={tokenName}
              currentPrice={currentPrice}
              change24h={change24h}
              high24h={high24h}
              low24h={low24h}
              volume24hUsd={volume24hUsd}
              liveData={livePrices[activeChartSymbol]}
              activeAlertsCount={alerts.filter((a) => a.isActive && a.symbol.toUpperCase() === activeChartSymbol.toUpperCase()).length}
              onOpenAlertModal={() => setIsAlertModalOpen(true)}
            />
          );
        })()}
      </div>

      {/* 3. Comprehensive Filter & Search Controls Bar */}
      <div className="bg-[#0c0c10] border border-[#1e1e26] rounded-2xl p-4 space-y-4 shadow-md">
        {/* Category Pills Slider */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-[#2a2a38]">
          <button
            onClick={() => {
              setShowOnlyWatchlist(!showOnlyWatchlist);
              setCurrentPage(1);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              showOnlyWatchlist
                ? "bg-amber-500 text-black shadow-md shadow-amber-500/20 font-bold"
                : "bg-[#14141c] text-[#a0a0b0] hover:text-white border border-[#242433]"
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${showOnlyWatchlist ? "fill-black text-black" : "text-amber-400"}`} />
            <span>Watchlist ({watchlist.size})</span>
          </button>

          <div className="h-5 w-[1px] bg-[#242433] mx-1 shrink-0" />

          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setShowOnlyWatchlist(false);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat && !showOnlyWatchlist
                  ? "bg-white text-black font-bold shadow-md shadow-white/10"
                  : "bg-[#14141c] text-[#8e8e99] hover:text-white hover:bg-[#1a1a24] border border-[#242433]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search, Performance Filter, Market Cap Tier, Currency, and Layout Mode Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pt-1">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666677]" />
            <input
              type="text"
              placeholder="Search token by name, symbol, or network (e.g. BTC, Solana, Move)..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#13131c] border border-[#262636] rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-[#666677] focus:outline-none focus:border-emerald-500/60 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666677] hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns & Layout Switches */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* 24h Performance Filter */}
            <select
              value={performanceFilter}
              onChange={(e: any) => {
                setPerformanceFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-[#14141c] border border-[#262636] text-[#cccccc] rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="ALL">24h Gain/Loss: All</option>
              <option value="GAINERS">Gainers (&ge; 0%)</option>
              <option value="TOP_GAINERS">Top Gainers (&gt; +5%)</option>
              <option value="LOSERS">Losers (&lt; 0%)</option>
            </select>

            {/* Market Cap Tier */}
            <select
              value={marketCapTier}
              onChange={(e: any) => {
                setMarketCapTier(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-[#14141c] border border-[#262636] text-[#cccccc] rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="ALL">Market Cap: All Tiers</option>
              <option value="MEGA">Mega Cap ($50B+)</option>
              <option value="LARGE">Large Cap ($10B - $50B)</option>
              <option value="MID">Mid Cap ($1B - $10B)</option>
              <option value="SMALL">Small Cap (&lt; $1B)</option>
            </select>

            {/* Currency Unit Switcher */}
            <div className="flex items-center rounded-xl bg-[#14141c] border border-[#262636] p-0.5">
              {(["USD", "EUR", "BTC", "ETH"] as CurrencyUnit[]).map((curr) => (
                <button
                  key={curr}
                  onClick={() => setSelectedCurrency(curr)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    selectedCurrency === curr
                      ? "bg-emerald-500/20 text-emerald-300 font-bold"
                      : "text-[#777788] hover:text-white"
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>

            {/* Layout View Mode Toggle */}
            <div className="flex items-center rounded-xl bg-[#14141c] border border-[#262636] p-0.5">
              <button
                onClick={() => setLayoutMode("table")}
                title="Table View (CoinMarketCap standard)"
                className={`p-1.5 rounded-lg transition-colors ${
                  layoutMode === "table" ? "bg-[#252535] text-white" : "text-[#777788] hover:text-white"
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setLayoutMode("grid")}
                title="Grid / Cards View"
                className={`p-1.5 rounded-lg transition-colors ${
                  layoutMode === "grid" ? "bg-[#252535] text-white" : "text-[#777788] hover:text-white"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Live Sync Trigger */}
            <button
              onClick={onRefreshLivePrices}
              disabled={isRefreshing}
              title="Poll latest spot prices from Binance & CoinGecko"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 font-semibold cursor-pointer disabled:opacity-50 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-emerald-400" : ""}`} />
              <span className="hidden sm:inline">Sync Live</span>
            </button>
          </div>
        </div>

        {/* Filter Count & Reset */}
        <div className="flex items-center justify-between text-xs text-[#777788] pt-1">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong className="text-white font-bold">{sortedTokens.length}</strong> of {tokensWithLive.length} tracked tokens
            </span>
            {lastUpdatedTime && (
              <>
                <span>•</span>
                <span className="text-[11px] font-mono text-emerald-400/80">Last tick {lastUpdatedTime}</span>
              </>
            )}
          </div>
          {(searchTerm || selectedCategory !== "All" || performanceFilter !== "ALL" || marketCapTier !== "ALL" || showOnlyWatchlist) && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("All");
                setPerformanceFilter("ALL");
                setMarketCapTier("ALL");
                setShowOnlyWatchlist(false);
                setCurrentPage(1);
              }}
              className="text-emerald-400 hover:underline font-semibold cursor-pointer"
            >
              Reset all filters
            </button>
          )}
        </div>
      </div>

      {/* 3. Main Display: Table View or Grid View */}
      {layoutMode === "table" ? (
        <div className="bg-[#0c0c10] border border-[#1e1e26] rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#09090d] border-b border-[#1c1c24] text-[11px] font-bold text-[#888899] uppercase tracking-wider select-none">
                  <th className="py-3.5 pl-4 pr-1 w-8 text-center">⭐</th>
                  <th
                    onClick={() => handleSort("rank")}
                    className="py-3.5 px-2 w-12 text-center cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>#</span>
                      {sortField === "rank" && <ArrowUpDown className="w-3 h-3 text-emerald-400" />}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("name")}
                    className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Name &amp; Asset</span>
                      {sortField === "name" && <ArrowUpDown className="w-3 h-3 text-emerald-400" />}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("priceUsd")}
                    className="py-3.5 px-4 text-right cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Price ({selectedCurrency})</span>
                      {sortField === "priceUsd" && <ArrowUpDown className="w-3 h-3 text-emerald-400" />}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("change1h")}
                    className="py-3.5 px-3 text-right cursor-pointer hover:text-white transition-colors hidden md:table-cell"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>1h %</span>
                      {sortField === "change1h" && <ArrowUpDown className="w-3 h-3 text-emerald-400" />}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("change24h")}
                    className="py-3.5 px-3 text-right cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>24h %</span>
                      {sortField === "change24h" && <ArrowUpDown className="w-3 h-3 text-emerald-400" />}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("change7d")}
                    className="py-3.5 px-3 text-right cursor-pointer hover:text-white transition-colors hidden lg:table-cell"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>7d %</span>
                      {sortField === "change7d" && <ArrowUpDown className="w-3 h-3 text-emerald-400" />}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("volume24hUsd")}
                    className="py-3.5 px-4 text-right cursor-pointer hover:text-white transition-colors hidden sm:table-cell"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>24h Volume</span>
                      {sortField === "volume24hUsd" && <ArrowUpDown className="w-3 h-3 text-emerald-400" />}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("marketCapUsd")}
                    className="py-3.5 px-4 text-right cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Market Cap</span>
                      {sortField === "marketCapUsd" && <ArrowUpDown className="w-3 h-3 text-emerald-400" />}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("circulatingSupply")}
                    className="py-3.5 px-4 text-right cursor-pointer hover:text-white transition-colors hidden xl:table-cell"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Circulating Supply</span>
                      {sortField === "circulatingSupply" && <ArrowUpDown className="w-3 h-3 text-emerald-400" />}
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-center hidden lg:table-cell">Last 7 Days</th>
                  <th className="py-3.5 px-4 text-left hidden sm:table-cell">ETF Filing Status</th>
                  <th className="py-3.5 pr-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#171720] text-xs">
                {paginatedTokens.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="py-12 text-center text-[#777788]">
                      No tokens matched your current filter selection.
                    </td>
                  </tr>
                ) : (
                  paginatedTokens.map((token, index) => {
                    const isStarred = watchlist.has(token.symbol);
                    const flash = priceFlashMap[token.symbol];
                    const isGainer = token.change24h >= 0;
                    const isGainer7d = token.change7d >= 0;
                    const isGainer1h = token.change1h >= 0;

                    // ETF Badge styling
                    const isApprovedEtf = token.etfStatus === "Approved Spot ETF";
                    const isPendingEtf = token.etfStatus === "Active 19b-4 Review" || token.etfStatus === "S-1 Filed";
                    const isOtc = token.etfStatus === "OTC Trust Uplisting";

                    return (
                      <tr
                        key={token.symbol}
                        onClick={() => setSelectedToken(token)}
                        className={`hover:bg-[#151520]/80 transition-colors cursor-pointer group ${
                          flash === "up" ? "bg-emerald-950/20" : flash === "down" ? "bg-red-950/20" : ""
                        }`}
                      >
                        {/* Star / Watchlist */}
                        <td className="py-3.5 pl-4 pr-1 text-center" onClick={(e) => toggleWatchlist(token.symbol, e)}>
                          <button
                            title={isStarred ? "Remove from Watchlist" : "Add to Watchlist"}
                            className="text-[#444455] hover:text-amber-400 transition-colors cursor-pointer"
                          >
                            <Star className={`w-3.5 h-3.5 ${isStarred ? "fill-amber-400 text-amber-400" : ""}`} />
                          </button>
                        </td>

                        {/* Rank */}
                        <td className="py-3.5 px-2 text-center font-mono text-[#777788] text-[11px]">
                          {token.rank}
                        </td>

                        {/* Name & Icon */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={token.icon}
                              alt={token.symbol}
                              className="w-7 h-7 rounded-full bg-[#1c1c28] p-0.5 shrink-0"
                              onError={(e: any) => {
                                e.target.src = "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png";
                              }}
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white group-hover:text-emerald-400 transition-colors text-sm">
                                  {token.name}
                                </span>
                                <span className="font-mono text-[11px] font-bold text-[#888899] bg-[#171722] px-1.5 py-0.5 rounded">
                                  {token.symbol}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-[#666677]">{token.category}</span>
                                {token.blockchain && (
                                  <>
                                    <span className="text-[9px] text-[#444455]">•</span>
                                    <span className="text-[10px] text-[#555566]">{token.blockchain}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Live Price with Flash Animation */}
                        <td className="py-3.5 px-4 text-right">
                          <span
                            className={`font-mono font-bold text-sm tracking-tight transition-colors duration-500 ${
                              flash === "up"
                                ? "text-emerald-300 bg-emerald-500/20 px-1 rounded"
                                : flash === "down"
                                ? "text-red-300 bg-red-500/20 px-1 rounded"
                                : "text-white"
                            }`}
                          >
                            {formatPrice(token.priceUsd)}
                          </span>
                        </td>

                        {/* 1h Change */}
                        <td className="py-3.5 px-3 text-right font-mono font-semibold hidden md:table-cell">
                          <span className={`flex items-center justify-end gap-0.5 ${isGainer1h ? "text-emerald-400" : "text-red-400"}`}>
                            {isGainer1h ? "+" : ""}{token.change1h.toFixed(2)}%
                          </span>
                        </td>

                        {/* 24h Change */}
                        <td className="py-3.5 px-3 text-right font-mono font-bold">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold ${
                              isGainer
                                ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                                : "text-red-400 bg-red-500/10 border border-red-500/20"
                            }`}
                          >
                            {isGainer ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            <span>{Math.abs(token.change24h).toFixed(2)}%</span>
                          </span>
                        </td>

                        {/* 7d Change */}
                        <td className="py-3.5 px-3 text-right font-mono font-semibold hidden lg:table-cell">
                          <span className={`${isGainer7d ? "text-emerald-400" : "text-red-400"}`}>
                            {isGainer7d ? "+" : ""}{token.change7d.toFixed(2)}%
                          </span>
                        </td>

                        {/* 24h Volume */}
                        <td className="py-3.5 px-4 text-right font-mono hidden sm:table-cell">
                          <div className="font-semibold text-[#cccccc]">
                            {formatCompactNumber(token.volume24hUsd)}
                          </div>
                          <div className="text-[10px] text-[#666677] font-mono">
                            {token.marketCapUsd > 0
                              ? `${((token.volume24hUsd / token.marketCapUsd) * 100).toFixed(1)}% mcap`
                              : ""}
                          </div>
                        </td>

                        {/* Market Cap */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                          <div>{formatCompactNumber(token.marketCapUsd)}</div>
                          <div className="text-[10px] text-[#666677] font-normal">
                            {globalMetrics.totalMarketCap > 0
                              ? `${((token.marketCapUsd / globalMetrics.totalMarketCap) * 100).toFixed(2)}% dom`
                              : ""}
                          </div>
                        </td>

                        {/* Circulating Supply */}
                        <td className="py-3.5 px-4 text-right font-mono hidden xl:table-cell">
                          <div className="font-medium text-[#cccccc]">
                            {token.circulatingSupply.toLocaleString()} {token.symbol}
                          </div>
                          {token.maxSupply && (
                            <div className="w-24 ml-auto mt-1 bg-[#222230] rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-emerald-400 h-full rounded-full"
                                style={{ width: `${Math.min(100, (token.circulatingSupply / token.maxSupply) * 100)}%` }}
                              />
                            </div>
                          )}
                        </td>

                        {/* Last 7 Days Sparkline SVG */}
                        <td className="py-3.5 px-4 text-center hidden lg:table-cell">
                          {renderSparklineSvg(token.sparkline7d, isGainer7d)}
                        </td>

                        {/* ETF Status */}
                        <td className="py-3.5 px-4 text-left hidden sm:table-cell">
                          {isApprovedEtf ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              Approved Spot ETF
                            </span>
                          ) : isPendingEtf ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                              <Clock className="w-3 h-3 text-purple-400" />
                              Active 19b-4 Review
                            </span>
                          ) : isOtc ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                              OTC Trust Uplisting
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium text-[#777788] bg-[#171720] border border-[#242430]">
                              Pipeline
                            </span>
                          )}
                        </td>

                        {/* Action Quick View */}
                        <td className="py-3.5 pr-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedToken(token);
                            }}
                            className="p-1.5 rounded-lg bg-[#181824] hover:bg-emerald-950/60 text-[#888899] hover:text-emerald-300 border border-[#282838] transition-colors cursor-pointer"
                            title="Inspect Token Detail & ETF Filings"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="bg-[#09090d] border-t border-[#1c1c24] px-4 py-3 flex items-center justify-between text-xs text-[#888899]">
              <div className="flex items-center gap-2">
                <span>Page {currentPage} of {totalPages}</span>
                <span className="text-[#444455]">•</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-[#14141c] border border-[#262636] text-white rounded-lg px-2 py-1 text-xs"
                >
                  <option value={20}>20 rows</option>
                  <option value={50}>50 rows</option>
                  <option value={100}>100 rows</option>
                  <option value={200}>All rows</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg bg-[#14141c] border border-[#262636] text-white disabled:opacity-30 hover:bg-[#20202c] transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    onClick={() => setCurrentPage(pg)}
                    className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${
                      currentPage === pg
                        ? "bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20"
                        : "bg-[#14141c] text-[#888899] hover:text-white border border-[#262636]"
                    }`}
                  >
                    {pg}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg bg-[#14141c] border border-[#262636] text-white disabled:opacity-30 hover:bg-[#20202c] transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Grid / Heatmap Cards Mode */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {paginatedTokens.map((token) => {
            const isGainer = token.change24h >= 0;
            const isStarred = watchlist.has(token.symbol);
            return (
              <div
                key={token.symbol}
                onClick={() => setSelectedToken(token)}
                className="bg-[#0e0e14] border border-[#1e1e28] hover:border-emerald-500/40 rounded-2xl p-4 transition-all hover:shadow-xl cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-[#1c1c28]">
                    <div className="flex items-center gap-2.5">
                      <img src={token.icon} alt={token.symbol} className="w-8 h-8 rounded-full bg-[#1c1c28] p-0.5" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-white group-hover:text-emerald-400 transition-colors text-sm">
                            {token.name}
                          </h3>
                          <span className="text-[10px] font-mono text-[#888899] bg-[#1a1a26] px-1.5 py-0.5 rounded">
                            {token.symbol}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#666677]">{token.category}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => toggleWatchlist(token.symbol, e)}
                      className="text-[#444455] hover:text-amber-400"
                    >
                      <Star className={`w-4 h-4 ${isStarred ? "fill-amber-400 text-amber-400" : ""}`} />
                    </button>
                  </div>

                  {/* Price & 24h Change */}
                  <div className="py-3 flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] text-[#777788] block">Spot Price</span>
                      <span className="text-lg font-bold font-mono text-white">{formatPrice(token.priceUsd)}</span>
                    </div>
                    <span
                      className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-xs font-bold ${
                        isGainer ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"
                      }`}
                    >
                      {isGainer ? "+" : ""}{token.change24h.toFixed(2)}%
                    </span>
                  </div>

                  {/* Sparkline */}
                  <div className="py-1 text-center">
                    {renderSparklineSvg(token.sparkline7d, isGainer)}
                  </div>

                  {/* Market Stats */}
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#1a1a26] text-[11px] font-mono">
                    <div>
                      <span className="text-[#666677] text-[10px] block">Market Cap</span>
                      <span className="font-bold text-[#cccccc]">{formatCompactNumber(token.marketCapUsd)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[#666677] text-[10px] block">24h Vol</span>
                      <span className="font-bold text-[#cccccc]">{formatCompactNumber(token.volume24hUsd)}</span>
                    </div>
                  </div>
                </div>

                {/* ETF Badge */}
                <div className="mt-3 pt-2.5 border-t border-[#1a1a26] flex items-center justify-between text-[11px]">
                  <span className="text-[10px] text-[#888899]">ETF Status:</span>
                  <span className={`font-bold text-[10px] ${token.etfStatus === "Approved Spot ETF" ? "text-emerald-400" : "text-purple-300"}`}>
                    {token.etfStatus}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Interactive Token Detail Modal / Quick View Drawer */}
      {selectedToken && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setSelectedToken(null)}
        >
          <div
            className="bg-[#0f0f14] border border-[#262633] rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-white space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#1f1f2a]">
              <div className="flex items-center gap-3.5">
                <img
                  src={selectedToken.icon}
                  alt={selectedToken.symbol}
                  className="w-12 h-12 rounded-2xl bg-[#1c1c28] p-1 border border-[#2a2a3a]"
                />
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-xl font-bold text-white">{selectedToken.name}</h3>
                    <span className="text-xs font-mono font-bold text-[#9999aa] bg-[#1a1a26] px-2 py-0.5 rounded-lg border border-[#262636]">
                      {selectedToken.symbol}
                    </span>
                    <span className="text-xs font-mono text-[#888899]">#{selectedToken.rank}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-[#888899]">
                    <span>{selectedToken.category}</span>
                    <span>•</span>
                    <span>{selectedToken.blockchain}</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-semibold">{selectedToken.source}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleWatchlist(selectedToken.symbol)}
                  className="p-2 rounded-xl bg-[#181824] hover:bg-[#202030] text-[#888899] hover:text-amber-400 transition-colors cursor-pointer"
                >
                  <Star className={`w-4 h-4 ${watchlist.has(selectedToken.symbol) ? "fill-amber-400 text-amber-400" : ""}`} />
                </button>
                <button
                  onClick={() => setSelectedToken(null)}
                  className="p-2 rounded-xl bg-[#181824] hover:bg-[#202030] text-[#888899] hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Price & 24h High/Low */}
            <div className="bg-[#14141c] border border-[#242433] rounded-2xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
                <div>
                  <span className="text-xs text-[#888899] block">Live Spot Price (Free Open Feeds)</span>
                  <div className="flex items-baseline gap-3 mt-1">
                    <span className="text-3xl font-extrabold font-mono text-white">
                      {formatPrice(selectedToken.priceUsd)}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                        selectedToken.change24h >= 0 ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"
                      }`}
                    >
                      {selectedToken.change24h >= 0 ? "+" : ""}{selectedToken.change24h.toFixed(2)}% (24h)
                    </span>
                  </div>
                </div>

                <div className="text-right text-xs font-mono">
                  <span className="text-[#888899]">24h Range:</span>
                  <div className="text-white font-semibold">
                    {formatPrice(selectedToken.low24h)} - {formatPrice(selectedToken.high24h)}
                  </div>
                </div>
              </div>

              {/* Range Slider Bar */}
              <div className="space-y-1">
                <div className="h-2 bg-[#20202c] rounded-full overflow-hidden relative">
                  <div
                    className="absolute top-0 bottom-0 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                    style={{
                      left: "0%",
                      width: `${Math.max(
                        5,
                        Math.min(
                          95,
                          ((selectedToken.priceUsd - selectedToken.low24h) /
                            (selectedToken.high24h - selectedToken.low24h || 1)) *
                            100
                        )
                      )}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-[#666677] font-mono">
                  <span>Low: {formatPrice(selectedToken.low24h)}</span>
                  <span>High: {formatPrice(selectedToken.high24h)}</span>
                </div>
              </div>
            </div>

            {/* Key Statistics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#13131c] border border-[#222230]">
                <span className="text-[#888899] text-[11px] block">Market Cap</span>
                <span className="text-sm font-bold font-mono text-white mt-1 block">
                  {formatCompactNumber(selectedToken.marketCapUsd)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#13131c] border border-[#222230]">
                <span className="text-[#888899] text-[11px] block">24h Trading Vol</span>
                <span className="text-sm font-bold font-mono text-white mt-1 block">
                  {formatCompactNumber(selectedToken.volume24hUsd)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#13131c] border border-[#222230]">
                <span className="text-[#888899] text-[11px] block">All-Time High</span>
                <span className="text-sm font-bold font-mono text-white mt-1 block">
                  {formatPrice(selectedToken.allTimeHighUsd)}
                </span>
                <span className="text-[10px] text-[#777788]">{selectedToken.allTimeHighDate}</span>
              </div>

              <div className="p-3 rounded-xl bg-[#13131c] border border-[#222230]">
                <span className="text-[#888899] text-[11px] block">Circulating Supply</span>
                <span className="text-sm font-bold font-mono text-white mt-1 block">
                  {(selectedToken.circulatingSupply / 1e6).toFixed(1)}M {selectedToken.symbol}
                </span>
              </div>
            </div>

            {/* Official Spot ETF Status Section */}
            <div className="bg-[#12121a] border border-[#20202c] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-sm font-bold text-white">Institutional ETF Status &amp; SEC Pipeline</h4>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {selectedToken.etfStatus}
                </span>
              </div>

              <p className="text-xs text-[#cccccc] leading-relaxed">
                {selectedToken.etfDetails}
              </p>

              {/* Active Issuers & Tickers */}
              {selectedToken.activeIssuers && selectedToken.activeIssuers.length > 0 && (
                <div className="pt-2 border-t border-[#1c1c28] flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-[#888899]">Active Issuers:</span>
                  {selectedToken.activeIssuers.map((iss) => (
                    <span key={iss} className="px-2 py-0.5 rounded-md bg-[#1a1a28] text-white font-medium">
                      {iss}
                    </span>
                  ))}
                </div>
              )}

              {selectedToken.activeEtfTickers && selectedToken.activeEtfTickers.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-[#888899]">Associated Tickers:</span>
                  {selectedToken.activeEtfTickers.map((tick) => (
                    <button
                      key={tick}
                      onClick={() => {
                        if (onSelectEtfByTicker) {
                          onSelectEtfByTicker(tick);
                          setSelectedToken(null);
                        }
                      }}
                      className="px-2 py-0.5 rounded bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 font-mono font-bold text-[11px] border border-emerald-500/30 cursor-pointer"
                    >
                      {tick}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Description & Official Links */}
            <div className="space-y-2 text-xs">
              <span className="text-[#888899] font-semibold uppercase tracking-wider text-[10px]">About {selectedToken.name}</span>
              <p className="text-[#cccccc] leading-relaxed">
                {selectedToken.description}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveChartSymbol(selectedToken.symbol);
                    setIsAlertModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition-colors cursor-pointer shadow-md shadow-amber-500/20"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Set Live Price Alert</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveChartSymbol(selectedToken.symbol);
                    setSelectedToken(null);
                    window.scrollTo({ top: 120, behavior: "smooth" });
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 font-bold text-xs border border-emerald-500/30 transition-colors cursor-pointer"
                >
                  <LineChart className="w-3.5 h-3.5" />
                  <span>Analyze on Candlestick Chart</span>
                </button>

                <a
                  href={selectedToken.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#181824] hover:bg-[#222234] text-white text-xs border border-[#282838] transition-colors"
                >
                  <Globe className="w-3.5 h-3.5 text-[#888899]" />
                  <span>Official Website</span>
                  <ExternalLink className="w-3 h-3 text-[#666677]" />
                </a>

                <a
                  href={selectedToken.explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#181824] hover:bg-[#222234] text-white text-xs border border-[#282838] transition-colors"
                >
                  <Search className="w-3.5 h-3.5 text-[#888899]" />
                  <span>Blockchain Explorer</span>
                  <ExternalLink className="w-3 h-3 text-[#666677]" />
                </a>

                <a
                  href={`https://www.binance.com/en/trade/${selectedToken.binanceSymbol}?type=spot`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-950/30 hover:bg-amber-900/50 text-amber-300 text-xs border border-amber-500/30 transition-colors"
                >
                  <span>Spot Orderbook Feed</span>
                  <ExternalLink className="w-3 h-3 text-amber-400" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Binance Price Alert Modal */}
      {isAlertModalOpen && (
        <BinancePriceAlertModal
          isOpen={isAlertModalOpen}
          onClose={() => setIsAlertModalOpen(false)}
          symbol={activeChartSymbol}
          tokenName={
            tokensWithLive.find((t) => t.symbol.toUpperCase() === activeChartSymbol.toUpperCase())?.name ||
            activeChartSymbol
          }
          currentPrice={
            livePrices[activeChartSymbol]?.priceUsd ||
            tokensWithLive.find((t) => t.symbol.toUpperCase() === activeChartSymbol.toUpperCase())?.priceUsd ||
            0
          }
          change24h={
            livePrices[activeChartSymbol]?.change24h ||
            tokensWithLive.find((t) => t.symbol.toUpperCase() === activeChartSymbol.toUpperCase())?.change24h ||
            0
          }
          livePrices={livePrices}
          alerts={alerts}
          onSaveAlert={handleSaveAlert}
          onToggleAlert={handleToggleAlert}
          onDeleteAlert={handleDeleteAlert}
          onClearTriggered={handleClearInactiveAlerts}
        />
      )}
    </div>
  );
};
