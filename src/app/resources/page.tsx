import type { Metadata } from "next";
import { BookOpen, Key, ShieldCheck, ShieldAlert, Terminal, Server, Globe, Send } from "lucide-react";
import ResourcesClient from "@/components/ResourcesClient";

export const metadata: Metadata = {
  title: "Documentation & Security Resources | Stealth Relay",
  description: "Master Zero-Knowledge operational security and customize your secure forwarding grids.",
};

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center selection:bg-[#d4af37]/30 relative overflow-hidden font-sans">
      {/* Radial Grid Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.04),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(212,175,55,0.02),transparent_50%)] pointer-events-none" />

      <div className="max-w-7xl w-full px-6 py-24 md:py-32 relative z-10">
        
        {/* Page Title */}
        <div className="flex flex-col items-start max-w-3xl mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#d4af37]/10 border border-[#d4af37]/20 rounded-full text-[#e5c158] text-xs font-semibold tracking-wide mb-6">
            <BookOpen className="w-3.5 h-3.5" /> Documentation
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6">
            System Knowledge Base
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed font-medium">
            Equip yourself with practical guidelines on configuring custom masks, auditing cryptographic integrity, and reinforcing your digital defense posture.
          </p>
        </div>

        {/* Dynamic Interactive Document Grid Area */}
        <ResourcesClient />

        {/* Call to action / Support link banner */}
        <div className="relative overflow-hidden border border-slate-800 bg-slate-900/30 rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.05),transparent_70%)] pointer-events-none" />
          <div className="relative z-10">
            <h3 className="text-2xl font-bold text-white mb-2">
              Missing Intel?
            </h3>
            <p className="text-slate-400 text-sm max-w-md leading-relaxed font-medium">
              Ask Stealthbot in the lower corner widget for real-time procedural advice, or securely dispatch an inquiry to info@stealthrelay.com.
            </p>
          </div>
          <a 
            href="mailto:info@stealthrelay.com"
            className="px-6 py-3.5 bg-[#d4af37] hover:bg-[#e5c158] hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] text-black text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all duration-300 whitespace-nowrap shadow-sm relative z-10"
          >
            Contact Secure Line
          </a>
        </div>

      </div>
    </div>
  );
}
