import type { Metadata } from "next";
import Image from "next/image";
import { Shield, EyeOff, Lock, Heart, Target } from "lucide-react";

export const metadata: Metadata = {
  title: "Our Ethos & Mission | Stealth Relay",
  description: "Discover the philosophy and architecture underpinning NextGen Zero-Knowledge Digital Immunity.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-transparent text-slate-200 flex flex-col items-center selection:bg-[#d4af37]/30 relative font-mono">
      <div className="max-w-6xl w-full px-6 py-24 md:py-32 relative z-10">
        
        {/* Heading / Ethos Intro */}
        <div className="flex flex-col items-center text-center mb-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#d4af37]/10 border border-[#d4af37]/20 rounded-full text-[#e5c158] text-xs font-semibold tracking-widest uppercase mb-6 drop-shadow-[0_0_8px_rgba(212,175,55,0.15)] animate-pulse">
            <Shield className="w-3.5 h-3.5" /> Operational Philosophy
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase text-white leading-none max-w-4xl mb-8 tracking-tighter">
            Digital Immunity <br /> As A Right
          </h1>
          <p className="text-sm md:text-base text-slate-400 leading-relaxed max-w-3xl uppercase tracking-wider">
            StealthRelay was built to restore the balance of power between users and central data silos. 
            By engineering mathematically-guaranteed Zero-Knowledge systems, we make privacy the default, not a luxury.
          </p>
        </div>

        {/* Our Tenets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
          {[
            {
              icon: EyeOff,
              title: "Absolute Secrecy",
              desc: "We don't ask for trust; we eliminate the need for it. Your payload is fully encrypted on your terminal before it ever hits our infrastructure.",
              accent: "border-[#d4af37]/20 text-[#e5c158]"
            },
            {
              icon: Target,
              title: "Modern Infrastructure",
              desc: "Built entirely on Cloudflare Edge and isolated D1 modules to ensure instant globally-distributed routing with zero data persistence.",
              accent: "border-[#d4af37]/20 text-[#e5c158]"
            },
            {
              icon: Lock,
              title: "Cryptographic Security",
              desc: "Powered by modern AES-256-GCM cryptography running strictly client-side in your browser runtime. The host never possesses the cipher keys.",
              accent: "border-white/10 text-slate-400"
            }
          ].map((tenet, idx) => (
            <div 
              key={idx}
              className="relative group border border-white/10 bg-[#070709]/85 backdrop-blur-xl rounded-2xl p-8 hover:border-[#d4af37]/40 hover:bg-[#070709]/95 transition-all duration-300 overflow-hidden shadow-2xl"
            >
              {/* Scope reticles */}
              <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-white/10 group-hover:border-[#d4af37]/50 transition-colors" />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-white/10 group-hover:border-[#d4af37]/50 transition-colors" />

              <div className={`w-12 h-12 rounded-xl border ${tenet.accent} flex items-center justify-center bg-slate-950 mb-6 group-hover:shadow-[0_0_15px_rgba(212,175,55,0.2)] transition-shadow duration-300`}>
                <tenet.icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider mb-3 group-hover:text-[#e5c158] transition-colors">
                {tenet.title}
              </h3>
              <p className="text-slate-450 text-xs md:text-sm leading-relaxed uppercase tracking-wider">
                {tenet.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Narrative / Philosophy Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center border border-white/10 bg-[#070709]/85 backdrop-blur-xl rounded-3xl p-8 md:p-12 mb-32 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#d4af37]/30" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#d4af37]/30" />
          
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-6 flex items-center gap-3">
              <Shield className="w-6 h-6 text-[#e5c158]" /> Hardened Pipeline
            </h2>
            <div className="space-y-6 text-slate-400 text-xs md:text-sm leading-relaxed uppercase tracking-wider">
              <p>
                StealthRelay emerged from a collective realization that standard email and cloud architectures have fundamental, structural flaws. Major corporate proxies examine user text, monitor usage telemetry, and build comprehensive digital profiles.
              </p>
              <p>
                We founded StealthRelay to provide a state-of-the-art alternative. Our design mandate is clear: what cannot be read cannot be compromised. We utilize fully client-side metadata-bleaching pipelines and mathematical envelope encryption.
              </p>
            </div>
          </div>

          <div className="relative aspect-square md:aspect-video lg:aspect-square border border-white/10 rounded-2xl overflow-hidden bg-slate-950 p-6 flex flex-col justify-center items-center group shadow-inner">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.03),transparent_70%)] group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
            <Shield className="w-12 h-12 text-[#e5c158]/80 mb-4 animate-pulse drop-shadow-[0_0_10px_rgba(212,175,55,0.3)]" />
            <div className="font-mono text-xs text-[#e5c158]/60 space-y-1.5 text-center select-none pointer-events-none tracking-widest uppercase">
              <p>[SYSTEM STATUS: SECURED]</p>
              <p>[DERIVING ZERO-KNOWLEDGE PROOF...]</p>
              <p>[CLIENT ENCRYPTION: ONLINE]</p>
              <p>[TELEMETRY INTRUSION BLOCKED]</p>
              <p>[IMMUNITY MODULE: ACTIVE]</p>
            </div>
          </div>
        </div>

        {/* Leadership / Team Section */}
        <div className="flex flex-col items-center mb-12">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-16 text-center">
            System Architects
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl w-full">
            
            {/* Member 1 */}
            <div className="flex flex-col items-center group text-center">
              <div className="relative w-48 h-48 rounded-2xl border border-white/10 group-hover:border-[#d4af37]/40 overflow-hidden transition-all duration-500 shadow-2xl mb-6 bg-slate-900">
                <Image 
                  src="/dianna.png" 
                  alt="Dianna - Operations Lead"
                  fill
                  className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500 scale-105 group-hover:scale-100 animate-fade-in"
                />
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-wider">
                Dianna Vance
              </h3>
              <p className="text-[#e5c158] text-xs font-semibold uppercase tracking-widest mt-1 mb-4">
                Chief Privacy Ops & Design
              </p>
              <p className="text-slate-400 text-xs md:text-sm leading-relaxed max-w-xs uppercase tracking-wider">
                Guiding brand aesthetic, regulatory shields, and client onboarding for high-security organizations.
              </p>
            </div>

            {/* Member 2 */}
            <div className="flex flex-col items-center group text-center">
              <div className="relative w-48 h-48 rounded-2xl border border-white/10 group-hover:border-[#d4af37]/40 overflow-hidden transition-all duration-500 shadow-2xl mb-6 bg-slate-900">
                <Image 
                  src="/julian.png" 
                  alt="Julian - Engineering Director"
                  fill
                  className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500 scale-105 group-hover:scale-100 animate-fade-in"
                />
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-wider">
                Julian Reed
              </h3>
              <p className="text-[#e5c158] text-xs font-semibold uppercase tracking-widest mt-1 mb-4">
                Director of Cryptographic Eng
              </p>
              <p className="text-slate-400 text-xs md:text-sm leading-relaxed max-w-xs uppercase tracking-wider">
                Architect of our zero-knowledge envelope delivery framework and distributed routing grids.
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
