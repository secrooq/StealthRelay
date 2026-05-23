"use client";

import { useState } from "react";
import { Key, Globe, Terminal, ShieldCheck, ShieldAlert, Server, Send, X, Copy, Check, Info, Shield, HelpCircle } from "lucide-react";

interface DocItem {
  category: string;
  title: string;
  icon: any;
  accent: string;
  description: string;
  fullGuide: {
    problem: string;
    solution: string;
    sequence: string[];
    codeSnippet?: {
      lang: string;
      code: string;
    };
    steps: string[];
  };
}

export default function ResourcesClient() {
  const [selectedDoc, setSelectedDoc] = useState<DocItem | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const docsList: DocItem[] = [
    {
      category: "Operation Guides",
      title: "Zero-Knowledge Vault Cryptography",
      icon: Key,
      accent: "text-[#e5c158] border-[#d4af37]/20 bg-slate-900/40",
      description: "Understand how standard browser WebCrypto AES-GCM-256 handles your files and generates nonces before committing chunks to our storage array.",
      fullGuide: {
        problem: "Traditional cloud storage services decrypt your files on their servers, rendering your private keys vulnerable to server breaches, subpoenas, or insider threats.",
        solution: "StealthRelay forces client-side-only encryption. Your plaintext data never leaves your browser. Files are fragmented locally, encrypted with AES-GCM-256, and sent to serverless buckets as unreadable high-entropy blobs.",
        sequence: [
          "Enter raw vault file / secret payload inside the web application.",
          "WebCrypto API derives a high-entropy 256-bit symmetric key using PBKDF2 (SHA-256, 100,000 iterations).",
          "File payload is split into exact 4MB raw binary fragments.",
          "Each segment is encrypted with an isolated 96-bit cryptographically secure pseudorandom initialization vector (IV).",
          "Decrypted master key is saved exclusively in the browser's URL hash (#key=...). This hash is NEVER sent to the StealthRelay network."
        ],
        codeSnippet: {
          lang: "javascript",
          code: `// Derive PBKDF2 cryptographic key in-browser
const baseKey = await window.crypto.subtle.importKey(
  "raw", new TextEncoder().encode(userSecret), "PBKDF2", false, ["deriveKey"]
);
const aesKey = await window.crypto.subtle.deriveKey(
  {
    name: "PBKDF2",
    salt: window.crypto.getRandomValues(new Uint8Array(16)),
    iterations: 100000,
    hash: "SHA-256"
  },
  baseKey,
  { name: "AES-GCM", length: 256 },
  false,
  ["encrypt", "decrypt"]
);`
        },
        steps: [
          "Your master key resides in your local context only.",
          "If you lose the URL reference (#key=...), StealthRelay CANNOT recover your vault files. There is no backdoor.",
          "All R2 chunk stores operate strictly under multi-region replication for 99.999999999% durability."
        ]
      }
    },
    {
      category: "Domain Operations",
      title: "Domain Integration System Setup",
      icon: Globe,
      accent: "text-[#e5c158] border-[#d4af37]/20 bg-slate-900/40",
      description: "Step-by-step configuration for binding custom domains using standard MX, SPF, DKIM, and DMARC parameters to point directly to our SMTP routing mesh.",
      fullGuide: {
        problem: "Using shared system domains makes your email aliases trackable, linked, and potentially blacklisted as a group. Registering your own custom domains is essential for total anonymity, but manual DNS mapping requires precise parameters.",
        solution: "StealthRelay provides a secure, decentralized SMTP routing template. You bind your custom domain to our edge servers via a series of standard MX, SPF, DKIM, and DMARC DNS settings, routing all inbound mail seamlessly into our zero-knowledge bleaching grid.",
        sequence: [
          "Purchase or delegate a low-profile custom domain with any DNS registrar (Cloudflare, Namecheap, Route53).",
          "MX Record Setup: Set Priority 10 pointing to mx.stealthrelay.com to route inbound mail directly to our edge.",
          "SPF (TXT) Obfuscation: Add a TXT record for '@' with v=spf1 include:spf.stealthrelay.com ~all to authorize our relays.",
          "DKIM (TXT) Security: Add a TXT record for name 'sr._domainkey' to cryptographically sign outbound mails with our public key.",
          "DMARC (TXT) Compliance: Add a TXT record for name '_dmarc' pointing to v=DMARC1; p=quarantine; pct=100 to quarantine unauthorized spoofing attempts."
        ],
        codeSnippet: {
          lang: "text",
          code: `# DNS Template Configuration for Custom Domains
# 1. MX Ingress Redirect (Priority 10)
Type: MX | Host: @ | Value: mx.stealthrelay.com | TTL: Auto

# 2. SPF Relaying Authority
Type: TXT | Host: @ | Value: v=spf1 include:spf.stealthrelay.com ~all | TTL: Auto

# 3. DKIM Key Verification
Type: TXT | Host: sr._domainkey | Value: v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0... | TTL: Auto

# 4. DMARC Alignment Policy
Type: TXT | Host: _dmarc | Value: v=DMARC1; p=quarantine; pct=100 | TTL: Auto`
        },
        steps: [
          "COEXISTING WITH CORPORATE SUITES (Google Workspace, Zoho, MS365): A single domain or subdomain can only have ONE active set of MX records. If your root domain (e.g., '@yourdomain.com') is already hooked to corporate Google or Zoho suites, DO NOT redirect its root MX records to StealthRelay, as this will hijack your primary mail inbox. Instead, delegate a dedicated subdomain (e.g., 'relay.yourdomain.com' or 'secure.yourdomain.com') specifically for StealthRelay.",
          "SPF RECORD CONSOLIDATION: A domain/subdomain can only have one active SPF TXT record. If you are dispatching outbound emails via Google Workspace, Brevo, and StealthRelay simultaneously from the same domain, you must merge their rules into a single TXT row. Example: 'v=spf1 include:_spf.google.com include:spf.brevo.com include:spf.stealthrelay.com ~all'. Never publish duplicate SPF rows.",
          "DKIM KEY INDEPENDENCE: DKIM records utilize separate 'selectors' (e.g., 'sr._domainkey', 'google._domainkey', 'mailchimp._domainkey'). Because selectors are fully isolated, they never conflict with each other. You can have dozens of active DKIM keys for different tools active on the same domain simultaneously.",
          "Note that DNS propagation across global registrar nodes can take anywhere from 5 minutes to 24 hours.",
          "Confirm active status in the StealthRelay dashboard under Relay Grid -> Domains -> Verify DNS."
        ]
      }
    },
    {
      category: "Email Tactics",
      title: "Disposable Mask Optimization",
      icon: Globe,
      accent: "text-[#e5c158] border-[#d4af37]/20 bg-slate-900/40",
      description: "Learn how to use temporary routing links for different domains, and block incoming tracking pixels at our Cloudflare edge before delivery.",
      fullGuide: {
        problem: "Embedded email trackers, invisible 1x1 tracking GIFs, and complex header structures leak your real IP address, physical location, operating system, and read times to marketing aggregators.",
        solution: "StealthRelay intercepts inbound SMTP traffic at the Cloudflare Edge runtime. We scrub all tracking vectors, strip telemetry headers, and route pristine sanitized payloads to your destination inbox.",
        sequence: [
          "An incoming email is dispatched to your high-entropy alias (e.g. secure-alias-xyz@stealthrelay.com).",
          "Ingress SMTP Server intercepts payload and fires an isolated Cloudflare Worker route.",
          "Header Bleaching: original transit tracer rows, User-Agent parameters, and client timestamps are purged.",
          "Body Bleaching: HTML payloads are parsed; 1x1 image trackers, web beacons, and javascript hooks are removed.",
          "Cleansed message is securely forwarded to your verified target email inbox."
        ],
        steps: [
          "Enable 'Header Bleach' inside your StealthRelay Dashboard settings.",
          "Configure temporary expiration limits on high-traffic aliases to self-destruct channels after a specific timeframe.",
          "Review incoming sanitization logs on the dashboard to audit intercepted beacons."
        ]
      }
    },
    {
      category: "SysAdmin / APIs",
      title: "Automating with Edge API Grid",
      icon: Terminal,
      accent: "text-slate-300 border-[#d4af37]/20 bg-slate-900/40",
      description: "Deploy automated alias generators inside your build tooling using simple Bearer API tokens to instantiate and tear down email silos instantly.",
      fullGuide: {
        problem: "Manually building email aliases inside a dashboard becomes tedious when running high-volume automated regression suites, testing user signups, or spinning up ephemeral cloud containers.",
        solution: "We provide an ultra-fast REST API designed for headless CI/CD scripts and automated tools. Provision secure domains and custom email masks programmatically in milliseconds.",
        sequence: [
          "Generate a secure Bearer token inside the StealthRelay Settings drawer.",
          "Include 'Authorization: Bearer sr_live_...' header in your HTTP script.",
          "Send a POST request to provision a dynamic alias or register custom domains on-the-fly.",
          "Use the created alias for registration, then send a DELETE query to purge the routing address instantly."
        ],
        codeSnippet: {
          lang: "bash",
          code: `# Spin up a new dynamic email alias instantly via curl
curl -X POST "https://stealthrelay.com/api/relay/domains" \\
  -H "Authorization: Bearer sr_live_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prefix": "ci-runner-902",
    "domain": "stealthrelay.com",
    "description": "Ephemeral integration runner"
  }'`
        },
        steps: [
          "All API responses are formatted in strict JSON structure.",
          "Rate limits are enforced dynamically based on your chosen billing plan.",
          "API tokens can be rotated instantly to mitigate credential leakage."
        ]
      }
    },
    {
      category: "Security Bulletins",
      title: "Mitigating Metadata Leakage",
      icon: ShieldCheck,
      accent: "text-[#e5c158] border-[#d4af37]/20 bg-slate-900/40",
      description: "Guidelines on image EXIF scrubbing, office document sanitization, and stripping operating system tracers before sharing encrypted packages.",
      fullGuide: {
        problem: "Media files (JPEG, PNG) and office documents frequently contain hidden EXIF parameters including GPS location tags, camera models, unique software version keys, and original author details.",
        solution: "StealthRelay sanitizes all uploaded vault media inside a sandboxed client thread. We read the raw byte streams and strip structural header markers to guarantee zero metadata trace leaks.",
        sequence: [
          "Upload an image or document to the Secure Vault component.",
          "An isolated Web Worker reads the payload into a sandboxed ArrayBuffer.",
          "EXIF markers (APP1 segment flags inside JPEGs, tEXt indicators in PNGs) are mapped.",
          "Metadata directories are overwritten with sterile null values.",
          "Image pixels are redrawn on a sterile, off-screen HTML5 canvas to export brand-new, bleached file bytes."
        ],
        codeSnippet: {
          lang: "javascript",
          code: `// Offscreen canvas image bleaching
const offscreen = new OffscreenCanvas(imgWidth, imgHeight);
const ctx = offscreen.getContext('2d');
ctx.drawImage(originalImage, 0, 0);
// Exporting completely sanitized PNG bytes
const sterileBlob = await offscreen.convertToBlob({ type: 'image/png' });`
        },
        steps: [
          "Enable 'Automatic Local Bleach' on your Vault dashboard.",
          "Sanitized media will load much faster due to the overhead metadata reduction.",
          "File sizes are automatically optimized for premium bandwidth usage."
        ]
      }
    },
    {
      category: "Threat Intel",
      title: "Phishing Vectors & Identification",
      icon: ShieldAlert,
      accent: "text-red-500 border-[#d4af37]/20 bg-slate-900/40",
      description: "Analyze how our automated engine intercepts, parses, and flags potentially dangerous embedded links within incoming relayed mail payloads.",
      fullGuide: {
        problem: "Cybercriminals use domain-shadowing, homograph attacks (substituting cyrillic lookalike characters), and high-frequency redirects to slip malicious phishing endpoints past traditional mail filters.",
        solution: "StealthRelay uses deep-packet parsing to trace link hierarchies and SPF/DKIM/DMARC alignment rules, showing clear threat warning flags directly in the UI before you interact.",
        sequence: [
          "Stealth SMTP router intercepts incoming payload.",
          "Runs comprehensive cryptographic validations: SPF alignment, DKIM signature verification, DMARC security actions.",
          "Link Extraction: HTML structures are queried; all target anchors are fetched.",
          "Homograph Scan: W3C Unicode standard lookup maps lookalike letters and character sets.",
          "Malicious links are enveloped in highly visible, non-clickable warning banners."
        ],
        steps: [
          "Never click links that show a 'Threat Identified' yellow flag.",
          "Use our built-in ephemeral sandbox link viewer to inspect suspect destination websites safely.",
          "Report unknown phishing vectors directly to info@stealthrelay.com to train global filters."
        ]
      }
    },
    {
      category: "Integrations",
      title: "Cloudflare Workers Bridging",
      icon: Server,
      accent: "text-[#e5c158] border-[#d4af37]/20 bg-slate-900/40",
      description: "Instructions for deploying local endpoints using the Cloudflare Wrangler SDK to interact seamlessly with Stealth Relay's infrastructure.",
      fullGuide: {
        problem: "Organizations with highly custom workflows need to route incoming emails to proprietary Slack hooks, database tables, or custom local webhooks directly from the edge.",
        solution: "Deploy a lightweight custom Cloudflare Worker to act as a secure proxy bridge between StealthRelay's ingress router and your internal server assets.",
        sequence: [
          "Configure a Cloudflare Worker using the Wrangler CLI.",
          "Add binding configurations to your wrangler.toml to securely map environment secrets.",
          "Write the event interceptor function.",
          "Route your StealthRelay verified domains through the proxy Worker.",
          "Incoming payloads are processed at the Cloudflare Edge and forwarded as secure encrypted webhook JSON."
        ],
        codeSnippet: {
          lang: "javascript",
          code: `// Cloudflare Worker custom routing proxy
export default {
  async email(message, env, ctx) {
    const rawContent = await new Response(message.raw).text();
    // Dispatch encrypted payload to internal webhook
    await fetch(env.INTERNAL_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from: message.from,
        to: message.to,
        content: rawContent
      })
    });
  }
};`
        },
        steps: [
          "Ensure your proxy worker uses active environment secrets for webhook endpoints.",
          "Verify SSL trust chains to prevent middleman snooping.",
          "Wrangler deployments execute instantly and scale worldwide automatically."
        ]
      }
    }
  ];

  return (
    <div className="w-full">
      {/* Document Grid Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
        {docsList.map((res, i) => (
          <div 
            key={i} 
            className="flex flex-col border border-slate-800 bg-slate-900/30 hover:bg-slate-900/60 hover:border-[#d4af37]/20 rounded-2xl p-8 transition-all duration-300 group shadow-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                {res.category}
              </span>
              <div className={`w-10 h-10 rounded-lg border border-slate-800 flex items-center justify-center bg-slate-950 shadow-md ${res.accent}`}>
                <res.icon className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight mb-3 group-hover:text-[#e5c158] transition-colors">
              {res.title}
            </h3>
            <p className="text-slate-400 text-sm font-medium leading-relaxed flex-1 mb-8">
              {res.description}
            </p>
            <button 
              onClick={() => setSelectedDoc(res)}
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#e5c158] hover:text-white uppercase tracking-wider transition-colors self-start cursor-pointer"
            >
              Access File <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Dynamic Glassmorphism Overlay Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-4xl max-h-[85vh] overflow-y-auto border border-[#d4af37]/25 bg-[#0e0d0b]/95 rounded-2xl shadow-2xl p-6 md:p-10 text-slate-100 flex flex-col font-sans selection:bg-[#d4af37]/30">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-6 mb-8">
              <div>
                <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-[#e5c158] mb-2 block">
                  {selectedDoc.category} // Secure Briefing
                </span>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                  {selectedDoc.title}
                </h2>
              </div>
              <button 
                onClick={() => setSelectedDoc(null)}
                className="p-2 border border-slate-850 hover:border-[#d4af37]/35 rounded-lg text-slate-400 hover:text-white bg-slate-950/50 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 space-y-8">
              {/* Problem/Solution split */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-6">
                  <div className="flex items-center gap-2 text-red-400 font-bold uppercase tracking-wider text-xs mb-3">
                    <ShieldAlert className="w-4 h-4" /> The Threat Vector
                  </div>
                  <p className="text-slate-350 text-sm leading-relaxed font-medium">
                    {selectedDoc.fullGuide.problem}
                  </p>
                </div>

                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-6">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider text-xs mb-3">
                    <ShieldCheck className="w-4 h-4" /> Tactical Countermeasure
                  </div>
                  <p className="text-slate-350 text-sm leading-relaxed font-medium">
                    {selectedDoc.fullGuide.solution}
                  </p>
                </div>
              </div>

              {/* Data Flow / Processing Sequence */}
              <div>
                <h4 className="text-xs font-mono font-extrabold uppercase tracking-[0.2em] text-[#d4af37] mb-4 flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5" /> Core Operational Sequence
                </h4>
                <div className="space-y-3 pl-2">
                  {selectedDoc.fullGuide.sequence.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-4 text-sm font-medium leading-relaxed text-slate-300">
                      <span className="w-6 h-6 rounded border border-slate-800 bg-slate-950 flex items-center justify-center text-[11px] font-mono text-[#e5c158] font-bold mt-0.5 shrink-0 shadow-sm">
                        {idx + 1}
                      </span>
                      <p className="pt-0.5">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Code Snippet (if available) */}
              {selectedDoc.fullGuide.codeSnippet && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-mono font-extrabold uppercase tracking-[0.2em] text-[#d4af37] flex items-center gap-2">
                      <Terminal className="w-3.5 h-3.5" /> Technical Implementation
                    </h4>
                    <button 
                      onClick={() => handleCopyCode(selectedDoc.fullGuide.codeSnippet!.code)}
                      className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-slate-400 hover:text-[#e5c158] cursor-pointer bg-slate-950/60 px-3 py-1.5 border border-slate-800 rounded-lg transition"
                    >
                      {copiedCode ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy Code
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-5 border border-slate-850 bg-slate-950/80 rounded-xl overflow-x-auto text-[13px] font-mono text-slate-350 leading-relaxed shadow-inner">
                    <code>{selectedDoc.fullGuide.codeSnippet.code}</code>
                  </pre>
                </div>
              )}

              {/* Crucial Integration Guidelines */}
              <div className="border-t border-slate-800 pt-6">
                <h4 className="text-xs font-mono font-extrabold uppercase tracking-[0.2em] text-[#d4af37] mb-4 flex items-center gap-2">
                  <Info className="w-3.5 h-3.5" /> Core Directives &amp; Security Audits
                </h4>
                <ul className="space-y-2 pl-4 list-disc text-sm font-medium leading-relaxed text-slate-300 marker:text-[#e5c158]">
                  {selectedDoc.fullGuide.steps.map((step, idx) => (
                    <li key={idx} className="pl-1">
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-800 pt-6 mt-8 flex justify-end">
              <button 
                onClick={() => setSelectedDoc(null)}
                className="px-6 py-3 bg-[#d4af37] hover:bg-[#e5c158] text-black text-xs font-extrabold uppercase tracking-wider rounded-xl transition duration-300 cursor-pointer shadow-sm"
              >
                Close Secure Session
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
