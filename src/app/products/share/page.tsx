import Link from "next/link";
import { Send, Shield, ShieldAlert, ShieldCheck, HelpCircle, Flame, Eye, Lock } from "lucide-react";

export const metadata = {
  title: "StealthShare Ephemeral Secrets | One-Time Secure Sharing Links",
  description: "Share sensitive documents, login credentials, and diagnostic files with one-time read, self-destructing links. Zero persistent server footprints.",
};

export default function ShareProductPage() {
  const specs = [
    { icon: Flame, title: "One-Time Read Destruct", desc: "Decryption keys are embedded in link hashes. Once read, the server node auto-scrubs the encrypted payload permanently." },
    { icon: Eye, title: "Client-Side Sandbox TTL", desc: "Configure precise, sterile lifetimes (from 5 minutes up to 24 hours). Links automatically expire and purge if unread." },
    { icon: Lock, title: "AES Enveloped Transits", desc: "Attachments are encrypted locally prior to upload. Our servers host sterile blocks without any key vectors." }
  ];

  const faqs = [
    { q: "How does 'self-destruction upon read' work?", a: "When you generate a StealthShare link, the cryptographic decryption key resides exclusively inside the URL's anchor hash (the portion after the '#'). Since anchor hashes are never sent to our servers, the server only processes the encrypted payload. When a recipient opens the link, the server serves the block and instantly marks it for deletion. The browser decrypts the file locally in RAM, and the block is wiped forever." },
    { q: "Does any data remain on server caches or backups?", a: "No. StealthShare payload storage runs on ephemeral, dynamic tables. Once deleted or expired, the database rows are hard-scrubbed from physical memory. We maintain zero recovery logs, zero forensic cache backups, and zero metadata archives." },
    { q: "What is the maximum file upload size limit?", a: "Guest sandbox shares support dynamic files up to 250 MB. Active paid operatives with the Contractor plan get up to 500 MB max upload limits, while Phantom and Enterprise tier levels unlock up to 2 GB and 5 GB maximum file upload capabilities." }
  ];

  return (
    <div className="w-full min-h-screen bg-transparent py-24 px-6 relative overflow-hidden selection:bg-[#d4af37]/30">
      {/* Dynamic graphic grids */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.03),transparent_70%)] pointer-events-none" />
      <div className="absolute top-12 left-10 w-80 h-80 bg-[#d4af37]/[0.02] rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        
        {/* Breadcrumbs */}
        <div className="flex gap-2 text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-8">
          <Link href="/" className="hover:text-[#e5c158]">Suite</Link>
          <span>//</span>
          <span className="text-[#e5c158]">StealthShare</span>
        </div>

        {/* HERO TITLE */}
        <div className="mb-20 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#d4af37]/20 bg-[#d4af37]/5 text-[#e5c158] font-mono text-[10px] uppercase tracking-[0.2em] mb-4">
            <Send className="w-3.5 h-3.5" /> Ephemeral Secret Ingress
          </div>
          <h1 className="text-4xl md:text-6xl font-mono font-black uppercase text-white tracking-tighter mb-6 leading-none">
            STEALTH<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] to-[#e5c158]">SHARE</span> EPHEMERAL SECRETS
          </h1>
          <p className="text-slate-400 font-mono max-w-3xl text-xs md:text-sm leading-relaxed uppercase tracking-wider">
            High-fidelity ephemeral transmission vectors. Share highly sensitive passphrases, credentials, private PGP keys, and source archives securely, knowing they will vanish permanently from existence after being read.
          </p>
        </div>

        {/* THE PROBLEM & THE SOLUTION GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          {/* Problem Card */}
          <div className="bg-[#100e0b]/80 border border-red-500/10 p-8 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/[0.02] rounded-bl-full pointer-events-none" />
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-red-400 uppercase tracking-widest mb-4">
              <ShieldAlert className="w-4 h-4" /> The Problem We Face
            </div>
            <h2 className="text-lg font-mono font-bold text-white uppercase mb-4">Lingering Caches &amp; Logs</h2>
            <p className="text-xs md:text-sm text-slate-400 font-mono leading-relaxed uppercase tracking-wider">
              Traditional transfer tools (like WeTransfer, Dropbox, or email attachments) preserve your uploaded files indefinitely inside custodial database backups. Shared file links continue to linger in server logs long after recipients have read them, providing static, high-value vectors for cyber-attackers and metadata profiling sweeps.
            </p>
          </div>

          {/* Solution Card */}
          <div className="bg-[#0c0e0b]/80 border border-emerald-500/10 p-8 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/[0.02] rounded-bl-full pointer-events-none" />
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest mb-4">
              <ShieldCheck className="w-4 h-4" /> The Solution Offered
            </div>
            <h2 className="text-lg font-mono font-bold text-white uppercase mb-4">One-Time Ephemeral Decoupling</h2>
            <p className="text-xs md:text-sm text-slate-400 font-mono leading-relaxed uppercase tracking-wider">
              StealthShare generates secure, transient transport links. Files are encrypted client-side using strong cryptographic parameters. Key envelopes are bound to link fragments, ensuring that once the recipient decodes and opens the document, the physical database block on the server auto-destructs instantly.
            </p>
          </div>
        </div>

        {/* CORE CAPABILITIES SPECS */}
        <div className="border-t border-white/10 pt-16 mb-20">
          <h2 className="font-mono font-bold text-white text-sm tracking-[0.2em] uppercase mb-10 border-l-2 border-[#d4af37] pl-4">Key Specifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {specs.map((spec, i) => (
              <div key={i} className="bg-[#070709]/85 backdrop-blur-xl border border-white/10 p-6 rounded-xl group hover:border-[#d4af37]/40 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-white/10 group-hover:border-[#d4af37]/50 transition-colors" />
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-white/10 group-hover:border-[#d4af37]/50 transition-colors" />

                <div className="w-10 h-10 bg-slate-950 border border-white/10 text-[#e5c158] flex items-center justify-center rounded-lg mb-4 group-hover:bg-[#d4af37] group-hover:text-black transition-all">
                  <spec.icon className="w-5 h-5" />
                </div>
                <h3 className="text-white font-mono font-bold uppercase mb-2 text-base tracking-wide group-hover:text-[#e5c158] transition-colors">{spec.title}</h3>
                <p className="text-slate-400 font-mono text-xs md:text-sm leading-relaxed uppercase tracking-wider">{spec.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ BLOCK */}
        <div className="border-t border-white/10 pt-16">
          <h2 className="font-mono font-bold text-white text-sm tracking-[0.2em] uppercase mb-10 border-l-2 border-[#d4af37] pl-4">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-[#070709]/70 border border-white/5 p-6 rounded-xl text-left">
                <h3 className="font-mono font-bold text-white text-xs md:text-sm uppercase tracking-wider flex items-start gap-2 mb-2">
                  <HelpCircle className="w-4 h-4 text-[#e5c158] shrink-0 mt-0.5" />
                  {faq.q}
                </h3>
                <p className="text-xs md:text-sm text-slate-400 font-mono uppercase tracking-wider pl-6 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* BOTTOM CTA */}
        <div className="mt-20 bg-gradient-to-r from-[#d4af37]/10 via-[#d4af37]/5 to-transparent border border-[#d4af37]/30 p-8 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#d4af37]" />
          <div>
            <h4 className="text-white font-mono font-bold uppercase mb-1 tracking-wider">Ready to dispatch dynamic ephemeral secrets?</h4>
            <p className="text-[#e5c158]/70 font-mono text-[10px] uppercase tracking-widest">Generate and transmit self-destructing links immediately.</p>
          </div>
          <Link href="/" className="px-6 py-3.5 bg-[#d4af37] hover:bg-white text-black font-mono font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(212,175,55,0.2)] rounded-xl transition-all duration-300">
            Share Secret
          </Link>
        </div>

      </div>

      {/* JSON-LD Schema markup for AEO/GEO engine discovery */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": "StealthShare Ephemeral Secrets",
            "description": "Secure one-time-read self-destructing link and transient credential sharing utility.",
            "brand": {
              "@type": "Brand",
              "name": "StealthRelay"
            },
            "offers": {
              "@type": "Offer",
              "price": "0.00",
              "priceCurrency": "USD",
              "availability": "https://schema.org/InStock"
            }
          })
        }}
      />
    </div>
  );
}
