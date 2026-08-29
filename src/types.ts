export type EtfStatus =
  | "Approved & Trading"
  | "19b-4 Pending Review"
  | "S-1 Registration Filed"
  | "Public Comments Period"
  | "SEC Delayed Decision"
  | "S-1 Amendment Filed"
  | "Staff Review Stage"
  | "Application Withdrawn"
  | "Withdrawn by Sponsor";

export type TradingStatusCategory =
  | "Live Spot ETF" // Active on Nasdaq, NYSE Arca, Cboe BZX
  | "Active OTC Trust" // Actively trading on OTCQX/Pink sheets (uplisting pending)
  | "Pending SEC Review" // Statutory review stage (S-1 / 19b-4)
  | "Withdrawn / Inactive";

export type FilingType = "Form S-1" | "Form 19b-4" | "Form S-1/A" | "Form 8-A" | "Form N-1A" | "Form RW" | "Form 19b-4/A";

export type ListingExchange = "Cboe BZX" | "Nasdaq" | "NYSE Arca";

export interface CustodianDetails {
  name: string;
  type: "Qualified Custodian" | "Trust Company" | "Banking Partner";
  coldStoragePercentage: number;
  insuranceCoverageMillionUsd: number;
  jurisdiction: string;
}

export type RegulatoryPathway = 
  | "75-Day Generic Listing (Rule 19b-4(e))"
  | "240-Day Section 19(b) Statutory Clock";

export interface StatutoryDeadlines {
  filingDate: string;
  federalRegisterDate: string;
  firstDeadline45d: string;
  secondDeadline90d: string;
  thirdDeadline180d: string;
  finalDeadline240d: string;
  nextDeadlineDate: string;
  nextDeadlineLabel: string;
  daysRemaining: number;
  regulatoryPathway?: RegulatoryPathway;
  genericListingEligible?: boolean;
  genericListingCriteriaNote?: string;
  fastTrackDays75Target?: string;
}

export interface SecEdgarInfo {
  cik: string;
  accessionNumber: string;
  formType: FilingType;
  filingDate: string;
  officialUrl: string;
  filingTitle: string;
  trustName: string;
}

export interface ETFApplication {
  id: string;
  tokenSymbol: string;
  tokenName: string;
  tokenIcon: string;
  tokenCategory:
    | "Smart Contracts (L1)"
    | "Payment & Settlements"
    | "Store of Value"
    | "Meme & Community"
    | "Multi-Asset Index"
    | "Privacy & Zero-Knowledge (L1)"
    | "Oracle & Infrastructure"
    | "DeFi & Financial Infrastructure"
    | "AI & Decentralized Compute"
    | "Data, Storage & Web3";
  currentPriceUsd: number;
  price24hChange: number;
  circulatingSupply: number;
  marketCapUsd: number;
  
  // Issuer & Trust Details
  fundName: string;
  ticker: string;
  issuer: string;
  issuerLogo: string;
  exchange: ListingExchange;
  sponsorFeePercentage: number;
  feeWaiverPeriod?: string;
  
  // Holdings & Portfolio
  tokensHeld: number; // Exact token count in custody / seed reserve
  portfolioValueUsd: number;
  percentageOfCirculatingSupply: number;
  stakingEnabled: boolean;
  stakingYieldPercentage?: number;
  stakingStatusNote: string;
  
  // Custody
  custodian: CustodianDetails;
  cashCustodian: string;
  
  // Filing & Regulatory Progress
  status: EtfStatus;
  tradingCategory?: TradingStatusCategory;
  tradingExchangeNote?: string;
  approvalProbabilityPercentage: number;
  filingType: FilingType;
  statutoryDeadlines: StatutoryDeadlines;
  secEdgar: SecEdgarInfo;
  
  // Regulatory Risk & Filing Highlights
  regulatoryHighlights: string[];
  surveillanceSharingPartner: string;
  keyCatalysts: string;
  lastUpdated: string;
}

export interface OnlineEtfTrackerSource {
  id: string;
  name: string;
  category: "SEC EDGAR" | "Market Price Feed" | "Exchange Registry" | "Bloomberg / ETF.com";
  status: "connected" | "syncing" | "paused" | "error";
  lastCheckTime: string;
  itemsDiscovered: number;
  endpointUrl: string;
}

export interface OnlineSyncLog {
  id: string;
  timestamp: string;
  type: "PRICE_TICK" | "ETF_DISCOVERED" | "REGISTRY_SCAN" | "SEC_FILING";
  message: string;
  badge?: string;
}

export interface TokenSummary {
  symbol: string;
  name: string;
  priceUsd: number;
  price24hChange: number;
  totalEtfHoldings: number;
  totalEtfHoldingsUsd: number;
  supplyPercentageLocked: number;
  totalFilingsCount: number;
  approvedFilingsCount: number;
  pendingFilingsCount: number;
  averageApprovalProbability: number;
}

export interface IssuerSummary {
  issuerName: string;
  totalFilings: number;
  approvedFunds: number;
  pendingApplications: number;
  totalAumUsd: number;
  avgSponsorFee: number;
  primaryCustodian: string;
  tokensCovered: string[];
}

