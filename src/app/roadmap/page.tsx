import React from 'react';
import Link from 'next/link';
import { Calendar, GitPullRequest, Layers, Milestone, Terminal, ShieldAlert } from 'lucide-react';

export const metadata = {
  title: 'Operational Roadmap | Stealth Relay',
  description: 'Track the upcoming cryptographic capabilities, zero-knowledge upgrades, and P2P obfuscation matrices planned for Stealth Relay.',
};

export default function RoadmapPage() {
  const milestones = [
    {
      phase: "Phase 1: Quantum Foundations",
      timeline: "Q1 2026",
      status: "COMPLETED",
      items: [
        "Dynamic Edge routing networks running in Cloudflare V8 memory isolates.",
        "Zero-knowledge browser-side metadata purging utilizing OffscreenCanvas bleaching engines.",
        "AES-GCM encryption layers for instant tactical secrets with customizable self-destruction timers."
      ]
    },
    {
      phase: "Phase 2: Custom Domains & Controls",
      timeline: "Q2 2026",
      status: "IN PROGRESS",
      items: [
        "Phantom and Enterprise custom domain routing integrations with public DNS-over-HTTPS TXT verification.",
        "Manual personnel tier allocations and unlimited trial grants via OTP-secured global administration consoles.",
        "Automatic Post-expiration cascading DB purges ensuring complete user data zero-knowledge sanitation."
      ]
    },
    {
      phase: "Phase 3: Decentralized Obfuscation",
      timeline: "Q3 2026",
      status: "PLANNED",
      items: [
        "Distributed P2P metadata proxy nodes to fully decouple origin mail server records from recipient nodes.",
        "Zero-knowledge decentralized identifier (DID) identity sync without storing standard email addresses.",
        "Outbound mail forwarding support on verified custom domain suffixes with strict DMARC/SPF parameters."
      ]
    },
    {
      phase: "Phase 4: Hardware Enclaves",
      timeline: "Q4 2026",
      status: "PLANNED",
      items: [
        "Hardware security key (YubiKey / WebAuthn) cryptographic authentication vectors inside zero-knowledge vaults.",
        "Native Android & iOS decentralized zero-knowledge companion apps built in Compose and SwiftUI.",
        "Global multi-region D1 database replication layers for zero-latency metadata dispatch routing."
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#040405] text-[#d4af37] px-6 py-20 flex flex-col items-center">
      <div className="max-w-4xl w-full space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#d4af37]/20 bg-[#d4af37]/5 text-xs font-mono font-bold tracking-widest uppercase">
            <Milestone className="w-4 h-4 text-[#e5c158]" /> Capabilities Roadmap
          </div>
          <h1 className="text-4xl font-mono font-black text-white uppercase tracking-[0.2em] leading-tight">
            Operational Vector Matrix
          </h1>
          <p className="text-xs text-slate-400 font-mono max-w-xl mx-auto leading-relaxed">
            The cryptographic roadmap for Stealth Relay. Transparency, zero-knowledge validation, and continuous privacy-centric evolution.
          </p>
        </div>

        <div className="grid gap-8">
          {milestones.map((ms, idx) => (
            <div 
              key={idx} 
              className={`p-8 bg-[#0a0a0c]/80 border rounded-3xl backdrop-blur-xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(212,175,55,0.05)] ${
                ms.status === 'COMPLETED' 
                  ? 'border-emerald-500/20' 
                  : ms.status === 'IN PROGRESS'
                  ? 'border-[#d4af37]/35'
                  : 'border-white/5'
              }`}
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4 mb-6">
                <div>
                  <h2 className="text-lg font-mono font-black text-white uppercase tracking-wider">{ms.phase}</h2>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-1">
                    <Calendar className="w-3.5 h-3.5 text-[#e5c158]" /> Targeted Timeline: {ms.timeline}
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-3 py-1 rounded font-mono border ${
                  ms.status === 'COMPLETED'
                    ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/30'
                    : ms.status === 'IN PROGRESS'
                    ? 'bg-amber-950/20 text-amber-400 border-[#d4af37]/30 animate-pulse'
                    : 'bg-slate-950/40 text-slate-500 border-white/5'
                }`}>
                  {ms.status}
                </span>
              </div>

              <ul className="space-y-4">
                {ms.items.map((item, i) => (
                  <li key={i} className="flex gap-3 text-xs text-slate-300 font-mono leading-relaxed">
                    <span className="text-[#e5c158] select-none">►</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="text-center pt-8">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-2 px-8 py-3.5 border border-[#d4af37]/35 bg-[#d4af37]/5 hover:bg-[#d4af37]/10 text-[#e5c158] font-mono font-bold uppercase text-xs tracking-widest rounded-xl transition-all"
          >
            <Terminal className="w-4 h-4" /> Enter Operations Command
          </Link>
        </div>
      </div>
    </div>
  );
}
