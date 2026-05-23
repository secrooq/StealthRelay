import { Check, X, Scale } from "lucide-react";

export default function ComparePage() {
  const comparisonData = [
    { feature: "Client-Derived Key Vault", stealth: true, simple: false, addy: false, duck: false },
    { feature: "Transient 'Burn' Payload Links", stealth: true, stealthComment: "Embedded integration", simple: false, addy: false, duck: false },
    { feature: "Edge-Side D1 Routing", stealth: true, stealthComment: "<10ms latency", simple: false, addy: false, duck: false },
    { feature: "Unlimited Aliases", stealth: true, simple: true, addy: true, duck: true },
    { feature: "PGP Auto-Bridge", stealth: true, simple: true, addy: true, duck: false },
    { feature: "Non-Custodial Storage", stealth: true, simple: false, addy: false, duck: false },
    { feature: "Memory-Only Forensics", stealth: true, simple: false, addy: false, duck: false },
  ];

  const competitors = [
    { name: "SimpleLogin", tag: "Custodial" },
    { name: "AnonAddy / Addy.io", tag: "Custodial" },
    { name: "Duck Email", tag: "Proprietary" },
  ];

  return (
    <div className="w-full min-h-screen bg-transparent py-20 px-6 font-mono relative overflow-hidden selection:bg-[#d4af37]/30">
      <div className="max-w-6xl mx-auto relative z-10">
        
        <div className="text-center mb-20">
          <Scale className="w-12 h-12 text-[#e5c158] mx-auto mb-6 drop-shadow-[0_0_15px_rgba(212,175,55,0.3)] animate-pulse" />
          <h1 className="text-xs font-bold text-[#e5c158] uppercase tracking-[0.3em] mb-4 drop-shadow-[0_0_10px_rgba(212,175,55,0.2)]">Tactical Assessment</h1>
          <h2 className="text-4xl md:text-5xl font-mono font-black uppercase text-white mb-6 tracking-tighter">Grid Comparison</h2>
          <p className="text-slate-400 text-xs md:text-sm max-w-2xl mx-auto leading-relaxed uppercase tracking-wider">
            Comparative forensic layout examining functional parity vs legacy custodian ecosystems. 
            While rivals provide masking, StealthRelay delivers total tactical zero-knowledge logic.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#070709]/85 backdrop-blur-xl shadow-2xl relative">
          {/* Cyber reticle scope decorations */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#d4af37]/30" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[#d4af37]/30" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-[#d4af37]/30" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#d4af37]/30" />

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="py-6 px-6 text-xs md:text-sm text-slate-300 font-bold uppercase tracking-wider w-1/3">Operational Metric</th>
                <th className="py-6 px-6 text-center bg-[#d4af37]/5 relative">
                  <div className="absolute inset-0 border-x border-[#d4af37]/20 bg-[#d4af37]/[0.02]" />
                  <span className="text-[#e5c158] font-black uppercase tracking-[0.15em] text-xs md:text-sm drop-shadow-[0_0_10px_rgba(212,175,55,0.35)]">StealthRelay</span>
                </th>
                {competitors.map((c, i) => (
                  <th key={i} className="py-6 px-6 text-center text-slate-400 font-bold uppercase text-xs tracking-wider">
                    {c.name}
                    <div className="text-[10px] text-slate-500 font-mono tracking-widest mt-1.5 uppercase">{c.tag}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((row, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                  <td className="py-5 px-6 text-xs md:text-sm text-slate-300 uppercase tracking-wider font-semibold">{row.feature}</td>
                  <td className="py-5 px-6 bg-[#d4af37]/5 text-center relative">
                    <div className="absolute inset-y-0 left-0 w-[1px] bg-[#d4af37]/20" />
                    <div className="absolute inset-y-0 right-0 w-[1px] bg-[#d4af37]/20" />
                    <div className="flex flex-col items-center">
                      <Check className="w-4 h-4 text-[#e5c158] mx-auto drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]" />
                      {row.stealthComment && <span className="text-[10px] text-[#e5c158]/70 mt-1 uppercase font-bold tracking-widest">{row.stealthComment}</span>}
                    </div>
                  </td>
                  <td className="py-5 px-6 text-center">
                    {row.simple ? <Check className="w-4 h-4 text-slate-400 mx-auto" /> : <X className="w-4 h-4 text-red-500/20 mx-auto" />}
                  </td>
                  <td className="py-5 px-6 text-center">
                    {row.addy ? <Check className="w-4 h-4 text-slate-400 mx-auto" /> : <X className="w-4 h-4 text-red-500/20 mx-auto" />}
                  </td>
                  <td className="py-5 px-6 text-center">
                    {row.duck ? <Check className="w-4 h-4 text-slate-400 mx-auto" /> : <X className="w-4 h-4 text-red-500/20 mx-auto" />}
                  </td>
                </tr>
              ))}
              {/* Highlighted column closure */}
              <tr>
                <td />
                <td className="h-[2px] bg-[#d4af37]/20 p-0" />
                <td colSpan={3} />
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-12 bg-[#070709] border border-dashed border-white/10 p-6 rounded-2xl text-center text-xs text-slate-400 uppercase tracking-widest leading-loose">
          Conclusion: Competitor platforms utilize centralized custodial DB storage for transient meta. StealthRelay enforces strict decentralized edge-origin routing protocols.
        </div>

        {/* 3-IN-1 CONSOLIDATION METRIC WIDGET */}
        <div className="mt-16 relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#d4af37]/15 to-transparent rounded-2xl blur-lg opacity-30 pointer-events-none" />
          
          <div className="relative bg-[#070709]/95 border border-[#d4af37]/20 p-8 rounded-2xl">
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#d4af37]/40" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#d4af37]/40" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#d4af37]/40" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#d4af37]/40" />

            <div className="flex flex-col lg:flex-row items-center gap-8 justify-between">
              <div className="text-left max-w-xl">
                <span className="text-[10px] font-mono text-[#e5c158] font-bold uppercase tracking-[0.25em] block mb-2">Architectural Procurement Savings</span>
                <h3 className="text-xl md:text-2xl font-mono font-black uppercase text-white tracking-wider mb-3">Consolidate &amp; Save Over 50% Annually</h3>
                <p className="text-xs md:text-sm text-slate-400 font-sans leading-relaxed">
                  Managing three separate accounts (SimpleLogin, NordLocker, and WeTransfer Pro) scatters your billing, introduces multi-service credential weaknesses, and aggregates to over <strong>$245 - $359+/year</strong>. StealthRelay integrates all three systems seamlessly under one client-side key envelope starting at just <strong>$15/month ($180/year)</strong>.
                </p>
              </div>

              <div className="w-full lg:w-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-center border-t lg:border-t-0 lg:border-l border-white/10 pt-6 lg:pt-0 lg:pl-8 shrink-0">
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 font-mono">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 block mb-1">Email Aliases</span>
                  <span className="text-slate-300 font-bold text-xs">$30 - $71/yr</span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 font-mono">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 block mb-1">Secure Vault</span>
                  <span className="text-slate-300 font-bold text-xs">$95 - $144/yr</span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 font-mono">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 block mb-1">Secure Sharing</span>
                  <span className="text-slate-300 font-bold text-xs">$120 - $144/yr</span>
                </div>
                <div className="p-3 bg-[#d4af37]/10 rounded-xl border border-[#d4af37]/30 font-mono">
                  <span className="text-[9px] uppercase tracking-wider text-[#e5c158] font-black block mb-1">StealthRelay</span>
                  <span className="text-[#e5c158] font-black text-xs">$180/yr</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 text-left flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-mono">
              <span className="text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                ⚡ Net Operative Savings: Up to $179.00 / year &amp; 100% Client-side cryptography
              </span>
              <a 
                href="/pricing" 
                className="px-4 py-2 bg-[#d4af37] text-black font-bold uppercase tracking-widest text-[10px] rounded hover:bg-white transition"
              >
                Secure Unified Account
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
