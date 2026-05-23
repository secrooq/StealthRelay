import { FileText } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen w-full bg-[#020203] pt-20 pb-32 relative overflow-hidden font-mono">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(212,175,55,0.03),transparent_40%)]" />

      <div className="max-w-3xl mx-auto px-6 relative z-10">
        <div className="border-b border-white/10 pb-6 mb-12 flex items-end justify-between">
          <div>
             <div className="text-[10px] text-[#e5c158] tracking-[0.3em] mb-2 font-bold">PROTOCOL 82-B</div>
             <h1 className="text-3xl font-black text-white uppercase">Terms of Engagement</h1>
          </div>
          <FileText className="w-8 h-8 text-[#d4af37]/35 mb-2" />
        </div>

        <article className="space-y-10 text-sm text-slate-200 leading-relaxed">
          <section>
            <h2 className="text-[#e5c158] font-bold mb-3 uppercase tracking-widest text-xs">[A] FIELD OF OPERATION</h2>
            <p>
              By activating a StealthRelay node, the operative assumes full unilateral accountability for all payloads and data packets distributed across our mesh. Utilization for illicit digital warfare or unlicensed exploitation results in immediate node revocation.
            </p>
          </section>

          <section>
            <h2 className="text-[#e5c158] font-bold mb-3 uppercase tracking-widest text-xs">[B] SERVICE CONTINUITY GUARANTEE</h2>
            <p>
              While the platform utilizes world-class geographically distributed mesh networking, quantum instability or carrier provider disruptions may occur. We warrant zero availability for missions outside the nominal operating matrix.
            </p>
          </section>

          <section>
            <h2 className="text-[#e5c158] font-bold mb-3 uppercase tracking-widest text-xs">[C] COMMUNICATION AUDITS &amp; MARKETING ENVELOPE CONSENT</h2>
            <p>
              All operatives registering or maintaining nodes within the StealthRelay environment (including free trials, active subscriptions, lapsed subscriptions, or fully terminated tiers) explicitly authorize StealthRelay to utilize their registered contact addresses to dispatch regular communication logs, operational briefings, system promotions, and custom marketing updates. This authorization forms a core part of the service agreement, ensuring transparency in administrative and technical changes. Options to adjust subscription parameters are included in each outbound dispatch packet.
            </p>
          </section>

          <div className="pt-12 border-t border-white/5 flex justify-between items-center opacity-50">
            <div className="text-[9px]">LAST REVISED: STARDATE 2026.05</div>
            <div className="h-[1px] w-20 bg-[#d4af37]/30"></div>
          </div>
        </article>
      </div>
    </div>
  );
}
