import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getDb } from '@/lib/db';
import { generateMaskedAlias } from '@/lib/aliasGenerator';
import { v4 as uuidv4 } from 'uuid';
import { verifyActiveAccess } from '@/lib/subscription';
import { validateApiKey } from '@/lib/apiKeyGuard';
import { logger } from "@/lib/logger";

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    let userId = session?.user?.email;
    
    if (!userId) {
      const apiKeyResult = await validateApiKey(request);
      if (apiKeyResult.isValid) {
        userId = apiKeyResult.userId;
      }
    }

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Block locked assets if subscription lapsed
    const isActive = await verifyActiveAccess(userId);
    if (!isActive) {
      return NextResponse.json({ error: 'SUBSCRIPTION_EXPIRED', locked: true }, { status: 403 });
    }

    const db = getDb();
    const { results } = await db.prepare(
      `SELECT * FROM relay_aliases 
       WHERE user_id = ? 
       ORDER BY created_at DESC`
    ).bind(userId).all();

    return NextResponse.json({ aliases: results || [] });
  } catch (error: any) {
    logger.error('[RELAY_LIST_ERROR]', error);
    return NextResponse.json({ error: 'Database failure' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    let userId = session?.user?.email;

    if (!userId) {
      const apiKeyResult = await validateApiKey(request);
      if (apiKeyResult.isValid) {
        userId = apiKeyResult.userId;
      }
    }

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Block creation for lapsed entities
    const isActive = await verifyActiveAccess(userId);
    if (!isActive) {
      return NextResponse.json({ error: 'SUBSCRIPTION_EXPIRED', locked: true }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const label = body.label || 'Unnamed Alias';
    const customDest = body.destinationEmail?.trim().toLowerCase();
    
    // In our NextAuth setup, the primary email is the user's logged email itself!
    const primaryEmail = userId;

    let targetDestination = primaryEmail;
    const db = getDb();

    // If explicit custom destination requested, verify legality
    if (customDest && customDest !== primaryEmail.toLowerCase()) {
       const check: any = await db.prepare(`SELECT is_verified FROM user_mailboxes WHERE user_id = ? AND email = ?`)
         .bind(userId, customDest).first();
       
       if (!check) {
         return NextResponse.json({ error: 'Destination unregistered. Add it to mailboxes first.' }, { status: 400 });
       }
       if (check.is_verified !== 1) {
         return NextResponse.json({ error: 'Destination not verified. Activate it in telemetry first.' }, { status: 400 });
       }
       targetDestination = customDest;
    }

    // Use custom domain provided by system config if present, otherwise default.
    let activeDomain = 'stealthrelay.com';
    try {
      const domainConfig: any = await db.prepare(`SELECT value FROM system_config WHERE key = 'relay_domain' LIMIT 1`).first();
      if (domainConfig?.value && domainConfig.value.trim() !== "") {
        activeDomain = domainConfig.value.trim();
      }
    } catch (cfgErr) {
      logger.info("Note: Using default domain, system_config lookup failed or uninitialized");
    }

    const reqDomain = body.domain?.trim().toLowerCase();
    if (reqDomain && reqDomain !== 'stealthrelay.com' && reqDomain !== activeDomain) {
      // Validate that this custom domain exists, belongs to the user, and is verified!
      const domainCheck: any = await db.prepare(`
        SELECT is_verified FROM custom_domains 
        WHERE user_id = ? AND domain_name = ? LIMIT 1
      `).bind(userId, reqDomain).first();

      if (!domainCheck) {
        return NextResponse.json({ error: 'This custom domain is not registered to your profile.' }, { status: 400 });
      }
      if (domainCheck.is_verified !== 1) {
        return NextResponse.json({ error: 'This custom domain is registered but not verified yet. Complete DNS setup.' }, { status: 400 });
      }
      activeDomain = reqDomain;
    }
    
    const aliasStr = generateMaskedAlias(activeDomain);
    const newId = uuidv4();

    await db.prepare(
      `INSERT INTO relay_aliases (id, user_id, alias_address, destination_email, label, is_active, forward_count)
       VALUES (?, ?, ?, ?, ?, 1, 0)`
    ).bind(newId, userId, aliasStr, targetDestination, label).run();

    return NextResponse.json({ 
      success: true,
      alias: {
        id: newId,
        alias_address: aliasStr,
        destination_email: targetDestination,
        label,
        is_active: 1
      } 
    });
  } catch (error: any) {
    logger.error('[RELAY_CREATE_ERROR]', error);
    return NextResponse.json({ error: 'Failed to create alias' }, { status: 500 });
  }
}
