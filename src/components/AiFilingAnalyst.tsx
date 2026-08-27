import React, { useState } from "react";
import { Sparkles, Bot, Send, ShieldAlert, FileText, CheckCircle, RefreshCw, HelpCircle } from "lucide-react";
import { ETFApplication } from "../types";

interface AiFilingAnalystProps {
  applications: ETFApplication[];
  selectedApplication?: ETFApplication | null;
}

export const AiFilingAnalyst: React.FC<AiFilingAnalystProps> = ({
  applications,
  selectedApplication,
}) => {
  const [selectedAppId, setSelectedAppId] = useState<string>(
    selectedApplication?.id || applications[0]?.id || ""
  );
  const [customPrompt, setCustomPrompt] = useState("");
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSimulated, setIsSimulated] = useState(false);

  // Chat Q&A state
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    {
      sender: "ai",
      text: "Hello! I am your SEC Crypto ETF Regulatory & Filings Analyst. Ask me about Form S-1 amendments, Rule 19b-4 statutory deadlines, CME futures correlation requirements, qualified cold-custody rules, or staking yield legal frameworks.",
    },
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const currentApp = applications.find((a) => a.id === selectedAppId) || applications[0];

  const handleGenerateAnalysis = async (presetQuery?: string) => {
    if (!currentApp) return;
    setIsLoading(true);
    setAnalysisResult(null);

    try {
      const response = await fetch("/api/ai/analyze-filing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenName: currentApp.tokenName,
          tokenSymbol: currentApp.tokenSymbol,
          issuer: currentApp.issuer,
          filingType: currentApp.filingType,
          status: currentApp.status,
          holdingsAmount: currentApp.tokensHeld.toLocaleString(),
          custodian: currentApp.custodian.name,
          filingDate: currentApp.statutoryDeadlines.filingDate,
          finalDeadline: currentApp.statutoryDeadlines.finalDeadline240d,
          customQuery: presetQuery || customPrompt,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setAnalysisResult(data.analysis);
        setIsSimulated(data.isSimulated || false);
      } else {
        setAnalysisResult(`Analysis error: ${data.error || "Unable to process request."}`);
      }
    } catch (err: any) {
      setAnalysisResult(`Network error: ${err.message || "Failed to reach backend analysis server."}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userText = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setIsChatLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          context: `Selected Fund: ${currentApp.fundName} (${currentApp.tokenSymbol}), Issuer: ${currentApp.issuer}, Status: ${currentApp.status}, Next Deadline: ${currentApp.statutoryDeadlines.nextDeadlineDate}`,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setChatMessages((prev) => [...prev, { sender: "ai", text: data.reply }]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          { sender: "ai", text: "Unable to process response from regulatory server." },
        ]);
      }
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        { sender: "ai", text: `Connection error: ${err.message}` },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0f0f0f] border border-[#1e1e1e] rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-900 text-[#cccccc] border border-[#2a2a2a] mb-3">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Powered by Gemini 3.7 Flash & Securities Regulatory Engine
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              AI SEC Filing & Legal Precedent Analyst
            </h2>
            <p className="text-xs text-[#888888] mt-1 max-w-2xl">
              Conduct instant institutional-grade legal due diligence on any Form S-1 or Form 19b-4 filing. Evaluate Howey test exposure, CME futures liquidity correlation, cold storage compliance, and 240-day approval probability.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#888888] font-medium">Target Filing:</span>
            <select
              value={selectedAppId}
              onChange={(e) => setSelectedAppId(e.target.value)}
              aria-label="Select Target ETF Filing for AI Legal Analysis"
              className="px-3 py-2 bg-[#181818] border border-[#2a2a2a] rounded-xl text-[#e0e0e0] text-xs font-medium focus:outline-none focus:border-purple-400"
            >
              {applications.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.issuer} - {a.fundName} ({a.tokenSymbol})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Analysis Engine Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Preset Queries & Generation Trigger */}
        <div className="space-y-4">
          <div className="bg-[#0f0f0f] border border-[#1e1e1e] rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-400" />
              <span>Target Application Details</span>
            </h3>

            {currentApp && (
              <div className="bg-[#080808] rounded-xl p-3.5 border border-[#1c1c1c] text-xs space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-[#888888]">Trust Name:</span>
                  <span className="font-semibold text-white truncate max-w-[170px]">{currentApp.fundName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#888888]">Issuer / Sponsor:</span>
                  <span className="font-semibold text-[#cccccc]">{currentApp.issuer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#888888]">Underlying Token:</span>
                  <span className="font-semibold text-white">{currentApp.tokenName} ({currentApp.tokenSymbol})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#888888]">SEC Form / CIK:</span>
                  <span className="font-mono text-[#cccccc]">{currentApp.filingType} &bull; {currentApp.secEdgar.cik}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#888888]">Custodian:</span>
                  <span className="text-[#cccccc] truncate max-w-[160px]">{currentApp.custodian.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#888888]">Statutory Deadline:</span>
                  <span className="font-mono text-amber-400 font-semibold">{currentApp.statutoryDeadlines.finalDeadline240d}</span>
                </div>
              </div>
            )}

            <div className="text-xs font-bold text-[#cccccc] mb-2">Quick Due-Diligence Presets:</div>
            <div className="space-y-2">
              <button
                onClick={() => handleGenerateAnalysis("Evaluate SEC statutory approval probability and legal precedents under Exchange Act Section 6(b)(5).")}
                disabled={isLoading}
                className="w-full text-left p-2.5 rounded-xl bg-[#080808] hover:bg-[#181818] border border-[#1e1e1e] hover:border-[#2a2a2a] text-xs text-[#cccccc] hover:text-white transition-colors disabled:opacity-50"
              >
                ⚖️ <strong>Approval Odds & SEC Precedent</strong>
                <p className="text-[10px] text-[#888888] mt-0.5">Assesses Grayscale v. SEC & CME futures correlation benchmark.</p>
              </button>

              <button
                onClick={() => handleGenerateAnalysis("Analyze Howey Test classification and whether this token is legally established as a non-security commodity.")}
                disabled={isLoading}
                className="w-full text-left p-2.5 rounded-xl bg-[#080808] hover:bg-[#181818] border border-[#1e1e1e] hover:border-[#2a2a2a] text-xs text-[#cccccc] hover:text-white transition-colors disabled:opacity-50"
              >
                🔍 <strong>Howey Test & Commodity Status</strong>
                <p className="text-[10px] text-[#888888] mt-0.5">Examines Ripple/Torres ruling, decentralization, & CFTC scope.</p>
              </button>

              <button
                onClick={() => handleGenerateAnalysis("Assess native validator staking yield mechanics, liquidity lockup risk, and Form S-1/A amendment disclosures.")}
                disabled={isLoading}
                className="w-full text-left p-2.5 rounded-xl bg-[#080808] hover:bg-[#181818] border border-[#1e1e1e] hover:border-[#2a2a2a] text-xs text-[#cccccc] hover:text-white transition-colors disabled:opacity-50"
              >
                ⚡ <strong>Staking Yield Legality & Liquidity</strong>
                <p className="text-[10px] text-[#888888] mt-0.5">Reviews validator delegation rules and Investment Company Act risk.</p>
              </button>

              <button
                onClick={() => handleGenerateAnalysis("Simulate 30-day institutional capital inflows and token circulating supply absorption if approved.")}
                disabled={isLoading}
                className="w-full text-left p-2.5 rounded-xl bg-[#080808] hover:bg-[#181818] border border-[#1e1e1e] hover:border-[#2a2a2a] text-xs text-[#cccccc] hover:text-white transition-colors disabled:opacity-50"
              >
                📊 <strong>Supply Absorption & Inflow Model</strong>
                <p className="text-[10px] text-[#888888] mt-0.5">Calculates projected fund flows vs. daily liquid market float.</p>
              </button>
            </div>

            {/* Custom Query Input */}
            <div className="mt-4 pt-3 border-t border-[#1e1e1e]">
              <label className="text-xs font-semibold text-[#888888] block mb-1.5">
                Custom Regulatory Question:
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g., What are the main risk factors listed in Item 1A of this S-1 filing?..."
                rows={2}
                className="w-full p-2.5 bg-[#080808] border border-[#1e1e1e] rounded-xl text-xs text-[#e0e0e0] placeholder-[#666666] focus:outline-none focus:border-purple-500 mb-2"
              />
              <button
                onClick={() => handleGenerateAnalysis()}
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 text-purple-200 border border-purple-500/40 text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing Filing Documents...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Run Full SEC Due-Diligence Brief</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Center & Right Columns: Analysis Output & Interactive Chat */}
        <div className="lg:col-span-2 space-y-4">
          {/* Analysis Dossier Card */}
          <div className="bg-[#0f0f0f] border border-[#1e1e1e] rounded-2xl p-5 shadow-sm min-h-[360px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#1e1e1e]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      SEC Legal & Regulatory Intelligence Report
                    </h3>
                    <div className="text-[11px] text-[#888888]">
                      Subject: {currentApp?.fundName} ({currentApp?.tokenSymbol})
                    </div>
                  </div>
                </div>

                {isSimulated && (
                  <span className="text-[10px] text-amber-400 font-mono bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                    Simulated Reference Brief
                  </span>
                )}
              </div>

              {isLoading ? (
                <div className="py-16 text-center">
                  <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-3" />
                  <p className="text-sm font-semibold text-[#e0e0e0]">
                    Extracting SEC EDGAR filing disclosures & legal precedents...
                  </p>
                  <p className="text-xs text-[#888888] mt-1">
                    Evaluating Rule 19b-4 statutory calendar, custodian agreements, and CFTC jurisdictional rulings.
                  </p>
                </div>
              ) : analysisResult ? (
                <div className="prose prose-invert prose-xs max-w-none text-xs text-[#cccccc] leading-relaxed space-y-3 max-h-[420px] overflow-y-auto pr-2">
                  <div className="whitespace-pre-line">{analysisResult}</div>
                </div>
              ) : (
                <div className="py-14 text-center text-[#888888]">
                  <FileText className="w-10 h-10 text-[#444444] mx-auto mb-2.5" />
                  <p className="text-sm font-semibold text-[#cccccc]">
                    No active brief generated yet
                  </p>
                  <p className="text-xs text-[#666666] mt-1 max-w-md mx-auto">
                    Click any due-diligence preset on the left or enter a custom regulatory prompt to generate an institutional filing analysis.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Regulatory Q&A Terminal */}
          <div className="bg-[#0f0f0f] border border-[#1e1e1e] rounded-2xl p-5 shadow-sm">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-purple-400" />
              <span>Interactive SEC Regulatory Q&A</span>
            </h4>

            {/* Chat message history */}
            <div className="bg-[#080808] rounded-xl p-3 border border-[#1c1c1c] max-h-[180px] overflow-y-auto space-y-2.5 mb-3 text-xs">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`p-2.5 rounded-xl max-w-[85%] leading-relaxed ${
                    msg.sender === "user"
                      ? "ml-auto bg-[#181818] text-white border border-[#2a2a2a] font-medium"
                      : "mr-auto bg-[#111111] text-[#cccccc] border border-[#1e1e1e]"
                  }`}
                >
                  <div className="text-[10px] text-[#888888] mb-0.5 font-bold">
                    {msg.sender === "user" ? "You" : "SEC Regulatory Intelligence"}
                  </div>
                  <div>{msg.text}</div>
                </div>
              ))}
              {isChatLoading && (
                <div className="text-xs text-purple-400 animate-pulse flex items-center gap-1.5 p-2">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Formulating regulatory legal guidance...</span>
                </div>
              )}
            </div>

            {/* Chat input form */}
            <form onSubmit={handleSendChat} className="flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about SEC 19b-4 rules, CME futures benchmarks, staking liquidity..."
                className="flex-1 px-3.5 py-2 bg-[#080808] border border-[#1e1e1e] rounded-xl text-xs text-[#e0e0e0] placeholder-[#666666] focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                disabled={isChatLoading || !chatInput.trim()}
                className="px-3.5 py-2 rounded-xl bg-purple-950/80 hover:bg-purple-900 text-purple-200 border border-purple-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Send className="w-3 h-3" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
