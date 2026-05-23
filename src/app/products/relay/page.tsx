import Link from "next/link";
import { Mail, Shield, ShieldAlert, ShieldCheck, ArrowRight, HelpCircle, EyeOff, Key, Globe } from "lucide-react";

export const metadata = {
  title: "StealthRelay Mail Masking | Dynamic Anonymous Email forwarding",
  description: "Protect your personal inbox with dynamic, encrypted email aliases. Prevent spam, block 1x1 tracking pixels, and sign payloads with auto-configured OpenPGP bridging.",
};

export default function RelayProductPage() {
  const specs = [
    { icon: ShieldCheck, title: "Edge Pixel Bleaching", desc: "Incoming payloads are dynamically sanitised of hidden tracking pixels, telemetry URLs, and malicious script links." },
    { icon: Key, title: "OpenPGP Auto-Bridge", desc: "Deploy dynamic inbound encryption. Inbound messages are automatically encrypted with your public PGP key before being forwarded." },
    { icon: Globe, title: "Custom BYOD Routing", desc: "Bind personal domain catch-all routers. Spin up unique, provider-specific aliases instantly on your own domains." }
  ];

  const faqs = [
    { q: "How does StealthRelay prevent spam exfiltration?", a: "By generating dynamic, random forwarding aliases for each service, spam is locked to that specific alias. If a service sells your data or leaks it, you can toggle that single alias off instantly, completely cutting off the spam vector without affecting your real email." },
    { q: "Is inbound mail processed in plain-text?", a: "No. StealthRelay integrates OpenPGP auto-bridging. Our edge nodes immediately wrap inbound payloads with your imported public PGP key at the entry portal, ensuring the rest of the transit leg to your main mailbox is fully encrypted." },
    { q: "Can I reply using my dynamic aliases?", a: "Yes. Inbound emails carry a secure, cryptographically hashed return path. Replying to a forwarded email routes your response back through the dynamic grid, stripping your true email headers and delivering it sterile to the recipient." }
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
          <span className="text-[#e5c158]">StealthRelay</span>
        </div>

        {/* HERO TITLE */}
        <div className="mb-20 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#d4af37]/20 bg-[#d4af37]/5 text-[#e5c158] font-mono text-[10px] uppercase tracking-[0.2em] mb-4">
            <Mail className="w-3.5 h-3.5" /> Dynamic Ingestion Grid
          </div>
          <h1 className="text-4xl md:text-6xl font-mono font-black uppercase text-white tracking-tighter mb-6 leading-none">
            STEALTH<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] to-[#e5c158]">RELAY</span> MAIL MASKING
          </h1>
          <p className="text-slate-400 font-mono max-w-3xl text-xs md:text-sm leading-relaxed uppercase tracking-wider">
            A high-performance dynamic forwarding matrix built on distributed edge nodes. Protect your primary mailbox vector, decontaminate tracking pixels, and sustain complete cross-site identity concealment.
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
            <h2 className="text-lg font-mono font-bold text-white uppercase mb-4">Fragmented Identity &amp; Leakage</h2>
            <p className="text-xs md:text-sm text-slate-400 font-mono leading-relaxed uppercase tracking-wider">
              Every website sign-up exfiltrates your primary email address. Malicious marketing agencies, tracking firms, and brokers cross-reference this single value to map your digital footprints across the web. To make matters worse, modern emails are embedded with 1x1 tracking pixels that silently notify senders when, where, and on what device you opened them.
            </p>
          </div>

          {/* Solution Card */}
          <div className="bg-[#0c0e0b]/80 border border-emerald-500/10 p-8 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/[0.02] rounded-bl-full pointer-events-none" />
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest mb-4">
              <ShieldCheck className="w-4 h-4" /> The Solution Offered
            </div>
            <h2 className="text-lg font-mono font-bold text-white uppercase mb-4">Edge Decoupled Mail Proxying</h2>
            <p className="text-xs md:text-sm text-slate-400 font-mono leading-relaxed uppercase tracking-wider">
              StealthRelay decouples your real mailbox. Our system deploys unique dynamic email forwarding aliases for each service. All inbound payloads are intercepted, decontaminated of telemetry trackers and exfiltration code at the edge, signed with OpenPGP dynamic encryption, and delivered sterile straight to your primary destination box.
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
            <h4 className="text-white font-mono font-bold uppercase mb-1 tracking-wider">Ready to secure your mail vectors?</h4>
            <p className="text-[#e5c158]/70 font-mono text-[10px] uppercase tracking-widest">Deploy dynamic email forwarding in under 60 seconds.</p>
          </div>
          <Link href="/relay" className="px-6 py-3.5 bg-[#d4af37] hover:bg-white text-black font-mono font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(212,175,55,0.2)] rounded-xl transition-all duration-300">
            Initialize Grid
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
            "name": "StealthRelay Mail Masking",
            "description": "Dynamic email aliasing and anonymous forwarding proxy service using client-side keys.",
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
