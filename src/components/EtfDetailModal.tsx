import React, { useState } from "react";
import {
  X,
  ExternalLink,
  ShieldCheck,
  Vault,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Sparkles,
  Building2,
  FileText,
  Calendar,
  Lock,
  Layers,
  Coins,
  Star,
} from "lucide-react";
import { ETFApplication } from "../types";

interface EtfDetailModalProps {
  application: ETFApplication | null;
  onClose: () => void;
  onAnalyzeAi: (app: ETFApplication) => void;
  isStarred?: boolean;
  onToggleWatchlist?: (id: string) => void;
}

export const EtfDetailModal: React.FC<EtfDetailModalProps> = ({
  application,
  onClose,
  onAnalyzeAi,
  isStarred = false,
  onToggleWatchlist,
}) => {
  const [copiedAccession, setCopiedAccession] = useState(false);
  const [copiedCik, setCopiedCik] = useState(false);

  if (!application) return null;

  const handleCopy = (text: string, type: "accession" | "cik") => {
    navigator.clipboard.writeText(text);
    if (type === "accession") {
      setCopiedAccession(true);
      setTimeout(() => setCopiedAccession(false), 2000);
    } else {
      setCopiedCik(true);
      setTimeout(() => setCopiedCik(false), 2000);
    }
  };

  const isApproved = application.status === "Approved & Trading";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0f0f0f] border border-[#1e1e1e] rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl my-8 relative animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-[#080808] px-6 py-5 border-b border-[#1c1c1c] flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#181818] border border-[#2a2a2a] flex items-center justify-center p-1 font-bold text-white text-base">
              {application.tokenSymbol}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-white">{application.fundName}</h2>
                <span className="px-2 py-0.5 rounded bg-[#181818] text-[#cccccc] border border-[#262626] text-xs font-mono font-bold">
                  {application.ticker} &bull; {application.exchange}
                </span>
                {application.stakingEnabled && (
                  <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-semibold">
                    Staking Yield Active
                  </span>
                )}
              </div>
              <p className="text-xs text-[#888888] mt-0.5">
                Applicant Sponsor: <strong className="text-[#e0e0e0]">{application.issuer}</strong> &bull; Sponsor Fee:{" "}
                <strong className="text-[#e0e0e0]">{application.sponsorFeePercentage}%</strong>
                {application.feeWaiverPeriod && (
                  <span className="text-emerald-400 ml-1">({application.feeWaiverPeriod})</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleWatchlist && onToggleWatchlist(application.id)}
              title={isStarred ? "Remove from Starred Watchlist" : "Add to Starred Watchlist"}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                isStarred
                  ? "bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25"
                  : "bg-[#181818] text-[#aaaaaa] hover:text-amber-400 border-[#2a2a2a] hover:bg-[#222222]"
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${isStarred ? "fill-amber-400 text-amber-400" : ""}`} />
              <span className="hidden sm:inline">{isStarred ? "Starred" : "Watchlist"}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#181818] hover:bg-[#222222] text-[#888888] hover:text-white border border-[#2a2a2a] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#080808] p-3.5 rounded-2xl border border-[#1c1c1c]">
              <div className="text-[#888888] text-[11px]">Underlying Asset Price</div>
              <div className="text-base font-bold text-white font-mono mt-0.5">
                ${application.currentPriceUsd.toLocaleString()}
              </div>
              <div className={application.price24hChange >= 0 ? "text-emerald-400 text-[11px]" : "text-rose-400 text-[11px]"}>
                {application.price24hChange >= 0 ? "+" : ""}{application.price24hChange}% 24h
              </div>
            </div>

            <div className="bg-[#080808] p-3.5 rounded-2xl border border-[#1c1c1c]">
              <div className="text-[#888888] text-[11px]">Tokens Held in Custody</div>
              <div className="text-base font-bold text-[#e0e0e0] font-mono mt-0.5">
                {application.tokensHeld.toLocaleString()} {application.tokenSymbol}
              </div>
              <div className="text-emerald-400 text-[11px] font-semibold">
                ${(application.portfolioValueUsd / (application.portfolioValueUsd >= 1e9 ? 1e9 : 1e6)).toFixed(2)}
                {application.portfolioValueUsd >= 1e9 ? "B" : "M"} Reserve
              </div>
            </div>

            <div className="bg-[#080808] p-3.5 rounded-2xl border border-[#1c1c1c]">
              <div className="text-[#888888] text-[11px]">Approval Probability</div>
              <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">
                {application.approvalProbabilityPercentage}%
              </div>
              <div className="text-[#888888] text-[11px]">Precedent Index</div>
            </div>

            <div className="bg-[#080808] p-3.5 rounded-2xl border border-[#1c1c1c]">
              <div className="text-[#888888] text-[11px]">Next Decision Clock</div>
              <div className="text-base font-bold text-amber-400 font-mono mt-0.5">
                {isApproved ? "Approved" : `${application.statutoryDeadlines.daysRemaining} Days`}
              </div>
              <div className="text-[#888888] text-[11px] truncate">
                {isApproved ? "Live on Exchange" : application.statutoryDeadlines.nextDeadlineDate}
              </div>
            </div>
          </div>

          {/* Interactive Mini Price & Inflow Chart Section */}
          <div className="bg-[#080808] border border-[#1c1c1c] rounded-2xl p-4.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-purple-400" />
                <span>Price Discovery & Institutional Inflow Curve ({application.tokenSymbol})</span>
              </h4>
              <span className="text-[10px] text-emerald-400 font-mono font-semibold">
                Spot: ${application.currentPriceUsd.toLocaleString()} ({application.price24hChange >= 0 ? "+" : ""}{application.price24hChange}%)
              </span>
            </div>

            <div className="h-40 w-full pt-1">
              <div className="w-full h-full flex flex-col justify-end">
                {/* Visual Trading Price Curve SVG */}
                <svg className="w-full h-28 overflow-visible" viewBox="0 0 500 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="modalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 0,80 Q 50,75 100,60 T 200,45 T 300,55 T 400,25 T 500,15 L 500,100 L 0,100 Z"
                    fill="url(#modalGrad)"
                  />
                  <path
                    d="M 0,80 Q 50,75 100,60 T 200,45 T 300,55 T 400,25 T 500,15"
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="2.5"
                  />
                  <circle cx="500" cy="15" r="4" fill="#a855f7" stroke="#ffffff" strokeWidth="1.5" />
                </svg>

                <div className="flex items-center justify-between text-[10px] text-[#666666] pt-2 border-t border-[#1a1a1a]">
                  <span>30 Days Ago: ${(application.currentPriceUsd * 0.91).toFixed(2)}</span>
                  <span>15 Days Ago: ${(application.currentPriceUsd * 0.96).toFixed(2)}</span>
                  <span className="text-white font-semibold">Current: ${application.currentPriceUsd.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Statutory 240-Day Regulatory Timeline Progression */}
          <div className="bg-[#080808] border border-[#1c1c1c] rounded-2xl p-4.5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>SEC Regulatory Timeline &amp; Statutory Deadlines</span>
              </h4>
              
              <div className="flex items-center gap-1.5">
                {!application.stakingEnabled && application.tokenCategory !== "Multi-Asset Index" ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                    ⚡ 75-Day Fast-Track Eligible (Rule 19b-4(e))
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/25">
                    🏛️ 240-Day Full Review (Section 19(b)(2))
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-[#111111] p-3 rounded-xl border border-[#1e1e1e]">
                <div className="text-[#888888] text-[10px] uppercase font-semibold">Stage 1: 45-Day Review</div>
                <div className="font-mono text-[#e0e0e0] font-bold mt-1">
                  {application.statutoryDeadlines.firstDeadline45d}
                </div>
                <div className="text-[#666666] text-[10px] mt-0.5">Designate extension period</div>
              </div>

              <div className="bg-[#111111] p-3 rounded-xl border border-[#1e1e1e]">
                <div className="text-[#888888] text-[10px] uppercase font-semibold">Stage 2: 90-Day Review</div>
                <div className="font-mono text-[#e0e0e0] font-bold mt-1">
                  {application.statutoryDeadlines.secondDeadline90d}
                </div>
                <div className="text-[#666666] text-[10px] mt-0.5">Institute proceedings</div>
              </div>

              <div className="bg-[#111111] p-3 rounded-xl border border-[#1e1e1e]">
                <div className="text-[#888888] text-[10px] uppercase font-semibold">Stage 3: 180-Day Review</div>
                <div className="font-mono text-[#e0e0e0] font-bold mt-1">
                  {application.statutoryDeadlines.thirdDeadline180d}
                </div>
                <div className="text-[#666666] text-[10px] mt-0.5">Public rebuttal comments</div>
              </div>

              <div className="bg-[#111111] p-3 rounded-xl border border-emerald-500/20">
                <div className="text-emerald-400 text-[10px] uppercase font-bold">Stage 4: 240-Day Final</div>
                <div className="font-mono text-emerald-300 font-extrabold mt-1">
                  {application.statutoryDeadlines.finalDeadline240d}
                </div>
                <div className="text-emerald-400 text-[10px] mt-0.5">Final Statutory Order</div>
              </div>
            </div>
            
            <p className="text-[10px] text-[#666666]">
              {!application.stakingEnabled && application.tokenCategory !== "Multi-Asset Index"
                ? "💡 This trust meets generic commodity standards under Rule 19b-4(e), allowing expedited S-1 review (~60-75 days) without requiring a bespoke 19b-4 approval order."
                : "💡 Because this application includes staking yields or complex multi-asset indices, it requires full Section 19(b) statutory review (up to 240 days)."}
            </p>
          </div>

          {/* Custody & Security Infrastructure */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#080808] border border-[#1c1c1c] rounded-2xl p-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Vault className="w-3.5 h-3.5 text-emerald-400" />
                <span>Qualified Crypto Custody Vault</span>
              </h4>
              <div className="space-y-2 text-[#cccccc]">
                <div className="flex justify-between">
                  <span className="text-[#888888]">Custodian Entity:</span>
                  <span className="font-semibold text-white">{application.custodian.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#888888]">Cold-Storage Segregation:</span>
                  <span className="font-semibold text-emerald-400">{application.custodian.coldStoragePercentage}% Offline Vaults</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#888888]">Crime Insurance Coverage:</span>
                  <span className="font-mono text-[#e0e0e0] font-semibold">${application.custodian.insuranceCoverageMillionUsd} Million</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#888888]">Regulatory Jurisdiction:</span>
                  <span className="text-[#cccccc]">{application.custodian.jurisdiction}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#888888]">Cash Custodian & Admin:</span>
                  <span className="text-[#cccccc]">{application.cashCustodian}</span>
                </div>
              </div>
            </div>

            {/* Official SEC EDGAR Filing Identifiers */}
            <div className="bg-[#080808] border border-[#1c1c1c] rounded-2xl p-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>Official SEC EDGAR Filing Identifiers</span>
              </h4>
              <div className="space-y-2 text-[#cccccc]">
                <div className="flex justify-between items-center">
                  <span className="text-[#888888]">SEC EDGAR CIK:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-white font-bold">{application.secEdgar.cik}</span>
                    <button
                      onClick={() => handleCopy(application.secEdgar.cik, "cik")}
                      className="p-1 rounded bg-[#181818] hover:bg-[#222222] text-[#888888] hover:text-white border border-[#2a2a2a]"
                      title="Copy CIK"
                    >
                      {copiedCik ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#888888]">Accession Number:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[#cccccc] text-[11px]">{application.secEdgar.accessionNumber}</span>
                    <button
                      onClick={() => handleCopy(application.secEdgar.accessionNumber, "accession")}
                      className="p-1 rounded bg-[#181818] hover:bg-[#222222] text-[#888888] hover:text-white border border-[#2a2a2a]"
                      title="Copy Accession"
                    >
                      {copiedAccession ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#888888]">Form Registration Type:</span>
                  <span className="font-semibold text-white">{application.filingType}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#888888]">Surveillance Sharing Partner:</span>
                  <span className="text-[#e0e0e0]">{application.surveillanceSharingPartner}</span>
                </div>

                <div className="pt-1.5">
                  <a
                    href={application.secEdgar.officialUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-1.5 px-3 rounded-lg bg-[#181818] hover:bg-[#222222] text-[#e0e0e0] border border-[#2a2a2a] flex items-center justify-center gap-1.5 font-semibold transition-colors"
                  >
                    <span>View Official Form on SEC.gov</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Staking & Regulatory Highlights */}
          <div className="bg-[#080808] border border-[#1c1c1c] rounded-2xl p-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
              Regulatory Disclosures & Legal Arguments
            </h4>
            <ul className="space-y-1.5 text-[#cccccc] list-disc list-inside text-xs leading-relaxed">
              {application.regulatoryHighlights.map((highlight, i) => (
                <li key={i}>{highlight}</li>
              ))}
            </ul>

            {application.stakingEnabled && (
              <div className="mt-3 p-2.5 rounded-xl bg-[#141414] border border-[#242424] text-purple-200 text-xs flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                <span>
                  <strong>Staking Yield Provision:</strong> {application.stakingStatusNote} (Estimated {application.stakingYieldPercentage}% APY)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-[#080808] px-6 py-4 border-t border-[#1c1c1c] flex items-center justify-between">
          <div className="text-[11px] text-[#888888]">
            Last updated from official SEC records: {application.lastUpdated}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onAnalyzeAi(application);
              }}
              className="px-4 py-2 rounded-xl bg-purple-950/80 hover:bg-purple-900 text-purple-200 border border-purple-500/40 text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Launch AI Legal Analysis</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#181818] hover:bg-[#222222] text-[#cccccc] hover:text-white border border-[#2a2a2a] text-xs font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
