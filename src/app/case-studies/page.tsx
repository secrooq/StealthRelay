import { FileText, Fingerprint, ShieldAlert } from "lucide-react";

export default function CaseStudiesPage() {
  const studies = [
    {
      title: "OP: SILENT WHISTLE",
      actor: "Investigative Syndicate",
      threat: "State-sponsored surveillance interception",
      outcome: "Successfully routed 5,000+ classified intake documents through transient StealthSecrets without creating persistent inode records on centralized infrastructure.",
      tag: "REDACTED CLEARANCE"
    },
    {
      title: "OP: CLOUD LEAK CONTAINMENT",
      actor: "Fortune 500 Fintech",
      threat: "Automated credential harvesting via phishing",
      outcome: "Implemented distinct alias matrix for every B2B vendor. Blocked cascading lateral movement after Vendor Z suffered a complete SMTP hijack.",
      tag: "CONFIDENTIAL"
    },
    {
      title: "OP: DARK ARCHIVE",
      actor: "Defense Contractor",
      threat: "Forensic disk analysis on seized devices",
      outcome: "Utilized StealthBox Vault with browser-side derived keys. Client keys vaporized on session close, yielding zero actionable intelligence to extraction rigs.",
      tag: "TOP SECRET"
    }
  ];

  return (
    <div className="w-full min-h-screen bg-transparent py-20 px-6 font-mono relative overflow-hidden selection:bg-[#d4af37]/30">
      <div className="max-w-5xl mx-auto relative z-10">
        
        <div className="mb-16 border-b border-white/10 pb-10">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-[#e5c158] uppercase tracking-[0.25em] mb-4 drop-shadow-[0_0_10px_rgba(212,175,55,0.3)]">
            <ShieldAlert className="w-4 h-4 animate-pulse" /> Classified Logs
          </div>
          <h1 className="text-4xl font-black uppercase text-white tracking-tighter mb-6">Mission Briefings</h1>
          <p className="text-slate-400 text-xs md:text-sm leading-relaxed max-w-xl uppercase tracking-wider">
            Field deployment analyses detailing live operational utility. 
            Identity datasets have been sanitized for operative protection.
          </p>
        </div>

        <div className="space-y-12">
          {studies.map((log, idx) => (
            <div key={idx} className="relative rounded-2xl border border-white/10 bg-[#070709]/85 backdrop-blur-xl p-8 shadow-2xl transition-all duration-500 hover:border-[#d4af37]/40 relative overflow-hidden group">
              {/* Tactical reticle scope indicators */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#d4af37]/30 group-hover:border-[#d4af37] transition-colors" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[#d4af37]/30 group-hover:border-[#d4af37] transition-colors" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-[#d4af37]/30 group-hover:border-[#d4af37] transition-colors" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#d4af37]/30 group-hover:border-[#d4af37] transition-colors" />

              <div className="absolute top-4 right-4 px-2.5 py-0.5 border border-white/10 text-[10px] text-slate-400 font-mono tracking-widest uppercase rounded bg-slate-950/80">
                LOG_ID: SR-{10300 + idx * 482}
              </div>
              
              <div className="mt-4">
                <div className="flex items-center gap-2 text-[#e5c158] text-xs font-bold mb-6 tracking-widest uppercase">
                  <Fingerprint className="w-4 h-4 text-[#e5c158] drop-shadow-[0_0_8px_rgba(212,175,55,0.3)] animate-pulse" /> [{log.tag}]
                </div>
                
                <h2 className="text-2xl font-black text-white mb-6 tracking-wide uppercase group-hover:text-[#e5c158] transition-colors">{log.title}</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6 border-t border-white/5 pt-6">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Operative Type</p>
                    <p className="text-white text-xs md:text-sm uppercase tracking-wider">{log.actor}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Threat Vector</p>
                    <p className="text-red-400/80 text-xs md:text-sm uppercase tracking-wider">{log.threat}</p>
                  </div>
                </div>

                <div className="bg-slate-950/60 border-l-2 border-[#d4af37] p-5 rounded-r-xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#d4af37]/[0.02] to-transparent pointer-events-none" />
                  <p className="text-[10px] text-[#e5c158]/70 uppercase tracking-widest mb-2 font-bold">Resolution Analysis</p>
                  <p className="text-slate-300 text-xs md:text-sm leading-relaxed uppercase tracking-wider italic">"{log.outcome}"</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 flex justify-center">
          <div className="px-8 py-4 border border-dashed border-white/10 hover:border-[#d4af37]/30 text-slate-400 font-mono text-xs uppercase tracking-[0.25em] bg-[#070709]/60 backdrop-blur-md rounded-xl transition-all duration-300">
            -- END OF SANITIZED LOGS --
          </div>
        </div>

      </div>
    </div>
  );
}
