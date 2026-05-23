import { NextRequest, NextResponse } from "next/server";
import { getOptionalRequestContext } from "@cloudflare/next-on-pages";
import { logger } from "@/lib/logger";

export const runtime = "edge";

const FALLBACK_MANIFEST: Record<string, any> = {
  'quantum-threat-identity': {
    title: 'Mitigating Quantum Threats to Digital Identity',
    content: "The arrival of scalable Shor's algorithm implementations poses an existential risk to RSA-2048 algorithms globally.\nStealthRelay utilizes lattice-based cryptographic primes that render polynomial-time quantum derivation mathematically inert.\nOperators must prioritize rolling their master keys into these hardened protocols immediately to guarantee forensic hygiene.",
    author_name: 'COMMANDER_ALPHA',
    published_at: '2024-05-10T00:00:00.000Z'
  },
  'zero-trust-metadata': {
    title: 'Metadata Sanitation: The Silent Breach Vector',
    content: "When individuals think about secure communication, they almost always focus on the content of their messages. They worry about encrypting their text, signing their documents, and password-protecting their files. While these are critical components of any security framework, they ignore a silent, highly effective breach vector: metadata.",
    author_name: 'GHOST_PROTOCOL',
    published_at: '2024-05-08T00:00:00.000Z'
  },
  'establishing-stealth-vault': {
    title: 'Establishing the First Immutable Vault',
    content: "The modern cloud storage industry has sold users a dangerous illusion of security. They offer 'encrypted vaults' and 'secure folders' that claim to guard your most sensitive personal and corporate files. However, when you look closely at their system architecture, a glaring flaw is revealed: centralization.",
    author_name: 'ROOT_ADMIN',
    published_at: '2024-05-01T00:00:00.000Z'
  },
  'hardening-comm-vectors': {
    title: 'Hardening Your Communication Vectors',
    content: "Operational protocol requires a fresh vector for every distinct third-party ingestion node.\nMulti-layered alias defenses prevent cross-domain correlation by state actors.\nStealthRelay provides infinite transient aliases to maintain total vector isolation.",
    author_name: 'OPERATIVE_DELTA',
    published_at: '2024-05-08T00:00:00.000Z'
  },
  'anatomy-digital-burn': {
    title: 'Anatomy of a Digital Burn',
    content: "One of the most dangerous misconceptions in modern computing is the belief that deleting a file actually removes it from existence. When you click 'delete' or empty your trash bin on a standard operating system, the computer does not erase the data. Instead, it simply marks the sectors on the storage drive as 'free space' and deletes the index pointer linking to the file.",
    author_name: 'COMMAND_CORE',
    published_at: '2024-05-05T00:00:00.000Z'
  },
  'anti-phishing-authentication': {
    title: 'Defeating Phishing Attacks with Cryptographic Aliases',
    content: "Why traditional email protocols invite social engineering, and how mathematical identity separation completely blocks impersonation vectors.",
    author_name: 'GHOST_PROTOCOL',
    published_at: '2024-05-15T00:00:00.000Z'
  },
  'secure-exif-stripping-ram': {
    title: 'Sandboxed Local RAM Exif Stripping Explained',
    content: "Deep dive into local browser-side metadata bleaching pipelines utilizing sandboxed HTML5 canvas rendering in active memory.",
    author_name: 'COMMAND_CORE',
    published_at: '2024-05-12T00:00:00.000Z'
  },
  'hybrid-homomorphic-encryption': {
    title: 'The Evolution of Zero-Knowledge Tunnels',
    content: "From standard client-side PGP to hybrid post-quantum key swaps and dynamic client-side AES-GCM-256 wrapping.",
    author_name: 'ROOT_ADMIN',
    published_at: '2024-05-18T00:00:00.000Z'
  }
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const ctx = getOptionalRequestContext();
    const env = ctx?.env as any;

    if (env?.DB) {
      const result = await env.DB.prepare(
        "SELECT title, content, author_name, published_at FROM blog_posts WHERE slug = ? LIMIT 1"
      ).bind(slug).first();

      if (result) {
        return NextResponse.json(result);
      }
    }

    // Fallback to internal manifest
    if (FALLBACK_MANIFEST[slug]) {
      return NextResponse.json(FALLBACK_MANIFEST[slug]);
    }

    return NextResponse.json({ error: "POST_NOT_FOUND" }, { status: 404 });
  } catch (error: any) {
    logger.error("[API_BLOG_STABILITY] Critical failure:", error);
    // Even on error, try to serve from manifest
    if (FALLBACK_MANIFEST[slug]) {
      return NextResponse.json(FALLBACK_MANIFEST[slug]);
    }
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
