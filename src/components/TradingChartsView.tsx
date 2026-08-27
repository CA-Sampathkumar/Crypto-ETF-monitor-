import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
  Cell,
  ComposedChart,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  Layers,
  Calendar,
  DollarSign,
  ShieldCheck,
  Award,
  Sparkles,
  Info,
  Maximize2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Flame,
} from "lucide-react";
import { CHART_PRODUCTS, generateTradingChartData, ChartDataPoint } from "../data/chartData";
import { ETFApplication } from "../types";

interface TradingChartsViewProps {
  applications: ETFApplication[];
  onSelectEtfBySymbol?: (symbol: string) => void;
}

export const TradingChartsView: React.FC<TradingChartsViewProps> = ({
  applications,
  onSelectEtfBySymbol,
}) => {
  const [selectedSymbol, setSelectedSymbol] = useState<string>("BTC");
  const [timeframe, setTimeframe] = useState<"24H" | "7D" | "30D" | "90D" | "1Y" | "ALL">("30D");
  const [chartMode, setChartMode] = useState<"price" | "flows" | "breakdown" | "nav">("flows");
  const [showSma20, setShowSma20] = useState(true);
  const [showSma50, setShowSma50] = useState(true);
  const [showGrossInflow, setShowGrossInflow] = useState(true);
  const [showGrossOutflow, setShowGrossOutflow] = useState(true);
  const [showNetFlowLine, setShowNetFlowLine] = useState(true);
  const [selectedMilestone, setSelectedMilestone] = useState<{ date: string; title: string } | null>(null);

  // Active product details
  const activeProduct = useMemo(() => {
    return CHART_PRODUCTS.find((p) => p.symbol === selectedSymbol) || CHART_PRODUCTS[0];
  }, [selectedSymbol]);

  // Matching ETF application from dashboard for real-time live price anchoring
  const matchingEtfs = useMemo(() => {
    return applications.filter((a) => a.tokenSymbol === selectedSymbol);
  }, [applications, selectedSymbol]);

  const liveEtf = matchingEtfs[0] || applications.find((a) => a.tokenSymbol === selectedSymbol || a.ticker.includes(selectedSymbol));
  const livePrice = liveEtf?.currentPriceUsd;
  const live24hChange = liveEtf?.price24hChange;

  // Generate chart data based on selected product, timeframe, and live price
  const { points: rawChartData, high, low, totalInflow, totalOutflow, netFlow, volumeTotal } = useMemo(() => {
    return generateTradingChartData(selectedSymbol, timeframe, livePrice, live24hChange);
  }, [selectedSymbol, timeframe, livePrice, live24hChange]);

  // Transform data for bidirectional outflows (negative representation for bar plotting)
  const chartData = useMemo(() => {
    return rawChartData.map((pt) => ({
      ...pt,
      etfNegativeOutflowMillionUsd: -pt.etfOutflowMillionUsd,
    }));
  }, [rawChartData]);

  // Current price and stats from latest point
  const latestPoint = chartData[chartData.length - 1] || {
    price: livePrice || activeProduct.basePrice,
    etfInflowMillionUsd: 0,
    etfOutflowMillionUsd: 0,
    etfNetInflowMillionUsd: 0,
  };
  const firstPoint = chartData[0] || { price: activeProduct.basePrice };
  const periodReturnPct = Number((((latestPoint.price - firstPoint.price) / (firstPoint.price || 1)) * 100).toFixed(2));
  const isPositive = periodReturnPct >= 0;

  const totalHeldTokens = matchingEtfs.reduce((acc, a) => acc + a.tokensHeld, 0);
  const totalHeldUsd = matchingEtfs.reduce((acc, a) => acc + a.portfolioValueUsd, 0);

  // Flow buy/sell ratio
  const flowBuyRatio = totalOutflow > 0 ? (totalInflow / totalOutflow).toFixed(2) : "N/A";

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as ChartDataPoint & { etfNegativeOutflowMillionUsd?: number };
      const isNetPositive = data.etfNetInflowMillionUsd >= 0;

      return (
        <div className="p-3.5 bg-[#0e0e0e]/95 border border-[#2a2a2a] rounded-xl shadow-2xl backdrop-blur-md text-xs space-y-2 min-w-[230px]">
          <div className="flex items-center justify-between border-b border-[#222222] pb-1.5 text-[#888888]">
            <span className="font-mono text-[11px] text-white flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#777777]" /> {data.date}
            </span>
            <span className="text-[10px] font-bold uppercase text-purple-400">
              {selectedSymbol}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#888888]">Spot Price:</span>
            <span className="font-mono font-bold text-white text-sm">
              ${data.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </span>
          </div>

          {/* Institutional Gross Inflows */}
          {data.etfInflowMillionUsd !== undefined && (
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#888888] flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Gross Inflow:
              </span>
              <span className="font-mono font-bold text-emerald-400">
                +${data.etfInflowMillionUsd}M
              </span>
            </div>
          )}

          {/* Institutional Gross Outflows */}
          {data.etfOutflowMillionUsd !== undefined && (
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#888888] flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Gross Outflow (Redemptions):
              </span>
              <span className="font-mono font-bold text-rose-400">
                -${data.etfOutflowMillionUsd}M
              </span>
            </div>
          )}

          {/* Net Institutional Inflow / Outflow */}
          {data.etfNetInflowMillionUsd !== undefined && (
            <div className="flex items-center justify-between pt-1 border-t border-[#1e1e1e]">
              <span className="text-[#aaaaaa] font-semibold">Net Institutional Flow:</span>
              <span className={`font-mono font-bold ${isNetPositive ? "text-emerald-400" : "text-rose-400"}`}>
                {isNetPositive ? "+" : ""}${data.etfNetInflowMillionUsd}M
              </span>
            </div>
          )}

          {/* Cumulative Reserves */}
          {data.cumulativeNetInflowMillionUsd !== undefined && (
            <div className="flex items-center justify-between text-[10px] text-[#777777]">
              <span>Cumulative Net AUM:</span>
              <span className="font-mono text-[#cccccc]">
                ${data.cumulativeNetInflowMillionUsd}M
              </span>
            </div>
          )}

          {data.sma20 && showSma20 && chartMode === "price" && (
            <div className="flex items-center justify-between text-[10px] text-amber-400">
              <span>SMA (20):</span>
              <span className="font-mono">${data.sma20.toLocaleString()}</span>
            </div>
          )}

          {data.sma50 && showSma50 && chartMode === "price" && (
            <div className="flex items-center justify-between text-[10px] text-blue-400">
              <span>SMA (50):</span>
              <span className="font-mono">${data.sma50.toLocaleString()}</span>
            </div>
          )}

          {data.milestoneEvent && (
            <div className="mt-2 pt-2 border-t border-[#222222] p-1.5 bg-purple-950/30 rounded border border-purple-500/20 text-purple-300">
              <div className="text-[10px] font-bold uppercase text-purple-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> SEC Filing Milestone
              </div>
              <div className="text-[11px] font-medium mt-0.5 leading-tight text-white">
                {data.milestoneEvent}
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & Product Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-br from-[#121212] via-[#0d0d0d] to-[#080808] border border-[#1f1f1f]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1">
              <Activity className="w-3 h-3" /> Trading, Inflows &amp; Outflows Engine
            </span>
            <span className="text-xs text-[#888888]">Institutional Inflow/Outflow Discovery Correlation</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>{activeProduct.name}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-[#1c1c1c] text-[#cccccc] font-mono font-normal">
              {activeProduct.ticker}
            </span>
          </h2>
        </div>

        {/* Product Chips Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {CHART_PRODUCTS.map((prod) => (
            <button
              key={prod.symbol}
              onClick={() => setSelectedSymbol(prod.symbol)}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedSymbol === prod.symbol
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-900/30 scale-105"
                  : "bg-[#141414] text-[#888888] hover:text-white hover:bg-[#1a1a1a] border border-[#222222]"
              }`}
            >
              {prod.symbol}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Bar with Inflows, Outflows, and Net Balance */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-[#0e0e0e] border border-[#1e1e1e]">
          <div className="text-[11px] text-[#777777] font-medium">Spot Price</div>
          <div className="text-lg font-bold font-mono text-white mt-0.5">
            ${latestPoint.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
          </div>
          <div className={`text-[11px] font-semibold flex items-center gap-0.5 mt-0.5 ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
            {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            <span>{periodReturnPct >= 0 ? "+" : ""}{periodReturnPct}% ({timeframe})</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0e0e0e] border border-[#1e1e1e]">
          <div className="text-[11px] text-[#777777] font-medium flex items-center gap-1">
            <ArrowUp className="w-3 h-3 text-emerald-400" />
            <span>Gross Inflows</span>
          </div>
          <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
            +${totalInflow.toLocaleString()}M
          </div>
          <div className="text-[11px] text-[#666666] mt-0.5">Institutional Subscriptions</div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0e0e0e] border border-[#1e1e1e]">
          <div className="text-[11px] text-[#777777] font-medium flex items-center gap-1">
            <ArrowDown className="w-3 h-3 text-rose-400" />
            <span>Gross Outflows</span>
          </div>
          <div className="text-lg font-bold font-mono text-rose-400 mt-0.5">
            -${totalOutflow.toLocaleString()}M
          </div>
          <div className="text-[11px] text-[#666666] mt-0.5">Fund Redemptions</div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0e0e0e] border border-[#1e1e1e]">
          <div className="text-[11px] text-[#777777] font-medium flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3 text-purple-400" />
            <span>Net Flow Balance</span>
          </div>
          <div className={`text-lg font-bold font-mono mt-0.5 ${netFlow >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {netFlow >= 0 ? "+" : ""}${netFlow.toLocaleString()}M
          </div>
          <div className="text-[11px] text-purple-400 mt-0.5">
            {flowBuyRatio}x Buy/Sell Pressure
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0e0e0e] border border-[#1e1e1e]">
          <div className="text-[11px] text-[#777777] font-medium">Portfolio Reserves Tracked</div>
          <div className="text-lg font-bold font-mono text-white mt-0.5">
            ${(totalHeldUsd / 1_000_000).toFixed(1)}M
          </div>
          <div className="text-[11px] text-emerald-400 mt-0.5">
            {totalHeldTokens.toLocaleString()} {selectedSymbol} in Custody
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0e0e0e] border border-[#1e1e1e]">
          <div className="text-[11px] text-[#777777] font-medium">SEC Filings Registered</div>
          <div className="text-lg font-bold font-mono text-white mt-0.5">
            {matchingEtfs.length} Funds
          </div>
          <div className="text-[11px] text-purple-400 mt-0.5">
            {matchingEtfs.filter((a) => a.status === "Approved & Trading").length} Approved &bull; {matchingEtfs.filter((a) => a.status !== "Approved & Trading").length} Pending
          </div>
        </div>
      </div>

      {/* Main Chart Container Card */}
      <div className="p-5 rounded-2xl bg-[#0d0d0d] border border-[#1f1f1f] space-y-4">
        {/* Chart Sub-Header & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#181818] pb-3">
          {/* Chart View Modes */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#060606] p-1 rounded-xl border border-[#1c1c1c]">
            <button
              onClick={() => setChartMode("flows")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                chartMode === "flows"
                  ? "bg-[#1c1c1c] text-white shadow-sm border border-[#333333]"
                  : "text-[#777777] hover:text-[#cccccc]"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Inflows &amp; Outflows (Net &amp; Gross)</span>
            </button>

            <button
              onClick={() => setChartMode("breakdown")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                chartMode === "breakdown"
                  ? "bg-[#1c1c1c] text-white shadow-sm border border-[#333333]"
                  : "text-[#777777] hover:text-[#cccccc]"
              }`}
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-purple-400" />
              <span>Inflow vs Outflow Split</span>
            </button>

            <button
              onClick={() => setChartMode("price")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                chartMode === "price"
                  ? "bg-[#1c1c1c] text-white shadow-sm border border-[#333333]"
                  : "text-[#777777] hover:text-[#cccccc]"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
              <span>Spot Price &amp; SMAs</span>
            </button>

            <button
              onClick={() => setChartMode("nav")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                chartMode === "nav"
                  ? "bg-[#1c1c1c] text-white shadow-sm border border-[#333333]"
                  : "text-[#777777] hover:text-[#cccccc]"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Cumulative Flow &amp; AUM</span>
            </button>
          </div>

          {/* Timeframe & Specific Mode Toggles */}
          <div className="flex flex-wrap items-center gap-3">
            {chartMode === "flows" && (
              <div className="flex items-center gap-2 text-[11px]">
                <label className="flex items-center gap-1 text-emerald-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showGrossInflow}
                    onChange={(e) => setShowGrossInflow(e.target.checked)}
                    className="rounded bg-[#1a1a1a] border-[#333333] text-emerald-500"
                  />
                  <span>Inflows (+)</span>
                </label>
                <label className="flex items-center gap-1 text-rose-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showGrossOutflow}
                    onChange={(e) => setShowGrossOutflow(e.target.checked)}
                    className="rounded bg-[#1a1a1a] border-[#333333] text-rose-500"
                  />
                  <span>Outflows (-)</span>
                </label>
                <label className="flex items-center gap-1 text-purple-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showNetFlowLine}
                    onChange={(e) => setShowNetFlowLine(e.target.checked)}
                    className="rounded bg-[#1a1a1a] border-[#333333] text-purple-500"
                  />
                  <span>Net Flow Line</span>
                </label>
              </div>
            )}

            {chartMode === "price" && (
              <div className="flex items-center gap-2 text-[11px]">
                <label className="flex items-center gap-1 text-amber-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showSma20}
                    onChange={(e) => setShowSma20(e.target.checked)}
                    className="rounded bg-[#1a1a1a] border-[#333333] text-amber-500"
                  />
                  <span>SMA 20</span>
                </label>
                <label className="flex items-center gap-1 text-blue-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showSma50}
                    onChange={(e) => setShowSma50(e.target.checked)}
                    className="rounded bg-[#1a1a1a] border-[#333333] text-blue-500"
                  />
                  <span>SMA 50</span>
                </label>
              </div>
            )}

            {/* Timeframe Selector */}
            <div className="flex items-center gap-1 bg-[#060606] p-1 rounded-xl border border-[#1c1c1c]">
              {(["24H", "7D", "30D", "90D", "1Y", "ALL"] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    timeframe === tf
                      ? "bg-purple-950 text-purple-200 border border-purple-500/40 font-bold"
                      : "text-[#777777] hover:text-white"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Flow Legend & Status Indicator */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#888888] px-1">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
              <span>Gross Inflow (Subscriptions)</span>
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />
              <span>Gross Outflow (Redemptions)</span>
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-1 rounded-sm bg-purple-400 inline-block" />
              <span>Net Inflow Trend</span>
            </span>
          </div>

          <div className="text-[11px] text-[#666666] font-mono">
            {timeframe} Period: <strong className="text-emerald-400">+${totalInflow}M</strong> Inflows &bull; <strong className="text-rose-400">-${totalOutflow}M</strong> Outflows = <strong className={netFlow >= 0 ? "text-emerald-400" : "text-rose-400"}>{netFlow >= 0 ? "+" : ""}${netFlow}M Net</strong>
          </div>
        </div>

        {/* Primary Interactive Chart Visualizer */}
        <div className="h-[380px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {chartMode === "price" ? (
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="sma20Grad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#d97706" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c1c1c" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#555555"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: "#222222" }}
                />
                <YAxis
                  stroke="#555555"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: "#222222" }}
                  domain={["dataMin * 0.98", "dataMax * 1.02"]}
                  tickFormatter={(val) => `$${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`}
                />
                <Tooltip content={<CustomTooltip />} />

                {/* Primary Price Area */}
                <Area
                  type="monotone"
                  dataKey="price"
                  name="Spot Price"
                  stroke={isPositive ? "#10b981" : "#ef4444"}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#priceGradient)"
                />

                {/* Moving Averages */}
                {showSma20 && (
                  <Line
                    type="monotone"
                    dataKey="sma20"
                    name="SMA 20"
                    stroke="#f59e0b"
                    strokeWidth={1.5}
                    dot={false}
                  />
                )}
                {showSma50 && (
                  <Line
                    type="monotone"
                    dataKey="sma50"
                    name="SMA 50"
                    stroke="#3b82f6"
                    strokeWidth={1.5}
                    dot={false}
                  />
                )}
              </AreaChart>
            ) : chartMode === "flows" ? (
              /* Bi-Directional Inflow (+) & Outflow (-) Chart */
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c1c1c" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#555555"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: "#222222" }}
                />
                <YAxis
                  stroke="#555555"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: "#222222" }}
                  tickFormatter={(val) => `${val >= 0 ? "+" : ""}$${val}M`}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="#444444" strokeWidth={1.5} />

                {/* Gross Inflows Positive Bars */}
                {showGrossInflow && (
                  <Bar
                    dataKey="etfInflowMillionUsd"
                    name="Gross Inflow ($M)"
                    fill="#10b981"
                    radius={[3, 3, 0, 0]}
                  />
                )}

                {/* Gross Outflows Negative Bars (Plotted below zero) */}
                {showGrossOutflow && (
                  <Bar
                    dataKey="etfNegativeOutflowMillionUsd"
                    name="Gross Outflow ($M)"
                    fill="#f43f5e"
                    radius={[0, 0, 3, 3]}
                  />
                )}

                {/* Net Flow Trend Line */}
                {showNetFlowLine && (
                  <Line
                    type="monotone"
                    dataKey="etfNetInflowMillionUsd"
                    name="Net Flow ($M)"
                    stroke="#c084fc"
                    strokeWidth={2.5}
                    dot={{ r: 2.5, fill: "#c084fc" }}
                  />
                )}
              </ComposedChart>
            ) : chartMode === "breakdown" ? (
              /* Side-by-Side Inflow vs Outflow Comparison */
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c1c1c" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#555555"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: "#222222" }}
                />
                <YAxis
                  stroke="#555555"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: "#222222" }}
                  tickFormatter={(val) => `$${val}M`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: 10, fontSize: 11 }}
                  formatter={(value) => <span className="text-[#aaaaaa]">{value}</span>}
                />
                <Bar dataKey="etfInflowMillionUsd" name="Inflow Subscriptions ($M)" fill="#10b981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="etfOutflowMillionUsd" name="Outflow Redemptions ($M)" fill="#f43f5e" radius={[3, 3, 0, 0]} />
              </BarChart>
            ) : (
              /* Cumulative AUM Inflows & Outflows */
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="cumNetGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c1c1c" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#555555"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: "#222222" }}
                />
                <YAxis
                  stroke="#555555"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: "#222222" }}
                  tickFormatter={(val) => `$${val}M`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: 10, fontSize: 11 }}
                  formatter={(value) => <span className="text-[#aaaaaa]">{value}</span>}
                />
                <Area
                  type="monotone"
                  dataKey="cumulativeNetInflowMillionUsd"
                  name="Cumulative Net AUM ($M)"
                  stroke="#a855f7"
                  strokeWidth={2}
                  fill="url(#cumNetGrad)"
                />
                <Line
                  type="monotone"
                  dataKey="cumulativeInflowMillionUsd"
                  name="Cumulative Gross Inflows ($M)"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="cumulativeOutflowMillionUsd"
                  name="Cumulative Gross Outflows ($M)"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Milestone Timeline Callout Strip */}
        <div className="pt-2 border-t border-[#181818]">
          <div className="text-[11px] font-bold uppercase text-[#888888] mb-2 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>Key Regulatory Milestones for {activeProduct.name}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {activeProduct.milestones.map((m, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-[#080808] border border-[#1e1e1e] flex flex-col justify-between text-xs space-y-1 hover:border-purple-500/40 transition-colors"
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-mono text-purple-400 font-semibold">{m.date}</span>
                  <span className="px-1.5 py-0.5 rounded uppercase font-bold text-[9px] bg-[#1a1a1a] text-[#aaaaaa]">
                    {m.type}
                  </span>
                </div>
                <div className="text-xs text-[#dddddd] font-medium leading-snug">
                  {m.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ETF Filings Direct Link Table for this Asset */}
      <div className="p-5 rounded-2xl bg-[#0d0d0d] border border-[#1f1f1f] space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-400" />
            <span>Registered Institutional Filings for {selectedSymbol} ({matchingEtfs.length})</span>
          </h3>
          <span className="text-xs text-[#888888]">Direct SEC Accession Numbers</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#080808] text-[#777777] uppercase text-[10px] tracking-wider border-y border-[#1c1c1c]">
              <tr>
                <th className="py-2.5 px-3">Issuer / Trust</th>
                <th className="py-2.5 px-3">Ticker</th>
                <th className="py-2.5 px-3">Exchange</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Holdings Value</th>
                <th className="py-2.5 px-3">Custodian</th>
                <th className="py-2.5 px-3 text-right">SEC Filing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#181818]">
              {matchingEtfs.map((app) => (
                <tr key={app.id} className="hover:bg-[#121212] transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-semibold text-white">{app.issuer}</div>
                    <div className="text-[11px] text-[#777777]">{app.fundName}</div>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-purple-400">{app.ticker}</td>
                  <td className="py-3 px-3 text-[#aaaaaa]">{app.exchange}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        app.status === "Approved & Trading"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {app.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-white">
                    ${(app.portfolioValueUsd / 1_000_000).toFixed(2)}M
                  </td>
                  <td className="py-3 px-3 text-[#aaaaaa]">{app.custodian.name}</td>
                  <td className="py-3 px-3 text-right">
                    <a
                      href={app.secEdgar.officialUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-purple-400 hover:text-white transition-colors"
                    >
                      <span>{app.secEdgar.accessionNumber.slice(0, 15)}...</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

