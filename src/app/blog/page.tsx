"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Terminal, ArrowRight, Loader2 } from "lucide-react";

// HARDCODED FALLBACK DATA FOR STAGING/LOCAL ENVIRONMENT
const FALLBACK_POSTS = [
  {
    id: 1,
    slug: 'quantum-threat-identity',
    title: 'Mitigating Quantum Threats to Digital Identity',
    excerpt: 'Analysis of impending post-quantum cryptography cascades and our pre-emptive defensive matrix deployment.',
    author_name: 'COMMANDER_ALPHA',
    published_at: '2024-05-10T00:00:00.000Z'
  },
  {
    id: 2,
    slug: 'zero-trust-metadata',
    title: 'Metadata Sanitation: The Silent Breach Vector',
    excerpt: 'Why encrypting contents is not enough. An audit of upstream header leakages in legacy systems.',
    author_name: 'GHOST_PROTOCOL',
    published_at: '2024-05-08T00:00:00.000Z'
  },
  {
    id: 3,
    slug: 'establishing-stealth-vault',
    title: 'Establishing the First Immutable Vault',
    excerpt: 'Detailed deployment log detailing the orchestration of zero-knowledge storage rings.',
    author_name: 'ROOT_ADMIN',
    published_at: '2024-05-01T00:00:00.000Z'
  },
  {
    id: 4,
    slug: 'hardening-comm-vectors',
    title: 'Hardening Your Communication Vectors',
    excerpt: 'Why standard email protocols invite social engineering, and how mathematical identity separation completely blocks impersonation.',
    author_name: 'OPERATIVE_DELTA',
    published_at: '2024-05-08T00:00:00.000Z'
  },
  {
    id: 5,
    slug: 'anatomy-digital-burn',
    title: 'Anatomy of a Digital Burn',
    excerpt: 'Why software unlinking is insufficient, and how Zero-Knowledge crypto-shredding delivers forensically absolute data erasure.',
    author_name: 'COMMAND_CORE',
    published_at: '2024-05-05T00:00:00.000Z'
  },
  {
    id: 6,
    slug: 'anti-phishing-authentication',
    title: 'Defeating Phishing Attacks with Cryptographic Aliases',
    excerpt: 'Why traditional email protocols invite social engineering, and how mathematical identity separation completely blocks impersonation vectors.',
    author_name: 'GHOST_PROTOCOL',
    published_at: '2024-05-15T00:00:00.000Z'
  },
  {
    id: 7,
    slug: 'secure-exif-stripping-ram',
    title: 'Sandboxed Local RAM Exif Stripping Explained',
    excerpt: 'Deep dive into local browser-side metadata bleaching pipelines utilizing sandboxed HTML5 canvas rendering in active memory.',
    author_name: 'COMMAND_CORE',
    published_at: '2024-05-12T00:00:00.000Z'
  },
  {
    id: 8,
    slug: 'hybrid-homomorphic-encryption',
    title: 'The Evolution of Zero-Knowledge Tunnels',
    excerpt: 'From standard client-side PGP to hybrid post-quantum key swaps and dynamic client-side AES-GCM-256 wrapping.',
    author_name: 'ROOT_ADMIN',
    published_at: '2024-05-18T00:00:00.000Z'
  },
  {
    id: 9,
    slug: 'photo-forensics-osint-exif-dangers',
    title: 'Photo Forensics and OSINT: How EXIF Metadata Exposes Your Location',
    excerpt: 'How open-source intelligence analysts use hidden EXIF GPS coordinates, device serial numbers, and timestamps embedded in your photos to track, identify, and geolocate targets.',
    author_name: 'GHOST_PROTOCOL',
    published_at: '2026-05-20T00:00:00.000Z'
  },
  {
    id: 10,
    slug: 'vpn-dns-leak-testing-guide',
    title: 'How to Test If Your VPN Is Leaking DNS and WebRTC Data',
    excerpt: 'Step-by-step guide to identifying DNS leaks, WebRTC IP exposure, and IPv6 tunneling failures that silently bypass your VPN and expose your real identity to ISPs and surveillance networks.',
    author_name: 'OPERATIVE_DELTA',
    published_at: '2026-05-21T00:00:00.000Z'
  },
  {
    id: 11,
    slug: 'zero-trust-architecture-startups',
    title: 'Implementing Zero-Trust Security Architecture for Startups and Small Teams',
    excerpt: 'A practical blueprint for deploying zero-trust network access, micro-segmentation, and least-privilege identity controls without enterprise budgets or dedicated security staff.',
    author_name: 'COMMANDER_ALPHA',
    published_at: '2026-05-22T00:00:00.000Z'
  },
  {
    id: 12,
    slug: 'browser-fingerprinting-how-websites-track-you',
    title: 'Browser Fingerprinting: How Websites Track You Without Cookies',
    excerpt: 'Detailed technical analysis of canvas fingerprinting, WebGL rendering signatures, font enumeration, and audio context analysis used by advertisers and trackers to uniquely identify your browser across the web.',
    author_name: 'COMMAND_CORE',
    published_at: '2026-05-22T00:00:00.000Z'
  },
  {
    id: 13,
    slug: 'disposable-email-addresses-security-guide',
    title: 'The Complete Guide to Disposable Email Addresses for Online Privacy',
    excerpt: 'Why using a single email address across multiple services creates a catastrophic correlation vulnerability, and how dynamic cryptographic aliases eliminate this attack vector permanently.',
    author_name: 'GHOST_PROTOCOL',
    published_at: '2026-05-23T00:00:00.000Z'
  },
  {
    id: 14,
    slug: 'dark-web-monitoring-credential-exposure',
    title: 'Dark Web Monitoring: How to Check If Your Credentials Are Compromised',
    excerpt: 'Understanding how stolen credentials propagate through underground marketplaces, combo lists, and stealer log ecosystems, and the tactical steps to detect and neutralize exposure before exploitation.',
    author_name: 'ROOT_ADMIN',
    published_at: '2026-05-23T00:00:00.000Z'
  },
  {
    id: 15,
    slug: 'end-to-end-encrypted-file-sharing-explained',
    title: 'End-to-End Encrypted File Sharing: How It Works and Why It Matters',
    excerpt: 'A technical deep dive into client-side AES-GCM encryption, ephemeral key exchange, and zero-knowledge storage architectures that guarantee only the sender and recipient can ever access shared files.',
    author_name: 'COMMANDER_ALPHA',
    published_at: '2026-05-24T00:00:00.000Z'
  },
  {
    id: 16,
    slug: 'insider-threat-detection-data-loss-prevention',
    title: 'Insider Threat Detection and Data Loss Prevention for Remote Teams',
    excerpt: 'How to architect secure file handling, audit logging, and cryptographic access controls that prevent accidental data exfiltration and malicious insider leaks in distributed work environments.',
    author_name: 'OPERATIVE_DELTA',
    published_at: '2026-05-24T00:00:00.000Z'
  }
];

