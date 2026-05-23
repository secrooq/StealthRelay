import type { Metadata } from "next";
import { Shield, FileText, CheckCircle, Terminal, Heart, ExternalLink } from "lucide-react";

export const metadata: Metadata = {
  title: "Legal Mandates & Privacy Directives | Stealth Relay",
  description: "Review the Terms of Immunity, Zero-Knowledge Mandates, and Warrant Canary updates.",
};

export default function LegalPage() {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-transparent text-slate-200 flex flex-col items-center selection:bg-[#d4af37]/30 relative overflow-hidden font-mono">
      <div className="max-w-5xl w-full px-6 py-24 md:py-32 relative z-10">
        
        {/* Heading */}
        <div className="flex flex-col items-center text-center mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#d4af37]/10 border border-[#d4af37]/20 rounded-full text-[#e5c158] text-xs font-mono uppercase tracking-widest mb-6">
            <Shield className="w-3.5 h-3.5" /> Regulatory Mandate
          </div>
          <h1 className="text-4xl md:text-5xl font-mono font-black tracking-tight text-white uppercase mb-6 leading-none">
            Legal <span className="text-slate-400">&amp;</span> Protections
          </h1>
          <p className="text-slate-400 max-w-2xl text-xs md:text-sm leading-relaxed uppercase tracking-wider">
            Stealth Relay is legally and architecturally bound to protect user identities. Below is the definitive summary of your protections and guarantees.
          </p>
        </div>

        {/* Core Accordion Summaries */}
        <div className="space-y-8 mb-24">
          {[
            {
              title: "Privacy Mandate (Data Minimization)",
              desc: "Our default data posture is 'collect nothing'. We do not monitor incoming email bodies (unless strictly scanned temporarily for links on-the-fly to strip trackers), nor store plaintext metadata. Once an alias email is destroyed, all related relational indexes are completely erased.",
              points: ["Zero IP telemetry collection on Vault operations", "No storage of unencrypted payload buffers", "All logs expire automatically after 48 hours"]
            },
            {
              title: "Terms of Immunity (Acceptable Usage)",
              desc: "Users retain 100% legal liability for encrypted data stored in their private silo. Stealth Relay does not actively inspect, filter, or moderate Zero-Knowledge files. However, automated server network abuse or denial-of-service activities will result in immediate IP-level boundary revocation.",
              points: ["Silo keys strictly held by local browser state", "Automated systems prevent outgoing network spam", "Illegal network penetration operations prohibited"]
            },
            {
              title: "GDPR & International Secrecy Consistency",
              desc: "Every human has a fundamental right to control their data. We extend full GDPR-level deletion controls to every inhabitant of Earth, regardless of their national geography. Deletion requests require 1 click inside the control console.",
              points: ["Full GDPR Article 17 consistency globally", "Single-step master key and bucket purges", "Zero selling of behavioral navigation analytics"]
            }
          ].map((item, index) => (
            <div key={index} className="border border-white/10 bg-[#070709]/80 backdrop-blur-xl rounded-2xl p-8 hover:border-[#d4af37]/40 transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-slate-900 border border-white/10 rounded flex items-center justify-center">
                  <FileText className="w-4 h-4 text-slate-300" />
                </div>
                <h3 className="text-xl font-mono font-bold text-white uppercase tracking-wide">
                  {item.title}
                </h3>
              </div>
              <p className="text-slate-400 leading-relaxed mb-6 text-xs md:text-sm uppercase tracking-wider">
                {item.desc}
              </p>
              <ul className="space-y-3">
                {item.points.map((pt, pidx) => (
                  <li key={pidx} className="flex items-start gap-3 text-xs md:text-sm text-slate-300">
                    <CheckCircle className="w-4 h-4 text-[#e5c158] shrink-0 mt-0.5" />
                    <span className="uppercase tracking-wider">{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* COMPLIANCE & TRUST HUB GRID */}
        <div className="mb-24 relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#d4af37]/15 to-transparent rounded-2xl blur-lg opacity-30 pointer-events-none" />
          
          <div className="relative bg-[#070709]/90 border border-white/10 p-8 md:p-10 rounded-2xl">
            <h2 className="text-2xl font-mono font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-[#e5c158]" /> Infrastructure Compliance &amp; Trust
            </h2>
            <p className="text-slate-400 text-xs md:text-sm leading-relaxed mb-10 uppercase tracking-widest leading-loose">
              Stealth Relay runs on Cloudflare's serverless edge infrastructure (Workers, R2, D1) and processes billing natively through Stripe. We inherit a world-class spectrum of independent compliance audits out-of-the-box, ensuring complete physical, operational, and database security parity.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  code: "SOC 2 / SOC 3",
                  title: "Security & Availability Audited",
                  detail: "Inherited SOC 2 Type II and SOC 3 compliance reports. Physical data centers and operational networks meet rigorous independent audit controls."
                },
                {
                  code: "ISO/IEC 27001",
                  title: "Global Security Parity Standards",
                  detail: "System endpoints inherit ISO/IEC 27001 (Information Security Management) and ISO 27018 (PII protection in public clouds) infrastructure credentials."
                },
                {
                  code: "GDPR & CCPA Compliant",
                  title: "Built-in Data Minimization",
                  detail: "Fully optimized for EU/UK GDPR and CCPA alignment. All network transit is routed using Cloudflare's high-privacy edge protocols with global deletion options."
                },
                {
                  code: "PCI DSS Level 1",
                  title: "Zero In-House Credit Card Handling",
                  detail: "Operatives are billed securely. All payment information flows directly to Stripe's Level 1 PCI DSS tokenization gateway. We store zero raw transaction records."
                },
                {
                  code: "HIPAA Alignment",
                  title: "Non-Custodial PHI Security",
                  detail: "No Protected Health Information (PHI) is readable by our servers. Because files are encrypted locally in browser RAM before upload, the system is natively compliant."
                },
                {
                  code: "ITAR / EAR Ready",
                  title: "Decentralized Key Isolation",
                  detail: "Export-controlled data is isolated strictly using local device-level PBKDF2/AES key envelopes, ensuring unencrypted payloads never traverse the network."
                }
              ].map((comp, idx) => (
                <div key={idx} className="bg-black/45 border border-white/5 p-5 rounded-xl hover:border-[#d4af37]/30 transition-all duration-300 relative group text-left">
                  <span className="bg-[#d4af37]/10 border border-[#d4af37]/35 text-[#e5c158] text-[9px] px-2 py-0.5 rounded font-mono font-bold uppercase tracking-widest block w-fit mb-3">
                    {comp.code}
                  </span>
                  <h4 className="text-white font-mono font-bold uppercase text-xs mb-2 tracking-wide group-hover:text-[#e5c158] transition-colors">
                    {comp.title}
                  </h4>
                  <p className="text-slate-400 font-mono text-[10px] uppercase leading-relaxed tracking-wider">
                    {comp.detail}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 text-left text-[10px] text-slate-500 font-mono uppercase tracking-widest flex items-center justify-between flex-wrap gap-4 font-mono">
              <span>Data Processors: Cloudflare Inc. &amp; Stripe Inc.</span>
              <a 
                href="https://www.cloudflare.com/trust-hub/compliance-resources/" 
                target="_blank" 
                rel="noreferrer"
                className="text-[#e5c158] hover:underline flex items-center gap-1.5 shrink-0"
              >
                Cloudflare Trust Hub <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Warrant Canary Section */}
        <div className="border border-[#d4af37]/30 bg-[#070709]/85 backdrop-blur-xl rounded-2xl p-8 md:p-12 relative overflow-hidden shadow-2xl">
          <div className="flex flex-col md:flex-row gap-12 items-start">
            <div className="md:w-2/3">
              <h2 className="text-2xl font-mono font-black text-white uppercase tracking-wider mb-6 flex items-center gap-3">
                <Terminal className="w-5 h-5 text-[#e5c158] animate-pulse" /> Current Warrant Canary
              </h2>
              <div className="space-y-4 font-mono text-xs text-[#e5c158]/70 bg-black/40 p-6 rounded-xl border border-[#d4af37]/20 leading-relaxed uppercase tracking-wider">
                <p>-- START MANDATORY CANARY UPDATE --</p>
                <p>TIMESTAMP: {today}</p>
                <p>STATUS: CLEAR</p>
                <p>Stealth Relay operates under strict Zero-Knowledge architectures. As of today:</p>
                <p>1. Stealth Relay has received NO national security letters.</p>
                <p>2. Stealth Relay has received NO gag orders or secret court warrants.</p>
                <p>3. No administrative decryption backdoors have been implemented.</p>
                <p>-- END CANARY SIGNATURE --</p>
              </div>
            </div>
            
            <div className="md:w-1/3 flex flex-col justify-center h-full pt-6">
              <p className="text-slate-400 text-xs md:text-sm leading-relaxed mb-6 uppercase tracking-wider">
                Due to our mathematical Zero-Knowledge design, even in the event of physical hardware seizure, third parties cannot access files because the underlying cipher keys reside strictly on your own terminal.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#e5c158] text-xs font-mono rounded uppercase tracking-widest font-bold self-start select-none">
                Status: Immune
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
