'use client';

import React, { useState, useEffect } from "react";
import { Check, X, Shield, Target, Crosshair, HelpCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function PricingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("yearly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [activePlan, setActivePlan] = useState<string | null>(null);
  const [activeBilling, setActiveBilling] = useState<string>("monthly");
  const [enterpriseSeats, setEnterpriseSeats] = useState<number>(5);

  useEffect(() => {
    if (session) {
      fetch('/api/user/subscription')
        .then(res => res.json())
        .then(data => {
          if (data && data.plan) {
            setActivePlan(data.plan.toUpperCase());
            setActiveBilling(data.billing_period || "monthly");
          }
        })
        .catch(err => console.error("Failed to load subscription plan", err));
    }
  }, [session]);

  const tiers = [
    {
      id: "CONTRACTOR",
      name: "Private Contractor",
      desc: "Tactical secure communication tunnels for single operatives.",
      price: {
        monthly: 19,
        yearly: 15
      },
      features: [
        "Unlimited Masked Relay Aliases",
        "10 Validated Mailbox Vectors",
        "50 GB Zero-Knowledge Vault Storage",
        "500 MB Max File Upload Limit",
        "Client-side AES-GCM & PBKDF2 keys",
        "Automated Public PGP Key Signing",
        "24-Hour Ephemeral Secrets TTL"
      ],
      notIncluded: [
        "Custom BYOD Domain Vectors",
        "Custom PGP Decryption Key Imports",
        "Multi-inbox catch-all replication",
        "Dedicated Exit IP pools",
        "Priority Command Support"
      ],
      cta: "Activate Contractor Mesh",
      highlight: false,
      badge: "Infiltration Class"
    },
    {
      id: "PHANTOM",
      name: "Phantom Entity",
      desc: "Total network identity concealment with dynamic custom domain nodes.",
      price: {
        monthly: 49,
        yearly: 41
      },
      features: [
        "Everything in Contractor plan",
        "Unlimited Validated Mailboxes",
        "350 GB Zero-Knowledge Vault Storage",
        "2 GB Max File Upload Limit",
        "Custom Domain Vector Integration",
        "Full PGP Encryption & Vault Exports",
        "Infinite Ephemeral Secret Expiry TTL",
        "Search Noise Obfuscator Generator"
      ],
      notIncluded: [
        "Enterprise Dedicated IP Pools",
        "Multi-Domain Enclave Controls",
        "System SLA Uptime Telemetry",
        "Dedicated Account Command Officer"
      ],
      cta: "Deploy Phantom Node",
      highlight: true,
      badge: "MOST POPULAR LOADOUT"
    },
    {
      id: "ENTERPRISE",
      name: "Enterprise Core",
      desc: "Sovereign global routing architecture for full organization coverage.",
      price: {
        monthly: 99,
        yearly: 79
      },
      features: [
        "Everything in Phantom plan",
        "Unlimited Custom Domain Integration",
        "4 TB Pooled Vault Storage",
        "5 GB Max File Upload Limit",
        "Sovereign Enclave Directory & KB",
        "Enterprise Dedicated Exit IP Pools",
        "Encrypted Team Chat Enclave Ready",
        "Full Cryptographic Compliance Logs"
      ],
      notIncluded: [],
      cta: "Secure Sovereign Core",
      highlight: false,
      badge: "Sovereign Command Class"
    }
  ];

  const handleCheckout = async (planId: string) => {
    if (!session) {
      router.push("/login?callbackUrl=/pricing");
      return;
    }

    setLoadingPlan(planId);
    setErrorMsg("");

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: planId,
          billing: billingPeriod,
          seats: planId === "ENTERPRISE" ? enterpriseSeats : undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to initiate Stripe gateway.");
      }

      if (data.url) {
        router.push(data.url);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Establish secure terminal bridge failed.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="w-full min-h-screen bg-transparent py-24 px-6 relative overflow-hidden selection:bg-[#d4af37]/30">
      <div className="max-w-7xl mx-auto text-center mb-16 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#d4af37]/20 bg-[#d4af37]/5 text-[#e5c158] font-mono text-[10px] uppercase tracking-[0.2em] mb-4 shadow-[0_0_15px_rgba(212,175,55,0.1)]">
          <Shield className="w-3.5 h-3.5" /> FUNDING MATRIX // RESOURCE ALLOCATION
        </div>
        <h1 className="text-4xl md:text-6xl font-mono font-black uppercase text-white tracking-tighter mb-4">
          OPERATIONAL <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] to-[#e5c158] drop-shadow-[0_0_15px_rgba(212,175,55,0.25)]">REQUISITION</span>
        </h1>
        <div className="max-w-xl mx-auto mb-6 bg-emerald-950/20 border border-emerald-500/25 p-2 rounded-xl text-[10px] font-mono text-emerald-400 uppercase tracking-widest animate-pulse flex items-center justify-center gap-2">
          <span>⚡ ALL PLANS DEPLOY WITH A 14-DAY RISK-FREE TRIAL &amp; 14-DAY MONEY-BACK GUARANTEE</span>
        </div>
        <p className="text-slate-400 font-mono text-xs md:text-sm max-w-2xl mx-auto uppercase tracking-wider leading-relaxed">
          Allocate cryptographic routing bandwidth and encrypted D1 vaults to sustain operational invisibility. Non-active telemetry pools are Forensically Scrubbed 3 days after trial expiration.
        </p>

        {/* Dynamic Billing Toggle Switch */}
        <div className="flex items-center justify-center gap-4 mt-12">
          <span className={`text-xs font-mono uppercase tracking-widest transition-colors ${billingPeriod === 'monthly' ? 'text-[#e5c158] font-bold' : 'text-slate-500'}`}>
            Monthly Protocol
          </span>
          
          <button 
            onClick={() => setBillingPeriod(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
            className="w-14 h-7 rounded-full bg-[#070709] border border-white/10 hover:border-[#d4af37]/50 p-1 flex items-center transition-all relative"
            aria-label="Toggle Billing Interval"
          >
            <div className={`w-5 h-5 rounded-full bg-gradient-to-r from-[#d4af37] to-[#e5c158] shadow-[0_0_15px_rgba(212,175,55,0.5)] transition-all transform ${billingPeriod === 'yearly' ? 'translate-x-7' : 'translate-x-0'}`} />
          </button>

          <span className={`text-xs font-mono uppercase tracking-widest transition-colors flex items-center gap-1.5 ${billingPeriod === 'yearly' ? 'text-[#e5c158] font-bold' : 'text-slate-500'}`}>
            Yearly Protocol <span className="bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#e5c158] text-[8px] px-2 py-0.5 rounded font-black tracking-wider uppercase">SAVE 20%</span>
          </span>
        </div>

        {errorMsg && (
          <div className="max-w-md mx-auto mt-8 bg-red-950/20 border border-red-500/30 text-red-400 p-4 rounded-xl text-xs font-mono tracking-wider">
            🚨 REQUISITION FAILURE: {errorMsg}
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10 items-stretch">
        {tiers.map((tier) => {
          const displayPrice = billingPeriod === "monthly" ? tier.price.monthly : tier.price.yearly;
          const totalYearlyCost = tier.id === "ENTERPRISE"
            ? tier.price.yearly * enterpriseSeats * 12
            : tier.price.yearly * 12;
          const isCurrentPlan = activePlan === tier.id && activeBilling === billingPeriod;
          const isCurrentPlanDifferentBilling = activePlan === tier.id && activeBilling !== billingPeriod;

          return (
            <div 
              key={tier.id}
              className={`relative flex flex-col rounded-2xl border transition-all duration-500 ${
                isCurrentPlan
                  ? 'border-[#d4af37] bg-[#d4af37]/5 shadow-[0_0_30px_rgba(212,175,55,0.15)]'
                  : isCurrentPlanDifferentBilling
                    ? 'border-amber-500 bg-amber-500/5 shadow-[0_0_30px_rgba(245,158,11,0.15)]'
                    : tier.highlight 
                      ? 'border-[#d4af37] bg-[#070709]/95 shadow-[0_0_40px_rgba(212,175,55,0.15)] scale-105 lg:scale-105 z-10' 
                      : 'border-white/10 bg-[#070709]/80 backdrop-blur-xl hover:border-white/20'
              } p-8 h-full overflow-hidden`}
            >
              {/* Tactical reticle markers */}
              <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-[#d4af37]/30" />
              <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-[#d4af37]/30" />
              <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-[#d4af37]/30" />
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-[#d4af37]/30" />

              <div className="mb-8">
                <div className="flex justify-between items-start mb-4">
                  <span className={`text-[9px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded border font-bold ${
                    isCurrentPlan
                      ? 'text-[#e5c158] bg-[#d4af37]/15 border-[#d4af37]'
                      : isCurrentPlanDifferentBilling
                        ? 'text-amber-500 bg-amber-500/10 border-amber-500/30'
                        : tier.highlight
                          ? 'text-[#e5c158] bg-[#d4af37]/10 border-[#d4af37]/20'
                          : 'text-slate-400 bg-slate-950 border-white/5'
                  }`}>
                    {isCurrentPlan ? "🛡️ CURRENT SECURE BINDING" : isCurrentPlanDifferentBilling ? "⚡ UPGRADE MATRIX AVAILABLE" : tier.badge}
                  </span>
                </div>
                <h3 className="text-xl font-mono font-black text-white uppercase tracking-wider mb-2">{tier.name}</h3>
                <p className="text-xs md:text-sm text-slate-400 font-mono tracking-wide leading-relaxed min-h-[48px]">{tier.desc}</p>
                
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-5xl font-mono font-bold text-white tracking-tight">${displayPrice}</span>
                  <span className="text-slate-500 font-mono text-[10px] uppercase tracking-widest">
                    {tier.id === "ENTERPRISE" ? "/ seat / month" : "/ month"}
                  </span>
                </div>
                
                {billingPeriod === "yearly" && (
                  <p className="text-[10px] text-[#e5c158] font-mono uppercase tracking-widest mt-1.5">
                    {tier.id === "ENTERPRISE"
                      ? `Total pool: $${tier.price.yearly * enterpriseSeats}/mo billed as $${totalYearlyCost}/year`
                      : `Billed as $${totalYearlyCost}/year protocol`}
                  </p>
                )}

                {tier.id === "ENTERPRISE" && (
                  <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-slate-400 uppercase tracking-widest">Team Size (Seats)</span>
                      <span className="text-[#e5c158] font-black">{enterpriseSeats} Licensed Seats</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      value={enterpriseSeats}
                      onChange={(e) => setEnterpriseSeats(parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#d4af37]"
                    />
                    <div className="flex justify-between text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                      <span>5 Seats (Min)</span>
                      <span>100+ Seats</span>
                    </div>
                    
                    {/* Interactive seat total calculator */}
                    <div className="mt-2 pt-2.5 border-t border-white/5 space-y-1 text-left font-mono">
                      <div className="flex justify-between items-center text-[10px] text-slate-300">
                        <span>Dynamic Multiplier</span>
                        <span className="text-white">${billingPeriod === 'yearly' ? '79' : '99'} × {enterpriseSeats} seats</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] font-bold text-[#e5c158]">
                        <span>Monthly Total</span>
                        <span>${(billingPeriod === 'yearly' ? 79 : 99) * enterpriseSeats}/mo</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-grow space-y-4 mb-10 border-t border-white/10 pt-6">
                {tier.features.map((feat, j) => (
                  <div key={j} className="flex items-start gap-3 text-xs md:text-sm text-slate-300 font-mono tracking-wide leading-relaxed">
                    <Check className="w-4 h-4 text-[#e5c158] shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
                {tier.notIncluded.map((feat, j) => (
                  <div key={j} className="flex items-start gap-3 text-xs md:text-sm text-slate-650 font-mono tracking-wide leading-relaxed opacity-30">
                    <X className="w-4 h-4 text-red-555 shrink-0 mt-0.5" />
                    <span className="line-through">{feat}</span>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => {
                  if (isCurrentPlan) {
                    router.push("/settings");
                  } else {
                    handleCheckout(tier.id);
                  }
                }}
                disabled={loadingPlan !== null && loadingPlan !== tier.id}
                className={`w-full py-4 rounded-xl font-mono text-xs font-black uppercase tracking-[0.25em] transition-all flex items-center justify-center gap-2 ${
                  isCurrentPlan
                    ? 'bg-transparent text-[#e5c158] border border-[#d4af37] hover:bg-[#d4af37]/10 shadow-[0_0_15px_rgba(212,175,55,0.1)] cursor-pointer'
                    : isCurrentPlanDifferentBilling
                      ? 'bg-amber-500 text-black hover:bg-white shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                      : tier.highlight 
                        ? 'bg-[#d4af37] text-black hover:bg-white hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] shadow-[0_0_20px_rgba(212,175,55,0.2)]' 
                        : 'bg-slate-950 text-white border border-white/10 hover:bg-[#d4af37]/10 hover:border-[#d4af37]/30'
                } disabled:opacity-50`}
              >
                {loadingPlan === tier.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" /> SYNCHRONIZING TELEMETRY...
                  </>
                ) : isCurrentPlan ? (
                  "Active Plan // Manage"
                ) : isCurrentPlanDifferentBilling ? (
                  billingPeriod === 'yearly' ? "Switch to Yearly Protocol" : "Switch to Monthly Protocol"
                ) : (
                  tier.cta
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Luxury Battlefield telemetry advisory */}
      <div className="max-w-4xl mx-auto mt-20 p-8 bg-[#070709]/80 border border-white/10 rounded-2xl text-center backdrop-blur-md relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-[#d4af37]" />
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#d4af37]/30" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#d4af37]/30" />
        <p className="text-xs font-mono text-[#e5c158] uppercase font-black tracking-[0.3em] mb-3.5 flex items-center justify-center gap-2">
          <Crosshair className="w-4 h-4 text-[#e5c158] animate-spin" style={{ animationDuration: '4s' }} /> SECURE OPERATIONAL LATENCY ADVISORY
        </p>
        <p className="text-xs md:text-sm font-mono text-slate-400 uppercase tracking-widest leading-loose">
          TO GUARANTEE ZERO-KNOWLEDGE ABSOLUTE PRIVACY, ALL SECURE STORAGE (STEALTHBOX), DISPOSABLE MAILBOXES, AND VERIFIED DOMAIN RECORDS ARE PERMANENTLY AND IRREVERSIBLY DELETED FROM OUR DATABASE ENCLAVES WITHIN 3 DAYS AFTER SUBSCRIPTION EXPIRATION.
        </p>
      </div>
    </div>
  );
}
