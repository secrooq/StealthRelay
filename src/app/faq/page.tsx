export default function FAQPage() {
  const faqs = [
    {
      q: "What happens if I lose my vault passphrase?",
      a: "Structural Lock-Out. Our nodes never ingest your raw derivation material. If keys are lost, the local AES orchestration permanently renders current data chunks unreadable cipher-text. We CANNOT reset it."
    },
    {
      q: "Is custom domain deployment complicated?",
      a: "Negative. You configure static DNS pointers (MX and TXT) from your domain registrar to our edge infrastructure. Full integration activates in ~5 minutes."
    },
    {
      q: "Explain the 14-day latency wipe protocol.",
      a: "Operational hygiene. Abandoned drives are non-custodial liabilities. After 14 days of lapsed subscription without download action, automated forensic routines execute iterative overwrites of your block storage partition."
    },
    {
      q: "Can I forward from an alias to multiple mailboxes?",
      a: "Affirmative. High-rank tiers permit dynamic splitting where a singular mask aliases to numerous validated inbound fleet targets simultaneously."
    },
    {
      q: "Are incoming payloads scanned for content?",
      a: "Only for binary malware heuristics at the edge. We process data in ephemeral memory and destroy the runtime state immediately post-delivery. No logs are archived."
    }
  ];

  return (
    <div className="w-full min-h-screen bg-transparent py-20 px-6 font-mono relative overflow-hidden selection:bg-[#d4af37]/30">
      <div className="max-w-3xl mx-auto relative z-10">
        
        <div className="mb-16">
          <h1 className="text-xs font-bold text-[#e5c158] uppercase tracking-[0.3em] mb-4 drop-shadow-[0_0_10px_rgba(212,175,55,0.25)]">Standard Protocol</h1>
          <h2 className="text-3xl md:text-4xl font-mono font-black uppercase text-white mb-4 tracking-tighter">Combat Inquiries (FAQ)</h2>
          <p className="text-slate-400 text-xs md:text-sm uppercase tracking-wider leading-relaxed">Resolving primary deployment constraints and behavioral policies.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((f, i) => (
            <details key={i} className="group border border-white/10 bg-[#070709]/85 backdrop-blur-xl rounded-xl overflow-hidden shadow-2xl transition-all duration-300 hover:border-[#d4af37]/40 relative">
              {/* Corner reticle decorations inside FAQs */}
              <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-white/10 group-hover:border-[#d4af37]/40 transition-colors" />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-white/10 group-hover:border-[#d4af37]/40 transition-colors" />

              <summary className="flex items-center justify-between p-6 cursor-pointer select-none list-none outline-none">
                <span className="text-white font-mono font-bold text-xs md:text-sm uppercase tracking-wider group-hover:text-[#e5c158] transition-colors pr-4">{f.q}</span>
                <div className="text-slate-400 group-hover:text-[#e5c158] group-open:rotate-180 transition-transform duration-300 text-xs font-bold">
                  [+]
                </div>
              </summary>
              <div className="p-6 pt-0 text-xs md:text-sm text-slate-350 leading-relaxed border-t border-white/5 bg-slate-950/40">
                <div className="py-4 border-l-2 border-[#d4af37]/65 pl-4 uppercase tracking-wider text-slate-300 leading-loose italic">
                  {f.a}
                </div>
              </div>
            </details>
          ))}
        </div>

        <div className="mt-20 text-center">
          <p className="text-xs text-slate-400 uppercase tracking-widest mb-4">Direct operative support required?</p>
          <a href="mailto:info@stealthrelay.com" className="inline-block px-8 py-3.5 bg-[#d4af37] hover:bg-white text-black font-mono font-black text-xs uppercase tracking-widest rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.25)]">
            Open Distress Comms
          </a>
        </div>

      </div>
    </div>
  );
}
