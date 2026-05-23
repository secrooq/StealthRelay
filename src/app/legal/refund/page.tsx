import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ChevronLeft } from 'lucide-react';

export const metadata = {
  title: 'Refund & Trial Policy | Stealth Relay',
  description: 'Learn about our 14-day free trial on all plans and our 14-day money-back guarantee.',
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-[#040405] text-slate-300 px-6 py-20 flex flex-col items-center">
      <div className="max-w-3xl w-full space-y-10">
        <div className="space-y-4">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-[#d4af37] transition">
            <ChevronLeft className="w-4 h-4" /> [Back to Terminal]
          </Link>
          <h1 className="text-3xl font-mono font-black text-white uppercase tracking-[0.2em] leading-tight">
            Refund &amp; Trial Policy
          </h1>
          <p className="text-xs text-[#e5c158] font-mono uppercase tracking-widest">
            Effective: May 2026 | 14-Day Guarantees &amp; Trials
          </p>
        </div>

        <div className="prose prose-invert max-w-none space-y-6 font-mono text-xs leading-relaxed text-slate-350">
          <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/5 text-emerald-400 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="m-0 leading-normal">
              <strong>100% SATISFACTION GUARANTEED:</strong> All registered operators get access to a 14-day free trial across all subscriptions. Cancel at any time during the first 14 days and pay absolutely nothing.
            </p>
          </div>

          <h2 className="text-sm font-mono font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2 pt-4">
            1. 14-Day Free Trial Provision
          </h2>
          <p>
            To allow complete evaluation of our premium tactical secure storage, canvas EXIF purges, and domain matrix features, Stealth Relay provides a <strong>14-day free trial</strong> across all paid tiers: Private Contractor, Phantom Entity, and Enterprise Core.
          </p>
          <p>
            During this 14-day period, all operational vectors are fully unlocked. You may terminate your subscription directly via the dashboard settings or Cloudflare Billing interface before the 14 days elapse, and no payment method will be charged.
          </p>

          <h2 className="text-sm font-mono font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2 pt-4">
            2. 14-Day Money-Back Guarantee
          </h2>
          <p>
            If you choose to continue after your trial and payment is completed, you remain protected by our <strong>14-day money-back guarantee</strong>. If you are unsatisfied with the network capabilities or zero-knowledge vault execution, contact <span className="text-[#e5c158]">info@stealthrelay.com</span> within 14 days of the charge for a full 100% refund.
          </p>

          <h2 className="text-sm font-mono font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2 pt-4">
            3. Finality &amp; Post-Expiration Purge
          </h2>
          <p>
            Once the 14-day post-payment refund window elapses, all charges are final and strictly non-refundable. 
          </p>
          <p>
            If an account becomes unpaid or enters an expired state, all active metadata, secure files (StealthBox), custom domain connections, and mailbox aliases are locked immediately. <strong>To guarantee zero-knowledge absolute sanitation, all expired user files and configurations are irreversibly deleted from our SQLite D1 database enclaves within 3 days post-expiration.</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
