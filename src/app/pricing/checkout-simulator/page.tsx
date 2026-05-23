'use client';

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Shield, CreditCard, Lock, ArrowLeft, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import Link from "next/link";

function CheckoutSimulatorContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  const plan = (searchParams.get("plan") || "CONTRACTOR").toUpperCase();
  const billing = (searchParams.get("billing") || "monthly").toLowerCase();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("4242 •••• •••• 4242");
  const [cardExpiry, setCardExpiry] = useState("12/29");
  const [cardCvc, setCardCvc] = useState("•••");

  const seatsRaw = searchParams.get("seats");
  const parsedSeats = parseInt(seatsRaw || "5", 10);
  const seatsCount = isNaN(parsedSeats) ? 5 : Math.max(5, parsedSeats);

  const plansInfo: Record<string, { name: string; price: number; desc: string }> = {
    CONTRACTOR: {
      name: "Private Contractor Plan",
      price: billing === "yearly" ? 15 : 19,
      desc: "Tactical secure communication tunnels for single operatives.",
    },
    PHANTOM: {
      name: "Phantom Entity Plan",
      price: billing === "yearly" ? 41 : 49,
      desc: "Total network identity concealment with dynamic custom domain nodes.",
    },
    ENTERPRISE: {
      name: "Enterprise Core Plan",
      price: billing === "yearly" ? 79 * seatsCount : 99 * seatsCount,
      desc: `Sovereign global routing architecture with ${seatsCount} licensed operative seats.`,
    },
  };

  const selectedPlan = plansInfo[plan] || plansInfo.CONTRACTOR;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      // Small simulated latency for cryptographic authorization
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const res = await fetch("/api/stripe/checkout/mock-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, billing, seats: seatsCount }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Simulated authorization signature rejected.");
      }

      setSuccess(true);
      // Wait for success animation
      await new Promise((resolve) => setTimeout(resolve, 1500));
      router.push("/relay?billing_success=true");
    } catch (err: any) {
      setErrorMsg(err.message || "Cryptographic routing injection failed.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#020203] text-white flex flex-col font-sans relative overflow-hidden">
      {/* Background Matrix telemetry decor */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.025),transparent_70%)] pointer-events-none" />
      
      {/* Header bar */}
      <header className="w-full border-b border-[#d4af37]/10 py-6 px-8 flex justify-between items-center bg-[#070709]/80 backdrop-blur-md z-10">
        <Link href="/pricing" className="flex items-center gap-2 text-xs font-mono uppercase text-slate-400 hover:text-[#e5c158] transition">
          <ArrowLeft className="w-4 h-4" /> ABORT REQUISITION
        </Link>
        <div className="flex items-center gap-2 text-xs font-mono text-[#e5c158]">
          <Shield className="w-4 h-4 animate-pulse" /> STRIPE INTEGRATION SANDBOX MODE
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center py-16 px-6 z-10">
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
          
          {/* Column 1: Payment Checkout form (Col-7) */}
          <div className="md:col-span-7 border border-[#d4af37]/15 bg-[#070709]/90 rounded-2xl p-8 flex flex-col relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-2 h-full bg-[#d4af37]" />

            {success ? (
              <div className="flex-grow flex flex-col items-center justify-center text-center py-16 animate-in fade-in zoom-in-95 duration-500">
                <CheckCircle2 className="w-20 h-20 text-[#e5c158] mb-6 drop-shadow-[0_0_20px_rgba(212,175,55,0.3)] animate-bounce" />
                <h2 className="text-2xl font-black uppercase tracking-wider text-[#e5c158] mb-3">
                  PAYMENT AUTHORIZED
                </h2>
                <p className="text-xs text-slate-400 font-mono uppercase tracking-widest max-w-sm">
                  Simulated transaction cleared. Cryptographic tokens generated. Upgrading operative profile...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex-grow flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 border-b border-[#d4af37]/10 pb-6 mb-8">
                    <div className="p-3 bg-[#d4af37]/10 border border-[#d4af37]/20 rounded-lg text-[#e5c158]">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black uppercase tracking-wider">Secure Payment Gateway</h2>
                      <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                        Zero-Knowledge cryptographic transaction simulator
                      </p>
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="mb-6 bg-red-955/20 border border-red-500/30 text-red-400 p-4 rounded-xl text-xs font-mono tracking-wider">
                      🚨 TRANSACTION ERROR: {errorMsg}
                    </div>
                  )}

                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-2">
                        Operative License Name (Name on Card)
                      </label>
                      <input
                        type="text"
                        required
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder={session?.user?.email || "John Doe"}
                        className="w-full bg-[#141310] border border-[#d4af37]/15 rounded-lg px-4 py-3 text-sm text-white font-mono uppercase tracking-widest focus:outline-none focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/50 transition duration-300"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-2">
                        Simulated Credit Card Number
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-full bg-[#141310] border border-[#d4af37]/15 rounded-lg pl-12 pr-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/50 transition duration-300"
                        />
                        <CreditCard className="w-4 h-4 text-[#e5c158] absolute left-4 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-2">
                          Expiration (MM/YY)
                        </label>
                        <input
                          type="text"
                          required
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full bg-[#141310] border border-[#d4af37]/15 rounded-lg px-4 py-3 text-sm text-white font-mono text-center focus:outline-none focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/50 transition duration-300"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-2">
                          Security Code (CVC)
                        </label>
                        <input
                          type="text"
                          required
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value)}
                          className="w-full bg-[#141310] border border-[#d4af37]/15 rounded-lg px-4 py-3 text-sm text-white font-mono text-center focus:outline-none focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/50 transition duration-300"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-12">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-xl bg-[#d4af37] text-black font-mono text-xs font-black uppercase tracking-[0.2em] hover:bg-white hover:text-black transition duration-300 shadow-[0_0_20px_rgba(212,175,55,0.2)] flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> ESTABLISHING CRYPTO HANDSHAKE...
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" /> AUTHORIZE SECURE PAYMENT (${selectedPlan.price})
                      </>
                    )}
                  </button>
                  <p className="text-[9px] font-mono uppercase text-slate-500 tracking-widest text-center mt-3">
                    🔒 Sandbox protocol. Payments are fully simulated. No real currency is charged.
                  </p>
                </div>
              </form>
            )}
          </div>

          {/* Column 2: Order Summary (Col-5) */}
          <div className="md:col-span-5 border border-white/5 bg-[#141310]/60 backdrop-blur-md rounded-2xl p-8 flex flex-col justify-between shadow-lg">
            <div>
              <h3 className="text-xs font-mono font-extrabold uppercase tracking-[0.2em] text-[#e5c158] mb-6">
                Requisition Vector
              </h3>

              <div className="border-b border-[#d4af37]/10 pb-6 mb-6">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Selected Loadout</span>
                <h4 className="text-xl font-sans font-black text-white uppercase tracking-wider mt-1">
                  {selectedPlan.name}
                </h4>
                <p className="text-[10px] font-mono text-[#e5c158] uppercase tracking-widest mt-1">
                  {billing === "yearly" ? "Annual Protocol Plan" : "Monthly Protocol Plan"}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-400 uppercase">Subtotal allocation</span>
                  <span>${selectedPlan.price}.00</span>
                </div>
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-400 uppercase">Zero-Knowledge Tax</span>
                  <span>$0.00</span>
                </div>
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-400 uppercase">Gateway Tunnel Fee</span>
                  <span>$0.00</span>
                </div>
              </div>
            </div>

            <div className="border-t border-[#d4af37]/10 pt-6 mt-8">
              <div className="flex justify-between items-baseline mb-6">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">Total Amount Due</span>
                <div className="text-right">
                  <span className="text-3xl font-sans font-black">${selectedPlan.price}</span>
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest ml-1">USD</span>
                </div>
              </div>

              <div className="p-4 bg-[#070709] rounded-xl border border-[#d4af37]/10 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-[#e5c158] shrink-0 mt-0.5" />
                <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest leading-loose">
                  Purchasing initiates a secure peer-to-peer routing contract. All services auto-renew. Scraping sequences execute upon latency warnings.
                </p>
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}

export default function CheckoutSimulatorPage() {
  return (
    <Suspense fallback={
      <div className="w-full min-h-screen bg-[#020203] flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-[#e5c158]" />
      </div>
    }>
      <CheckoutSimulatorContent />
    </Suspense>
  );
}
