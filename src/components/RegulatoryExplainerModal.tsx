import React from "react";
import {
  X,
  HelpCircle,
  Scale,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Building2,
  ShieldCheck,
  Globe2,
  Coins,
  ArrowRight,
  BookOpen,
  Landmark,
} from "lucide-react";

interface RegulatoryExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RegulatoryExplainerModal: React.FC<RegulatoryExplainerModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div
        className="relative w-full max-w-4xl bg-[#0f0f0f] border border-[#262626] rounded-2xl shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-neutral-900 via-[#141414] to-neutral-900 border-b border-[#222222] p-6 flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  SEC Regulatory Analysis
                </span>
                <span className="text-xs text-[#888888]">1934 Exchange Act § 6(b)(5)</span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">
                Why Are Only 2 Tokens (BTC & ETH) Approved as US Spot ETFs?
              </h2>
              <p className="text-xs text-[#a0a0a0] mt-0.5">
                A comprehensive breakdown of SEC approval precedents, the CME futures standard, and the status of other trading tokens.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#181818] hover:bg-[#242424] text-[#888888] hover:text-white border border-[#2e2e2e] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs text-[#cccccc] leading-relaxed">
          
          {/* Section 1: The Core Question Answered */}
          <div className="bg-[#141414] border border-[#242424] rounded-xl p-4.5 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>The Executive Summary</span>
            </div>
            <p className="text-xs text-[#d1d5db]">
              Under U.S. securities law, the Securities and Exchange Commission (SEC) requires national securities exchanges (Nasdaq, NYSE Arca, Cboe BZX) to prove their rules are designed to <strong>"prevent fraudulent and manipulative acts and practices"</strong> (Exchange Act Section 6(b)(5)). Historically, the SEC established that this standard could ONLY be satisfied if the underlying token traded on a <strong>"regulated market of significant size"</strong> — specifically the <strong>Chicago Mercantile Exchange (CME)</strong>.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="bg-[#0c0c0c] border border-[#1f1f1f] rounded-lg p-3">
                <div className="font-bold text-white flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  Bitcoin (BTC)
                </div>
                <p className="text-[11px] text-[#9ca3af]">
                  CME Bitcoin Futures launched in <strong>December 2017</strong>. After 6 years of futures data, the SEC approved 11 spot Bitcoin ETFs in <strong>January 2024</strong> following the <em>Grayscale v. SEC</em> D.C. Circuit Court victory.
                </p>
              </div>
              <div className="bg-[#0c0c0c] border border-[#1f1f1f] rounded-lg p-3">
                <div className="font-bold text-white flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                  Ethereum (ETH)
                </div>
                <p className="text-[11px] text-[#9ca3af]">
                  CME Ether Futures launched in <strong>February 2021</strong>. Using the exact same legal correlation test, the SEC approved 8 spot Ethereum ETFs in <strong>July 2024</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Why Other Tokens Weren't Approved Yet */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              What About Other Tokens? Why Weren't They Approved Concurrently?
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-[#121212] border border-[#222222] rounded-xl p-3.5 space-y-1.5">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  1. Lack of CME Futures History
                </div>
                <p className="text-[11px] text-[#888888]">
                  Tokens like Solana, XRP, Cardano, and Avalanche did not have CFTC-regulated futures contracts trading on the CME for multiple years. Without a CME futures market, the previous SEC test could not be strictly applied.
                </p>
              </div>

              <div className="bg-[#121212] border border-[#222222] rounded-xl p-3.5 space-y-1.5">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-purple-400" />
                  2. Prior Regulatory Classification
                </div>
                <p className="text-[11px] text-[#888888]">
                  The SEC previously alleged in civil complaints that several altcoins were "unregistered investment contracts." Issuers could not file Form 19b-4 rule changes until key court decisions (like <em>Ripple / SEC</em> SDNY) provided legal clarity.
                </p>
              </div>

              <div className="bg-[#121212] border border-[#222222] rounded-xl p-3.5 space-y-1.5">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5 text-emerald-400" />
                  3. Statutory 240-Day Clocks
                </div>
                <p className="text-[11px] text-[#888888]">
                  Form 19b-4 filings were formally submitted between late 2024 and early 2025. The SEC has a strict <strong>240-day statutory clock</strong> to issue approval or disapproval orders, meaning final altcoin decisions arrive across 2025.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: The Big Secret - Many Other Tokens DO Trade Publicly! */}
          <div className="bg-gradient-to-br from-purple-950/40 via-[#141414] to-[#141414] border border-purple-500/30 rounded-xl p-4.5 space-y-3">
            <div className="flex items-center gap-2 text-purple-300 font-bold text-sm">
              <Building2 className="w-4 h-4 text-purple-400" />
              <span>Crucial Clarification: Many Tokens ALREADY Trade in Public US Markets</span>
            </div>
            <p className="text-xs text-[#d1d5db]">
              While only BTC and ETH currently have SEC-approved <strong>national exchange spot ETFs (Nasdaq/NYSE/Cboe)</strong>, over <strong>15 other crypto tokens</strong> already trade publicly in the United States as <strong>SEC-reporting Grantor Trusts</strong> on OTCQX and OTC Markets!
            </p>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
              <div className="bg-[#0b0b0b] border border-[#222222] p-2.5 rounded-lg">
                <div className="font-mono font-bold text-emerald-400">GLNK</div>
                <div className="text-white font-medium">Grayscale Chainlink</div>
                <div className="text-[#777777]">$60M+ AUM (OTCQX)</div>
              </div>
              <div className="bg-[#0b0b0b] border border-[#222222] p-2.5 rounded-lg">
                <div className="font-mono font-bold text-emerald-400">GSUI</div>
                <div className="text-white font-medium">Grayscale Sui Trust</div>
                <div className="text-[#777777]">$25M+ AUM (Public)</div>
              </div>
              <div className="bg-[#0b0b0b] border border-[#222222] p-2.5 rounded-lg">
                <div className="font-mono font-bold text-emerald-400">BCHG</div>
                <div className="text-white font-medium">Grayscale Bitcoin Cash</div>
                <div className="text-[#777777]">$210M+ AUM (OTCQX)</div>
              </div>
              <div className="bg-[#0b0b0b] border border-[#222222] p-2.5 rounded-lg">
                <div className="font-mono font-bold text-emerald-400">ETCG</div>
                <div className="text-white font-medium">Grayscale Ethereum Classic</div>
                <div className="text-[#777777]">$380M+ AUM (OTCQX)</div>
              </div>
              <div className="bg-[#0b0b0b] border border-[#222222] p-2.5 rounded-lg">
                <div className="font-mono font-bold text-emerald-400">BITW</div>
                <div className="text-white font-medium">Bitwise 10 Crypto Index</div>
                <div className="text-[#777777]">$1.2B+ AUM (OTCQX)</div>
              </div>
              <div className="bg-[#0b0b0b] border border-[#222222] p-2.5 rounded-lg">
                <div className="font-mono font-bold text-emerald-400">GDLC</div>
                <div className="text-white font-medium">Grayscale Large Cap</div>
                <div className="text-[#777777]">$750M+ AUM (OTCQX)</div>
              </div>
              <div className="bg-[#0b0b0b] border border-[#222222] p-2.5 rounded-lg">
                <div className="font-mono font-bold text-emerald-400">LTCN</div>
                <div className="text-white font-medium">Grayscale Litecoin Trust</div>
                <div className="text-[#777777]">$180M+ AUM (OTCQX)</div>
              </div>
              <div className="bg-[#0b0b0b] border border-[#222222] p-2.5 rounded-lg">
                <div className="font-mono font-bold text-emerald-400">GTAO</div>
                <div className="text-white font-medium">Grayscale Bittensor</div>
                <div className="text-[#777777]">$18M+ AUM (Public)</div>
              </div>
            </div>

            <p className="text-[11px] text-[#9ca3af] bg-[#0c0c0c] p-2.5 rounded-lg border border-[#1f1f1f]">
              💡 <strong>The Goal of Current S-1 / 19b-4 Filings:</strong> These trusts hold 100% cold-storage tokens today. The pending SEC filings are to <em>uplist</em> them onto the New York Stock Exchange (NYSE Arca) or Nasdaq, enabling direct retail 401(k) access, eliminating NAV discounts/premiums, and unlocking in-kind creation and redemption baskets.
            </p>
          </div>

          {/* Section 4: The 75-Day vs 240-Day Rule Explained */}
          <div className="bg-gradient-to-br from-emerald-950/30 via-[#141414] to-[#121212] border border-emerald-500/30 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <Clock className="w-4 h-4" />
              <span>Did the SEC Change the 240-Day Rule to 75 Days? (The Dual-Pathway Reality)</span>
            </div>
            
            <p className="text-xs text-[#d1d5db] leading-relaxed">
              <strong>Yes, for qualifying spot crypto ETPs, but with an important legal distinction:</strong> The federal statute itself (Section 19(b) of the Securities Exchange Act) still exists, but the SEC approved <strong>Generic Listing Standards</strong> (under SEC Rule 19b-4(e)) for commodity-based trust shares across NYSE Arca (Rule 8.201-E), Nasdaq (Rule 5711), and Cboe BZX (Rule 14.11(e)(4)).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="bg-[#0b0b0b] border border-emerald-500/40 rounded-xl p-3.5 space-y-2">
                <div className="font-bold text-emerald-300 flex items-center gap-1.5 text-xs">
                  <span>⚡ 75-Day Fast Track (Rule 19b-4(e) Generic Standards)</span>
                </div>
                <ul className="space-y-1.5 text-[11px] text-[#aaaaaa]">
                  <li>• <strong>No Individual 19b-4 Filing Required:</strong> Exchanges do not need a separate SEC rule approval order for each fund.</li>
                  <li>• <strong>Pure Form S-1 Review:</strong> The regulatory clock shrinks to the Form S-1 registration timeline (30 days initial staff comments + 20-30 days for amendments = <strong>60 to 75 days total</strong>).</li>
                  <li>• <strong>Qualifying Criteria:</strong> Underlying asset must trade on a market with CFTC futures, Intermarket Surveillance Group (ISG) tracking, standard cold-storage custody, and no novel staking components.</li>
                </ul>
              </div>

              <div className="bg-[#0b0b0b] border border-amber-500/40 rounded-xl p-3.5 space-y-2">
                <div className="font-bold text-amber-300 flex items-center gap-1.5 text-xs">
                  <span>🏛️ 240-Day Full Review (Section 19(b) Statutory Clock)</span>
                </div>
                <ul className="space-y-1.5 text-[11px] text-[#aaaaaa]">
                  <li>• <strong>Mandatory for Staking Products:</strong> Any fund that passes validator staking yield to investors (e.g. Solana/Ethereum Staking, Grayscale Hyperliquid) cannot use generic standards.</li>
                  <li>• <strong>Mandatory for Multi-Asset Baskets:</strong> Composite index funds (like Bitwise 10) require full Section 19(b) reviews.</li>
                  <li>• <strong>Hard 240-Day Legal Deadline:</strong> 45d first review → 90d proceedings → 180d rebuttal → 240d final order. The SEC cannot delay past Day 240.</li>
                </ul>
              </div>
            </div>

            <div className="text-[11px] text-[#888888] bg-[#0a0a0a] p-2.5 rounded-lg border border-[#1f1f1f]">
              🔍 <strong>Why Our Database Tracks Both:</strong> Applications submitted prior to the generic listing rollout or containing staking mechanisms continue to be tracked along their active Federal Register 240-day statutory countdowns, while standard single-commodity spot filings qualify for the accelerated 75-day S-1 window.
            </div>
          </div>

          {/* Section 5: What is Changing in 2025? */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              The 2025 Shift: Why Altcoin ETF Approvals Are Now Accelerated
            </h3>
            
            <div className="space-y-2">
              <div className="flex items-start gap-3 bg-[#121212] border border-[#202020] p-3 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">
                  1
                </div>
                <div>
                  <div className="font-bold text-white">CME Benchmark Reference Rates Established</div>
                  <p className="text-[11px] text-[#888888] mt-0.5">
                    CME CF Benchmark Reference Rates are now live for Solana (SOL), XRP, Litecoin (LTC), Chainlink (LINK), Cardano (ADA), Polkadot (DOT), Avalanche (AVAX), and Sui (SUI), establishing institutional pricing integrity.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-[#121212] border border-[#202020] p-3 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">
                  2
                </div>
                <div>
                  <div className="font-bold text-white">CFTC Commodity Classification (LTC, DOGE, BCH)</div>
                  <p className="text-[11px] text-[#888888] mt-0.5">
                    Litecoin, Dogecoin, and Bitcoin Cash are PoW decentralized protocols designated as non-security commodities by CFTC filings and Coinbase Derivatives certifications, giving them the highest approval probability (&gt;85%).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-[#121212] border border-[#202020] p-3 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">
                  3
                </div>
                <div>
                  <div className="font-bold text-white">Global Precedent in Europe and Canada</div>
                  <p className="text-[11px] text-[#888888] mt-0.5">
                    Spot ETPs for Solana, XRP, Chainlink, Polkadot, and diversified crypto baskets have traded safely on the SIX Swiss Exchange, Deutsche Börse, and Euronext for over 4 years without market failure.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-[#0b0b0b] border-t border-[#1e1e1e] p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-[#777777]">
            Source: U.S. Securities and Exchange Commission (SEC EDGAR) &amp; CFTC Rule 40.2
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold transition-colors"
          >
            Understood &bull; Close Explainer
          </button>
        </div>
      </div>
    </div>
  );
};
