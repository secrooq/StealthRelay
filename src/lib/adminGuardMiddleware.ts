import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

import { getEnv } from "@/lib/db";

// Read the admin bypass secret from all possible sources
function getAdminBypassSecret(): string {
  const secret = getEnv("ADMIN_BYPASS_SECRET");
  if (secret) {
    return secret.trim().replace(/^["']|["']$/g, '');
  }
  return crypto.randomUUID();
}

// Cookie-based admin guard — reads cookie from request headers (works in all runtimes)
export function isAdminFromRequest(request: NextRequest): boolean {
  const token = request.cookies.get('stealth_admin_token')?.value?.trim();
  if (!token) return false;
  return token === getAdminBypassSecret();
}
