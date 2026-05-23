import { getRequestContext } from '@/lib/db';
import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { verifyActiveAccess } from '@/lib/subscription';
import { logger } from "@/lib/logger";

export const runtime = 'edge';

export async function GET(request: NextRequest, context: { params: Promise<{ slug?: string[] }> }) {
  try {
    const params = await context.params;
    const slug = params.slug || [];
    const primary = slug[0] || '';

    // Route 1: files
    if (primary === 'files') {
      const session = await auth();
      const userId = session?.user?.email;
      if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

      const ctx = getRequestContext();
      const db = ctx.env.DB;

      const { results } = await db.prepare(
        `SELECT id, wrapped_key, file_iv, encrypted_metadata AS encrypted_meta, meta_iv, file_size, created_at 
         FROM vault_files 
         WHERE user_id = ? 
         ORDER BY created_at DESC`
      ).bind(userId).all();

      return NextResponse.json({ files: results || [] });
    }

    // Route 2: profile
    if (primary === 'profile') {
      const session = await auth();
      const userId = session?.user?.email;
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const ctx = getRequestContext();
      const db = ctx.env.DB;

      const profile = await db.prepare(
        `SELECT salt, wrapped_vault_key_pwd, iv_pwd, wrapped_vault_key_rec, iv_rec FROM vault_users WHERE user_id = ?`
      ).bind(userId).first() as any;

      if (!profile || !profile.wrapped_vault_key_pwd) {
        return NextResponse.json({ exists: false });
      }

      return NextResponse.json({ exists: true, profile });
    }

    // Route 3: download/[id]
    if (primary === 'download' && slug[1]) {
      const fileId = slug[1];
      const session = await auth();
      const userId = session?.user?.email;
      if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

      const ctx = getRequestContext();
      const db = ctx.env.DB;
      const storage = ctx.env.STEALTH_STORAGE;

      // Verify ownership
      const fileRecord: any = await db.prepare(
        `SELECT storage_key FROM vault_files WHERE id = ? AND user_id = ?`
      ).bind(fileId, userId).first();

      if (!fileRecord) {
        return NextResponse.json({ error: 'File not found or permission denied' }, { status: 404 });
      }

      // Retrieve from R2
      const obj = await storage.get(fileRecord.storage_key);
      if (!obj) {
        return NextResponse.json({ error: 'Object missing in physical storage' }, { status: 404 });
      }

      return new NextResponse(obj.body);
    }

    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  } catch (error: any) {
    logger.error('Vault API GET error:', error);
    return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ slug?: string[] }> }) {
  try {
    const params = await context.params;
    const slug = params.slug || [];
    const primary = slug[0] || '';

    // Route 1: profile initialization
    if (primary === 'profile') {
      const session = await auth();
      const userId = session?.user?.email;
      if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

      const { salt, wrapped_vault_key_pwd, iv_pwd, wrapped_vault_key_rec, iv_rec } = await request.json();

      if (!salt || !wrapped_vault_key_pwd || !iv_pwd || !wrapped_vault_key_rec || !iv_rec) {
        return NextResponse.json({ error: 'Incomplete credentials payload' }, { status: 400 });
      }

      const ctx = getRequestContext();
      const db = ctx.env.DB;

      const existing = await db.prepare(`SELECT user_id, wrapped_vault_key_pwd FROM vault_users WHERE user_id = ?`).bind(userId).first() as any;
      if (existing && existing.wrapped_vault_key_pwd) {
        return NextResponse.json({ error: 'Vault already initialized' }, { status: 409 });
      }

      if (existing) {
        await db.prepare(`
          UPDATE vault_users 
          SET salt = ?, wrapped_vault_key_pwd = ?, iv_pwd = ?, wrapped_vault_key_rec = ?, iv_rec = ?
          WHERE user_id = ?
        `).bind(salt, wrapped_vault_key_pwd, iv_pwd, wrapped_vault_key_rec, iv_rec, userId).run();
      } else {
        await db.prepare(`
          INSERT INTO vault_users (user_id, salt, wrapped_vault_key_pwd, iv_pwd, wrapped_vault_key_rec, iv_rec)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(userId, salt, wrapped_vault_key_pwd, iv_pwd, wrapped_vault_key_rec, iv_rec).run();
      }

      return NextResponse.json({ success: true });
    }

    // Route 2: share creation
    if (primary === 'share') {
      const session = await auth();
      const userId = session?.user?.email;
      if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

      const isActive = await verifyActiveAccess(userId);
      if (!isActive) {
        return NextResponse.json({ error: 'ACCESS_DENIED_EXPIRED', locked: true }, { status: 403 });
      }

      const formData = await request.formData();
      const file = formData.get('file') as File;
      const encryptedMeta = formData.get('encryptedMeta') as string;
      const shareIv = formData.get('shareIv') as string;
      const fileSize = parseInt(formData.get('fileSize') as string || '0');
      const mimeType = formData.get('mimeType') as string || 'application/octet-stream';
      const expiryHoursRaw = formData.get('expiryHours') as string | null;
      const passwordHash = formData.get('passwordHash') as string | null;

      if (!file || !encryptedMeta || !shareIv) {
        return NextResponse.json({ error: 'Incomplete encryption package' }, { status: 400 });
      }

      let hours = 24;
      if (expiryHoursRaw) {
        const parsed = parseInt(expiryHoursRaw);
        if (!isNaN(parsed) && parsed > 0) {
          hours = Math.min(336, parsed);
        }
      }
      const now = new Date();
      now.setHours(now.getHours() + hours);
      const expiresAt = now.toISOString();

      const ctx = getRequestContext();
      const db = ctx.env.DB;
      const storage = ctx.env.STEALTH_STORAGE;

      const shareId = uuidv4();
      const storageKey = `shares/${shareId}`;

      const buffer = await file.arrayBuffer();

      await storage.put(storageKey, buffer, {
        customMetadata: {
          shareId,
          ownerId: userId
        }
      });

      await db.prepare(`
        INSERT INTO vault_shares (
          id, owner_id, file_name_encrypted, file_size, mime_type, share_iv, expires_at, access_password_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        shareId,
        userId,
        encryptedMeta,
        fileSize,
        mimeType,
        shareIv,
        expiresAt,
        passwordHash
      ).run();

      return NextResponse.json({ success: true, shareId });
    }

    // Route 3: file upload
    if (primary === 'upload') {
      const session = await auth();
      const userId = session?.user?.email;
      if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

      const isActive = await verifyActiveAccess(userId);
      if (!isActive) {
        return NextResponse.json({ error: 'ACCESS_DENIED_EXPIRED', locked: true }, { status: 403 });
      }

      const formData = await request.formData();
      const file = formData.get('file') as File;
      const wrappedKey = formData.get('wrappedKey') as string;
      const fileIv = formData.get('fileIv') as string;
      const encryptedMetadata = formData.get('encryptedMetadata') as string;
      const metaIv = formData.get('metaIv') as string;
      const fileSize = parseInt(formData.get('fileSize') as string || '0');

      if (!file || !wrappedKey || !fileIv || !encryptedMetadata || !metaIv) {
        return NextResponse.json({ error: 'Incomplete payload' }, { status: 400 });
      }

      const ctx = getRequestContext();
      const db = ctx.env.DB;
      const storage = ctx.env.STEALTH_STORAGE;

      const fileId = uuidv4();
      const storageKey = `vault/${userId}/${fileId}`;

      const buffer = await file.arrayBuffer();

      await storage.put(storageKey, buffer);

      await db.prepare(`
        INSERT INTO vault_files (id, user_id, storage_key, wrapped_key, file_iv, encrypted_metadata, meta_iv, file_size)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        fileId,
        userId,
        storageKey,
        wrappedKey,
        fileIv,
        encryptedMetadata,
        metaIv,
        fileSize
      ).run();

      return NextResponse.json({ success: true, id: fileId });
    }

    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  } catch (error: any) {
    logger.error('Vault API Mutate error:', error);
    return NextResponse.json({ error: 'Logic breakdown' }, { status: 500 });
  }
}
