import { DailyActivityItem, DailyActivitySummary, AppNotification, ETFApplication } from "../types";

export const INITIAL_TODAY_ACTIVITIES: DailyActivityItem[] = [
  // 1. APPROVED & EFFECTIVE DISCLOSURES (Official SEC Form 8-A / S-1 Notices of Effectiveness)
  {
    id: "act-approved-grayscale-btc-mini",
    timestamp: "14:15:00",
    date: new Date().toISOString().split("T")[0],
    timeAgo: "25 mins ago",
    type: "APPROVAL",
    title: "SEC Division of Corporation Finance Issues Notice of Effectiveness for Grayscale Bitcoin Mini Trust (BTC)",
    description: "The SEC declared effective the Form 8-A and Form S-1 registration statements for the Grayscale Bitcoin Mini Trust on NYSE Arca, establishing a low 0.15% sponsor fee spot Bitcoin product.",
    fundName: "Grayscale Bitcoin Mini Trust",
    ticker: "BTC",
    issuer: "Grayscale Investments",
    tokenSymbol: "BTC",
    tokenName: "Bitcoin",
    formType: "Form 8-A / S-1",
    exchange: "NYSE Arca",
    estimatedValueUsd: 2180000000, // $2.18 Billion
    tokensCount: 22500, // 22,500 BTC
    sponsorFeePercentage: 0.15,
    custodian: "Coinbase Custody Trust Company LLC",
    secCik: "0002015097",
    secAccession: "0000950170-24-087120",
    officialFilingUrl: "https://www.sec.gov/edgar/browse/?CIK=0002015097",
    impactLevel: "HIGH",
    status: "Approved & Trading",
    reasonOrCatalyst: "SEC Notice of Effectiveness issued under Securities Act of 1933 and Exchange Act Section 12(b).",
    etfApplicationId: "grayscale-bitcoin-mini-trust",
  },
  {
    id: "act-approved-grayscale-eth-mini",
    timestamp: "11:40:00",
    date: new Date().toISOString().split("T")[0],
    timeAgo: "2 hours ago",
    type: "APPROVAL",
    title: "SEC Grants Final Listing & Trading Effectiveness for Grayscale Ethereum Mini Trust (ETH)",
    description: "NYSE Arca received SEC formal confirmation of effectiveness under Section 19(b) and Form 8-A for the Grayscale Ethereum Mini Trust, holding 100% physically backed spot Ether.",
    fundName: "Grayscale Ethereum Mini Trust",
    ticker: "ETH",
    issuer: "Grayscale Investments",
    tokenSymbol: "ETH",
    tokenName: "Ethereum",
    formType: "Form 8-A / S-1",
    exchange: "NYSE Arca",
    estimatedValueUsd: 1050000000, // $1.05 Billion
    tokensCount: 385000, // 385k ETH
    sponsorFeePercentage: 0.15,
    custodian: "Coinbase Custody Trust Company LLC",
    secCik: "0002026859",
    secAccession: "0000950170-24-086910",
    officialFilingUrl: "https://www.sec.gov/edgar/browse/?CIK=0002026859",
    impactLevel: "HIGH",
    status: "Approved & Trading",
    reasonOrCatalyst: "Spun off from ETHE with low-fee institutional custody structure on NYSE Arca.",
    etfApplicationId: "grayscale-ethereum-mini-trust",
  },

  // 2. NEW S-1 & 19b-4 FILINGS SUBMITTED TO SEC
  {
    id: "act-filed-canary-hbar",
    timestamp: "13:05:00",
    date: new Date().toISOString().split("T")[0],
    timeAgo: "1 hour ago",
    type: "NEW_FILING",
    title: "Canary Capital Files Form S-1 Registration Statement for Canary Hedera HBAR ETF (HBAR)",
    description: "Canary Capital submitted a new registration statement on Form S-1 to launch the first US spot Hedera ETF on Nasdaq with 100% cold-storage segregated custody via Coinbase Custody.",
    fundName: "Canary Hedera HBAR ETF",
    ticker: "HBAR",
    issuer: "Canary Capital",
    tokenSymbol: "HBAR",
    tokenName: "Hedera",
    formType: "Form S-1",
    exchange: "Nasdaq",
    estimatedValueUsd: 64200000, // $64.2 Million
    tokensCount: 320000000, // 320M HBAR
    sponsorFeePercentage: 0.25,
    custodian: "Coinbase Custody Trust Company LLC",
    secCik: "0002049911",
    secAccession: "0001193125-24-259124",
    officialFilingUrl: "https://www.sec.gov/edgar/browse/?CIK=0002049911",
    impactLevel: "HIGH",
    status: "S-1 Registration Filed",
    reasonOrCatalyst: "Targets enterprise DLT hashgraph adoption backed by Google, IBM, and Boeing governing council nodes.",
    etfApplicationId: "canary-hedera-hbar-etf",
  },
  {
    id: "act-filed-grayscale-chainlink",
    timestamp: "10:20:00",
    date: new Date().toISOString().split("T")[0],
    timeAgo: "3 hours ago",
    type: "NEW_FILING",
    title: "Grayscale Files Form 19b-4 Rule Change to Convert Chainlink Trust to Spot ETF (GLNK)",
    description: "NYSE Arca submitted a proposed rule change under Section 19(b) to list and trade shares of the Grayscale Chainlink Trust ETF with federally chartered Anchorage Digital Bank as qualified custodian.",
    fundName: "Grayscale Chainlink Trust ETF",
    ticker: "GLNK",
    issuer: "Grayscale Investments",
    tokenSymbol: "LINK",
    tokenName: "Chainlink",
    formType: "Form 19b-4",
    exchange: "NYSE Arca",
    estimatedValueUsd: 148500000, // $148.5 Million
    tokensCount: 7800000, // 7.8M LINK
    sponsorFeePercentage: 0.35,
    custodian: "Anchorage Digital Bank NA",
    secCik: "0001889812",
    secAccession: "0000950170-24-142890",
    officialFilingUrl: "https://www.sec.gov/edgar/browse/?CIK=0001889812",
    impactLevel: "HIGH",
    status: "19b-4 Pending Review",
    reasonOrCatalyst: "Chainlink standard oracle infrastructure feeds 90%+ of decentralized finance pricing.",
    etfApplicationId: "grayscale-chainlink-trust-etf",
  },
  {
    id: "act-filed-canary-sui",
    timestamp: "09:50:00",
    date: new Date().toISOString().split("T")[0],
    timeAgo: "4 hours ago",
    type: "NEW_FILING",
    title: "Canary Capital Files Form S-1 for Canary Sui Spot ETF (CSUI)",
    description: "Canary Capital submitted a new Form S-1 registration statement to list the first spot Sui ETP on Nasdaq with BitGo Trust Company as qualified custodian.",
    fundName: "Canary Sui ETF",
    ticker: "CSUI",
    issuer: "Canary Capital",
    tokenSymbol: "SUI",
    tokenName: "Sui",
    formType: "Form S-1",
    exchange: "Nasdaq",
    estimatedValueUsd: 48000000, // $48.0 Million
    tokensCount: 14500000, // 14.5M SUI
    sponsorFeePercentage: 0.25,
    custodian: "BitGo Trust Company",
    secCik: "0002051120",
    secAccession: "0001213900-24-098412",
    officialFilingUrl: "https://www.sec.gov/edgar/browse/?CIK=0002051120",
    impactLevel: "MEDIUM",
    status: "S-1 Registration Filed",
    reasonOrCatalyst: "High-throughput Move-based object execution model gaining institutional DeFi traction.",
    etfApplicationId: "canary-sui-etf",
  },
  {
    id: "act-filed-bitwise-aptos",
    timestamp: "09:10:00",
    date: new Date().toISOString().split("T")[0],
    timeAgo: "5 hours ago",
    type: "NEW_FILING",
    title: "Bitwise Files Form S-1 for Bitwise Aptos Staking ETF (BAPT)",
    description: "Bitwise filed Form S-1 with the SEC to register a spot Aptos ETF on Cboe BZX incorporating institutional validator staking rewards via Gemini Trust.",
    fundName: "Bitwise Aptos Staking ETF",
    ticker: "BAPT",
    issuer: "Bitwise",
    tokenSymbol: "APT",
    tokenName: "Aptos",
    formType: "Form S-1",
    exchange: "Cboe BZX",
    estimatedValueUsd: 42800000, // $42.8 Million
    tokensCount: 4500000, // 4.5M APT
    sponsorFeePercentage: 0.20,
    custodian: "Gemini Trust Company LLC",
    secCik: "0002048991",
    secAccession: "0001193125-24-269102",
    officialFilingUrl: "https://www.sec.gov/edgar/browse/?CIK=0002048991",
    impactLevel: "MEDIUM",
    status: "S-1 Registration Filed",
    reasonOrCatalyst: "High-throughput Move VM network expanding into enterprise settlement and tokenization.",
    etfApplicationId: "bitwise-aptos-etf",
  },

  // 3. WITHDRAWALS & STRATEGIC REFILINGS (Official SEC Form RW)
  {
    id: "act-withdrawn-invesco-galaxy-sol",
    timestamp: "12:50:00",
    date: new Date().toISOString().split("T")[0],
    timeAgo: "1.5 hours ago",
    type: "WITHDRAWAL",
    title: "Invesco Galaxy Submits Form RW to Withdraw 19b-4 for Strategic 75-Day Fast-Track Refiling",
    description: "Invesco and Galaxy Digital formally filed Form RW (Request for Withdrawal) with the SEC to transition their application into the streamlined 75-day generic listing pathway under amended exchange rules.",
    fundName: "Invesco Galaxy Solana ETF",
    ticker: "QSOL",
    issuer: "Invesco Galaxy",
    tokenSymbol: "SOL",
    tokenName: "Solana",
    formType: "Form RW",
    exchange: "Cboe BZX",
    estimatedValueUsd: 85000000, // $85.0 Million
    tokensCount: 460000, // 460k SOL
    sponsorFeePercentage: 0.25,
    custodian: "Coinbase Custody Trust Company LLC",
    secCik: "0002028710",
    secAccession: "0001193125-24-210492",
    officialFilingUrl: "https://www.sec.gov/edgar/browse/?CIK=0002028710",
    impactLevel: "MEDIUM",
    status: "Withdrawn by Sponsor",
    reasonOrCatalyst: "Voluntary Form RW withdrawal for fast-track refiling under amended exchange generic standards.",
    etfApplicationId: "invesco-galaxy-solana-etf",
  },
  {
    id: "act-withdrawn-roundhill-meme",
    timestamp: "08:30:00",
    date: new Date().toISOString().split("T")[0],
    timeAgo: "6 hours ago",
    type: "WITHDRAWAL",
    title: "Roundhill Withdraws Multi-Asset Meme Basket ETP Filing via Form RW",
    description: "Roundhill Investments withdrew Form N-1A registration for their multi-token meme coin basket strategy to focus regulatory resources on single-asset spot commodity trusts.",
    fundName: "Roundhill Crypto Meme Index ETF",
    ticker: "MEME",
    issuer: "Roundhill",
    tokenSymbol: "DOGE",
    tokenName: "Dogecoin / Multi",
    formType: "Form RW",
    exchange: "Cboe BZX",
    estimatedValueUsd: 22400000, // $22.4 Million
    tokensCount: 85000000,
    sponsorFeePercentage: 0.65,
    custodian: "BitGo Trust Company",
    secCik: "0001928490",
    secAccession: "0001193125-24-201844",
    officialFilingUrl: "https://www.sec.gov/edgar/browse/?CIK=0001928490",
    impactLevel: "LOW",
    status: "Application Withdrawn",
    reasonOrCatalyst: "Regulatory guidance favored single-asset commodity trusts over multi-asset index products.",
  },

  // 4. SEC S-1/A AMENDMENTS & REGULATORY WIRE DISCLOSURES
  {
    id: "act-amend-bitwise-xrp",
    timestamp: "10:55:00",
    date: new Date().toISOString().split("T")[0],
    timeAgo: "3.5 hours ago",
    type: "AMENDMENT",
    title: "Bitwise Submits Form S-1/A Amendment for Bitwise XRP ETF Under Active SEC Staff Review",
    description: "Bitwise filed Amendment No. 1 to Form S-1 with the SEC Division of Corporation Finance, detailing CME CF Ripple-Dollar benchmark reference rates and Coinbase Custody cold-storage segregation.",
    fundName: "Bitwise XRP ETF",
    ticker: "XRP",
    issuer: "Bitwise",
    tokenSymbol: "XRP",
    tokenName: "XRP (Ripple)",
    formType: "Form S-1/A",
    exchange: "NYSE Arca",
    estimatedValueUsd: 340500000, // $340.5 Million
    tokensCount: 140000000, // 140M XRP
    sponsorFeePercentage: 0.22,
    custodian: "Coinbase Custody Trust Company LLC",
    secCik: "0002038755",
    secAccession: "0001193125-24-239841",
    officialFilingUrl: "https://www.sec.gov/edgar/browse/?CIK=0002038755",
    impactLevel: "HIGH",
    status: "19b-4 Pending Review",
    reasonOrCatalyst: "Form S-1/A amendment addressing SEC staff disclosure questions regarding secondary market surveillance and settlement mechanics.",
    etfApplicationId: "bitwise-xrp-etf",
  },
  {
    id: "act-amend-canary-litecoin",
    timestamp: "10:15:00",
    date: new Date().toISOString().split("T")[0],
    timeAgo: "4 hours ago",
    type: "AMENDMENT",
    title: "Canary Capital Files Form S-1/A Amendment for Canary Litecoin ETF (LTCC)",
    description: "Canary Capital submitted an updated Form S-1 registration statement with the SEC, presenting legal analysis of Litecoin's pure Proof-of-Work consensus parity with Bitcoin under Howey test standards.",
    fundName: "Canary Litecoin ETF",
    ticker: "LTCC",
    issuer: "Canary Capital",
    tokenSymbol: "LTC",
    tokenName: "Litecoin",
    formType: "Form S-1/A",
    exchange: "Nasdaq",
    estimatedValueUsd: 195200000, // $195.2 Million
    tokensCount: 1840000, // 1.84M LTC
    sponsorFeePercentage: 0.25,
    custodian: "Coinbase Custody Trust Company LLC",
    secCik: "0002041235",
    secAccession: "0001213900-24-089102",
    officialFilingUrl: "https://www.sec.gov/edgar/browse/?CIK=0002041235",
    impactLevel: "HIGH",
    status: "S-1 Registration Filed",
    reasonOrCatalyst: "S-1 amendment establishing Proof-of-Work commodity parity with spot Bitcoin trusts.",
    etfApplicationId: "canary-litecoin-etf",
  },
  {
    id: "act-amend-franklin-eth-staking",
    timestamp: "09:45:00",
    date: new Date().toISOString().split("T")[0],
    timeAgo: "4.5 hours ago",
    type: "AMENDMENT",
    title: "Franklin Templeton Submits Form S-1/A to Enable In-Kind Validator Staking for Ethereum ETF",
    description: "Franklin Templeton updated the Franklin Ethereum ETF (EZET) registration statement with SEC Division of Corporation Finance, detailing 3.8% staking yield mechanics with BNY Mellon and Coinbase Custody.",
    fundName: "Franklin Ethereum Staking ETF",
    ticker: "EZET",
    issuer: "Franklin Templeton",
    tokenSymbol: "ETH",
    tokenName: "Ethereum",
    formType: "Form S-1/A",
    exchange: "Cboe BZX",
    estimatedValueUsd: 485000000, // $485 Million
    tokensCount: 165000, // 165k ETH
    sponsorFeePercentage: 0.19,
    custodian: "Coinbase Custody Trust Company LLC",
    secCik: "0002011920",
    secAccession: "0001193125-24-245019",
    officialFilingUrl: "https://www.sec.gov/edgar/browse/?CIK=0002011920",
    impactLevel: "HIGH",
    status: "S-1 Amendment Filed",
    reasonOrCatalyst: "Institutional staking yield generation structure submitted for SEC Division of Corporation Finance review.",
  },
];

