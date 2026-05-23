export default function SecurityPage() {
  return (
    <div className="w-full min-h-screen bg-[#020203] py-20 px-6 font-mono">
      <div className="max-w-4xl mx-auto">
        
        <div className="mb-16 text-center">
          <h1 className="text-xs font-bold text-red-500 uppercase tracking-[0.4em] mb-4 animate-pulse">CRITICAL DOCTRINE</h1>
          <h2 className="text-4xl md:text-5xl font-black uppercase text-white mb-6 tracking-tighter">Operational Security</h2>
          <p className="text-slate-100 text-sm max-w-xl mx-auto leading-relaxed">
            Detailed breakdown of anti-surveillance mechanisms enforcing total infrastructure agnosticism.
          </p>
        </div>

        <div className="space-y-12">
          <section className="border border-white/10 bg-[#050507] p-8 rounded relative">
            <div className="absolute -top-3 -left-3 bg-red-600 text-white text-[9px] font-bold px-2 py-1 uppercase">01. Key Sovereignty</div>
            <h3 className="text-xl font-bold text-white uppercase mb-4">Zero-Knowledge Derivation</h3>
            <p className="text-slate-200 text-sm leading-relaxed mb-4">
              Standard centralized SaaS architecture ingests passwords and hashes them server-side. StealthRelay NEVER ingests your master passphrase. 
            </p>
            <ul className="list-disc pl-6 text-xs text-slate-100 space-y-2">
              <li>PBKDF2 derivation executes entirely within your local Web Crypto sandbox.</li>
              <li>Generated 256-bit Symmetric Key encrypts data BEFORE transmission.</li>
              <li>Our Cloudflare R2 nodes exclusively store ciphertext buffers. Even with full database access, system admins cannot read contents.</li>
            </ul>
          </section>

          <section className="border border-white/10 bg-[#050507] p-8 rounded relative">
            <div className="absolute -top-3 -left-3 bg-blue-600 text-white text-[9px] font-bold px-2 py-1 uppercase">02. Forwarding Hygiene</div>
            <h3 className="text-xl font-bold text-white uppercase mb-4">Transient Edge Transit</h3>
            <p className="text-slate-200 text-sm leading-relaxed">
              StealthRelay Aliasing acts as a blind conduit. Incoming SMTP payloads are parsed in ephemeral Cloudflare Worker memory. 
              Post-forwarding, the runtime container is incinerated. 
              No transactional mail logs, sender-to-receiver linkage tables, or content caches persist on the filesystem.
            </p>
          </section>

          <section className="border border-white/10 bg-[#050507] p-8 rounded relative">
            <div className="absolute -top-3 -left-3 bg-emerald-600 text-white text-[9px] font-bold px-2 py-1 uppercase">03. Retention Routine</div>
            <h3 className="text-xl font-bold text-white uppercase mb-4">Latency Purge Protocol</h3>
            <p className="text-slate-200 text-sm leading-relaxed">
              Accounts in perpetual stagnation accumulate metadata vulnerability. StealthRelay automates strict erasure of dormant entities after 14 days of lapsed support status to eliminate stagnant exploit surface area.
            </p>
          </section>
        </div>

        <div className="mt-20 p-6 bg-white/5 text-center text-[10px] text-slate-100 rounded">
          SYSTEM COMPLIANCE: MIL-SPEC 256 | ZERO-LOG MANDATE ACTIVE | FORENSICALLY HARDENED
        </div>

      </div>
    </div>
  );
}
