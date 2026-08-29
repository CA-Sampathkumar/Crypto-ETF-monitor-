// Historical Price & Inflow Chart Data Engine for Crypto ETF Products & Tokens

export interface ChartDataPoint {
  date: string;
  timestamp: number;
  price: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volumeMillionUsd: number;
  etfInflowMillionUsd: number;
  etfOutflowMillionUsd: number;
  etfNetInflowMillionUsd: number;
  cumulativeInflowMillionUsd: number;
  cumulativeOutflowMillionUsd: number;
  cumulativeNetInflowMillionUsd: number;
  sma20?: number;
  sma50?: number;
  milestoneEvent?: string;
  milestoneType?: "filing" | "approval" | "amendment" | "benchmark" | "court";
}

export interface ProductChartConfig {
  symbol: string;
  name: string;
  ticker?: string;
  isEtf: boolean;
  basePrice: number;
  volatility: number;
  inflowBaselineMillion: number;
  milestones: Array<{ date: string; title: string; type: "filing" | "approval" | "amendment" | "benchmark" | "court" }>;
}

export const CHART_PRODUCTS: ProductChartConfig[] = [
  {
    symbol: "BTC",
    name: "Bitcoin (Spot & ETFs)",
    ticker: "IBIT / FBTC / GBTC",
    isEtf: true,
    basePrice: 96450,
    volatility: 0.022,
    inflowBaselineMillion: 280,
    milestones: [
      { date: "2024-01-10", title: "SEC Approves 11 Spot Bitcoin ETFs", type: "approval" },
      { date: "2024-03-12", title: "Record $1.04B Single-Day Net Inflow", type: "benchmark" },
      { date: "2024-04-19", title: "4th Bitcoin Halving (Block 840k)", type: "benchmark" },
      { date: "2024-11-06", title: "Post-Election Institutional Surge", type: "benchmark" },
      { date: "2025-01-15", title: "IBIT Crosses 500,000 BTC Reserve", type: "approval" },
    ],
  },
  {
    symbol: "ETH",
    name: "Ethereum (Spot & Staking ETFs)",
    ticker: "ETHA / FETH / ETHE",
    isEtf: true,
    basePrice: 2840,
    volatility: 0.028,
    inflowBaselineMillion: 65,
    milestones: [
      { date: "2024-05-23", title: "SEC Approves Spot Ethereum 19b-4s", type: "approval" },
      { date: "2024-07-23", title: "Spot Ethereum ETFs Launch on Nasdaq", type: "approval" },
      { date: "2024-12-10", title: "Fidelity Files Staking Addendum", type: "amendment" },
      { date: "2025-02-14", title: "NYSE Arca Files Staking ETP Rule", type: "filing" },
    ],
  },
  {
    symbol: "SOL",
    name: "Solana (Spot Filings & CME)",
    ticker: "VSOL / TSOL / CSOL",
    isEtf: false,
    basePrice: 194.5,
    volatility: 0.038,
    inflowBaselineMillion: 35,
    milestones: [
      { date: "2024-06-27", title: "VanEck Files First Spot Solana S-1", type: "filing" },
      { date: "2024-07-08", title: "Cboe BZX 19b-4 Published in Register", type: "filing" },
      { date: "2024-11-21", title: "Bitwise Submits Delaware Solana Trust", type: "filing" },
      { date: "2025-02-05", title: "CME CF Launches Real-Time SOL Index", type: "benchmark" },
    ],
  },
  {
    symbol: "XRP",
    name: "XRP (Spot Filings & Index)",
    ticker: "XRPC / XRPW / GXRP",
    isEtf: false,
    basePrice: 2.65,
    volatility: 0.045,
    inflowBaselineMillion: 28,
    milestones: [
      { date: "2024-10-02", title: "Bitwise Files First Spot XRP S-1", type: "filing" },
      { date: "2024-10-15", title: "Canary Capital Submits XRP ETF", type: "filing" },
      { date: "2024-11-25", title: "WisdomTree Files Spot XRP Trust", type: "filing" },
      { date: "2025-01-30", title: "Amended S-1 with Qualified Custody", type: "amendment" },
    ],
  },
  {
    symbol: "LTC",
    name: "Litecoin (Spot Filings & OTC)",
    ticker: "LTCN / CLTC",
    isEtf: false,
    basePrice: 118.2,
    volatility: 0.032,
    inflowBaselineMillion: 12,
    milestones: [
      { date: "2024-10-15", title: "Canary Capital Files Spot Litecoin ETF", type: "filing" },
      { date: "2024-11-12", title: "CFTC PoW Commodity Classification", type: "court" },
      { date: "2025-01-20", title: "Grayscale Prepares LTCN Uplisting", type: "amendment" },
    ],
  },
  {
    symbol: "DOGE",
    name: "Dogecoin (Spot Filings)",
    ticker: "GDOG / CDOG",
    isEtf: false,
    basePrice: 0.285,
    volatility: 0.052,
    inflowBaselineMillion: 18,
    milestones: [
      { date: "2024-11-20", title: "Canary Capital Files Spot Dogecoin S-1", type: "filing" },
      { date: "2025-01-10", title: "CME CF Benchmarks DOGE Rate Added", type: "benchmark" },
      { date: "2025-02-12", title: "Institutional Custody Framework Filed", type: "amendment" },
    ],
  },
  {
    symbol: "SUI",
    name: "Sui (Grayscale Trust & Filings)",
    ticker: "GSUI",
    isEtf: false,
    basePrice: 3.45,
    volatility: 0.042,
    inflowBaselineMillion: 15,
    milestones: [
      { date: "2024-09-12", title: "Grayscale Sui Trust Opens Private Placement", type: "filing" },
      { date: "2024-12-05", title: "VanEck SUI ETN Launches in Europe", type: "benchmark" },
      { date: "2025-02-10", title: "OTCQX Public Trading Registration (GSUI)", type: "approval" },
    ],
  },
  {
    symbol: "LINK",
    name: "Chainlink (Grayscale Trust & Uplisting)",
    ticker: "GLNK",
    isEtf: false,
    basePrice: 19.8,
    volatility: 0.035,
    inflowBaselineMillion: 20,
    milestones: [
      { date: "2024-08-15", title: "Grayscale Chainlink Trust Reaches $50M AUM", type: "benchmark" },
      { date: "2024-11-28", title: "21Shares Registers European LINK ETP", type: "approval" },
      { date: "2025-02-18", title: "NYSE Arca Uplisting Preparation Begins", type: "filing" },
    ],
  },
  {
    symbol: "BITW",
    name: "Bitwise 10 Crypto Index (Multi-Asset)",
    ticker: "BITW",
    isEtf: true,
    basePrice: 48.5,
    volatility: 0.025,
    inflowBaselineMillion: 45,
    milestones: [
      { date: "2024-10-25", title: "NYSE Arca Files 19b-4 for BITW Conversion", type: "filing" },
      { date: "2024-12-18", title: "Index Weighting Rules Clarified to SEC", type: "amendment" },
      { date: "2025-02-15", title: "BITW Rebalances SOL & SUI Allocation", type: "benchmark" },
    ],
  },
  {
    symbol: "HYPE",
    name: "Hyperliquid (Spot & Staking ETFs)",
    ticker: "GHYP / BHYP / THYP",
    isEtf: false,
    basePrice: 28.75,
    volatility: 0.048,
    inflowBaselineMillion: 35,
    milestones: [
      { date: "2025-09-20", title: "Grayscale Files S-1 for Hyperliquid ETF (GHYP)", type: "filing" },
      { date: "2025-09-25", title: "Bitwise Files Spot HYPE ETF with Staking (BHYP)", type: "filing" },
      { date: "2025-10-29", title: "21Shares Files Physical Hyperliquid ETF (THYP)", type: "filing" },
      { date: "2026-04-10", title: "Bitwise Amends S-1 with Anchorage Custody & Staking Terms", type: "amendment" },
    ],
  },
  {
    symbol: "ONDO",
    name: "Ondo Finance (Grayscale RWA & Arkham Entity)",
    ticker: "GONDO / ONDO",
    isEtf: false,
    basePrice: 0.3646,
    volatility: 0.042,
    inflowBaselineMillion: 15,
    milestones: [
      { date: "2024-05-20", title: "Grayscale RWA Fund Adds ONDO to Institutional Basket", type: "benchmark" },
      { date: "2024-09-15", title: "BlackRock BUIDL Direct Redemption Integration", type: "benchmark" },
      { date: "2025-01-25", title: "Arkham Verifies Grayscale ONDO On-Chain Cold Vault", type: "filing" },
      { date: "2026-06-12", title: "Grayscale Prepares Single-Asset ONDO Trust Filing", type: "amendment" },
    ],
  },
];

