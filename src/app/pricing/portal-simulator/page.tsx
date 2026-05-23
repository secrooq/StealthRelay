'use client';

import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Shield, CreditCard, Lock, ArrowLeft, Loader2, Sparkles, AlertTriangle, CheckCircle, RefreshCw, XCircle, ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface SubscriptionState {
  email: string;
  plan: string;
  status: string;
  current_period_end: string | null;
}

function PortalSimulatorContent() {
  const { data: session } = useSession();
  const router = useRouter();

  const [subInfo, setSubInfo] = useState<SubscriptionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchSubscription = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/subscription");
      if (res.ok) {
        const data = await res.json();
        setSubInfo(data);
      }
    } catch (err) {
      console.error("Failed to load subscription status", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  const handleUpdateSubscription = async (targetPlan: string, actionType: string) => {
    setActionLoading(actionType);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      // simulated cryptographic synchronization delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const res = await fetch("/api/stripe/checkout/mock-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: targetPlan,
          billing: "monthly"
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to modify subscription contract in secure ledger.");
      }

      setSuccessMsg(`Contract successfully modified! Tier updated to: ${targetPlan}`);
      await fetchSubscription();
      
      // Auto redirect to dashboard after small success reading delay
      await new Promise((resolve) => setTimeout(resolve, 2000));
      router.push("/dashboard");
    } catch (err: any) {
      setErrorMsg(err.message || "Cryptographic routing transaction failed.");
    } finally {
      setActionLoading(null);
    }
  };

  const getPlanDetails = (planCode: string) => {
    switch (planCode) {
      case "CONTRACTOR":
        return { name: "Private Contractor", price: 19, color: "text-slate-300" };
      case "PHANTOM":
        return { name: "Phantom Entity", price: 49, color: "text-[#e5c158]" };
      case "ENTERPRISE":
        return { name: "Enterprise Core", price: 99, color: "text-emerald-405" };
      default:
        return { name: "Free Telemetry Trial", price: 0, color: "text-slate-500" };
    }
  };

  const currentPlan = getPlanDetails(subInfo?.plan || "FREE_TRIAL");

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#020203] flex flex-col items-center justify-center text-white font-mono">
        <Loader2 className="w-8 h-8 animate-spin text-[#e5c158] mb-4" />
        <p className="text-xs uppercase tracking-widest text-slate-550">Querying subscriber telemetry...</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#020203] text-white flex flex-col font-sans relative overflow-hidden">
      {/* Scope Reticle decorative overlays */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.02),transparent_70%)] pointer-events-none" />
      
      {/* Header bar */}
      <header className="w-full border-b border-[#d4af37]/10 py-6 px-8 flex justify-between items-center bg-[#070709]/80 backdrop-blur-md z-10 font-mono">
        <Link href="/dashboard" className="flex items-center gap-2 text-xs uppercase text-slate-400 hover:text-[#e5c158] transition">
          <ArrowLeft className="w-4 h-4" /> RETURN TO HUD
        </Link>
        <div className="flex items-center gap-2 text-xs text-[#e5c158]">
          <Shield className="w-4 h-4 animate-pulse" /> STRIPE PORTAL SIMULATION SYSTEM
        </div>
      </header>

      <main className="flex-grow max-w-4xl w-full mx-auto py-16 px-6 z-10">
        
        {/* Portal title */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-[#d4af37]/20 bg-[#d4af37]/5 text-[#e5c158] font-mono text-[9px] uppercase tracking-[0.25em] mb-4">
            <CreditCard className="w-3.5 h-3.5" /> STRIPE BILLING TELEMETRY // SANDBOX MODE
          </div>
          <h1 className="text-2xl md:text-4xl font-sans font-black uppercase text-white tracking-wide">
            OPERATIONAL <span className="text-[#e5c158]">REQUISITION</span> TERMINAL
          </h1>
          <p className="text-xs text-slate-400 font-mono uppercase tracking-wider mt-2">
            Configure active secure tunnels, renew peer-to-peer licenses, or terminate bandwidth matrices.
          </p>
        </div>

        {/* Global Notifications */}
        {successMsg && (
          <div className="mb-8 bg-emerald-955/20 border border-emerald-500/35 text-emerald-400 p-4 rounded-xl text-xs font-mono tracking-wider flex items-center gap-3">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="mb-8 bg-red-955/20 border border-red-500/30 text-red-400 p-4 rounded-xl text-xs font-mono tracking-wider flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Col 1: Active Plan Summary (Col-5) */}
          <div className="lg:col-span-5 border border-[#d4af37]/15 bg-[#070709]/90 rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-2 h-full bg-[#d4af37]" />

            <div>
              <h2 className="text-xs font-mono font-extrabold uppercase tracking-[0.25em] text-[#e5c158] mb-8">
                Active System Deck
              </h2>

              <div className="border-b border-[#d4af37]/10 pb-6 mb-6">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Active Operative License</span>
                <h3 className={`text-2xl font-sans font-black uppercase tracking-wider mt-1.5 ${currentPlan.color}`}>
                  {currentPlan.name}
                </h3>
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-1">
                  {subInfo?.status === "ACTIVE" ? "STATUS: CONDUIT SECURED" : "STATUS: FREE TELEMETRY"}
                </p>
              </div>

              <div className="space-y-4 font-mono text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 uppercase">Operative Profile:</span>
                  <span className="text-white font-bold">{session?.user?.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 uppercase">System Cost:</span>
                  <span className="text-white font-bold">${currentPlan.price}/mo</span>
                </div>
                {subInfo?.current_period_end && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 uppercase">Period Renewal:</span>
                    <span className="text-white font-bold">{new Date(subInfo.current_period_end).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-[#d4af37]/10 pt-6 mt-8">
              <div className="p-4 bg-[#141310] rounded-xl border border-[#d4af37]/10 flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-[#e5c158] shrink-0 mt-0.5" />
                <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest leading-loose">
                  Simulated gateway identity. Modifying credentials directly updates your local Wrangler D1 SQLite database profiles.
                </p>
              </div>
            </div>
          </div>

          {/* Col 2: Actions Menu (Col-7) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Action 1: Tier Upgrades */}
            <div className="border border-white/5 bg-[#141310]/60 backdrop-blur-md rounded-2xl p-6 shadow-md">
              <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#e5c158] mb-4 flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4" /> Change Bandwidth Plan Tier
              </h3>
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-6 leading-relaxed">
                Allocate secure routing vectors by changing your digital footprint allocation tier.
              </p>

              <div className="grid grid-cols-1 gap-3 font-mono text-xs">
                
                {/* Contractor selection */}
                {subInfo?.plan !== "CONTRACTOR" && (
                  <button
                    disabled={actionLoading !== null}
                    onClick={() => handleUpdateSubscription("CONTRACTOR", "UPGRADE_CONTRACTOR")}
                    className="w-full p-4 border border-[#d4af37]/10 hover:border-[#d4af37]/40 bg-[#070709]/60 rounded-xl flex items-center justify-between transition group"
                  >
                    <div className="text-left">
                      <span className="font-bold text-white uppercase group-hover:text-[#e5c158] transition">Private Contractor Tier</span>
                      <p className="text-[8px] text-slate-500 uppercase tracking-widest mt-1">Upgrade or shift to $19/mo Contractor</p>
                    </div>
                    <span className="text-[#e5c158] font-bold group-hover:underline text-[10px] flex items-center gap-1">
                      {actionLoading === "UPGRADE_CONTRACTOR" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "APPLY protocol"}
                    </span>
                  </button>
                )}

                {/* Phantom selection */}
                {subInfo?.plan !== "PHANTOM" && (
                  <button
                    disabled={actionLoading !== null}
                    onClick={() => handleUpdateSubscription("PHANTOM", "UPGRADE_PHANTOM")}
                    className="w-full p-4 border border-[#d4af37]/10 hover:border-[#d4af37]/40 bg-[#070709]/60 rounded-xl flex items-center justify-between transition group"
                  >
                    <div className="text-left">
                      <span className="font-bold text-[#e5c158] uppercase">Phantom Entity Tier</span>
                      <p className="text-[8px] text-slate-500 uppercase tracking-widest mt-1">Upgrade or shift to $49/mo Phantom Node</p>
                    </div>
                    <span className="text-[#e5c158] font-bold group-hover:underline text-[10px] flex items-center gap-1">
                      {actionLoading === "UPGRADE_PHANTOM" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "APPLY protocol"}
                    </span>
                  </button>
                )}

                {/* Enterprise selection */}
                {subInfo?.plan !== "ENTERPRISE" && (
                  <button
                    disabled={actionLoading !== null}
                    onClick={() => handleUpdateSubscription("ENTERPRISE", "UPGRADE_ENTERPRISE")}
                    className="w-full p-4 border border-[#d4af37]/10 hover:border-[#d4af37]/40 bg-[#070709]/60 rounded-xl flex items-center justify-between transition group"
                  >
                    <div className="text-left">
                      <span className="font-bold text-[#e5c158] uppercase">Enterprise Sovereign Core</span>
                      <p className="text-[8px] text-slate-500 uppercase tracking-widest mt-1">Upgrade or shift to $99/mo Enterprise</p>
                    </div>
                    <span className="text-[#e5c158] font-bold group-hover:underline text-[10px] flex items-center gap-1">
                      {actionLoading === "UPGRADE_ENTERPRISE" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "APPLY protocol"}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Action 2: Renewals and Cancellations */}
            <div className="border border-white/5 bg-[#141310]/60 backdrop-blur-md rounded-2xl p-6 shadow-md grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Renew card */}
              <div className="p-4 border border-[#d4af37]/10 bg-[#070709]/40 rounded-xl flex flex-col justify-between">
                <div>
                  <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#e5c158] mb-2 flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5" /> Extend Contract
                  </h4>
                  <p className="text-[8px] font-mono text-slate-500 uppercase tracking-wider leading-relaxed">
                    Extend current active ledger billing period by an extra 30 calender days instantly.
                  </p>
                </div>
                <button
                  disabled={actionLoading !== null || subInfo?.plan === "FREE_TRIAL"}
                  onClick={() => handleUpdateSubscription(subInfo?.plan || "CONTRACTOR", "RENEW_PLAN")}
                  className="w-full mt-4 py-2.5 rounded-lg border border-[#d4af37]/30 text-[#e5c158] font-mono text-[9px] uppercase tracking-widest font-black hover:bg-[#d4af37]/10 transition duration-300 flex items-center justify-center gap-1.5 disabled:opacity-40"
                >
                  {actionLoading === "RENEW_PLAN" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "EXTEND BILLING"}
                </button>
              </div>

              {/* Cancel card */}
              <div className="p-4 border border-red-500/10 bg-[#070709]/40 rounded-xl flex flex-col justify-between">
                <div>
                  <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-red-400 mb-2 flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5" /> Terminate Contract
                  </h4>
                  <p className="text-[8px] font-mono text-slate-500 uppercase tracking-wider leading-relaxed">
                    Instantly sever secure paid conduit routing, falling back immediately to Free Telemetry Trial.
                  </p>
                </div>
                <button
                  disabled={actionLoading !== null || subInfo?.plan === "FREE_TRIAL"}
                  onClick={() => handleUpdateSubscription("FREE_TRIAL", "CANCEL_PLAN")}
                  className="w-full mt-4 py-2.5 rounded-lg border border-red-500/30 text-red-400 font-mono text-[9px] uppercase tracking-widest font-black hover:bg-red-500/10 transition duration-300 flex items-center justify-center gap-1.5 disabled:opacity-40"
                >
                  {actionLoading === "CANCEL_PLAN" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "TERMINATE CONDUIT"}
                </button>
              </div>

            </div>

          </div>

        </div>
      </main>
    </div>
  );
}

export default function PortalSimulatorPage() {
  return (
    <Suspense fallback={
      <div className="w-full min-h-screen bg-[#020203] flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-[#e5c158]" />
      </div>
    }>
      <PortalSimulatorContent />
    </Suspense>
  );
}
