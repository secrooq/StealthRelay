import Link from "next/link";
import { Shield, Eye, ShieldAlert, Cpu, Lock, Coins, ShieldCheck, FileSearch, Building2, HelpCircle } from "lucide-react";

export const metadata = {
  title: "Target Verticals & Sectors | StealthRelay Sovereign Fields",
  description: "Explore the custom threat matrices and zero-knowledge defensive shields deployed for cybersecurity teams, Web3 traders, law enforcement, and defense contractors.",
};

export default function IndustriesPage() {
  const sectors = [
    {
      icon: Cpu,
      name: "Cybersecurity & Pen Testers",
      vector: "Static payload trace & logging metadata breaches.",
      shield: "Secure dynamic exit IP nodes and memory-only attachment sanitizing. RED-teams can transmit sterilized packages to clients without static logging footprints."
    },
    {
      icon: Coins,
      name: "Crypto & Web3 Traders",
      vector: "High-value spear-phishing, SIM swaps, and target profiling.",
      shield: "Decouple your identity entirely. Dynamic email masks lock vectors per-service, preventing database breaches from exposing your primary addresses, while Zero-Knowledge storage safeguards seed phrases and offline backup keys."
    },
    {
      icon: Building2,
      name: "Aerospace & Defense",
      vector: "Digital espionage and trade secret leaks targeting communication lines.",
      shield: "Enforce local RAM encryption. Export-controlled blueprints (ITAR/EAR compliance layouts) are encrypted locally inside client-side RAM before upload, blocking third-party exfiltration."
    },
    {
      icon: FileSearch,
      name: "Law Enforcement & Forensics",
      vector: "Compromised intelligence drops and active custody link leaks.",
      shield: "Sterile dropboxes for anonymous inbound tips. Links auto-scrub from memory upon reading, ensuring complete metadata sterilization and absolute informant privacy."
    },
    {
      icon: Shield,
      name: "Legal & Journalism Counsel",
      vector: "Custodial subpoenas and metadata correlation exposing whistleblower sources.",
      shield: "Non-custodial intake lockers. Because we possess ZERO mathematical keys to your vault or dynamic shares, no subpoena can force the exfiltration of whistleblower identities."
    },
    {
      icon: Eye,
      name: "Digital Nomads & Freelancers",
      vector: "Cross-border tracking and automated digital identity profiling.",
      shield: "Consolidated custom domain networks. Manage dynamic forwarding catch-all rules and custom domains, neutralizing multi-site tracking."
    }
  ];

  return (
    <div className="w-full min-h-screen bg-transparent py-24 px-6 relative overflow-hidden selection:bg-[#d4af37]/30">
      {/* Dynamic radial glow backgrounds */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.035),transparent_70%)] pointer-events-none" />
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-[#d4af37]/[0.015] rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Header Section */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#d4af37]/20 bg-[#d4af37]/5 text-[#e5c158] font-mono text-[10px] uppercase tracking-[0.2em] mb-4">
            🛡️ VERTICAL SECTORS // OPERATIONAL TARGETS
          </div>
          <h1 className="text-4xl md:text-6xl font-mono font-black uppercase text-white tracking-tighter mb-6 leading-none">
            WHO WE <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] to-[#e5c158]">SERVE</span> &amp; DEPLOY FOR
          </h1>
          <p className="text-slate-400 font-mono max-w-3xl mx-auto text-xs md:text-sm leading-relaxed uppercase tracking-wider">
            Custom cryptographic shields configured to immunize high-stakes fields against data exposure. From Red-team payloads to sovereign defense blueprints, we deliver absolute non-custodial protection.
          </p>
        </div>

        {/* Sectors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {sectors.map((sector, i) => (
            <div 
              key={i} 
              className="bg-[#070709]/85 backdrop-blur-xl border border-white/10 hover:border-[#d4af37]/45 p-8 rounded-2xl relative overflow-hidden transition-all duration-300 group"
            >
              {/* Tactical reticle markers */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-white/10 group-hover:border-[#d4af37]/50" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-white/10 group-hover:border-[#d4af37]/50" />

              <div className="w-12 h-12 bg-slate-950 border border-white/10 rounded-xl flex items-center justify-center text-[#e5c158] mb-6 group-hover:bg-[#d4af37] group-hover:text-black group-hover:shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all">
                <sector.icon className="w-6 h-6" />
              </div>

              <h2 className="text-lg font-mono font-bold text-white uppercase mb-4 tracking-wide group-hover:text-[#e5c158] transition-colors">
                {sector.name}
              </h2>

              <div className="space-y-4 text-left font-mono">
                <div>
                  <span className="text-[9px] uppercase tracking-widest text-red-400 font-bold block mb-1">☠ Threat Vector</span>
                  <p className="text-[11px] text-slate-400 uppercase leading-relaxed">{sector.vector}</p>
                </div>
                <div className="border-t border-white/5 pt-3">
                  <span className="text-[9px] uppercase tracking-widest text-emerald-400 font-bold block mb-1">🛡 Zero-Knowledge Shield</span>
                  <p className="text-[11px] text-slate-350 uppercase leading-relaxed">{sector.shield}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Dynamic Architectural Section */}
        <div className="bg-neutral-950/70 border border-white/5 p-8 rounded-2xl text-left relative overflow-hidden mb-20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4af37]/[0.02] rounded-bl-full pointer-events-none" />
          <h2 className="text-lg font-mono font-bold text-[#e5c158] uppercase tracking-wider mb-4">Sovereign Compliance &amp; Regulatory Shielding</h2>
          <p className="text-xs md:text-sm text-slate-400 font-mono leading-relaxed uppercase tracking-widest leading-loose">
            Whether you are subject to HIPAA regulations, GDPR compliance rules, or strict federal ITAR export controls, StealthRelay provides a powerful regulatory shield. By executing 100% of data encryption locally in client browser memory (RAM), no unencrypted payload ever traverses our routing grid or server nodes, completely bypassing custodial risk audits.
          </p>
        </div>

        {/* BOTTOM CTA */}
        <div className="bg-gradient-to-r from-[#d4af37]/10 via-[#d4af37]/5 to-transparent border border-[#d4af37]/30 p-8 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#d4af37]" />
          <div>
            <h4 className="text-white font-mono font-bold uppercase mb-1 tracking-wider">Ready to secure your dynamic target vectors?</h4>
            <p className="text-[#e5c158]/70 font-mono text-[10px] uppercase tracking-widest">Activate your dynamic consolidated security suite immediately.</p>
          </div>
          <Link href="/pricing" className="px-6 py-3.5 bg-[#d4af37] hover:bg-white text-black font-mono font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(212,175,55,0.2)] rounded-xl transition-all duration-300">
            Secure Account
          </Link>
        </div>

      </div>

      {/* JSON-LD Schema markup for AEO/GEO engine discovery */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "StealthRelay Target Industries",
            "description": "Explores zero-knowledge security grids tailored for crypto traders, Red-team pen-testers, law enforcement tips dropboxes, and aerospace defense contractors.",
            "publisher": {
              "@type": "Organization",
              "name": "StealthRelay"
            }
          })
        }}
      />
    </div>
  );
}
