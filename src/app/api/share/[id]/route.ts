import { getRequestContext } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";

export const runtime = 'edge';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

    const ctx = getRequestContext();
    const db = ctx.env.DB;
    const storage = ctx.env.STEALTH_STORAGE;

    // Retrieve share record
    const share: any = await db.prepare(`
      SELECT file_name_encrypted, file_size, mime_type, share_iv, expires_at, access_password_hash
      FROM vault_shares WHERE id = ?
    `).bind(id).first();

    if (!share) {
      return NextResponse.json({ error: 'Link expired or deleted' }, { status: 404 });
    }

    // Expiry validation (Dynamic auto-destruction)
    if (share.expires_at) {
      const expiry = new Date(share.expires_at);
      if (expiry < new Date()) {
        // Proactive Cleanup: Delete background records from database & R2
        // Let's handle it async or await it
        await storage.delete(`shares/${id}`);
        await db.prepare(`DELETE FROM vault_shares WHERE id = ?`).bind(id).run();
        return NextResponse.json({ error: 'This secure payload has expired and been wiped from our system' }, { status: 410 });
      }
    }

    // Success - return share validation data (DO NOT expose access_password_hash, just a flag!)
    return NextResponse.json({
      id,
      encryptedMeta: share.file_name_encrypted,
      fileSize: share.file_size,
      mimeType: share.mime_type,
      shareIv: share.share_iv,
      requiresPassword: !!share.access_password_hash
    });
  } catch (error) {
    logger.error('Public share fetch failure:', error);
    return NextResponse.json({ error: 'Zero-knowledge bridge disruption' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

    const { passwordHash } = await request.json().catch(() => ({ passwordHash: null }));

    const ctx = getRequestContext();
    const db = ctx.env.DB;
    const storage = ctx.env.STEALTH_STORAGE;

    // Retrieve record
    const share: any = await db.prepare(`
      SELECT access_password_hash, expires_at
      FROM vault_shares WHERE id = ?
    `).bind(id).first();

    if (!share) {
      return NextResponse.json({ error: 'Link expired or deleted' }, { status: 404 });
    }

    // Expiry check
    if (share.expires_at) {
      const expiry = new Date(share.expires_at);
      if (expiry < new Date()) {
        await storage.delete(`shares/${id}`);
        await db.prepare(`DELETE FROM vault_shares WHERE id = ?`).bind(id).run();
        return NextResponse.json({ error: 'Secure link has expired.' }, { status: 410 });
      }
    }

    // Verify password if required
    if (share.access_password_hash) {
      if (!passwordHash || passwordHash !== share.access_password_hash) {
        return NextResponse.json({ error: 'Incorrect password', verified: false }, { status: 401 });
      }
    }

    return NextResponse.json({ success: true, verified: true });
  } catch (error) {
    logger.error('Password verification failure:', error);
    return NextResponse.json({ error: 'Handshake disruption' }, { status: 500 });
  }
}
