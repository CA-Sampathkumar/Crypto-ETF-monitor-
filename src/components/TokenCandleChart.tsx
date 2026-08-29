import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  BarChart2,
  Clock,
  TrendingUp,
  TrendingDown,
  Maximize2,
  Minimize2,
  Volume2,
  Layers,
  Edit3,
  Plus,
  Minus,
  RotateCcw,
  Trash2,
  Eye,
  EyeOff,
  Check,
  X,
  AlertTriangle,
  RefreshCw,
  Bell,
  Sparkles,
  Sliders,
  Target,
  Move,
  Search,
} from "lucide-react";
import { CandleData, KlineTimeframe, fetchLiveKlines, LiveTokenPrice } from "../services/marketApi";

export interface ChartMarker {
  id: string;
  type: "horizontal_line" | "target_tpsl" | "note";
  price: number;
  label: string;
  color: string; // e.g. '#10b981', '#ef4444', '#3b82f6', '#f59e0b'
  targetTp?: number;
  targetSl?: number;
}

interface TokenCandleChartProps {
  symbol: string;
  tokenName: string;
  currentPrice: number;
  change24h: number;
  high24h?: number;
  low24h?: number;
  volume24hUsd?: number;
  liveData?: LiveTokenPrice;
  onOpenAlertModal?: () => void;
  activeAlertsCount?: number;
}

const TIMEFRAMES: { label: string; value: KlineTimeframe }[] = [
  { label: "15m", value: "15m" },
  { label: "1H", value: "1h" },
  { label: "4H", value: "4h" },
  { label: "1D", value: "1d" },
  { label: "1W", value: "1w" },
  { label: "1M", value: "1M" },
  { label: "1Y", value: "1y" },
  { label: "5Y", value: "5y" },
  { label: "MAX", value: "max" },
];

