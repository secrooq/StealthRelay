import { Key, Mail, ShieldCheck, Zap, EyeOff, RefreshCw, Globe, Lock } from "lucide-react";

export default function FeaturesPage() {
  const features = [
    {
      cat: "Cryptography",
      items: [
        { icon: Lock, title: "Quantum-Ready Vault", desc: "AES-256-GCM client-wrapped chunks. We possess ZERO access to your key derivation algorithms." },
        { icon: Key, title: "PGP / OpenPGP Bridge", desc: "Bring external public keys. We automate dynamic payload encryption at the edge before final delivery." }
      ]
    },
    {
      cat: "Communication",
      items: [
        { icon: Mail, title: "Infinite Aliases", desc: "Spawn randomized proxies instantly for each provider, neutralizing cross-site identity graphing." },
        { icon: Globe, title: "Custom Domain Matrix", desc: "Anchor your own domains. Enable Catch-All routines and regex pattern matching." }
      ]
    },
    {
      cat: "Counter-Intel",
      items: [
        { icon: EyeOff, title: "Pixel Decontamination", desc: "Incoming emails are scrubbed of hidden 1x1 tracking pixels and header exfiltration vectors." },
        { icon: RefreshCw, title: "Dynamic Rotation", desc: "Cycle active grid nodes automatically to degrade persistence targeting algorithms." }
      ]
    }
  ];

  return (
    <div className="w-full min-h-screen bg-transparent py-20 px-6 relative overflow-hidden selection:bg-[#d4af37]/30">
      <div className="max-w-5xl mx-auto relative z-10">
        
        <div className="mb-20">
          <h1 className="text-xs font-mono font-bold text-[#e5c158] uppercase tracking-[0.3em] mb-4 drop-shadow-[0_0_10px_rgba(212,175,55,0.2)]">Capability Ledger</h1>
          <h2 className="text-4xl md:text-6xl font-mono font-black uppercase text-white mb-6 tracking-tighter">Tactical Specs</h2>
          <p className="text-slate-400 font-mono max-w-2xl text-xs md:text-sm leading-relaxed uppercase tracking-wider">
            Total operational analysis of StealthRelay's defensive stack. Built upon edge compute nodes distributed for global sub-millisecond availability and robust evasion.
          </p>
        </div>

        <div className="space-y-16">
          {features.map((group, i) => (
            <div key={i} className="border-t border-white/10 pt-10">
              <h3 className="font-mono font-bold text-white text-sm tracking-[0.2em] uppercase mb-8 border-l-2 border-[#d4af37] pl-4">{group.cat}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {group.items.map((item, j) => (
                  <div key={j} className="bg-[#070709]/85 backdrop-blur-xl border border-white/10 p-6 rounded-xl group hover:border-[#d4af37]/40 transition-all duration-300 relative overflow-hidden">
                    {/* Reticle corner decoration */}
                    <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-white/10 group-hover:border-[#d4af37]/50 transition-colors" />
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-white/10 group-hover:border-[#d4af37]/50 transition-colors" />

                    <div className="w-10 h-10 bg-slate-950 border border-white/10 text-[#e5c158] flex items-center justify-center rounded-lg mb-4 group-hover:bg-[#d4af37] group-hover:text-black group-hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all duration-300">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <h4 className="text-white font-mono font-bold uppercase mb-2 text-base tracking-wide group-hover:text-[#e5c158] transition-colors">{item.title}</h4>
                    <p className="text-slate-400 font-mono text-xs md:text-sm leading-relaxed uppercase tracking-wider">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 bg-gradient-to-r from-[#d4af37]/10 via-[#d4af37]/5 to-transparent border border-[#d4af37]/30 p-8 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#d4af37]" />
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#d4af37]/30" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#d4af37]/30" />
          <div>
            <h4 className="text-white font-mono font-bold uppercase mb-1 tracking-wider">Ready for Implementation?</h4>
            <p className="text-[#e5c158]/70 font-mono text-[10px] uppercase tracking-widest">Activate your grid account in under 60 seconds.</p>
          </div>
          <a href="/relay" className="px-6 py-3.5 bg-[#d4af37] hover:bg-white text-black font-mono font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.25)] rounded-xl shrink-0 transition-all duration-300">
            Initialize Grid
          </a>
        </div>

      </div>
    </div>
  );
}
