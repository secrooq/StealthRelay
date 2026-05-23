import { Lock } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen w-full bg-[#020203] pt-20 pb-32 relative overflow-hidden font-mono">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.03),transparent_40%)]" />
      
      <div className="max-w-3xl mx-auto px-6 relative z-10">
        <div className="border-b border-white/10 pb-6 mb-12 flex items-end justify-between">
          <div>
             <div className="text-[10px] text-[#e5c158] tracking-[0.3em] mb-2 font-bold">DIRECTIVE 12-ALPHA</div>
             <h1 className="text-3xl font-black text-white uppercase">Privacy Manifesto</h1>
          </div>
          <Lock className="w-8 h-8 text-[#d4af37]/35 mb-2" />
        </div>

        <article className="space-y-10 text-sm text-slate-200 leading-relaxed">
          <section>
            <h2 className="text-[#e5c158] font-bold mb-3 uppercase tracking-widest text-xs">[01] ZERO-PERSISTENCE MANTRA</h2>
            <p>
              All data inputs into the StealthSecret network are buffered directly to volatile memory, encrypted, and transmitted to storage. Upon expiration or intentional Burn command, the cryptographic keys are purged, guaranteeing algorithmic fragmentation of the underlying bytes. No secondary backups are archived.
            </p>
          </section>

          <section>
            <h2 className="text-[#e5c158] font-bold mb-3 uppercase tracking-widest text-xs">[02] ENCRYPTED INGRESS PACKETS</h2>
            <p>
              E-mail payloads processed via StealthRelay are scanned solely for malicious byte-signatures and dynamically forwarded. Content storage does not occur unless actively requested and explicitly key-bound by the user.
            </p>
          </section>

          <section>
            <h2 className="text-[#e5c158] font-bold mb-3 uppercase tracking-widest text-xs">[03] OPERATIVE MARKETING &amp; COMMUNICATION CONSENT</h2>
            <p>
              By registering an account or initiating an active node on the StealthRelay network, all users—regardless of subscription status (including active, lapsed, or free operational tiers)—explicitly consent to the ingestion and utilization of their primary contact email for administrative briefings, tactical system announcements, exclusive promotions, and customized marketing campaign vectors directly dispatched by StealthRelay. These communications can be managed or opted out of via the unsubscribe directives provided in the dispatch vectors.
            </p>
          </section>

          <section className="bg-white/5 border border-white/10 p-6 rounded text-xs">
            <div className="text-[#e5c158] font-bold mb-2">LEGAL WARNING:</div>
            Compliance is algorithmic. Your telemetry is obscured by design and we hold zero access vectors into your locked vaults.
          </section>
        </article>
      </div>
    </div>
  );
}
