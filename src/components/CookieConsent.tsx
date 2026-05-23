"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, Check } from "lucide-react";

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasConsent = localStorage.getItem("stealth_consent_given");
    if (!hasConsent) {
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptConsent = () => {
    localStorage.setItem("stealth_consent_given", "true");
    setIsVisible(false);
    // Hook logic for initializing analytics dynamically would trigger here
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 z-[100] animate-in slide-in-from-bottom-10 duration-500">
      <div className="bg-[#0a0a0c]/90 backdrop-blur-xl border border-emerald-500/20 rounded-lg p-5 shadow-2xl shadow-black">
        <div className="flex items-start gap-3 mb-4">
          <div className="mt-1">
            <ShieldAlert className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-xs font-mono font-bold text-white uppercase tracking-widest mb-1">Telemetry Disclaimer</h4>
            <p className="text-[11px] text-slate-200 font-mono leading-relaxed">
              This node uses non-persistent analytics identifiers and session continuity tokens to secure operational capacity. By Proceeding, you acknowledge monitoring.
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-between border-t border-white/5 pt-4">
          <a href="/legal/privacy" className="text-[10px] font-mono text-slate-100 hover:text-white underline transition">Read Manifesto</a>
          <button 
            onClick={acceptConsent}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 hover:text-black border border-emerald-500/30 transition-all duration-200 text-emerald-400 rounded font-mono text-[10px] uppercase tracking-widest"
          >
            <Check className="w-3 h-3" />
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
}
