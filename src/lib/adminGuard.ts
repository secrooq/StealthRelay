import { cookies } from 'next/headers';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { getEnv } from './db';

export interface AdminSession {
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'DEVELOPER' | 'VIEWER';
}

export function getAdminBypassSecret(): string {
  const secret = getEnv('ADMIN_BYPASS_SECRET');
  if (secret) {
    return secret.trim().replace(/^["']|["']$/g, '');
  }
  return (process.env.ADMIN_BYPASS_SECRET || crypto.randomUUID())
    .trim()
    .replace(/^["']|["']$/g, '');
}

/**
 * Ensures the security_personnel table has at least one active ROOT admin (info@stealthrelay.com).
 */
export async function seedSecurityPersonnel() {
  try {
    const db = getRequestContext().env.DB;
    const count: any = await db.prepare(`SELECT COUNT(*) as cnt FROM security_personnel`).first();
    if (count && count.cnt === 0) {
      await db.prepare(`
        INSERT INTO security_personnel (id, email, role, status)
        VALUES (?, ?, ?, ?)
      `).bind(
        'root-admin-id',
        'info@stealthrelay.com',
        'SUPER_ADMIN',
        'ACTIVE'
      ).run();
      console.log('Seeded root admin info@stealthrelay.com');
    }
  } catch (e) {
    console.warn('Database seed check bypassed or failed:', e);
  }
}

export async function signSession(email: string, role: string, expires: number, secret: string): Promise<string> {
  const data = `${email}:${role}:${expires}`;
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    encoder.encode(data)
  );
  const hashArray = Array.from(new Uint8Array(signature));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `${data}:${hashHex}`;
}

export async function verifySession(cookieValue: string, secret: string): Promise<{ email: string; role: string; expires: number } | null> {
  try {
    const parts = cookieValue.split(':');
    if (parts.length !== 4) return null;
    const [email, role, expiresStr, signature] = parts;
    const expires = parseInt(expiresStr);
    if (Date.now() > expires) return null;

    const expectedPart = await signSession(email, role, expires, secret);
    const expectedSig = expectedPart.split(':')[3];
    if (signature === expectedSig) {
      return { email, role, expires };
    }
  } catch (e) {
    console.error('verifySession error:', e);
  }
  return null;
}

/**
 * Retrieve the active administrative session.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('stealth_admin_session')?.value?.trim();
    if (!token) return null;

    const secret = getAdminBypassSecret();
    const verified = await verifySession(token, secret);
    if (!verified) return null;

    const db = getRequestContext().env.DB;
    await seedSecurityPersonnel(); // Ensure DB is seeded

    // Verify they are not banned and match role
    const personnel: any = await db.prepare(`
      SELECT status, role FROM security_personnel WHERE email = ?
    `).bind(verified.email).first();

    if (!personnel || personnel.status === 'BANNED') {
      return null;
    }

    return {
      email: verified.email,
      role: personnel.role as any
    };
  } catch (e) {
    console.error('getAdminSession exception:', e);
  }
  return null;
}

/**
 * Verify admin access from a cookie store (for API routes / server components).
 */
export async function isAdminUser(): Promise<boolean> {
  const session = await getAdminSession();
  return session !== null;
}

export async function requireAdmin(allowedRoles: Array<'SUPER_ADMIN' | 'ADMIN' | 'DEVELOPER' | 'VIEWER'> = ['SUPER_ADMIN', 'ADMIN', 'DEVELOPER', 'VIEWER']) {
  const session = await getAdminSession();
  if (!session) {
    throw new Error('403 Forbidden: Administrative Clearance Required');
  }
  if (!allowedRoles.includes(session.role)) {
    throw new Error('403 Forbidden: Insufficient administrative privileges');
  }
  return session;
}
