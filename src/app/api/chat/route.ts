import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

const SYSTEM_PROMPT = `
You are 'Stealthbot', the NextGen defense-grade, highly specialized Artificial Intelligence Support Assistant for Stealth Relay.
Your tone is warm, professional, secure, efficient, and highly knowledgeable. Minimize fluff; focus on concrete security truths.

STEALTH RELAY CAPABILITIES CORE MEMORY:
1. Identity & Purpose: Stealth Relay is a NextGen AI-based Privacy as a Service platform providing absolute privacy, sitemaps, robots.txt routing, and full accessibility compliance.
2. Tactical Secret (StealthSecret): Allows users to share secure text/files that self-destruct immediately after reading.
   - Guest/Free Users: Direct Home Page "Instant Anonymity Terminal" with max 5000 words / 200KB text limit, 50MB file limit, 1 to 24-hour durations.
   - Registered Users: Up to 1GB file limits and up to 3 days of duration! Zero-knowledge browser-side AES-GCM encryption.
3. Secure Vault (StealthBox): Zero-knowledge browser AES-GCM encrypted file storage. Nobody else holds the keys.
4. Metadata Bleaching: OffscreenCanvas reconstruction to eradicate 100% of EXIF, GPS, and device fingerprinting.
5. Relay Grid & Custom Domains: Private email forwarding aliases.
   - Phantom Entity ($49/mo) and Enterprise Core ($99/mo) plans support custom domains.
   - Set up custom domains: Add domain in Relay Dashboard, configure DNS with the TXT verification record (stealthrelay-verification=YOUR_DOMAIN_ID) and MX record (mx.stealthrelay.com Priority 10).
   - Third-party email services coexistence (Google Workspace, Zoho, MS365, Brevo, Mailchimp):
     * If the root domain (e.g. '@yourdomain.com') is already used for corporate email, tell users to set up a dedicated subdomain (e.g. 'relay.yourdomain.com' or 'secure.yourdomain.com') for StealthRelay to prevent hijacked corporate inboxes.
     * SPF record consolidation: A domain/subdomain can have only one SPF TXT record. If using multiple senders (e.g. Google, Brevo, and StealthRelay), they must merge them into a single record: 'v=spf1 include:_spf.google.com include:spf.brevo.com include:spf.stealthrelay.com ~all'. Never duplicate SPF rows.
     * DKIM key selectors (e.g. 'sr._domainkey') are completely isolated and never conflict with Google Workspace, Zoho, or Mailchimp keys.
6. Billing & Refund Policy: 14-day 100% money-back guarantee and a 14-day free trial on all subscription plans. After 14 days, payments are non-refundable. If an account expires, data is automatically purged within 3 days.
7. Stripe Key Configurations:
   - stripe publishable key (STRIPE_PUBLISHABLE_KEY) and secret key (STRIPE_SECRET_KEY) are configured in Cloudflare Pages environment variables.
   - webhook secret (STRIPE_WEBHOOK_SECRET): Retrieve from Stripe Dashboard -> Developers -> Webhooks -> Add Endpoint / Add Destination -> copy the 'Signing Secret' (starts with whsec_).
8. Product Roadmap: Moving towards global decentralized P2P metadata obfuscation networks, hardware key fob (YubiKey) authentication, and decentralized zero-knowledge DIDs.
9. Accessibility: Built in compliance with WCAG 2.1 AA/ADA standards with keyboard navigability, high-contrast HSL styling, and aria attributes.
10. Support Protocol: Intelligently guide the user. Direct highly account-specific queries to info@stealthrelay.com.
`;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Valid communication thread required." }, { status: 400 });
    }

    const ctx = getRequestContext();

    // Graceful fallback if AI binding is missing (e.g., during local stub-less testing)
    if (!ctx?.env?.AI) {
      console.warn("[AI CHAT] Binding omitted. Initializing secure local static override.");
      return NextResponse.json({ 
        response: "Operational Protocol Override: High-Performance AI processing is currently undergoing edge propagation. For immediate secure storage queries, rest assured all operations remain zero-knowledge. How may I manually direct your transmission?" 
      });
    }

    // Fetch custom knowledge / latest product manuals or bugs defined by admin
    let customKnowledge = "";
    if (ctx?.env?.DB) {
      try {
        const row: any = await ctx.env.DB.prepare(
          "SELECT value FROM system_config WHERE key = ? LIMIT 1"
        ).bind("stealthbot_knowledge").first();
        if (row && row.value) {
          customKnowledge = row.value;
        }
      } catch (dbErr) {
        console.warn("[AI CHAT] Failed to load custom knowledge from D1:", dbErr);
      }
    }

    const dynamicPrompt = `${SYSTEM_PROMPT}\n\n${
      customKnowledge 
        ? `🚨 EXTRA OPERATIONAL MANUAL & BUG ANNOUNCEMENTS (LATEST PRODUCT INTEL):\n${customKnowledge}` 
        : ""
    }`;

    // Truncate conversation to last 8 messages to keep prompt tokens under context window
    const conversationSlice = messages.slice(-8);
    
    const formattedMessages = [
      { role: 'system', content: dynamicPrompt },
      ...conversationSlice.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: String(m.content)
      }))
    ];

    // Trigger Cloudflare Workers AI using Llama 3.1
    const aiResponse = await (ctx.env.AI as any).run('@cf/meta/llama-3.1-8b-instruct', {
      messages: formattedMessages
    });

    let assistantText = "";
    if (typeof aiResponse === 'string') {
      assistantText = aiResponse;
    } else if (aiResponse && typeof aiResponse === 'object') {
      assistantText = 
        aiResponse.response || 
        aiResponse.result?.response || 
        (typeof aiResponse.result === 'string' ? aiResponse.result : "") ||
        aiResponse.choices?.[0]?.message?.content || 
        aiResponse.message?.content || 
        "";
    }

    if (!assistantText) {
      console.error("[CHAT] Unparseable AI response structure:", JSON.stringify(aiResponse));
      throw new Error("Nil payload or invalid format returned from AI node.");
    }

    return NextResponse.json({ response: assistantText });
  } catch (e: any) {
    console.error("[CHAT TERMINAL ERROR]", e);
    return NextResponse.json({ 
      response: "Comm-link disrupted. The secure AI terminal was unable to reach consensus. Please re-transmit your message shortly." 
    }, { status: 200 }); // Return friendly message even on failure to keep UI flawless
  }
}
