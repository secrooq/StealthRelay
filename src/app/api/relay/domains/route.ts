import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { getSubscriptionStatus, verifyActiveAccess } from '@/lib/subscription';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
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
    const { results } = await db.prepare(`
      SELECT * FROM custom_domains 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).bind(userId).all();

    return NextResponse.json({ domains: results || [] });
  } catch (error: any) {
    console.error('[DOMAINS_GET_ERROR]', error);
    return NextResponse.json({ error: 'Failed to retrieve custom domain records.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
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

    // Enforce Phantom or Enterprise plan gating
    const sub = await getSubscriptionStatus(userId);
    const isPaid = sub.plan === 'PHANTOM' || sub.plan === 'ENTERPRISE';
    
    let isPersonnel = false;
    try {
      const personnel: any = await db.prepare("SELECT status FROM security_personnel WHERE email = ?").bind(userId).first();
      if (personnel && personnel.status === 'ACTIVE') {
        isPersonnel = true;
      }
    } catch {}
    if (userId === 'admin@stealthrelay.com') {
      isPersonnel = true;
    }

    if (!isPaid && !isPersonnel) {
      return NextResponse.json({ 
        error: "Custom domain integration is a premium vector reserved strictly for Phantom Entity and Enterprise Core tiers." 
      }, { status: 403 });
    }

    const { domainName } = await request.json();
    if (!domainName || typeof domainName !== 'string') {
      return NextResponse.json({ error: 'Domain name is required.' }, { status: 400 });
    }

    const cleanDomain = domainName.trim().toLowerCase();
    
    // Domain regex check
    const domainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,15}$/;
    if (!domainRegex.test(cleanDomain)) {
      return NextResponse.json({ error: 'Invalid domain name format.' }, { status: 400 });
    }

    // Blacklist check (do not allow adding system domain stealthrelay.com)
    if (cleanDomain === 'stealthrelay.com' || cleanDomain.endsWith('.pages.dev')) {
      return NextResponse.json({ error: 'System domains cannot be registered.' }, { status: 400 });
    }

    const domainId = uuidv4();

    await db.prepare(`
      INSERT INTO custom_domains (id, user_id, domain_name, is_verified, catch_all_enabled)
      VALUES (?, ?, ?, 0, 0)
    `).bind(domainId, userId, cleanDomain).run();

    return NextResponse.json({ 
      success: true, 
      domain: {
        id: domainId,
        user_id: userId,
        domain_name: cleanDomain,
        is_verified: 0,
        catch_all_enabled: 0
      }
    });
  } catch (error: any) {
    if (error.message && error.message.includes('UNIQUE')) {
      return NextResponse.json({ error: 'This domain name is already registered.' }, { status: 400 });
    }
    console.error('[DOMAINS_POST_ERROR]', error);
    return NextResponse.json({ error: 'Failed to register domain.' }, { status: 500 });
  }
}
