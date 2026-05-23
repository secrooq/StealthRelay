import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getDb } from '@/lib/db';
import { verifyActiveAccess } from '@/lib/subscription';

export const runtime = 'edge';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await auth();
    const userId = session?.user?.email;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isActive = await verifyActiveAccess(userId);
    if (!isActive) {
      return NextResponse.json({ error: 'SUBSCRIPTION_EXPIRED', locked: true }, { status: 403 });
    }

    const db = getDb();

    // Verify ownership
    const domain: any = await db.prepare(`
      SELECT domain_name FROM custom_domains WHERE id = ? AND user_id = ?
    `).bind(id, userId).first();

    if (!domain) {
      return NextResponse.json({ error: 'Domain registration not found.' }, { status: 404 });
    }

    // Delete domain record
    await db.prepare(`
      DELETE FROM custom_domains WHERE id = ?
    `).bind(id).run();

    // Also delete any aliases created with this custom domain suffix to prevent orphans!
    await db.prepare(`
      DELETE FROM relay_aliases WHERE user_id = ? AND alias_address LIKE ?
    `).bind(userId, `%@${domain.domain_name}`).run();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[DOMAIN_DELETE_ERROR]', error);
    return NextResponse.json({ error: 'Failed to delete domain record.' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await auth();
    const userId = session?.user?.email;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isActive = await verifyActiveAccess(userId);
    if (!isActive) {
      return NextResponse.json({ error: 'SUBSCRIPTION_EXPIRED', locked: true }, { status: 403 });
    }

    const db = getDb();
    const body = await request.json().catch(() => ({}));
    const action = body.action;

    if (action !== 'verify') {
      return NextResponse.json({ error: 'Unsupported action.' }, { status: 400 });
    }

    // Verify ownership
    const domain: any = await db.prepare(`
      SELECT domain_name FROM custom_domains WHERE id = ? AND user_id = ?
    `).bind(id, userId).first();

    if (!domain) {
      return NextResponse.json({ error: 'Domain registration not found.' }, { status: 404 });
    }

    // Query Cloudflare DNS-over-HTTPS
    const cfDnsUrl = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain.domain_name)}&type=TXT`;
    const cfRes = await fetch(cfDnsUrl, {
      headers: { 'Accept': 'application/dns-json' }
    });

    if (!cfRes.ok) {
      return NextResponse.json({ error: 'DNS resolution nodes are temporarily unreachable. Retry shortly.' }, { status: 502 });
    }

    const dnsJson: any = await cfRes.json();
    const txtRecords = dnsJson.Answer || [];
    const expectedToken = `stealthrelay-verification=${id}`;
    
    let verified = false;
    for (const record of txtRecords) {
      // Remove enclosing double quotes from TXT record response
      const dataStr = String(record.data || '').replace(/^["']|["']$/g, '');
      if (dataStr.trim() === expectedToken) {
        verified = true;
        break;
      }
    }

    if (verified) {
      await db.prepare(`
        UPDATE custom_domains 
        SET is_verified = 1 
        WHERE id = ?
      `).bind(id).run();
      
      return NextResponse.json({ success: true, verified: true });
    }

    return NextResponse.json({ 
      success: true, 
      verified: false, 
      error: `Verification token mismatch. Ensure a TXT record for ${domain.domain_name} contains "stealthrelay-verification=${id}".` 
    });
  } catch (error: any) {
    console.error('[DOMAIN_VERIFY_ERROR]', error);
    return NextResponse.json({ error: 'Failed to verify DNS status.' }, { status: 500 });
  }
}
