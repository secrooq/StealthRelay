import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ChevronLeft } from 'lucide-react';

export const metadata = {
  title: 'Legal Disclaimer | Stealth Relay',
  description: 'Legal disclaimer and limitations of liability regarding the use of Stealth Relay privacy-as-a-service utilities.',
};

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-[#040405] text-slate-300 px-6 py-20 flex flex-col items-center">
      <div className="max-w-3xl w-full space-y-10">
        <div className="space-y-4">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-[#d4af37] transition">
            <ChevronLeft className="w-4 h-4" /> [Back to Terminal]
          </Link>
          <h1 className="text-3xl font-mono font-black text-white uppercase tracking-[0.2em] leading-tight">
            Legal Disclaimer
          </h1>
          <p className="text-xs text-[#e5c158] font-mono uppercase tracking-widest">
            Last Updated: May 2026 | General Liability Limitation Guidelines
          </p>
        </div>

        <div className="prose prose-invert max-w-none space-y-6 font-mono text-xs leading-relaxed text-slate-350">
          <div className="p-4 rounded-xl border border-yellow-500/20 bg-yellow-950/5 text-yellow-400 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="m-0 leading-normal">
              <strong>ATTENTION OPERATIVES:</strong> By executing cryptographic commands or interacting with the Stealth Relay network matrices, you agree to the complete exclusion of liability outlined herein.
            </p>
          </div>

          <h2 className="text-sm font-mono font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2 pt-4">
            1. Service Provisions & Cryptography
          </h2>
          <p>
            Stealth Relay provides browser-side zero-knowledge encrypted storage (StealthBox), temporary encrypted note dispatches (StealthSecret), and email proxy routing vectors (Relay Grid) on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. 
          </p>
          <p>
            Because all encryption and metadata bleaching operations occur locally in browser sandbox memory before edge propagation, the user bears absolute and sole responsibility for local passcode retention, decryption keys, and private data integrity. Stealth Relay possesses no capacity to retrieve, restore, or reconstruct data if local keys are lost.
          </p>

          <h2 className="text-sm font-mono font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2 pt-4">
            2. High-Risk Exclusion & Lawful Alignment
          </h2>
          <p>
            Stealth Relay is engineered to defend individual digital privacy and is not designed or intended for use in activities violating regional, national, or international laws. We actively reject, disclaim, and prohibit any usage associated with malicious intrusion, harassment, fraud, or standard network abuse.
          </p>

          <h2 className="text-sm font-mono font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2 pt-4">
            3. Limitation of Liability
          </h2>
          <p>
            In no event shall Stealth Relay, its core engineers, or operators be liable for any direct, indirect, consequential, special, or exemplary damages, including but not limited to loss of encrypted file vectors, mailbox aliases, custom domain redirects, or system downtime arising from registrar conflicts, Cloudflare isolate outages, or user passphrase degradation.
          </p>
        </div>
      </div>
    </div>
  );
}
