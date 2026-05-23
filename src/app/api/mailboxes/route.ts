import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getRequestContext, getEnv } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { sendEmail, buildVerificationEmailHtml } from '@/lib/email';

export const runtime = 'edge';

// GET: Retrieves verified and pending mailboxes for active user.
export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.email;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getRequestContext().env.DB;
    const { results } = await db.prepare(
      `SELECT id, email, is_verified, created_at, verification_token FROM user_mailboxes WHERE user_id = ? ORDER BY created_at DESC`
    ).bind(userId).all();

    return NextResponse.json({ mailboxes: results || [] });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

// POST: Registers a new candidate destination and generates secure token.
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.email;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const email = body.email?.trim().toLowerCase();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }

    const db = getRequestContext().env.DB;

    // Check limit
    const check = await db.prepare(`SELECT count(*) as total FROM user_mailboxes WHERE user_id = ?`).bind(userId).first();
    if (check && (check.total as number) >= 10) {
       return NextResponse.json({ error: 'Mailbox limit reached. Maximum 10 secondary mailboxes allowed.' }, { status: 403 });
    }

    // Check for existing
    const existing = await db.prepare(`SELECT id FROM user_mailboxes WHERE user_id = ? AND email = ?`)
      .bind(userId, email).first();
    if (existing) {
       return NextResponse.json({ error: 'This email address is already registered.' }, { status: 400 });
    }

    const id = uuidv4();
    const array = new Uint8Array(32);
    globalThis.crypto.getRandomValues(array);
    const verificationToken = Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');

    await db.prepare(
      `INSERT INTO user_mailboxes (id, user_id, email, is_verified, verification_token) VALUES (?, ?, ?, 0, ?)`
    ).bind(id, userId, email, verificationToken).run();

    const verificationLink = `${request.nextUrl.origin}/api/verify/${verificationToken}`;

    // Fire-and-forget email dispatch using Brevo connection
    const brevoApiKey = getEnv("BREVO_API_KEY");
    
    let emailFired = false;
    if (brevoApiKey) {
      emailFired = await sendEmail({
        to: email,
        subject: 'Verify your StealthRelay Linked Mailbox',
        htmlContent: buildVerificationEmailHtml(verificationLink),
        brevoApiKey: brevoApiKey
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: emailFired ? 'Verification email dispatched.' : 'Verification token generated locally.',
      verificationToken, 
      debugLink: verificationLink,
      emailFired
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
