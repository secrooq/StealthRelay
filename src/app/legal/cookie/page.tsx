import React from 'react';
import Link from 'next/link';
import { Eye, ChevronLeft } from 'lucide-react';

export const metadata = {
  title: 'Cookie & Privacy Policy | Stealth Relay',
  description: 'Learn how Stealth Relay operates with absolute minimum metadata, zero tracking, and local cookie isolates.',
};

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-[#040405] text-slate-300 px-6 py-20 flex flex-col items-center">
      <div className="max-w-3xl w-full space-y-10">
        <div className="space-y-4">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-[#d4af37] transition">
            <ChevronLeft className="w-4 h-4" /> [Back to Terminal]
          </Link>
          <h1 className="text-3xl font-mono font-black text-white uppercase tracking-[0.2em] leading-tight">
            Cookie &amp; Privacy Policy
          </h1>
          <p className="text-xs text-[#e5c158] font-mono uppercase tracking-widest">
            Last Updated: May 2026 | Minimalist Privacy Protocols
          </p>
        </div>

        <div className="prose prose-invert max-w-none space-y-6 font-mono text-xs leading-relaxed text-slate-350">
          <p>
            Stealth Relay is built with a singular design principle: <strong>Absolute zero-knowledge digital sovereignty.</strong> We do not track, profile, or sell user telemetry. All features are optimized to run with minimal server footprints.
          </p>

          <h2 className="text-sm font-mono font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2 pt-4">
            1. Cookie Usage Guidelines
          </h2>
          <p>
            We use strictly necessary technical cookies to securely preserve session identities, maintain administrative OTP access, and store client-side preferences. We DO NOT use advertising tracking pixels, cross-domain behavioral cookies, or secondary profiling matrices.
          </p>
          <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01]">
            <ul className="space-y-2">
              <li>• <strong>stealth_session:</strong> Maintains encrypted edge authenticated sessions (expires on window close or maximum 12 hours).</li>
              <li>• <strong>stealth_vault_key:</strong> Kept strictly inside temporary <code>sessionStorage</code> in the browser. It never reaches the network edge.</li>
            </ul>
          </div>

          <h2 className="text-sm font-mono font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2 pt-4">
            2. Privacy Safeguards
          </h2>
          <p>
            Because all file storage (StealthBox) processes AES-GCM encryption client-side, the files residing in our database isolates are fully encrypted and mathematically unreadable. Outbound dispatches bleached using our OffscreenCanvas engine guarantee that zero location, camera, or author metadata is ever uploaded.
          </p>

          <h2 className="text-sm font-mono font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2 pt-4">
            3. Data Erasure Rights
          </h2>
          <p>
            You hold total control over your digital footprint. Deleting a secure file, removing a custom domain suffix, or deleting an alias from the Relay Grid triggers immediate and permanent SQLite transactional purge sequences. Expired accounts are automatically wiped from existence within 3 days.
          </p>
        </div>
      </div>
    </div>
  );
}
