import { getRequestContext } from '@cloudflare/next-on-pages';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params;
    const db = getRequestContext().env.DB;

    const record: any = await db.prepare(`SELECT id, email FROM user_mailboxes WHERE verification_token = ?`)
      .bind(token).first();

    if (!record) {
      return generateResponse("VERIFICATION FAILED: The provided cryptotoken is invalid, stale, or has already fragmented.", false);
    }

    // Flip flag
    await db.prepare(`UPDATE user_mailboxes SET is_verified = 1, verification_token = NULL WHERE id = ?`)
      .bind(record.id).run();

    return generateResponse(`CRYPTO-VALIDATION SUCCESSFUL. Destination [${record.email}] now fully operational within the grid.`, true);

  } catch (error: any) {
    return generateResponse("SYSTEM ERROR IN VECTOR CHAIN: Connection lost during commit.", false);
  }
}

function generateResponse(message: string, success: boolean) {
  const bg = success ? "#064e3b" : "#450a0a";
  const accent = success ? "#10b981" : "#ef4444";
  
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Vector Verification State</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { background: #020203; color: white; font-family: monospace; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; overflow: hidden; }
        .box { border: 1px solid ${accent}; background: rgba(255,255,255,0.02); padding: 3rem; border-radius: 8px; max-width: 450px; text-align: center; box-shadow: 0 0 40px ${bg}; }
        .icon { font-size: 2.5rem; color: ${accent}; margin-bottom: 1rem; }
        h2 { text-transform: uppercase; letter-spacing: 0.2em; font-size: 1.1rem; margin-bottom: 2rem; color: ${accent}; }
        p { font-size: 0.9rem; color: #94a3b8; line-height: 1.6; }
        .btn { display: inline-block; margin-top: 2rem; border: 1px solid #ffffff30; padding: 0.75rem 1.5rem; text-decoration: none; color: #94a3b8; text-transform: uppercase; font-size: 0.75rem; transition: 0.3s; }
        .btn:hover { background: #ffffff10; color: white; border-color: white; }
      </style>
    </head>
    <body>
      <div class="box">
        <div class="icon">${success ? '✓' : '⚡'}</div>
        <h2>${success ? 'Command Authenticated' : 'Interceptor Alert'}</h2>
        <p>${message}</p>
        <a href="/relay" class="btn">Return to Grid Dashboard</a>
      </div>
    </body>
    </html>
  `;
  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
