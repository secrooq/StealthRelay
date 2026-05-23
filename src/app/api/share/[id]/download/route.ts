import { getRequestContext } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: 'Missing identifier' }, { status: 400 });

    const { passwordHash } = await request.json().catch(() => ({ passwordHash: null }));

    const { env, ctx } = getRequestContext();
    const db = env.DB;
    const storage = env.STEALTH_STORAGE;

    // Fetch base record and confirm expiry again before serving actual binary data
    const share: any = await db.prepare(`
      SELECT access_password_hash, expires_at
      FROM vault_shares WHERE id = ?
    `).bind(id).first();

    if (!share) {
      return NextResponse.json({ error: 'Payload not found' }, { status: 404 });
    }

    // Strict Expiry confirmation
    if (share.expires_at) {
      const expiry = new Date(share.expires_at);
      if (expiry < new Date()) {
        await storage.delete(`shares/${id}`);
        await db.prepare(`DELETE FROM vault_shares WHERE id = ?`).bind(id).run();
        return NextResponse.json({ error: 'Payload expired' }, { status: 410 });
      }
    }

    // Password verification
    if (share.access_password_hash) {
      if (!passwordHash || passwordHash !== share.access_password_hash) {
        return NextResponse.json({ error: 'AUTHENTICATION_REQUIRED', message: 'Incorrect or missing download key' }, { status: 401 });
      }
    }

    // Serve physical blob from R2
    const obj = await storage.get(`shares/${id}`);
    if (!obj) {
      return NextResponse.json({ error: 'Physical payload vanished' }, { status: 404 });
    }

    // 1. Delete D1 metadata record ATOMICALLY to prevent concurrency/TOCTOU race conditions
    const deletedShare = await db.prepare(`
      DELETE FROM vault_shares WHERE id = ? RETURNING id
    `).bind(id).first();

    if (!deletedShare) {
      return NextResponse.json({ error: 'Payload already viewed or concurrently downloaded' }, { status: 409 });
    }

    // 2. Implement edge stream cleanup to physically wipe the storage asset upon download completion/severance
    const { readable, writable } = new TransformStream();

    ctx.waitUntil(
      obj.body.pipeTo(writable)
        .then(async () => {
          console.log(`[BURN] Stream consumed completely for share ${id}. Wiping R2 object.`);
          await storage.delete(`shares/${id}`);
        })
        .catch(async (err: any) => {
          console.error(`[BURN] Stream severed/aborted for share ${id}:`, err, '. Purging immediately.');
          await storage.delete(`shares/${id}`);
        })
    );

    return new NextResponse(readable, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Physical payload delivery fail:', error);
    return NextResponse.json({ error: 'Intergalactic pipe breakdown' }, { status: 500 });
  }
}