export interface TokenCustodyLockAnalysis {
  tokenSymbol: string;
  tokenName: string;
  tokenIcon: string;
  category: string;
  priceUsd: number;
  price24hChange: number;
  circulatingSupply: number;
  marketCapUsd: number;
  totalTokensHeldInEtfs: number;
  totalUsdLockedInEtfs: number;
  percentageCirculatingSupplyLocked: number;
  etfFilingsCount: number;
  approvedFundsCount: number;
  pendingFundsCount: number;
  custodians: {
    name: string;
    type: string;
    tokensHeld: number;
    usdValue: number;
    coldStoragePercentage: number;
    insuranceCoverageMillionUsd: number;
    jurisdiction: string;
  }[];
  stakingStatus: {
    enabled: boolean;
    yieldPercentage?: number;
    stakedTokensCount: number;
    stakedUsdValue: number;
    unbondingPeriodDays: number;
    custodySegregated: boolean;
    notes: string;
  };
  securityAndAudits: {
    soc1Compliant: boolean;
    soc2Compliant: boolean;
    multiSigScheme: string;
    airGappedVaults: boolean;
    rule15c3Segregation: boolean;
  };
}

export interface UntappedTokenCandidate {
  symbol: string;
  name: string;
  icon: string;
  category: string;
  priceUsd: number;
  price24hChange: number;
  marketCapUsd: number;
  rank: number;
  etfReadinessScore: number; // 0 - 100
  hasActiveEtfApplication: boolean;
  activeFilingCount: number;
  activeTickers: string[];
  commodityClassificationStatus: "CFTC PoW Commodity" | "Decentralized L1" | "Utility / Staking Protocol" | "DeFi Governance Token" | "RWA / Tokenized Asset";
  cmeFuturesAvailable: boolean;
  cmeReferenceRateAvailable: boolean;
  qualifiedCustodianSupport: string[];
  spotLiquidityRating: "Tier 1 (High Depth)" | "Tier 2 (Moderate Depth)" | "Tier 3 (Emerging Depth)";
  issuersHoldingAsset: string[];
  keyCatalysts: string;
  suggestedListingExchange: ListingExchange;
  suggestedCustodian: string;
}

export interface MasterWalletAddress {
  label: string;
  tokenSymbol: string;
  network: string;
  address: string;
  explorerUrl: string;
  explorerName: string;
  multisigScheme: string;
  custodian: string;
  balanceTokens: number;
  balanceUsd: number;
  verifiedOnChain: boolean;
  lastAudited: string;
}

export interface IssuerSupportedToken {
  symbol: string;
  name: string;
  tokensHeld: number;
  usdValue: number;
  hasActiveEtf: boolean;
  etfTicker?: string;
  etfStatus?: string;
  walletAddress?: string;
  explorerUrl?: string;
  explorerName?: string;
  network?: string;
  custodian?: string;
  verifiedOnChain?: boolean;
}

export interface IssuerWalletInfo {
  issuerId: string;
  issuerName: string;
  issuerLogo: string;
  totalAumUsd: number;
  totalCryptoHoldingsUsd: number;
  knownCustodyWalletsCount: number;
  primaryCustodians: string[];
  supportedTokens: IssuerSupportedToken[];
  masterWalletAddresses: MasterWalletAddress[];
  untappedTokensHeldWithoutEtf: string[];
  trustStructure: string;
  cashAdministrator: string;
}

export type DailyEventType =
  | "NEW_FILING"
  | "APPROVAL"
  | "WITHDRAWAL"
  | "AMENDMENT"
  | "BREAKING_NEWS";

export interface DailyActivityItem {
  id: string;
  timestamp: string; // Time string e.g. "14:32:00" or ISO
  date: string; // YYYY-MM-DD
  timeAgo: string;
  type: DailyEventType;
  title: string;
  description: string;
  fundName: string;
  ticker: string;
  issuer: string;
  tokenSymbol: string;
  tokenName: string;
  formType: FilingType | string;
  exchange: ListingExchange | string;
  estimatedValueUsd: number; // How much it is worth in USD
  tokensCount?: number;
  sponsorFeePercentage?: number;
  custodian?: string;
  secCik?: string;
  secAccession?: string;
  officialFilingUrl?: string;
  impactLevel: "HIGH" | "MEDIUM" | "LOW";
  status: EtfStatus;
  reasonOrCatalyst?: string;
  etfApplicationId?: string;
  rawSecSource?: any;
}

export interface DailyActivitySummary {
  date: string;
  totalEventsCount: number;
  newFilingsCount: number;
  newFilingsTotalValueUsd: number;
  approvedCount: number;
  approvedTotalValueUsd: number;
  withdrawnCount: number;
  withdrawnTotalValueUsd: number;
  amendmentsCount: number;
  netMarketValueDeltaUsd: number;
  topTokensImpacted: { symbol: string; count: number; valueUsd: number }[];
  topCustodiansImpacted: { name: string; count: number; valueUsd: number }[];
}

export type NotificationCategory = "FILING" | "APPROVAL" | "WITHDRAWAL" | "NEWS" | "SYSTEM";

export interface AppNotification {
  id: string;
  timestamp: string;
  timeAgo: string;
  category: NotificationCategory;
  title: string;
  message: string;
  isRead: boolean;
  priority: "HIGH" | "MEDIUM" | "LOW";
  relatedTicker?: string;
  relatedToken?: string;
  valueUsd?: number;
  actionUrl?: string;
  etfId?: string;
}

