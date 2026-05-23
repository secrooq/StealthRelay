import Link from "next/link";
import { Lock, Shield, ShieldAlert, ShieldCheck, HelpCircle, HardDrive, Cpu, Image } from "lucide-react";

export const metadata = {
  title: "StealthVault Cloud Box | Zero-Knowledge Encrypted Archive Storage",
  description: "Non-custodial zero-knowledge storage vault. Your documents are encrypted strictly in browser RAM before upload, blocking custodial leaks and tracking vectors.",
};

export default function VaultProductPage() {
  const specs = [
    { icon: Cpu, title: "Browser RAM Cryptography", desc: "Files are split into dynamic chunks and encrypted completely inside your local memory sandbox. Senders retain exclusive control over keys." },
    { icon: Image, title: "RAM Metadata Bleaching", desc: "Images and attachments are automatically bleached of active EXIF tracking, device logs, and hidden coordinates before leaving your node." },
    { icon: Lock, title: "PBKDF2 Key Derivation", desc: "Your master password derives strong AES key parameters client-side. We have absolute zero knowledge of your encryption hashes." }
  ];

  const faqs = [
    { q: "What does 'non-custodial' storage mean?", a: "Traditional cloud providers (like Google Drive or OneDrive) hold the decryption keys to your files, meaning they can read, index, or hand over your records. StealthVault is completely non-custodial: your encryption keys are derived dynamically inside your browser's RAM and are never sent to our servers. Only you can unlock your vault." },
    { q: "What happens if I lose my master vault credentials?", a: "Because we enforce a strict zero-knowledge architecture, we do not store your password or key hashes, meaning we cannot reset your password or recover your files if credentials are lost. Senders must print or backup their master offline recovery keys to safeguard access." },
    { q: "Are files scanned or indexed by AI?", a: "Absolutely not. Because all documents are encrypted with AES-256-GCM client-side before network upload, they appear on our server nodes as sterile, scrambled cryptographic blocks. No AI scrapers, search indices, or servers can read a single byte." }
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
          <span className="text-[#e5c158]">StealthVault</span>
        </div>

        {/* HERO TITLE */}
        <div className="mb-20 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#d4af37]/20 bg-[#d4af37]/5 text-[#e5c158] font-mono text-[10px] uppercase tracking-[0.2em] mb-4">
            <HardDrive className="w-3.5 h-3.5" /> Non-Custodial Secure Archive
          </div>
          <h1 className="text-4xl md:text-6xl font-mono font-black uppercase text-white tracking-tighter mb-6 leading-none">
            STEALTH<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] to-[#e5c158]">VAULT</span> CLOUD BOX
          </h1>
          <p className="text-slate-400 font-mono max-w-3xl text-xs md:text-sm leading-relaxed uppercase tracking-wider">
            Sovereign, non-custodial cloud storage archives designed to withstand targeted data intrusion. Secure your pre-patent ideas, legal files, trade secrets, and recovery seeds with browser-level AES security.
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
            <h2 className="text-lg font-mono font-bold text-white uppercase mb-4">Custodial Breaches &amp; Queries</h2>
            <p className="text-xs md:text-sm text-slate-400 font-mono leading-relaxed uppercase tracking-wider">
              Traditional cloud storage companies hold the mathematical keys to your uploaded files. Their algorithms read and catalog your archives to feed search indexes and build profile matrices. If their database gets breached, or if they receive a warrantless legal query, your private trade secrets and confidential documents are immediately exposed.
            </p>
          </div>

          {/* Solution Card */}
          <div className="bg-[#0c0e0b]/80 border border-emerald-500/10 p-8 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/[0.02] rounded-bl-full pointer-events-none" />
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest mb-4">
              <ShieldCheck className="w-4 h-4" /> The Solution Offered
            </div>
            <h2 className="text-lg font-mono font-bold text-white uppercase mb-4">Zero-Knowledge Isolation</h2>
            <p className="text-xs md:text-sm text-slate-400 font-mono leading-relaxed uppercase tracking-wider">
              StealthVault enforces a strict zero-knowledge architecture. All file chunks are encrypted directly within your local device's browser memory (RAM) sandbox before a single packet is broadcasted. Senders generate and hold the key parameters privately. Our servers only ingest locked, sterile cryptographic blocks.
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
            <h4 className="text-white font-mono font-bold uppercase mb-1 tracking-wider">Ready to claim non-custodial cloud storage?</h4>
            <p className="text-[#e5c158]/70 font-mono text-[10px] uppercase tracking-widest">Configure your zero-knowledge storage vault in under 60 seconds.</p>
          </div>
          <Link href="/vault" className="px-6 py-3.5 bg-[#d4af37] hover:bg-white text-black font-mono font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(212,175,55,0.2)] rounded-xl transition-all duration-300">
            Access Vault
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
            "name": "StealthVault Cloud Box",
            "description": "Zero-knowledge non-custodial cloud storage box featuring local RAM chunk encryption.",
            "brand": {
              "@type": "Brand",
              "name": "StealthRelay"
            },
            "offers": {
              "@type": "Offer",
              "price": "15.00",
              "priceCurrency": "USD",
              "availability": "https://schema.org/InStock"
            }
          })
        }}
      />
    </div>
  );
}
