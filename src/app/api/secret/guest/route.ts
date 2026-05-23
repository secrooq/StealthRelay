import { getRequestContext } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'edge';

const MAX_GUEST_FILE_SIZE_BYTES = 250 * 1024 * 1024; // 250MB limit

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const isFile = formData.get('isFile') === 'true';
    const ivBase64 = formData.get('iv') as string;
    
    const hasPassword = formData.get('hasPassword') === '1' ? 1 : 0;
    const salt = formData.get('salt') as string | null;
    const durationInput = Number(formData.get('durationHours') || 1);

    // Ensure safety controls: cap duration rigidly between 1 and 24 hours for non-authenticated callers
    const durationHours = Math.min(Math.max(1, durationInput), 24);

    if (!file || !ivBase64) {
      return NextResponse.json({ error: 'Missing file carrier or initialization vector.' }, { status: 400 });
    }

    // Strict edge boundary protection
    if (file.size > MAX_GUEST_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: 'Maximum guest transmission limit (250MB) breached.' }, { status: 413 });
    }

    const id = uuidv4();
    const storageKey = `secrets/${id}`;

    const ctx = getRequestContext();
    const db = ctx.env.DB;
    const storage = ctx.env.STEALTH_STORAGE;

    // 1. Push secure AES-encrypted cipher block to Cloudflare R2
    const buffer = await file.arrayBuffer();
    await storage.put(storageKey, buffer);

    // 2. Log meta registry in Cloudflare D1
    // Format string safely using positional parameters to calculate datetime
    const durationString = `+${durationHours} hours`;
    
    await db.prepare(`
      INSERT INTO stealth_secrets (
        id, storage_key, iv, is_file, has_password, salt, is_viewed, expires_at,
        allowed_countries, allowed_ips, allowed_domains
      )
      VALUES (?, ?, ?, ?, ?, ?, 0, datetime('now', ?), NULL, NULL, NULL)
    `)
    .bind(
      id, 
      storageKey, 
      ivBase64, 
      isFile ? 1 : 0, 
      hasPassword, 
      salt,
      durationString
    )
    .run();

    return NextResponse.json({ id, success: true });
  } catch (error: any) {
    console.error('Guest Secret API Exception:', error);
    return NextResponse.json({ error: 'Cloud Edge infrastructure failed to seal secret.' }, { status: 500 });
  }
}
