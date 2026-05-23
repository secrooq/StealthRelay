import { getRequestContext } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";

export const runtime = 'edge';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const ctx = getRequestContext();
    const db = ctx.env.DB;
    const storage = ctx.env.STEALTH_STORAGE;

    // 1. Atomic claim: Mark as viewed first to mitigate all concurrency and TOCTOU race conditions
    const secretRecord: any = await db.prepare(
      `UPDATE stealth_secrets 
       SET is_viewed = 1 
       WHERE id = ? AND is_viewed = 0 AND expires_at > datetime('now')
       RETURNING *`
    ).bind(id).first();

    if (!secretRecord) {
      return NextResponse.json({ error: 'Secret not found, already viewed, or expired.' }, { status: 404 });
    }

    // -------------------------------------------------------------------------
    // ADVANCED PERIMETER SAFEGUARDS
    // -------------------------------------------------------------------------
    const clientCountry = request.headers.get('cf-ipcountry');
    const clientIp = request.headers.get('cf-connecting-ip') || '0.0.0.0';

    // 0. Verify Global Config Constraints (Top-Level Firewall)
    const globalConfig = await db.prepare(`SELECT * FROM system_config`).all();
    const configMap: any = globalConfig.results.reduce((acc: any, row: any) => {
      acc[row.key] = row.value;
      return acc;
    }, {});

    if (configMap.global_allowed_countries) {
      const gList = configMap.global_allowed_countries.split(',').map((c: string) => c.trim().toUpperCase());
      if (gList.length > 0 && (!clientCountry || !gList.includes(clientCountry.toUpperCase()))) {
        return NextResponse.json({ 
          error: 'SYSTEM LEVEL DENIAL: Global governance dictates restricted operations from this jurisdiction.' 
        }, { status: 403 });
      }
    }

    if (configMap.global_allowed_ips) {
      const gIps = configMap.global_allowed_ips.split(',').map((ip: string) => ip.trim());
      const isGlobalMatch = gIps.some((allowed: string) => {
         return allowed.includes('/') ? clientIp.startsWith(allowed.split('/')[0]) : clientIp === allowed;
      });
      if (!isGlobalMatch) {
        return NextResponse.json({ 
          error: 'SYSTEM LEVEL DENIAL: Universal Firewall rejected ingress vector. Access strictly prohibited.' 
        }, { status: 403 });
      }
    }

    // 1. Verify Specific Record Country Constraint
    if (secretRecord.allowed_countries) {
      const list = secretRecord.allowed_countries.split(',').map((c: string) => c.trim().toUpperCase());
      if (!clientCountry || !list.includes(clientCountry.toUpperCase())) {
        logger.warn(`[SECURITY] Geo-Block triggered. Incoming: ${clientCountry}. Required: ${list}`);
        return NextResponse.json({ 
          error: 'ACCESS DENIED: This intelligence is geofenced and not authorized for retrieval in your current operating theater.' 
        }, { status: 403 });
      }
    }

    // 2. Verify IP / CIDR Constraint
    if (secretRecord.allowed_ips) {
      const list = secretRecord.allowed_ips.split(',').map((ip: string) => ip.trim());
      // Simple matching for now, extensible to full CIDR helper if needed
      const isMatch = list.some((allowed: string) => {
        if (allowed.includes('/')) {
          // Handle subnet (Optional complex check, here we simplify to startswith for basic support or exact match)
          return clientIp.startsWith(allowed.split('/')[0]); 
        }
        return clientIp === allowed;
      });

      if (!isMatch) {
         logger.warn(`[SECURITY] IP-Block triggered. Incoming: ${clientIp}`);
         return NextResponse.json({ 
          error: 'ACCESS DENIED: Unauthorized physical vector. Target source IP does not match predefined clearance manifests.' 
        }, { status: 403 });
      }
    }

    // 3. Verify Email Domain Constraint (Requires Active Auth)
    if (secretRecord.allowed_domains) {
       // Import NextAuth auth helper
       const { auth } = await import('@/auth');
       const session = await auth();
       const viewerEmail = session?.user?.email;
       if (!viewerEmail) {
         return NextResponse.json({
           error: 'AUTHENTICATION REQUIRED: Secure Domain clearance required to unlock this secret.'
         }, { status: 401 });
       }

       const viewerDomain = viewerEmail.split('@')[1]?.toLowerCase();
       const domainList = secretRecord.allowed_domains.split(',').map((d: string) => d.trim().toLowerCase());

       if (!viewerDomain || !domainList.includes(viewerDomain)) {
         logger.warn(`[SECURITY] Domain-Block triggered. Incoming domain: ${viewerDomain}`);
         return NextResponse.json({ 
           error: `ACCESS DENIED: Your organizational unit (${viewerDomain}) lacks the requisite clearance to access this classified block.` 
         }, { status: 403 });
       }
    }
    // -------------------------------------------------------------------------

    const storageKey = secretRecord.storage_key;

    // 2. Fetch the encrypted blob from R2
    const object = await storage.get(storageKey);
    if (!object) {
      return NextResponse.json({ error: 'Storage blob not found.' }, { status: 404 });
    }

    // Extract IV from Database instead of R2 Custom Metadata
    const ivBase64 = secretRecord.iv;
    if (!ivBase64) {
      return NextResponse.json({ error: 'Corruption: IV missing.' }, { status: 500 });
    }

    // Read the body completely into memory before we delete it from R2
    const fileBytes = await object.arrayBuffer();

    // 3. Delete the physical object from R2 immediately to guarantee zero recovery
    await storage.delete(storageKey);

    // Return the encrypted file and the decryption vector headers
    const headers = new Headers();
    headers.set('X-Stealth-IV', ivBase64);
    headers.set('X-Stealth-Is-File', String(secretRecord.is_file));
    headers.set('X-Stealth-Has-Password', String(secretRecord.has_password));
    if (secretRecord.salt) {
      headers.set('X-Stealth-Salt', secretRecord.salt);
    }

    return new NextResponse(fileBytes, { headers });
  } catch (error: any) {
    logger.error('Retrieve Error:', error);
    return NextResponse.json({ error: 'Failed to retrieve secret' }, { status: 500 });
  }
}