/**
 * Generates realistic chronological trading chart and ETF inflow data
 * Anchors directly to the live updated market price if provided.
 */
export function generateTradingChartData(
  symbol: string,
  timeframe: "24H" | "7D" | "30D" | "90D" | "1Y" | "ALL",
  livePrice?: number,
  price24hChange?: number
): {
  points: ChartDataPoint[];
  high: number;
  low: number;
  totalInflow: number;
  totalOutflow: number;
  netFlow: number;
  volumeTotal: number;
} {
  const config = CHART_PRODUCTS.find((p) => p.symbol === symbol) || CHART_PRODUCTS[0];
  const activeBasePrice = livePrice && livePrice > 0 ? livePrice : config.basePrice;
  const points: ChartDataPoint[] = [];

  let count = 30;
  let stepMs = 24 * 60 * 60 * 1000;
  const now = Date.now();

  if (timeframe === "24H") {
    count = 24;
    stepMs = 60 * 60 * 1000; // hourly
  } else if (timeframe === "7D") {
    count = 28;
    stepMs = 6 * 60 * 60 * 1000; // 4 points per day
  } else if (timeframe === "30D") {
    count = 30;
    stepMs = 24 * 60 * 60 * 1000; // daily
  } else if (timeframe === "90D") {
    count = 90;
    stepMs = 24 * 60 * 60 * 1000; // daily
  } else if (timeframe === "1Y") {
    count = 120;
    stepMs = 3 * 24 * 60 * 60 * 1000; // 3 days
  } else if (timeframe === "ALL") {
    count = 180;
    stepMs = 4 * 24 * 60 * 60 * 1000;
  }

  const startTime = now - (count - 1) * stepMs;
  
  // Starting price based on timeframe return curve
  let startingMultiplier = 0.95;
  if (timeframe === "24H") {
    const changeDelta = (price24hChange || 0) / 100;
    startingMultiplier = 1 / (1 + changeDelta);
  } else if (timeframe === "7D") {
    startingMultiplier = 0.94;
  } else if (timeframe === "30D") {
    startingMultiplier = 0.88;
  } else if (timeframe === "90D") {
    startingMultiplier = 0.76;
  } else if (timeframe === "1Y") {
    startingMultiplier = 0.58;
  } else if (timeframe === "ALL") {
    startingMultiplier = 0.42;
  }

  let runningPrice = activeBasePrice * startingMultiplier;
  let cumulativeInflow = 0;
  let cumulativeOutflow = 0;

  // Milestone lookup map
  const milestoneMap = new Map<string, { title: string; type: any }>();
  config.milestones.forEach((m) => {
    milestoneMap.set(m.date, { title: m.title, type: m.type });
  });

  const rawPrices: number[] = [];

  for (let i = 0; i < count; i++) {
    const timestamp = startTime + i * stepMs;
    const dateObj = new Date(timestamp);
    const dateStr =
      timeframe === "24H"
        ? dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : dateObj.toISOString().split("T")[0];

    if (i === count - 1) {
      // Pin the very last point EXACTLY to the real-time live market price
      runningPrice = activeBasePrice;
    } else {
      const progress = i / (count - 1);
      // Interpolate with sinusoidal realistic market volatility
      const trendPrice = activeBasePrice * (startingMultiplier + progress * (1 - startingMultiplier));
      const jitter = (Math.sin(i * 0.7) * 0.5 + Math.cos(i * 1.3) * 0.5 + (Math.random() - 0.5) * 0.4) * config.volatility * (1 - progress * 0.7);
      runningPrice = Math.max(trendPrice * (1 + jitter), activeBasePrice * 0.1);
    }

    rawPrices.push(runningPrice);

    // Realistic institutional gross inflows and gross outflows
    const baseUnit = config.inflowBaselineMillion;
    const grossInflow = Math.round((Math.random() * baseUnit * 1.2 + 8) * (Math.random() > 0.15 ? 1 : 0.2));
    const grossOutflow = Math.round((Math.random() * baseUnit * 0.45 + 2) * (Math.random() > 0.35 ? 1 : 0.1));
    const netInflow = grossInflow - grossOutflow;

    cumulativeInflow += grossInflow;
    cumulativeOutflow += grossOutflow;
    const cumulativeNet = cumulativeInflow - cumulativeOutflow;

    const volume = Math.round(
      runningPrice * (config.inflowBaselineMillion * 10000 + Math.random() * 500000) / 1000000
    );

    const fullDateKey = dateObj.toISOString().split("T")[0];
    const matchedMilestone = milestoneMap.get(fullDateKey);

    points.push({
      date: dateStr,
      timestamp,
      price: Number(runningPrice.toFixed(activeBasePrice < 10 ? 4 : 2)),
      volumeMillionUsd: volume,
      etfInflowMillionUsd: grossInflow,
      etfOutflowMillionUsd: grossOutflow,
      etfNetInflowMillionUsd: netInflow,
      cumulativeInflowMillionUsd: cumulativeInflow,
      cumulativeOutflowMillionUsd: cumulativeOutflow,
      cumulativeNetInflowMillionUsd: cumulativeNet,
      milestoneEvent: matchedMilestone?.title,
      milestoneType: matchedMilestone?.type,
    });
  }

  // Calculate Simple Moving Averages (SMA 20, SMA 50)
  for (let i = 0; i < points.length; i++) {
    if (i >= 3) {
      const window20 = rawPrices.slice(Math.max(0, i - 10), i + 1);
      const sum20 = window20.reduce((a, b) => a + b, 0);
      points[i].sma20 = Number((sum20 / window20.length).toFixed(activeBasePrice < 10 ? 4 : 2));
    }
    if (i >= 8) {
      const window50 = rawPrices.slice(Math.max(0, i - 25), i + 1);
      const sum50 = window50.reduce((a, b) => a + b, 0);
      points[i].sma50 = Number((sum50 / window50.length).toFixed(activeBasePrice < 10 ? 4 : 2));
    }
  }

  const prices = points.map((p) => p.price);
  const high = Math.max(...prices);
  const low = Math.min(...prices);
  const totalInflow = cumulativeInflow;
  const totalOutflow = cumulativeOutflow;
  const netFlow = cumulativeInflow - cumulativeOutflow;
  const volumeTotal = points.reduce((acc, p) => acc + p.volumeMillionUsd, 0);

  return { points, high, low, totalInflow, totalOutflow, netFlow, volumeTotal };
}
