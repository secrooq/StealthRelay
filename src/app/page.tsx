import Link from "next/link";
import Image from "next/image";
import {
  Footprints,
  ServerCrash,
  Eye,
  MailWarning,
  History,
  Network,
  ArrowRight,
  Shield,
  Quote,
  CheckCircle2,
} from "lucide-react";
import NewsletterForm from "@/components/NewsletterForm";
import GuestSecretUploader from "@/components/GuestSecretUploader";

export default function Home() {
  return (
    <div className="flex flex-col w-full bg-transparent text-slate-200 overflow-x-hidden selection:bg-[#d4af37]/35 font-sans">
      {/* SECTION 1: HERO & IMMEDIATE SANDBOX */}
      <section className="relative pt-24 pb-20 md:pt-36 md:pb-28 border-b border-[#d4af37]/15 flex items-center justify-center overflow-hidden bg-transparent">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.035),transparent_70%)] pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-[#d4af37]/25 bg-[#d4af37]/10 text-[#e5c158] text-xs font-mono font-bold tracking-widest uppercase mb-8 shadow-[0_0_15px_rgba(212,175,55,0.08)] animate-pulse">
            <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse" />
            OPERATIONAL SECURITY IMMUNITY PLATFORM
          </div>

          <h1 className="text-4xl md:text-6xl font-display font-black tracking-tight text-white mb-6 leading-none max-w-4xl uppercase tracking-tighter">
            CONFIDENTIAL SECURE CHANNELS.<br />
            SHIELD YOUR DIGITAL TRACE.
          </h1>

          <p className="text-base md:text-lg text-slate-350 max-w-3xl mb-12 leading-relaxed font-medium">
            A premium zero-knowledge security suite. Mask your identity with disposable email aliases, bleach tracking metadata in local memory, and broadcast self-destructing encrypted payloads with absolute sovereign privacy.
          </p>

          {/* HIGH-IMPACT IMMEDIATE SANDBOX AREA */}
          <div className="w-full max-w-3xl mb-16 relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#d4af37]/15 to-transparent rounded-[34px] blur-lg opacity-40 pointer-events-none" />
            <div className="relative group p-1.5 rounded-[30px] bg-[#1a1815]/90 backdrop-blur-xl shadow-2xl border border-[#d4af37]/15 hover:border-[#d4af37]/35 transition-all duration-300">
              <GuestSecretUploader />
            </div>
          </div>

          {/* TRANSPARENT CLOUDFLARE FREE TIER CALCULATION */}
          <div className="w-full max-w-3xl bg-[#1b1915]/50 border border-[#d4af37]/10 rounded-2xl p-6 md:p-8 text-left mb-16 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#d4af37]/5 rounded-bl-full pointer-events-none" />
            <h3 className="text-sm font-mono font-bold uppercase text-[#e5c158] tracking-widest mb-3 flex items-center gap-2">
              ⚡ TRANSPARENT TELEMETRY: 100% FREE GUEST SHARING
            </h3>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-sans mb-4">
              All guest uploads are processed using local client-side memory. Your text (up to <strong>1,000 words</strong>) or files (up to <strong>250 MB</strong>) are sealed inside your device using high-performance <strong>AES-GCM 256-bit encryption</strong> before any bytes touch the network.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[#d4af37]/10 text-xs">
              <div>
                <span className="font-mono font-bold text-[#e5c158] block mb-1">1. ZERO SERVER TRACE</span>
                <span className="text-slate-400">Payloads auto-destruct permanently from storage after read or upon expiration (up to 24 hours).</span>
              </div>
              <div>
                <span className="font-mono font-bold text-[#e5c158] block mb-1">2. CLOUDFLARE R2 TIER</span>
                <span className="text-slate-400">Because files are transient and expire immediately, we utilize Cloudflare's 10GB free R2 storage bracket.</span>
              </div>
              <div>
                <span className="font-mono font-bold text-[#e5c158] block mb-1">3. ZERO EGRESS COST</span>
                <span className="text-slate-400">Cloudflare does not charge bandwidth fees. We pay $0.00 to run it, allowing you to use it completely free.</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md sm:max-w-none justify-center">
            <Link
              href="/relay"
              className="group flex items-center justify-center gap-2 px-8 py-4 bg-[#d4af37] text-[#141310] font-mono text-sm font-black rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:bg-[#e5c158] transition-all duration-300 uppercase tracking-widest"
            >
              Initialize Private Relay{" "}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
            <Link
              href="/features"
              className="flex items-center justify-center gap-2 px-8 py-4 bg-[#1a1815]/80 border border-[#d4af37]/15 text-slate-300 font-mono text-sm font-bold rounded-xl hover:bg-[#201e1a]/95 hover:text-white transition-all duration-300 shadow-xl uppercase tracking-widest"
            >
              View Operations Manual
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 2: PROBLEM (TACTICAL COMPROMISES) */}
      <section className="relative py-24 bg-transparent border-b border-[#d4af37]/15">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col max-w-4xl mb-16 text-left">
            <h2 className="text-3xl md:text-4xl font-display font-black tracking-tight text-white mb-4 uppercase">
              Your Digital Presence is Siphoned.
            </h2>
            <p className="text-sm md:text-base text-slate-400 leading-relaxed uppercase tracking-wider">
              Every digital footprint you leave remains permanently indexed, cataloged, and sold.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Footprints,
                title: "Persistent Footprints",
                desc: "Ordinary accounts bind your daily transactions directly into a permanent trace.",
              },
              {
                icon: ServerCrash,
                title: "Centralized Vaults",
                desc: "Big tech providers hold the keys to your files, rendering them vulnerable to queries.",
              },
              {
                icon: Eye,
                title: "Tracking Metadata",
                desc: "Shared photos silently carry active GPS coordinates and hardware identification markers.",
              },
              {
                icon: MailWarning,
                title: "Exposed Mailboxes",
                desc: "Every signup sells your true email, triggering permanent spam vectors.",
              },
              {
                icon: History,
                title: "Undying Storage",
                desc: "Shared file links live forever in server caches without built-in expiration.",
              },
              {
                icon: Network,
                title: "Identity Linking",
                desc: "Third-party APIs cross-reference separate profiles into a unified personal record.",
              },
            ].map((point, i) => (
              <div
                key={i}
                className="bg-[#1a1815]/80 backdrop-blur-xl p-8 rounded-2xl flex flex-col group border border-[#d4af37]/10 hover:border-[#d4af37]/45 transition-all duration-300 relative overflow-hidden"
              >
                {/* corner decorators */}
                <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-[#d4af37]/20 group-hover:border-[#d4af37]/65 transition-colors" />
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-[#d4af37]/20 group-hover:border-[#d4af37]/65 transition-colors" />

                <div className="w-12 h-12 rounded-xl bg-[#23201b] border border-[#d4af37]/15 flex items-center justify-center text-[#e5c158] mb-6 group-hover:scale-110 transition-transform duration-300 group-hover:shadow-[0_0_12px_rgba(212,175,55,0.15)]">
                  <point.icon className="w-5.5 h-5.5 stroke-[2]" />
                </div>
                <h3 className="text-base font-display font-bold text-white mb-3 uppercase tracking-wider">
                  {point.title}
                </h3>
                <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-sans">
                  {point.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 2.5: THE CONSOLIDATION REVOLUTION */}
      <section className="relative py-24 bg-[#0a0908] border-b border-[#d4af37]/15 overflow-hidden">
        {/* Abstract cyber grids */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(212,175,55,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.015)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-[#d4af37]/[0.02] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#d4af37]/[0.02] rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            
            {/* Value Copy block */}
            <div className="w-full lg:w-1/2 text-left space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#d4af37]/20 bg-[#d4af37]/5 text-[#e5c158] font-mono text-[10px] uppercase tracking-[0.2em]">
                🚀 Consolidation Advantage
              </div>
              <h2 className="text-3xl md:text-5xl font-mono font-black uppercase text-white tracking-tighter leading-none">
                SLASH OVERHEAD. <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] to-[#e5c158]">CONSOLIDATE</span> YOUR SECURE CORES.
              </h2>
              <p className="text-sm md:text-base text-slate-300 leading-relaxed font-sans">
                Why pay for separate, disconnected privacy services that increase your attack footprint? Operatives traditionally subscribe to multiple fragmented platforms, creating administrative overhead and data transit friction.
              </p>
              <div className="space-y-4 pt-2 font-mono text-xs text-slate-400">
                <div className="flex items-start gap-3">
                  <span className="text-[#e5c158] font-bold">✓</span>
                  <span><strong>Zero Inter-Service Leakage</strong>: All components operate on a single, client-side zero-knowledge framework.</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#e5c158] font-bold">✓</span>
                  <span><strong>Stereo Data Transit</strong>: Instantly generate secure ephemeral share vectors straight from your dynamic storage archives.</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#e5c158] font-bold">✓</span>
                  <span><strong>Single Access Matrix</strong>: Manage identities, file lockers, and transient sharing pipelines with one secure master signature.</span>
                </div>
              </div>
            </div>

            {/* Graphic Comparison Cards */}
            <div className="w-full lg:w-1/2 grid grid-cols-1 gap-6 relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-[#d4af37]/10 to-transparent rounded-3xl blur-xl opacity-30 pointer-events-none" />
              
              {/* Legacy Cost Card */}
              <div className="bg-neutral-950/70 border border-white/5 p-6 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-2 h-full bg-red-950/30" />
                <h4 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest mb-4">Fragmented Security Model (3 Subscriptions)</h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs font-mono text-slate-400">
                    <span>1. Mail Masking (SimpleLogin Premium)</span>
                    <span className="text-slate-300 font-bold">$30 - $71/yr</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-mono text-slate-400">
                    <span>2. Secure Vault Storage (NordLocker 500GB)</span>
                    <span className="text-slate-300 font-bold">$95 - $144/yr</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-mono text-slate-400">
                    <span>3. Ephemeral Secrets Sharing (WeTransfer Pro)</span>
                    <span className="text-slate-300 font-bold">$120 - $144/yr</span>
                  </div>
                </div>

                <div className="border-t border-white/5 mt-4 pt-3 flex justify-between items-center font-mono">
                  <span className="text-xs uppercase text-slate-500 tracking-wider">Total Annual Costs</span>
                  <span className="text-red-400 font-bold text-sm line-through">$245 - $359+/year</span>
                </div>
              </div>

              {/* StealthRelay Glowing Consolidated Card */}
              <div className="bg-[#110f0c] border border-[#d4af37]/30 hover:border-[#d4af37]/60 p-6 rounded-2xl relative overflow-hidden transition-all duration-300 shadow-[0_0_40px_rgba(212,175,55,0.06)] group">
                <div className="absolute top-0 right-0 w-2 h-full bg-[#d4af37]" />
                <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-[#d4af37]/45" />
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-[#d4af37]/45" />
                
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-xs font-mono font-bold text-[#e5c158] uppercase tracking-widest">StealthRelay 3-in-1 Unified License</h4>
                  <span className="bg-[#d4af37]/15 border border-[#d4af37]/35 text-[#e5c158] text-[8px] px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">Save Over 50%</span>
                </div>

                <div className="space-y-2.5 mb-6 text-left">
                  <div className="flex items-center gap-2 text-xs font-mono text-white">
                    <span className="text-[#e5c158]">✓</span>
                    <span>Dynamic Forwarding Ingestion (Unlimited Aliases)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-white">
                    <span className="text-[#e5c158]">✓</span>
                    <span>Zero-Knowledge Storage Vault (Non-Custodial)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-white">
                    <span className="text-[#e5c158]">✓</span>
                    <span>One-Time Ephemeral Secret Share Node</span>
                  </div>
                </div>

                <div className="border-t border-[#d4af37]/15 pt-4 flex justify-between items-center font-mono">
                  <div>
                    <span className="text-2xl font-bold text-white tracking-tight">$15</span>
                    <span className="text-slate-400 text-xs"> / month</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[#e5c158] font-bold text-xs uppercase tracking-wider block">Billed as $180/year</span>
                    <span className="text-[9px] text-slate-500 uppercase">Save hundreds annually</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* SECTION 3: SOLUTION */}
      <section className="py-24 border-b border-[#d4af37]/15 bg-transparent relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#d4af37]/[0.015] rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col max-w-3xl mb-20 text-center mx-auto">
            <h2 className="text-3xl md:text-4xl font-display font-black tracking-tight text-white mb-4 uppercase">
              Three Pillars of Sovereignty.
            </h2>
            <p className="text-sm md:text-base text-slate-400 leading-relaxed uppercase tracking-wider">
              StealthRelay strips tracking vectors at the edge. You manage keys, routing, and self-destruction.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative">
            <div className="hidden lg:block absolute top-10 left-[15%] w-[70%] h-0.5 bg-[#d4af37]/10 z-0" />

            {[
              {
                num: "01",
                title: "Masked Ingestion",
                desc: "Configure secure, high-speed email masks on-the-fly. Block spam, tracking codes, and unwanted logs instantly.",
              },
              {
                num: "02",
                title: "Local Sterilization",
                desc: "File assets undergo canvas rendering and structural telemetry stripping before leaving your system.",
              },
              {
                num: "03",
                title: "Ephemeral Shredding",
                desc: "Define precise expiration windows. Accessing the link instantly overwrites the cryptographic record.",
              },
            ].map((step, idx) => (
              <div key={idx} className="relative flex flex-col items-center text-center z-10 group">
                <div className="w-20 h-20 rounded-2xl bg-[#1a1815]/90 backdrop-blur-xl border border-[#d4af37]/15 group-hover:border-[#d4af37]/45 flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(212,175,55,0.08)] transition-colors duration-300">
                  <span className="text-xl font-mono font-black text-[#e5c158]">
                    {step.num}
                  </span>
                </div>
                <h3 className="text-base font-display font-bold text-white mb-4 uppercase tracking-wider">
                  {step.title}
                </h3>
                <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-sans px-2">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: PARTNERS */}
      <section className="py-16 border-b border-[#d4af37]/15 bg-transparent overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-6 mb-8 text-center">
          <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-[#d4af37]/75 drop-shadow-[0_0_8px_rgba(212,175,55,0.1)]">
            TRUSTED BY HIGH-COMPLIANCE DEVS & ENGINEERS
          </h4>
        </div>

        <div className="relative flex overflow-x-hidden">
          <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-[#141310] to-transparent z-10 pointer-events-none" />
          <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-[#141310] to-transparent z-10 pointer-events-none" />

          <div className="carousel-track flex items-center gap-16 whitespace-nowrap py-2">
            {[1, 2].map((blockIndex) => (
              <div key={blockIndex} className="flex items-center gap-24">
                {[
                  "Aether Systems",
                  "Vektor Crypt",
                  "Apex Defense",
                  "Orion Cloud",
                  "Sovereign Core",
                  "Decentral Tech",
                  "Atlas Sec",
                  "Specter Lab",
                ].map((company, i) => (
                  <span
                    key={i}
                    className="text-2xl font-mono font-black tracking-tight text-slate-650 select-none cursor-default uppercase"
                  >
                    {company}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5: ADVOCATE TESTIMONIALS */}
      <section className="py-24 bg-transparent border-b border-[#d4af37]/15 relative">
        <div className="max-w-6xl mx-auto px-6 flex flex-col">
          <div className="max-w-2xl mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-black tracking-tight text-white uppercase">
              Endorsed by Security Architects.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                quote:
                  "StealthRelay revolutionized our operational communications. Wiping metadata locally before upload guarantees that files cannot trace back to our engineers.",
                author: "Dianna Thorne",
                role: "Lead Cybersecurity Architect",
                img: "/dianna.png",
              },
              {
                quote:
                  "I now maintain total command over our customer data routing. Creating throwaway email relays has reduced our team's exposed surface area to zero.",
                author: "Julian Vance",
                role: "Director of Technical Operations",
                img: "/julian.png",
              },
            ].map((testimonial, idx) => (
              <div
                key={idx}
                className="bg-[#1a1815]/80 backdrop-blur-xl p-8 rounded-2xl border border-[#d4af37]/10 hover:border-[#d4af37]/45 transition-colors relative overflow-hidden"
              >
                {/* corners */}
                <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-[#d4af37]/25" />
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-[#d4af37]/25" />

                <div className="flex items-center gap-4 mb-6">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden bg-slate-800 border border-[#d4af37]/15">
                    <Image
                      src={testimonial.img}
                      alt={testimonial.author}
                      fill
                      className="object-cover grayscale"
                    />
                  </div>
                  <div>
                    <cite className="not-italic font-display font-bold text-white uppercase tracking-wider text-sm">
                      {testimonial.author}
                    </cite>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
                <Quote className="w-8 h-8 text-[#d4af37]/10 mb-4" />
                <blockquote className="text-xs md:text-sm font-sans italic text-slate-300 leading-relaxed pl-4 border-l border-[#d4af37]/20">
                  "{testimonial.quote}"
                </blockquote>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6: INTELLIGENCE BRIEFING REGISTER */}
      <section className="py-24 relative bg-transparent overflow-hidden">
        <div className="max-w-3xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/20 mb-8">
            <Shield className="w-8 h-8 text-[#d4af37]" />
          </div>

          <h2 className="text-3xl md:text-5xl font-display font-black tracking-tight text-white mb-6 leading-tight uppercase">
            Sovereign Security Bulletins.
          </h2>

          <p className="text-xs md:text-sm text-slate-400 leading-relaxed uppercase tracking-wider max-w-2xl mx-auto mb-10">
            Receive actionable intelligence updates to harden your system architecture, metadata boundaries, and network ingress routes.
          </p>

          <NewsletterForm />

          <p className="mt-8 text-xs text-[#4ade80]/90 font-bold flex items-center justify-center gap-2 uppercase tracking-widest font-mono">
            <CheckCircle2 className="w-4 h-4" /> SECURE PROTOCOL INITIATED. ZERO ALIAS LOGS RECORDED.
          </p>
        </div>
      </section>
    </div>
  );
}
