'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { ShieldAlert, ArrowRight, Sparkles } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function TrialBanner() {
  const { data: session, status } = useSession();
  const [subPlan, setSubPlan] = useState<string | null>(null);
  const [subStatus, setSubStatus] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/user/subscription')
        .then(res => res.json())
        .then(data => {
          setSubPlan(data.plan);
          setSubStatus(data.status);
        })
        .catch(err => console.error("TrialBanner plan fetch failed:", err));
    }
  }, [status]);

  // Hide the banner if the user is on the pricing page already to avoid redundancy
  if (pathname === '/pricing') return null;

  const isTrial = status === 'authenticated' && subPlan === 'FREE_TRIAL';

  if (!isTrial || !isVisible) return null;

  return (
    <div className="w-full bg-gradient-to-r from-red-950/90 via-[#1a130b] to-amber-950/90 border-b border-[#d4af37]/25 text-slate-100 py-3.5 px-4 md:px-6 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_4px_30px_rgba(212,175,55,0.08)] z-[60] animate-in slide-in-from-top duration-300">
      {/* Cyber Grid Background lines */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(212,175,55,0.015)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-32 h-full bg-[radial-gradient(circle_at_right,rgba(212,175,55,0.05),transparent_70%)] pointer-events-none" />

      {/* Left: Alarm Warning and Danger Notice */}
      <div className="flex items-start md:items-center gap-3.5 max-w-4xl text-left">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/35 flex items-center justify-center text-amber-400 shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.15)] animate-pulse">
          <ShieldAlert className="w-5.5 h-5.5" />
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-black tracking-widest text-amber-400 uppercase bg-amber-500/15 border border-amber-500/25 px-2 py-0.5 rounded">
              SYSTEM LEVEL: TRIAL WARNING
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
          </div>
          <p className="text-xs md:text-sm text-slate-200 leading-relaxed font-sans mt-1">
            Your StealthRelay environment is currently operating in <strong>Trial Mode</strong>. 
            <span className="text-red-400 font-semibold ml-1">Danger Alert:</span> If your trial expires without upgrading, all non-custodial transient vault logs, geofenced records, and active email masks will be <strong>permanently and cryptographically purged</strong> from our decentralized nodes within 72 hours.
          </p>
        </div>
      </div>

      {/* Right: Premium Interactive Upgrade Area */}
      <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-end">
        <Link
          href="/pricing"
          className="group flex items-center justify-center gap-2 px-6 py-2.5 bg-[#d4af37] text-[#141310] font-mono text-xs font-black uppercase tracking-widest rounded-lg shadow-[0_0_15px_rgba(212,175,55,0.25)] hover:bg-white hover:text-black transition-all duration-300 w-full md:w-auto hover:scale-[1.03]"
        >
          <Sparkles className="w-3.5 h-3.5 text-black animate-spin duration-3000" />
          Secure Core License
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </Link>
        <button
          onClick={() => setIsVisible(false)}
          className="p-2 text-slate-400 hover:text-white transition rounded-lg hover:bg-white/5 text-xs font-mono uppercase tracking-wider hidden md:block"
          aria-label="Dismiss Banner"
        >
          [Dismiss]
        </button>
      </div>
    </div>
  );
}
