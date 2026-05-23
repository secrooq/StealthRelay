import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    const userId = session?.user?.email;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const db = getRequestContext().env.DB;

    // 1. Handle toggle update
    if (typeof body.is_active !== 'undefined') {
      const newStatus = body.is_active ? 1 : 0;
      await db.prepare(`UPDATE relay_aliases SET is_active = ? WHERE id = ? AND user_id = ?`)
        .bind(newStatus, id, userId).run();
    }

    // 2. Handle PGP update
    if (typeof body.encryption_enabled !== 'undefined' || typeof body.pgp_public_key !== 'undefined') {
      const current: any = await db.prepare(`SELECT encryption_enabled, pgp_public_key FROM relay_aliases WHERE id = ? AND user_id = ?`)
        .bind(id, userId).first();

      if (!current) return NextResponse.json({ error: 'Alias not found' }, { status: 404 });

      const newEncVal = typeof body.encryption_enabled !== 'undefined' ? (body.encryption_enabled ? 1 : 0) : current.encryption_enabled;
      const newKeyVal = typeof body.pgp_public_key !== 'undefined' ? body.pgp_public_key : current.pgp_public_key;

      await db.prepare(`UPDATE relay_aliases SET encryption_enabled = ?, pgp_public_key = ? WHERE id = ? AND user_id = ?`)
        .bind(newEncVal, newKeyVal, id, userId).run();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    const userId = session?.user?.email;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getRequestContext().env.DB;
    const result = await db.prepare(
      `DELETE FROM relay_aliases WHERE id = ? AND user_id = ?`
    ).bind(id, userId).run();

    if (result.meta.changes === 0) {
      return NextResponse.json({ error: 'Alias not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Burn operation failed' }, { status: 500 });
  }
}
