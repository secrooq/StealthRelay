"use client";

import { useState } from "react";
import { Shield, Zap, Check, Lock, ArrowRight, CreditCard, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TrialActivationPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate payment processing/verification
    setTimeout(() => {
      // In a real app, this would call a server action to save stripe customer id or update DB
      // For now we simulate success
      router.push("/relay?trial_active=true");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#020203] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[15%] w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[15%] w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[150px] pointer-events-none" />

      <div className="max-w-2xl w-full z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 text-[10px] font-mono uppercase tracking-[0.3em] mb-6 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Operational Clearance Required
          </div>
          <h1 className="text-4xl md:text-5xl font-black uppercase text-white mb-4 tracking-tight">Activate Your Stealth Trial</h1>
          <p className="text-slate-400 font-mono text-sm max-w-lg mx-auto">
            To prevent bot exhaustion and ensure resource integrity, we require a valid credit card to initialize your 7-day Zero-Knowledge trial.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Benefit Box */}
          <div className="bg-[#050507] border border-white/10 rounded-2xl p-8 flex flex-col">
            <h3 className="text-emerald-400 font-mono text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
              <Zap className="w-4 h-4" /> Trial Benefits
            </h3>
            <ul className="space-y-4 mb-8">
              {[
                "Unlimited Tactical Aliases",
                "1GB Encrypted Vault Storage",
                "Instant Metadata Bleaching",
                "Priority Node Routing",
                "7 Days Full Clearance"
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-xs text-slate-200 font-mono">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-6 border-t border-white/5">
              <p className="text-[10px] text-slate-500 font-mono uppercase">
                $0.00 Due Today. $9.00/mo after trial. Cancel instantly in dashboard.
              </p>
            </div>
          </div>

          {/* Form Box */}
          <form onSubmit={handleActivate} className="bg-white/[0.02] border border-emerald-500/20 rounded-2xl p-8 flex flex-col shadow-[0_0_50px_rgba(16,185,129,0.05)]">
            <h3 className="text-white font-mono text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" /> Payment Identity
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest">Cardholder Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="OPERATIVE NAME"
                  className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-xs font-mono text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest">Card Credentials</label>
                <div className="relative">
                  <input 
                    type="text" 
                    required
                    placeholder="XXXX XXXX XXXX XXXX"
                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-xs font-mono text-white focus:outline-none focus:border-emerald-500/50"
                  />
                  <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest">Expiry</label>
                  <input 
                    type="text" 
                    required
                    placeholder="MM/YY"
                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-xs font-mono text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest">CVC</label>
                  <input 
                    type="text" 
                    required
                    placeholder="***"
                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-xs font-mono text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="mt-8 w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest text-xs py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying Node...
                </>
              ) : (
                <>
                  Initialize 7-Day Trial <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-10 text-center text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em] flex items-center justify-center gap-2">
          <Lock className="w-3 h-3" /> Encrypted via 256-bit AES Handshake. No data stored on local logs.
        </p>
      </div>
    </div>
  );
}
