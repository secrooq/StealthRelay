import type { Metadata } from "next";
import { Outfit, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import "./globals.css";
import Link from "next/link";
import { Shield } from "lucide-react";
import CookieConsent from "@/components/CookieConsent";
import DashboardBottomNav from "@/components/DashboardBottomNav";
import FloatingSupportWidget from "@/components/FloatingSupportWidget";
import Script from "next/script";
import { getRequestContext } from "@cloudflare/next-on-pages";
import NavMenu from "@/components/NavMenu";
import TrialBanner from "@/components/TrialBanner";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

async function getSystemConfig() {
  try {
    const ctx = getRequestContext();
    if (!ctx || !ctx.env || !ctx.env.DB) return {};
    const configs = await ctx.env.DB.prepare(`SELECT * FROM system_config`).all();
    return configs.results.reduce((acc: any, row: any) => {
      acc[row.key] = row.value;
      return acc;
    }, {});
  } catch (e) {
    console.warn("[CONFIG WARNING] Direct local database lookup bypassed.", e);
    return {};
  }
}

export const metadata: Metadata = {
  title: "StealthRelay | Zero-Trust Ephemeral Sharing & Encrypted Email Relay",
  description: "Secure digital workspace offering absolute identity masking, disposable email relays, local RAM EXIF metadata bleaching, and zero-knowledge self-destructing file storage powered by client-side AES-GCM.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "StealthRelay",
  },
  icons: {
    apple: "/icon-192.png",
  },
  openGraph: {
    title: "StealthRelay | Zero-Trust Ephemeral Sharing & Encrypted Email Relay",
    description: "Defend your digital footprint. Instantly generate secure email masks, bleach EXIF geofences, and share self-destructing files securely using browser-side AES-GCM local encryption.",
    url: "https://stealthrelay.com",
    siteName: "StealthRelay",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "StealthRelay | Zero-Trust Cryptographic Digital Immunity",
    description: "Premium zero-knowledge identity masking, EXIF-sterilized file sharing, and self-destructing relays designed for absolute digital security.",
  },
  other: {
    "geo.region": "US",
    "geo.position": "37.7749;-122.4194",
    "ICBM": "37.7749, -122.4194"
  }
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is Zero-Knowledge encryption?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Zero-knowledge encryption guarantees your data is encrypted directly inside your local browser's memory before any network transmission occurs. You hold the unique key locally; StealthRelay servers never see, store, or possess the capability to decrypt your secure payloads."
      }
    },
    {
      "@type": "Question",
      "name": "How does local metadata bleaching protect shared files?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "When files or photos are selected for secure sharing, our client-side software redrafts canvas details in active memory to permanently sanitize embedded EXIF GPS tags, camera models, and identifying parameters before the cryptographic seal is finalized."
      }
    }
  ]
};

const productSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "StealthRelay",
  "operatingSystem": "All Platforms",
  "applicationCategory": "SecurityApplication",
  "description": "Premium zero-knowledge privacy service providing disposable email relays, local RAM EXIF metadata sanitization, and transient self-destructing file shares.",
  "offers": {
    "@type": "Offer",
    "price": "0.00",
    "priceCurrency": "USD"
  },
  "featureList": [
    "Zero-Knowledge Client-Side AES-GCM Encryption",
    "Disposable Inbound Email Obfuscation Relays",
    "Transient 100MB Free Guest Storage Sandbox",
    "On-the-Fly Local Memory EXIF Metadata Bleaching",
    "Custom Destruct countdown timers"
  ]
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#141310",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const config = await getSystemConfig();

  return (
    <html
      lang="en"
      className={`${outfit.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased dark`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
        {config.google_ads_script && (
          <div style={{ display: "none" }} dangerouslySetInnerHTML={{ __html: config.google_ads_script }} />
        )}
        {config.custom_head_scripts && (
          <div style={{ display: "none" }} dangerouslySetInnerHTML={{ __html: config.custom_head_scripts }} />
        )}
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
        />
      </head>
      <body className="min-h-full flex flex-col text-[#f7f5f0] font-sans selection:bg-[#d4af37]/35">
        {config.custom_body_scripts && (
          <div style={{ display: "none" }} dangerouslySetInnerHTML={{ __html: config.custom_body_scripts }} />
        )}
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-8PT5QGML6P" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-8PT5QGML6P');
          `}
        </Script>
        <Script id="ms-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "uq1i2ahhkx");
          `}
        </Script>
        
        <SessionProvider>
          <TrialBanner />
          <header className="sticky top-0 z-50 w-full border-b border-[#d4af37]/15 bg-[#181714]/90 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-6">
              <Link href="/" className="hidden md:flex items-center gap-2 group">
                <div className="w-8.5 h-8.5 bg-[#d4af37]/10 border border-[#d4af37]/45 rounded-lg flex items-center justify-center group-hover:border-[#d4af37] transition-all duration-300 shadow-[0_0_15px_rgba(212,175,55,0.15)]">
                  <Shield className="w-4.5 h-4.5 text-[#d4af37] group-hover:scale-110 transition-transform" />
                </div>
                <span className="font-sans font-black uppercase tracking-widest text-sm text-white">
                  Stealth<span className="text-[#e5c158]">Relay</span>
                </span>
              </Link>

              <NavMenu />
            </div>
          </header>

          <main className="flex-1 flex flex-col w-full">
             {children}
          </main>

          <footer className="border-t border-[#d4af37]/15 bg-[#0e0d0b] py-24 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(212,175,55,0.02),transparent_70%)] pointer-events-none" />
            <div className="max-w-7xl mx-auto px-6 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-16 mb-16">
                <div className="md:col-span-2">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 bg-[#d4af37]/10 border border-[#d4af37]/35 rounded-lg flex items-center justify-center">
                      <Shield className="w-4 h-4 text-[#d4af37]" />
                    </div>
                    <span className="font-sans font-black uppercase tracking-[0.2em] text-[15px] text-white">StealthRelay</span>
                  </div>
                  <p className="text-slate-400 text-[17px] leading-relaxed max-w-md font-sans mb-8">
                    The ultimate premium workspace for secure email forwarding, private cloud storage, and encrypted messaging. Engineered with zero-compromise, zero-knowledge cryptographic architectures.
                  </p>
                  <div className="flex items-center gap-4">
                    {['Facebook', 'X', 'LinkedIn', 'YouTube', 'Medium'].map((social) => (
                      <a
                        key={social}
                        href="#"
                        className="w-10 h-10 rounded-full border border-white/10 hover:border-[#d4af37]/40 flex items-center justify-center text-[12px] font-mono uppercase text-slate-400 hover:text-[#d4af37] hover:bg-[#d4af37]/5 transition-all duration-300 shadow-sm hover:shadow-[0_0_15px_rgba(212,175,55,0.15)]"
                      >
                        {social[0]}
                      </a>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-mono font-extrabold uppercase tracking-[0.25em] text-[#d4af37] mb-6">
                    About
                  </h4>
                  <ul className="space-y-4">
                    {['Our Ethos', 'Security Model'].map((link) => (
                      <li key={link}>
                        <Link href="/about" className="text-[16px] text-slate-400 hover:text-white font-sans transition-colors">
                          {link}
                        </Link>
                      </li>
                    ))}
                    <li>
                      <a 
                        href="https://github.com/stealthrelay/stealthrelay" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-[16px] text-slate-400 hover:text-white font-sans transition-colors"
                      >
                        Open Source (AGPL-3.0)
                      </a>
                    </li>
                    <li>
                      <Link href="/pricing" className="text-[16px] text-slate-400 hover:text-white font-sans transition-colors">
                        Pricing Plans
                      </Link>
                    </li>
                    <li>
                      <Link href="/industries" className="text-[16px] text-slate-400 hover:text-white font-sans transition-colors">
                        Who We Serve
                      </Link>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-mono font-extrabold uppercase tracking-[0.25em] text-[#d4af37] mb-6">
                    Resources &amp; Intel
                  </h4>
                  <ul className="space-y-4">
                    <li>
                      <Link href="/resources" className="text-[16px] text-slate-400 hover:text-white font-sans transition-colors">
                        Knowledge Base
                      </Link>
                    </li>
                    <li>
                      <Link href="/case-studies" className="text-[16px] text-slate-400 hover:text-white font-sans transition-colors">
                        Case Studies
                      </Link>
                    </li>
                    <li>
                      <Link href="/faq" className="text-[16px] text-slate-400 hover:text-white font-sans transition-colors">
                        FAQ Docs
                      </Link>
                    </li>
                    <li>
                      <Link href="/blog" className="text-[16px] text-slate-400 hover:text-white font-sans transition-colors">
                        Security Blog
                      </Link>
                    </li>
                    <li>
                      <Link href="/legal" className="text-[16px] text-slate-400 hover:text-white font-sans transition-colors">
                        Legal Directives
                      </Link>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-mono font-extrabold uppercase tracking-[0.25em] text-[#d4af37] mb-6">
                    Legal &amp; Policy
                  </h4>
                  <ul className="space-y-3 font-mono text-[11px] uppercase tracking-wider">
                    <li>
                      <Link href="/legal/refund" className="text-slate-400 hover:text-[#d4af37] transition-colors">
                        Refund &amp; Trial
                      </Link>
                    </li>
                    <li>
                      <Link href="/legal/cookie" className="text-slate-400 hover:text-[#d4af37] transition-colors">
                        Cookie &amp; Privacy
                      </Link>
                    </li>
                    <li>
                      <Link href="/disclaimer" className="text-slate-400 hover:text-[#d4af37] transition-colors">
                        Disclaimer
                      </Link>
                    </li>
                    <li>
                      <Link href="/accessibility" className="text-slate-400 hover:text-[#d4af37] transition-colors">
                        Accessibility
                      </Link>
                    </li>
                    <li>
                      <Link href="/roadmap" className="text-slate-400 hover:text-[#d4af37] transition-colors">
                        Roadmap Vector
                      </Link>
                    </li>
                    <li>
                      <a href="/sitemap.xml" target="_blank" className="text-slate-400 hover:text-[#d4af37] transition-colors">
                        Sitemap XML
                      </a>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[12px] font-mono text-slate-500 uppercase tracking-widest">
                <p>© 2026 StealthRelay. All rights reserved.</p>
                <div className="flex items-center gap-6">
                  <span className="flex items-center gap-2 text-[#4ade80]/80 font-bold animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80]" /> Status: Operational
                  </span>
                  <span className="text-slate-650">Version 9.4.2-Prod</span>
                </div>
              </div>
            </div>
          </footer>

          <DashboardBottomNav />
          <CookieConsent />
          <FloatingSupportWidget />
        </SessionProvider>

        {config.facebook_pixel_script && (
          <div style={{ display: "none" }} dangerouslySetInnerHTML={{ __html: config.facebook_pixel_script }} />
        )}
        {config.custom_footer_scripts && (
          <div style={{ display: "none" }} dangerouslySetInnerHTML={{ __html: config.custom_footer_scripts }} />
        )}
      </body>
    </html>
  );
}
