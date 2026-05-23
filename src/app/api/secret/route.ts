import { getRequestContext } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const isFile = formData.get('isFile') === 'true';
    const ivBase64 = formData.get('iv') as string;
    
    const hasPassword = formData.get('hasPassword') === '1' ? 1 : 0;
    const salt = formData.get('salt') as string | null;

    const allowedCountries = formData.get('allowedCountries') as string | null;
    const allowedIps = formData.get('allowedIps') as string | null;
    const allowedDomains = formData.get('allowedDomains') as string | null;

    if (!file || !ivBase64) {
      return NextResponse.json({ error: 'Missing file or IV' }, { status: 400 });
    }

    const id = uuidv4();
    const storageKey = `secrets/${id}`;

    const ctx = getRequestContext();
    const db = ctx.env.DB;
    const storage = ctx.env.STEALTH_STORAGE;

    // 1. Upload the encrypted blob to R2
    const buffer = await file.arrayBuffer();
    await storage.put(storageKey, buffer);

    // 2. Insert tracking record into D1 with lockdown parameters
    await db.prepare(`
      INSERT INTO stealth_secrets (
        id, storage_key, iv, is_file, has_password, salt, is_viewed, expires_at,
        allowed_countries, allowed_ips, allowed_domains
      )
      VALUES (?, ?, ?, ?, ?, ?, 0, datetime('now', '+3 days'), ?, ?, ?)
    `)
    .bind(
      id, 
      storageKey, 
      ivBase64, 
      isFile ? 1 : 0, 
      hasPassword, 
      salt,
      allowedCountries,
      allowedIps,
      allowedDomains
    )
    .run();

    return NextResponse.json({ id, success: true });
  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: 'Failed to process secret' }, { status: 500 });
  }
}