// Helper to compute live summary for any array of activities
export function computeDailyActivitySummary(
  activities: DailyActivityItem[],
  date: string = new Date().toISOString().split("T")[0]
): DailyActivitySummary {
  const dayItems = activities.filter((a) => a.date === date || !a.date);

  let newFilingsCount = 0;
  let newFilingsTotalValueUsd = 0;
  let approvedCount = 0;
  let approvedTotalValueUsd = 0;
  let withdrawnCount = 0;
  let withdrawnTotalValueUsd = 0;
  let amendmentsCount = 0;

  const tokenMap = new Map<string, { count: number; valueUsd: number }>();
  const custodianMap = new Map<string, { count: number; valueUsd: number }>();

  dayItems.forEach((item) => {
    if (item.type === "NEW_FILING") {
      newFilingsCount += 1;
      newFilingsTotalValueUsd += item.estimatedValueUsd;
    } else if (item.type === "APPROVAL") {
      approvedCount += 1;
      approvedTotalValueUsd += item.estimatedValueUsd;
    } else if (item.type === "WITHDRAWAL") {
      withdrawnCount += 1;
      withdrawnTotalValueUsd += item.estimatedValueUsd;
    } else if (item.type === "AMENDMENT") {
      amendmentsCount += 1;
    }

    if (item.tokenSymbol) {
      const prev = tokenMap.get(item.tokenSymbol) || { count: 0, valueUsd: 0 };
      tokenMap.set(item.tokenSymbol, {
        count: prev.count + 1,
        valueUsd: prev.valueUsd + item.estimatedValueUsd,
      });
    }

    if (item.custodian) {
      const shortName = item.custodian.split(" ")[0];
      const prev = custodianMap.get(shortName) || { count: 0, valueUsd: 0 };
      custodianMap.set(shortName, {
        count: prev.count + 1,
        valueUsd: prev.valueUsd + item.estimatedValueUsd,
      });
    }
  });

  const netMarketValueDeltaUsd = (approvedTotalValueUsd + newFilingsTotalValueUsd) - withdrawnTotalValueUsd;

  const topTokensImpacted = Array.from(tokenMap.entries())
    .map(([symbol, data]) => ({ symbol, ...data }))
    .sort((a, b) => b.valueUsd - a.valueUsd);

  const topCustodiansImpacted = Array.from(custodianMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.valueUsd - a.valueUsd);

  return {
    date,
    totalEventsCount: dayItems.length,
    newFilingsCount,
    newFilingsTotalValueUsd,
    approvedCount,
    approvedTotalValueUsd,
    withdrawnCount,
    withdrawnTotalValueUsd,
    amendmentsCount,
    netMarketValueDeltaUsd,
    topTokensImpacted,
    topCustodiansImpacted,
  };
}

// Convert today's activity items into initial notification feed
export function generateInitialNotifications(activities: DailyActivityItem[]): AppNotification[] {
  return activities.map((item) => {
    let category: "FILING" | "APPROVAL" | "WITHDRAWAL" | "NEWS" = "FILING";
    if (item.type === "APPROVAL") category = "APPROVAL";
    else if (item.type === "WITHDRAWAL") category = "WITHDRAWAL";
    else if (item.type === "BREAKING_NEWS" || item.type === "AMENDMENT") category = "NEWS";

    return {
      id: `notif-${item.id}`,
      timestamp: new Date().toISOString(),
      timeAgo: item.timeAgo,
      category,
      title: item.title,
      message: `${item.fundName} (${item.ticker}) &bull; Est. Value: $${(item.estimatedValueUsd / 1e6).toFixed(1)}M USD &bull; Custodian: ${item.custodian?.split(" ")[0] || "Qualified"}`,
      isRead: false,
      priority: item.impactLevel,
      relatedTicker: item.ticker,
      relatedToken: item.tokenSymbol,
      valueUsd: item.estimatedValueUsd,
      etfId: item.etfApplicationId,
    };
  });
}