export default function BlogPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const res = await fetch('/api/blog');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const merged = [...data];
            FALLBACK_POSTS.forEach((fallback) => {
              if (!merged.some((post) => post.slug === fallback.slug)) {
                merged.push(fallback);
              }
            });
            setPosts(merged);
          } else {
            setPosts(FALLBACK_POSTS);
          }
        } else {
          setPosts(FALLBACK_POSTS);
        }
      } catch (error) {
        console.error("Failed to retrieve live Intel, operating with cache.", error);
        setPosts(FALLBACK_POSTS);
      } finally {
        setLoading(false);
      }
    };
    loadPosts();
  }, []);

  return (
    <div className="w-full min-h-screen bg-transparent py-20 px-6 font-mono relative overflow-hidden selection:bg-[#d4af37]/30">
      <div className="max-w-5xl mx-auto relative z-10">
        
        <div className="mb-20 border-b border-white/10 pb-10 flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#e5c158] uppercase tracking-widest mb-2 drop-shadow-[0_0_10px_rgba(212,175,55,0.25)] animate-pulse">
              <Terminal className="w-4 h-4" /> COMMS_LOG_INTEL
            </div>
            <h1 className="text-4xl md:text-5xl font-mono font-black uppercase text-white tracking-tighter">Briefing Room</h1>
          </div>
          <p className="text-slate-400 text-xs md:text-sm max-w-xs md:text-right hidden md:block uppercase tracking-wider leading-relaxed">
            Distribution of localized intelligence regarding state-actors and encryption evolution.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 border border-white/10 bg-[#070709]/80 backdrop-blur-xl rounded-2xl shadow-2xl relative">
            <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-[#d4af37]/30" />
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-[#d4af37]/30" />
            <Loader2 className="w-8 h-8 text-[#e5c158] animate-spin mb-4" />
            <span className="text-xs text-[#e5c158] tracking-[0.2em] font-bold uppercase animate-pulse">Decrypting Intel Streams...</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center text-slate-400 py-20 border border-dashed border-white/10 rounded-2xl bg-[#070709]/60 backdrop-blur-md uppercase tracking-wider text-xs">
            [ NO LOGS FOUND IN BUFFER ]
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group rounded-2xl border border-white/10 bg-[#070709]/80 backdrop-blur-xl hover:border-[#d4af37]/40 transition-all duration-300 relative overflow-hidden flex flex-col shadow-xl">
                {/* Micro Reticle scope borders */}
                <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-white/10 group-hover:border-[#d4af37]/40 transition-colors" />
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-white/10 group-hover:border-[#d4af37]/40 transition-colors" />

                <div className="absolute top-0 left-0 h-[2px] bg-gradient-to-r from-[#d4af37] to-[#e5c158] w-0 group-hover:w-full transition-all duration-500" />
                
                <div className="p-6 flex-grow">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono uppercase tracking-widest mb-4">
                    <span>By: {post.author_name}</span>
                    <span>{new Date(post.published_at).toLocaleDateString()}</span>
                  </div>
                  <h2 className="text-base font-black text-white uppercase group-hover:text-[#e5c158] transition-colors mb-3 leading-tight tracking-wide">
                    {post.title}
                  </h2>
                  <p className="text-slate-400 text-xs md:text-sm leading-relaxed uppercase tracking-wider">
                    {post.excerpt || "Full tactical analysis available in main payload container."}
                  </p>
                </div>
                <div className="p-6 pt-0 border-t border-transparent group-hover:border-white/5 flex justify-between items-center text-xs font-bold text-[#e5c158]/60 group-hover:text-[#e5c158] mt-auto tracking-widest uppercase">
                  <span>READ DECRYPT</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1 drop-shadow-[0_0_5px_rgba(212,175,55,0.3)]" />
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
