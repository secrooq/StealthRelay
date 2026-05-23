import { BookOpen, Shield, Key, Cpu } from "lucide-react";

export default function HelpPage() {
  return (
    <div className="min-h-screen w-full bg-[#020203] pt-20 pb-32 relative overflow-hidden">
      {/* Background grid styling */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-lg border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-center">
             <BookOpen className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-mono font-black uppercase tracking-tighter text-white flex items-center gap-3">
              Command Handbook
            </h1>
            <p className="text-xs text-emerald-500/60 font-mono tracking-widest uppercase mt-1">Operational Manual // Classified Documentation</p>
          </div>
        </div>

        <div className="mt-12 space-y-8">
          {[
            {
              title: "StealthSecret Vector",
              icon: Shield,
              desc: "How to transmit transient payload intelligence securely.",
              details: "Input plaintext or binary payload, specify burning constraints, and distribute the hyper-link. The data incinerates at the quantum level immediately upon viewing or expiration timestamp."
            },
            {
              title: "Vault Encryption Chain",
              icon: Key,
              desc: "Client-side root key mechanics.",
              details: "Your Master Password derives the root AES-256 key locally. It never crosses the wire. Losing both password and recovery mnemonic triggers permanent structural decryption lock-out."
            },
            {
              title: "Relay Matrix",
              icon: Cpu,
              desc: "Masked inbound/outbound packet forwarding.",
              details: "Deploy randomized proxy addresses to intercept tracking vectors. Mail is filtered and re-routed directly to your validated baseline mailboxes in real-time."
            }
          ].map((item, i) => (
            <div key={i} className="p-8 border border-white/10 bg-[#0a0a0c]/80 backdrop-blur rounded-2xl group hover:border-emerald-500/40 transition-all duration-500">
              <div className="flex items-start gap-4">
                 <item.icon className="w-6 h-6 text-emerald-500 mt-1 group-hover:scale-110 transition-transform" />
                 <div>
                   <h3 className="text-xl font-bold text-slate-200 font-mono uppercase tracking-wider mb-2">{item.title}</h3>
                   <p className="text-emerald-400/70 text-sm mb-4 font-mono font-bold italic">{item.desc}</p>
                   <p className="text-slate-200 text-sm leading-relaxed font-sans border-l-2 border-white/5 pl-4">{item.details}</p>
                 </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