export const TokenCandleChart: React.FC<TokenCandleChartProps> = ({
  symbol,
  tokenName,
  currentPrice,
  change24h,
  high24h,
  low24h,
  volume24hUsd,
  liveData,
  onOpenAlertModal,
  activeAlertsCount = 0,
}) => {
  const [timeframe, setTimeframe] = useState<KlineTimeframe>("15m");
  const [allCandles, setAllCandles] = useState<CandleData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Crosshair & Price tracking state (Mouse & Touch)
  const [hoveredCandle, setHoveredCandle] = useState<CandleData | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoveredPriceY, setHoveredPriceY] = useState<number | null>(null);

  // Zoom & Pan Interactive State
  const [visibleCount, setVisibleCount] = useState<number>(45); // number of candles rendered on screen
  const [panOffset, setPanOffset] = useState<number>(0); // 0 = viewing latest live candles, > 0 = viewing past history
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ startX: number; initialPan: number; hasMoved: boolean }>({
    startX: 0,
    initialPan: 0,
    hasMoved: false,
  });
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartCountRef = useRef<number>(45);

  const [showVolume, setShowVolume] = useState<boolean>(true);
  const [showMarkers, setShowMarkers] = useState<boolean>(true);
  const [isMarkerDrawerOpen, setIsMarkerDrawerOpen] = useState<boolean>(false);

  // Markers state (saved per symbol in localStorage)
  const [markers, setMarkers] = useState<ChartMarker[]>(() => {
    try {
      const saved = localStorage.getItem(`crypto_chart_markers_${symbol.toUpperCase()}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn("Failed to parse markers", e);
    }
    return [];
  });

  // Edit / Add marker state
  const [newMarkerType, setNewMarkerType] = useState<"horizontal_line" | "target_tpsl" | "note">("horizontal_line");
  const [newMarkerPrice, setNewMarkerPrice] = useState<string>(currentPrice ? currentPrice.toString() : "");
  const [newMarkerLabel, setNewMarkerLabel] = useState<string>("Support Level");
  const [newMarkerColor, setNewMarkerColor] = useState<string>("#3b82f6");
  const [newTpPrice, setNewTpPrice] = useState<string>("");
  const [newSlPrice, setNewSlPrice] = useState<string>("");
  const [editingMarkerId, setEditingMarkerId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const chartWrapperRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState<number>(800);

  // Measure container width for responsive SVG rendering
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setChartWidth(containerRef.current.clientWidth);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Save markers whenever updated
  useEffect(() => {
    localStorage.setItem(`crypto_chart_markers_${symbol.toUpperCase()}`, JSON.stringify(markers));
  }, [markers, symbol]);

  // Sync newMarkerPrice with currentPrice on initial load or symbol switch
  useEffect(() => {
    if (currentPrice > 0) {
      setNewMarkerPrice(currentPrice.toString());
      setNewTpPrice((currentPrice * 1.05).toFixed(currentPrice < 1 ? 4 : 2));
      setNewSlPrice((currentPrice * 0.95).toFixed(currentPrice < 1 ? 4 : 2));
    }
  }, [symbol, currentPrice]);

  // Reset pan whenever switching token or timeframe
  useEffect(() => {
    setPanOffset(0);
    setHoveredCandle(null);
    setHoveredIndex(null);
    setHoveredPriceY(null);
  }, [symbol, timeframe]);

  // Load live Klines data
  const loadKlines = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchLimit =
        timeframe === "max"
          ? 500
          : timeframe === "5y"
          ? 260
          : timeframe === "1y"
          ? 365
          : timeframe === "1M"
          ? 60
          : 150;
      const data = await fetchLiveKlines(symbol, timeframe, fetchLimit);
      if (data && data.length > 0) {
        setAllCandles(data);
      } else {
        setError("Live feed connecting...");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load live candle data");
    } finally {
      setIsLoading(false);
    }
  }, [symbol, timeframe]);

  useEffect(() => {
    loadKlines();
    const interval = setInterval(loadKlines, 15000); // 15s auto-refresh
    return () => clearInterval(interval);
  }, [loadKlines]);

  // Update latest candle close price in real time when liveData arrives
  useEffect(() => {
    if (liveData && liveData.priceUsd > 0 && allCandles.length > 0) {
      setAllCandles((prev) => {
        if (prev.length === 0) return prev;
        const copy = [...prev];
        const lastIdx = copy.length - 1;
        const last = { ...copy[lastIdx] };
        last.close = liveData.priceUsd;
        if (liveData.priceUsd > last.high) last.high = liveData.priceUsd;
        if (liveData.priceUsd < last.low) last.low = liveData.priceUsd;
        copy[lastIdx] = last;
        return copy;
      });
    }
  }, [liveData]);

  // Sliced Visible Candles based on panOffset and visibleCount (Zoom/Shrink & Pan)
  const visibleCandles = useMemo(() => {
    if (allCandles.length === 0) return [];
    const total = allCandles.length;
    const end = Math.max(1, total - panOffset);
    const start = Math.max(0, end - visibleCount);
    return allCandles.slice(start, end);
  }, [allCandles, panOffset, visibleCount]);

  // Candle computations & price bounds for visible window
  const { minPrice, maxPrice, maxVol, priceRange } = useMemo(() => {
    if (visibleCandles.length === 0) {
      return {
        minPrice: currentPrice * 0.95 || 100,
        maxPrice: currentPrice * 1.05 || 110,
        maxVol: 100000,
        priceRange: 10,
      };
    }
    let min = Infinity;
    let max = -Infinity;
    let vMax = 0;

    visibleCandles.forEach((c) => {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
      if (c.volume > vMax) vMax = c.volume;
    });

    // Include active markers in price bounds if enabled
    if (showMarkers) {
      markers.forEach((m) => {
        if (m.price && m.price < min) min = m.price;
        if (m.price && m.price > max) max = m.price;
        if (m.targetTp && m.targetTp > max) max = m.targetTp;
        if (m.targetSl && m.targetSl < min) min = m.targetSl;
      });
    }

    const padding = (max - min) * 0.08 || 1;
    return {
      minPrice: Math.max(0, min - padding),
      maxPrice: max + padding,
      maxVol: vMax || 1,
      priceRange: max + padding - Math.max(0, min - padding),
    };
  }, [visibleCandles, markers, showMarkers, currentPrice]);

  // SVG Chart Layout dimensions
  const height = 370;
  const paddingLeft = 12;
  const paddingRight = 78; // for price axis labels
  const paddingTop = 25;
  const priceChartHeight = showVolume ? 255 : 315;
  const volumeChartTop = 275;
  const volumeChartHeight = 65;
  const availableWidth = Math.max(200, chartWidth - paddingLeft - paddingRight);
  const candleCount = visibleCandles.length;
  const candleSpacing = candleCount > 0 ? availableWidth / candleCount : 10;
  const candleBodyWidth = Math.max(2, Math.min(18, candleSpacing * 0.72));

  // Coordinate conversion helper
  const getY = (price: number) => {
    if (priceRange <= 0) return priceChartHeight / 2;
    return paddingTop + (1 - (price - minPrice) / priceRange) * (priceChartHeight - paddingTop);
  };

  const getVolY = (vol: number) => {
    if (maxVol <= 0) return height - 10;
    const ratio = Math.min(1, vol / maxVol);
    return volumeChartTop + volumeChartHeight - ratio * volumeChartHeight;
  };

  // Convert Y coordinate back to price value (for crosshair price tracking)
  const getPriceFromY = (y: number) => {
    const ratio = 1 - (y - paddingTop) / (priceChartHeight - paddingTop);
    return minPrice + ratio * priceRange;
  };

  // Zoom Helpers (In, Out / Shrink, Reset)
  const handleZoomIn = () => {
    setVisibleCount((prev) => Math.max(12, Math.round(prev * 0.75)));
  };

  const handleZoomOut = () => {
    setVisibleCount((prev) => Math.min(allCandles.length || 100, Math.round(prev * 1.35)));
  };

  const handleResetZoom = () => {
    setVisibleCount(45);
    setPanOffset(0);
  };

  // Wheel zoom listener (non-passive to prevent window scroll)
  useEffect(() => {
    const chartEl = chartWrapperRef.current;
    if (!chartEl) return;

    const onWheelHandler = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        // Zoom in (fewer candles)
        setVisibleCount((prev) => Math.max(12, Math.round(prev - 3)));
      } else {
        // Zoom out / shrink (more candles)
        setVisibleCount((prev) => Math.min(allCandles.length || 120, Math.round(prev + 3)));
      }
    };

    chartEl.addEventListener("wheel", onWheelHandler, { passive: false });
    return () => chartEl.removeEventListener("wheel", onWheelHandler);
  }, [allCandles.length]);

  // Pointer / Touch tracking & dragging logic
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      initialPan: panOffset,
      hasMoved: false,
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

    // Track price at pointer click
    handlePointerMove(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = chartWrapperRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clientX = e.clientX - rect.left - paddingLeft;
    const clientY = e.clientY - rect.top;

    // Handle Drag / Pan if active
    if (isDragging) {
      const deltaX = e.clientX - dragStartRef.current.startX;
      if (Math.abs(deltaX) > 4) {
        dragStartRef.current.hasMoved = true;
      }
      const candleShift = Math.round(deltaX / Math.max(4, candleSpacing));
      const maxPan = Math.max(0, allCandles.length - visibleCount);
      const newPan = Math.max(0, Math.min(maxPan, dragStartRef.current.initialPan + candleShift));
      setPanOffset(newPan);
    }

    // Handle Price & Crosshair Tracking
    if (clientX >= 0 && clientX <= availableWidth && candleCount > 0) {
      const idx = Math.min(candleCount - 1, Math.max(0, Math.floor(clientX / candleSpacing)));
      setHoveredIndex(idx);
      setHoveredCandle(visibleCandles[idx]);
      setHoveredPriceY(clientY);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
  };

  // Multi-Touch Pinch to Zoom handler
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      pinchStartDistRef.current = dist;
      pinchStartCountRef.current = visibleCount;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartDistRef.current !== null) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      const scale = pinchStartDistRef.current / dist;
      const newCount = Math.max(12, Math.min(allCandles.length || 120, Math.round(pinchStartCountRef.current * scale)));
      setVisibleCount(newCount);
    }
  };

  const handleTouchEnd = () => {
    pinchStartDistRef.current = null;
  };

  // Add / Save marker handler
  const handleSaveMarker = () => {
    const p = parseFloat(newMarkerPrice);
    if (isNaN(p) || p <= 0) return;

    if (editingMarkerId) {
      setMarkers((prev) =>
        prev.map((m) =>
          m.id === editingMarkerId
            ? {
                ...m,
                type: newMarkerType,
                price: p,
                label: newMarkerLabel.trim() || `${symbol} Marker`,
                color: newMarkerColor,
                targetTp: newMarkerType === "target_tpsl" ? parseFloat(newTpPrice) || undefined : undefined,
                targetSl: newMarkerType === "target_tpsl" ? parseFloat(newSlPrice) || undefined : undefined,
              }
            : m
        )
      );
      setEditingMarkerId(null);
    } else {
      const newM: ChartMarker = {
        id: `marker-${Date.now()}`,
        type: newMarkerType,
        price: p,
        label: newMarkerLabel.trim() || `${symbol} Marker`,
        color: newMarkerColor,
        targetTp: newMarkerType === "target_tpsl" ? parseFloat(newTpPrice) || undefined : undefined,
        targetSl: newMarkerType === "target_tpsl" ? parseFloat(newSlPrice) || undefined : undefined,
      };
      setMarkers((prev) => [...prev, newM]);
    }

    setNewMarkerLabel("Support / Resistance");
    setIsMarkerDrawerOpen(false);
  };

  const handleDeleteMarker = (id: string) => {
    setMarkers((prev) => prev.filter((m) => m.id !== id));
  };

  const handleEditMarkerClick = (marker: ChartMarker) => {
    setEditingMarkerId(marker.id);
    setNewMarkerType(marker.type);
    setNewMarkerPrice(marker.price.toString());
    setNewMarkerLabel(marker.label);
    setNewMarkerColor(marker.color);
    if (marker.targetTp) setNewTpPrice(marker.targetTp.toString());
    if (marker.targetSl) setNewSlPrice(marker.targetSl.toString());
    setIsMarkerDrawerOpen(true);
  };

  // Format price helper
  const formatPriceVal = (val?: number | null) => {
    if (val === undefined || val === null || isNaN(val)) return "0.00";
    if (val >= 1000) return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (val >= 1) return val.toFixed(3);
    if (val >= 0.0001) return val.toFixed(5);
    if (val > 0) {
      try {
        return val.toPrecision(4);
      } catch {
        return val.toFixed(6);
      }
    }
    return "0.00";
  };

  // Safe calculated 24h statistics
  const calculatedHigh = high24h ?? (allCandles.length > 0 ? Math.max(...allCandles.map((c) => c.high)) : currentPrice * 1.02);
  const calculatedLow = low24h ?? (allCandles.length > 0 ? Math.min(...allCandles.map((c) => c.low)) : currentPrice * 0.98);
  const calculatedVol = volume24hUsd ?? (allCandles.length > 0 ? allCandles.reduce((acc, c) => acc + c.volume * c.close, 0) : 0);

  // Active or hovered candle for stats header
  const activeCandle = hoveredCandle || (visibleCandles.length > 0 ? visibleCandles[visibleCandles.length - 1] : null);
  const activeIsBullish = activeCandle ? activeCandle.close >= activeCandle.open : true;
  const activeChangePct = activeCandle && activeCandle.open > 0
    ? ((activeCandle.close - activeCandle.open) / activeCandle.open) * 100
    : 0;

  return (
    <div
      ref={containerRef}
      className="bg-[#0b0b10] border border-[#1e1e2d] rounded-2xl p-4 sm:p-5 text-[#e0e0e0] shadow-xl space-y-4"
    >
      {/* Chart Top Header: Token Name, Live Price, Timeframes, Zoom Controls & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[#1b1b2a]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-white tracking-tight">{symbol}/USDT</span>
            <span className="text-xs text-[#888899] font-medium hidden sm:inline">{tokenName}</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-mono font-black text-white">
              ${formatPriceVal(currentPrice)}
            </span>
            <span
              className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-md font-mono ${
                change24h >= 0 ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"
              }`}
            >
              {change24h >= 0 ? "+" : ""}
              {change24h.toFixed(2)}%
            </span>
          </div>

          {/* Real-time Pan / Live Badge */}
          {panOffset > 0 && (
            <button
              onClick={() => setPanOffset(0)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black font-bold text-[11px] border border-amber-500/30 transition-all cursor-pointer shadow-sm animate-pulse"
              title="Jump back to latest live candles"
            >
              <span>⚡ Jump to Live</span>
              <span className="text-[10px] opacity-80">(-{panOffset} bars)</span>
            </button>
          )}
        </div>

        {/* Action Controls: Timeframes (15m, 1H, 4H, 1D, 1W, 1M, 1Y), Zoom/Shrink Tools, Markers, Alert */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe Buttons: 15m, 1H, 4H, 1D, 1W, 1M (Month), 1Y (Year) */}
          <div className="flex items-center bg-[#141420] p-1 rounded-xl border border-[#232336] overflow-x-auto">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.value}
                onClick={() => setTimeframe(tf.value)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  timeframe === tf.value
                    ? "bg-emerald-500 text-black shadow-md font-black"
                    : "text-[#888899] hover:text-white hover:bg-[#1f1f30]"
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* Interactive Zoom / Shrink / Drag Toolbar */}
          <div className="flex items-center bg-[#141420] p-0.5 rounded-xl border border-[#232336]">
            <button
              onClick={handleZoomIn}
              title="Zoom In (Expand Candles)"
              className="p-1.5 rounded-lg text-[#9999aa] hover:text-white hover:bg-[#202034] transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleZoomOut}
              title="Zoom Out / Shrink (Show More Candles)"
              className="p-1.5 rounded-lg text-[#9999aa] hover:text-white hover:bg-[#202034] transition-colors cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              title="Reset Zoom & Drag to Live"
              className="p-1.5 rounded-lg text-[#9999aa] hover:text-white hover:bg-[#202034] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Edit Markers Toolbar Trigger */}
          <button
            onClick={() => {
              setEditingMarkerId(null);
              setIsMarkerDrawerOpen(!isMarkerDrawerOpen);
            }}
            title="Edit / Add Custom Price Markers, Support/Resistance & Target Annotations"
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
              isMarkerDrawerOpen || markers.length > 0
                ? "bg-blue-950/60 text-blue-300 border-blue-500/40 shadow-sm shadow-blue-500/10"
                : "bg-[#141420] text-[#aaaaaa] border-[#242436] hover:text-white hover:bg-[#1a1a2c]"
            }`}
          >
            <Edit3 className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Markers</span>
            {markers.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-blue-500 text-black">
                {markers.length}
              </span>
            )}
          </button>

          {/* Price Alert Button */}
          {onOpenAlertModal && (
            <button
              onClick={onOpenAlertModal}
              title="Set Live Price Alerts with Audio & Notifications"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                activeAlertsCount > 0
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/10"
                  : "bg-amber-950/30 text-amber-400 border-amber-500/30 hover:bg-amber-900/50"
              }`}
            >
              <Bell className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
              <span>Alert</span>
              {activeAlertsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-400 text-black">
                  {activeAlertsCount}
                </span>
              )}
            </button>
          )}

          {/* Volume Toggle */}
          <button
            onClick={() => setShowVolume(!showVolume)}
            title="Toggle Volume Bar Sub-Chart"
            className={`p-1.5 rounded-xl border text-xs transition-colors cursor-pointer ${
              showVolume
                ? "bg-[#181828] text-purple-300 border-purple-500/30"
                : "bg-[#12121c] text-[#666677] border-[#222230]"
            }`}
          >
            <BarChart2 className="w-4 h-4" />
          </button>

          {/* Live Sync Refresh */}
          <button
            onClick={loadKlines}
            disabled={isLoading}
            title="Refresh Real-time Spot Klines"
            className="p-1.5 rounded-xl bg-[#141420] hover:bg-[#1e1e30] text-[#888899] hover:text-white border border-[#242436] transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-emerald-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Live OHLCV Bar Display & Interactive Tracking Notice */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-3 text-[11px]">
          {activeCandle ? (
            <>
              <span className="text-[#888899]">
                {timeframe === "15m" || timeframe === "1h" || timeframe === "4h"
                  ? new Date(activeCandle.time).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : timeframe === "1d" || timeframe === "1w"
                  ? new Date(activeCandle.time).toLocaleDateString([], {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : new Date(activeCandle.time).toLocaleDateString([], {
                      year: "numeric",
                      month: "short",
                    })}
              </span>
              <span>
                <strong className="text-[#777788]">O:</strong>{" "}
                <span className={activeIsBullish ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                  {formatPriceVal(activeCandle.open)}
                </span>
              </span>
              <span>
                <strong className="text-[#777788]">H:</strong>{" "}
                <span className="text-[#cccccc]">{formatPriceVal(activeCandle.high)}</span>
              </span>
              <span>
                <strong className="text-[#777788]">L:</strong>{" "}
                <span className="text-[#cccccc]">{formatPriceVal(activeCandle.low)}</span>
              </span>
              <span>
                <strong className="text-[#777788]">C:</strong>{" "}
                <span className={activeIsBullish ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                  {formatPriceVal(activeCandle.close)}
                </span>
              </span>
              <span className={activeIsBullish ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                {activeChangePct >= 0 ? "+" : ""}
                {activeChangePct.toFixed(2)}%
              </span>
              <span>
                <strong className="text-[#777788]">Vol:</strong>{" "}
                <span className="text-[#9999aa]">{activeCandle.volume.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
              </span>
            </>
          ) : (
            <span className="text-[#888899]">Connecting to Live Kline Stream...</span>
          )}
        </div>

        <div className="flex items-center gap-3 text-[10px] text-[#777788]">
          <span className="hidden sm:inline-flex items-center gap-1 text-[#666677]">
            <Move className="w-3 h-3 text-cyan-400" /> Touch / Drag to Pan &bull; Scroll / Pinch to Zoom
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block"></span> Bullish
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-red-500 inline-block"></span> Bearish
          </span>
        </div>
      </div>

      {/* Markers Quick Bar if active */}
      {markers.length > 0 && showMarkers && (
        <div className="flex flex-wrap items-center gap-2 px-1 text-xs">
          <span className="text-[10px] uppercase font-bold text-[#888899]">Active Markers:</span>
          {markers.map((m) => (
            <div
              key={m.id}
              onClick={() => handleEditMarkerClick(m)}
              className="group flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#161624] hover:bg-[#202034] text-xs border border-[#252538] cursor-pointer transition-colors"
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
              <span className="font-medium text-white text-[11px]">{m.label}:</span>
              <span className="font-mono font-bold text-[#cccccc] text-[11px]">${formatPriceVal(m.price)}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteMarker(m.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-[#777788] hover:text-red-400 ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <button
            onClick={() => setShowMarkers(!showMarkers)}
            className="text-[10px] text-[#888899] hover:text-white underline ml-1 cursor-pointer"
          >
            {showMarkers ? "Hide on chart" : "Show on chart"}
          </button>
        </div>
      )}

      {/* Interactive Marker Edit / Add Drawer */}
      {isMarkerDrawerOpen && (
        <div className="p-4 bg-[#12121e] border border-[#28283e] rounded-2xl space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-blue-400" />
              <h4 className="text-sm font-bold text-white">
                {editingMarkerId ? "Edit Chart Marker" : "Add New Chart Marker / Annotation"}
              </h4>
            </div>
            <button
              onClick={() => setIsMarkerDrawerOpen(false)}
              className="text-[#888899] hover:text-white p-1 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            {/* Marker Type */}
            <div>
              <label className="text-[11px] text-[#888899] block mb-1">Marker Type</label>
              <select
                value={newMarkerType}
                onChange={(e) => setNewMarkerType(e.target.value as any)}
                className="w-full bg-[#181826] border border-[#2c2c40] rounded-xl px-3 py-1.5 text-white font-medium focus:outline-none focus:border-blue-500"
              >
                <option value="horizontal_line">Horizontal Price Line</option>
                <option value="target_tpsl">Take-Profit &amp; Stop-Loss Band</option>
                <option value="note">Price Note / Callout</option>
              </select>
            </div>

            {/* Price Level */}
            <div>
              <label className="text-[11px] text-[#888899] block mb-1">Price Level (USD)</label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  value={newMarkerPrice}
                  onChange={(e) => setNewMarkerPrice(e.target.value)}
                  placeholder="Price"
                  className="w-full bg-[#181826] border border-[#2c2c40] rounded-xl px-3 py-1.5 font-mono text-white font-bold focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setNewMarkerPrice(currentPrice.toString())}
                  className="absolute right-2 top-1.5 text-[9px] bg-[#222234] hover:bg-[#2c2c44] text-[#888899] hover:text-white px-1.5 py-0.5 rounded cursor-pointer"
                >
                  Last
                </button>
              </div>
            </div>

            {/* Label / Description */}
            <div>
              <label className="text-[11px] text-[#888899] block mb-1">Label Text</label>
              <input
                type="text"
                value={newMarkerLabel}
                onChange={(e) => setNewMarkerLabel(e.target.value)}
                placeholder="e.g. Major Resistance, Support, Entry"
                className="w-full bg-[#181826] border border-[#2c2c40] rounded-xl px-3 py-1.5 text-white font-medium focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Color Selector */}
            <div>
              <label className="text-[11px] text-[#888899] block mb-1">Line Color</label>
              <div className="flex items-center gap-1.5">
                {[
                  { name: "Blue", hex: "#3b82f6" },
                  { name: "Green", hex: "#10b981" },
                  { name: "Red", hex: "#ef4444" },
                  { name: "Amber", hex: "#f59e0b" },
                  { name: "Purple", hex: "#a855f7" },
                  { name: "Cyan", hex: "#06b6d4" },
                ].map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setNewMarkerColor(c.hex)}
                    style={{ backgroundColor: c.hex }}
                    className={`w-7 h-7 rounded-lg border-2 transition-transform cursor-pointer ${
                      newMarkerColor === c.hex ? "border-white scale-110" : "border-transparent opacity-70"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* TP / SL extra inputs if Target TP-SL selected */}
          {newMarkerType === "target_tpsl" && (
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#1e1e2d] text-xs">
              <div>
                <label className="text-[11px] text-emerald-400 block mb-1 font-semibold">Take-Profit Target (TP)</label>
                <input
                  type="number"
                  step="any"
                  value={newTpPrice}
                  onChange={(e) => setNewTpPrice(e.target.value)}
                  placeholder="TP Price"
                  className="w-full bg-[#181826] border border-emerald-500/40 rounded-xl px-3 py-1.5 font-mono text-emerald-300 font-bold focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] text-red-400 block mb-1 font-semibold">Stop-Loss Target (SL)</label>
                <input
                  type="number"
                  step="any"
                  value={newSlPrice}
                  onChange={(e) => setNewSlPrice(e.target.value)}
                  placeholder="SL Price"
                  className="w-full bg-[#181826] border border-red-500/40 rounded-xl px-3 py-1.5 font-mono text-red-300 font-bold focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1e1e2d]">
            {editingMarkerId && (
              <button
                type="button"
                onClick={() => {
                  handleDeleteMarker(editingMarkerId);
                  setEditingMarkerId(null);
                  setIsMarkerDrawerOpen(false);
                }}
                className="px-3 py-1.5 rounded-xl bg-red-950/40 text-red-300 text-xs font-semibold hover:bg-red-900/60 border border-red-500/30 cursor-pointer"
              >
                Delete Marker
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsMarkerDrawerOpen(false)}
              className="px-3 py-1.5 rounded-xl bg-[#1a1a28] text-[#888899] text-xs hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveMarker}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{editingMarkerId ? "Update Marker" : "Place Marker on Chart"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Interactive SVG Candlestick & Volume Canvas with Drag, Pan, Touch Tracking & Pinch */}
      <div
        ref={chartWrapperRef}
        className={`relative bg-[#07070c] rounded-2xl border border-[#181826] overflow-hidden select-none touch-none transition-colors ${
          isDragging ? "cursor-grabbing" : "cursor-crosshair"
        }`}
        style={{ height }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseLeave={() => {
          if (!isDragging) {
            setHoveredCandle(null);
            setHoveredIndex(null);
            setHoveredPriceY(null);
          }
        }}
      >
        {isLoading && allCandles.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-xs text-[#888899]">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
            <span>Streaming Live Market Candlestick Klines...</span>
          </div>
        ) : error && allCandles.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-xs text-amber-400 p-4 text-center">
            <AlertTriangle className="w-6 h-6" />
            <span>{error}</span>
            <button
              onClick={loadKlines}
              className="mt-2 px-3 py-1 rounded-lg bg-[#1a1a2a] text-white hover:bg-[#252538] text-xs font-semibold cursor-pointer"
            >
              Retry Live Stream
            </button>
          </div>
        ) : (
          <svg className="w-full h-full pointer-events-none">
            {/* Horizontal Grid lines & Price Labels */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const p = minPrice + (1 - ratio) * priceRange;
              const y = paddingTop + ratio * (priceChartHeight - paddingTop);
              return (
                <g key={ratio}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={chartWidth - paddingRight}
                    y2={y}
                    stroke="#161624"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={chartWidth - paddingRight + 8}
                    y={y + 3.5}
                    fill="#666677"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    ${formatPriceVal(p)}
                  </text>
                </g>
              );
            })}

            {/* Volume Divider & Volume Grid */}
            {showVolume && (
              <g>
                <line
                  x1={paddingLeft}
                  y1={volumeChartTop - 8}
                  x2={chartWidth - paddingRight}
                  y2={volumeChartTop - 8}
                  stroke="#1c1c2e"
                />
                <text
                  x={paddingLeft + 4}
                  y={volumeChartTop + 10}
                  fill="#555566"
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  VOLUME SUB-CHART
                </text>
                <text
                  x={chartWidth - paddingRight + 8}
                  y={volumeChartTop + 10}
                  fill="#555566"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {maxVol > 1e6 ? `${(maxVol / 1e6).toFixed(1)}M` : maxVol.toFixed(0)}
                </text>
              </g>
            )}

            {/* Candlesticks (Wicks & Bodies) */}
            {visibleCandles.map((c, i) => {
              const isBull = c.close >= c.open;
              const candleColor = isBull ? "#10b981" : "#ef4444";
              const x = paddingLeft + i * candleSpacing + candleSpacing / 2;
              const yOpen = getY(c.open);
              const yClose = getY(c.close);
              const yHigh = getY(c.high);
              const yLow = getY(c.low);

              const bodyTop = Math.min(yOpen, yClose);
              const bodyHeight = Math.max(1.5, Math.abs(yClose - yOpen));

              // Volume bar parameters
              const volY = getVolY(c.volume);
              const volHeight = Math.max(1, volumeChartTop + volumeChartHeight - volY);

              return (
                <g key={c.time} className="transition-opacity">
                  {/* Candlestick Wick (High to Low) */}
                  <line
                    x1={x}
                    y1={yHigh}
                    x2={x}
                    y2={yLow}
                    stroke={candleColor}
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />

                  {/* Candlestick Real Body */}
                  <rect
                    x={x - candleBodyWidth / 2}
                    y={bodyTop}
                    width={candleBodyWidth}
                    height={bodyHeight}
                    fill={candleColor}
                    rx="1"
                  />

                  {/* Volume Bar below Price Chart */}
                  {showVolume && (
                    <rect
                      x={x - candleBodyWidth / 2}
                      y={volY}
                      width={candleBodyWidth}
                      height={volHeight}
                      fill={candleColor}
                      fillOpacity={hoveredIndex === i ? "0.9" : "0.45"}
                      rx="1"
                    />
                  )}
                </g>
              );
            })}

            {/* Custom User Price Markers & Lines */}
            {showMarkers &&
              markers.map((marker) => {
                const markerY = getY(marker.price);
                const isOffChart = markerY < paddingTop || markerY > priceChartHeight;
                if (isOffChart) return null;

                const tpY = marker.targetTp ? getY(marker.targetTp) : null;
                const slY = marker.targetSl ? getY(marker.targetSl) : null;

                return (
                  <g key={marker.id}>
                    {/* Main Marker Line */}
                    <line
                      x1={paddingLeft}
                      y1={markerY}
                      x2={chartWidth - paddingRight}
                      y2={markerY}
                      stroke={marker.color}
                      strokeWidth="1.8"
                      strokeDasharray="4 3"
                    />

                    {/* Marker Badge on Price Axis */}
                    <rect
                      x={chartWidth - paddingRight}
                      y={markerY - 9}
                      width={paddingRight - 4}
                      height={18}
                      fill={marker.color}
                      rx="4"
                    />
                    <text
                      x={chartWidth - paddingRight + 4}
                      y={markerY + 3.5}
                      fill="#ffffff"
                      fontSize="9.5"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      ${formatPriceVal(marker.price)}
                    </text>

                    {/* Marker Label Pin on Left */}
                    <rect
                      x={paddingLeft + 6}
                      y={markerY - 14}
                      width={Math.min(140, marker.label.length * 7 + 16)}
                      height={15}
                      fill="#0c0c16"
                      stroke={marker.color}
                      strokeWidth="1"
                      rx="3"
                    />
                    <text
                      x={paddingLeft + 12}
                      y={markerY - 3}
                      fill={marker.color}
                      fontSize="9"
                      fontWeight="bold"
                    >
                      {marker.label}
                    </text>

                    {/* TP & SL auxiliary target lines if Target TP-SL */}
                    {tpY !== null && (
                      <g>
                        <line
                          x1={paddingLeft}
                          y1={tpY}
                          x2={chartWidth - paddingRight}
                          y2={tpY}
                          stroke="#10b981"
                          strokeWidth="1.2"
                          strokeDasharray="2 2"
                        />
                        <text
                          x={paddingLeft + 8}
                          y={tpY - 3}
                          fill="#10b981"
                          fontSize="8.5"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          TP: ${formatPriceVal(marker.targetTp!)}
                        </text>
                      </g>
                    )}

                    {slY !== null && (
                      <g>
                        <line
                          x1={paddingLeft}
                          y1={slY}
                          x2={chartWidth - paddingRight}
                          y2={slY}
                          stroke="#ef4444"
                          strokeWidth="1.2"
                          strokeDasharray="2 2"
                        />
                        <text
                          x={paddingLeft + 8}
                          y={slY - 3}
                          fill="#ef4444"
                          fontSize="8.5"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          SL: ${formatPriceVal(marker.targetSl!)}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

            {/* Crosshair Cursor & Price Tracking (Touch & Mouse) */}
            {hoveredIndex !== null && hoveredCandle && (
              <g>
                {/* Vertical Crosshair Line */}
                <line
                  x1={paddingLeft + hoveredIndex * candleSpacing + candleSpacing / 2}
                  y1={paddingTop}
                  x2={paddingLeft + hoveredIndex * candleSpacing + candleSpacing / 2}
                  y2={height - 20}
                  stroke="#ffffff"
                  strokeOpacity="0.35"
                  strokeDasharray="2 2"
                />

                {/* Horizontal Crosshair on Cursor/Touch Price Y */}
                {hoveredPriceY !== null && hoveredPriceY >= paddingTop && hoveredPriceY <= priceChartHeight ? (
                  <>
                    <line
                      x1={paddingLeft}
                      y1={hoveredPriceY}
                      x2={chartWidth - paddingRight}
                      y2={hoveredPriceY}
                      stroke="#38bdf8"
                      strokeOpacity="0.4"
                      strokeDasharray="2 2"
                    />
                    <rect
                      x={chartWidth - paddingRight}
                      y={hoveredPriceY - 8}
                      width={paddingRight - 4}
                      height={16}
                      fill="#0284c7"
                      rx="3"
                    />
                    <text
                      x={chartWidth - paddingRight + 4}
                      y={hoveredPriceY + 3.5}
                      fill="#ffffff"
                      fontSize="9.5"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      ${formatPriceVal(getPriceFromY(hoveredPriceY))}
                    </text>
                  </>
                ) : (
                  <>
                    <line
                      x1={paddingLeft}
                      y1={getY(hoveredCandle.close)}
                      x2={chartWidth - paddingRight}
                      y2={getY(hoveredCandle.close)}
                      stroke="#ffffff"
                      strokeOpacity="0.35"
                      strokeDasharray="2 2"
                    />
                    <rect
                      x={chartWidth - paddingRight}
                      y={getY(hoveredCandle.close) - 8}
                      width={paddingRight - 4}
                      height={16}
                      fill={hoveredCandle.close >= hoveredCandle.open ? "#10b981" : "#ef4444"}
                      rx="3"
                    />
                    <text
                      x={chartWidth - paddingRight + 4}
                      y={getY(hoveredCandle.close) + 3.5}
                      fill="#ffffff"
                      fontSize="9.5"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      ${formatPriceVal(hoveredCandle.close)}
                    </text>
                  </>
                )}

                {/* Timestamp Pin at Bottom X Axis */}
                <rect
                  x={paddingLeft + hoveredIndex * candleSpacing + candleSpacing / 2 - 50}
                  y={height - 18}
                  width={100}
                  height={16}
                  fill="#181828"
                  stroke="#333348"
                  strokeWidth="1"
                  rx="3"
                />
                <text
                  x={paddingLeft + hoveredIndex * candleSpacing + candleSpacing / 2}
                  y={height - 6}
                  fill="#ffffff"
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {timeframe === "15m" || timeframe === "1h" || timeframe === "4h"
                    ? `${new Date(hoveredCandle.time).toLocaleDateString([], { month: "short", day: "numeric" })} ${new Date(hoveredCandle.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                    : timeframe === "1d" || timeframe === "1w"
                    ? new Date(hoveredCandle.time).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" })
                    : new Date(hoveredCandle.time).toLocaleDateString([], { year: "numeric", month: "short" })}
                </text>
              </g>
            )}

            {/* Current Price Running Horizontal Line */}
            {currentPrice > 0 && (
              <g>
                <line
                  x1={paddingLeft}
                  y1={getY(currentPrice)}
                  x2={chartWidth - paddingRight}
                  y2={getY(currentPrice)}
                  stroke={change24h >= 0 ? "#10b981" : "#ef4444"}
                  strokeWidth="1"
                  strokeDasharray="2 2"
                  strokeOpacity="0.6"
                />
              </g>
            )}
          </svg>
        )}

        {/* Floating Zoom / Pan Status Controls on Bottom Left */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-[#0e0e18]/85 backdrop-blur-md px-2.5 py-1 rounded-xl border border-[#222238] text-[10px] text-[#9999aa] shadow-lg pointer-events-auto">
          <span>{visibleCandles.length} candles</span>
          <span className="text-[#444455]">&bull;</span>
          <span>{timeframe.toUpperCase()}</span>
          {panOffset > 0 && (
            <>
              <span className="text-[#444455]">&bull;</span>
              <span className="text-amber-400 font-bold">History</span>
            </>
          )}
        </div>
      </div>

      {/* Footer Info: Live Feed Source Tag */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#171724] text-[11px] text-[#777788]">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-emerald-400 font-medium font-mono">
            Live Public Spot Klines ({timeframe} Timeframe)
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono">
          <span>24h High: <strong className="text-white">${formatPriceVal(calculatedHigh)}</strong></span>
          <span>24h Low: <strong className="text-white">${formatPriceVal(calculatedLow)}</strong></span>
          <span className="hidden sm:inline">24h Vol: <strong className="text-white">${(calculatedVol / 1e6).toFixed(1)}M</strong></span>
        </div>
      </div>
    </div>
  );
};
