import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export const runtime = "edge";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const token = searchParams.get("token");

    if (!email || !token) {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <title>StealthRelay - Protocol Link Broken</title>
          <style>
            body {
              background-color: #070908;
              color: #f43f5e;
              font-family: monospace;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-h: 100vh;
              height: 100vh;
              margin: 0;
            }
            .card {
              border: 1px solid rgba(244, 63, 94, 0.2);
              background: #0f1110;
              padding: 40px;
              border-radius: 12px;
              text-align: center;
              box-shadow: 0 0 30px rgba(244, 63, 94, 0.05);
            }
            h1 { font-size: 18px; margin-bottom: 20px; letter-spacing: 0.1em; }
            p { color: #94a3b8; font-size: 12px; max-width: 400px; line-height: 1.6; }
            a { color: #00ff66; text-decoration: none; font-size: 11px; margin-top: 20px; display: inline-block; border: 1px border-[#00ff66]/20; padding: 8px 16px; border-radius: 6px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>[ PROTOCOL DISRUPTED ]</h1>
            <p>The magic link you are attempting to consume has an invalid or incomplete cryptographic token pack.</p>
            <a href="/login">[ BACK TO CONSOLE ]</a>
          </div>
        </body>
        </html>
        `,
        { headers: { "Content-Type": "text/html" } }
      );
    }

    // Serve a high-fidelity client-side link page
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>StealthRelay - Link Protocol Establishing</title>
        <meta charset="utf-8">
        <style>
          body {
            background-color: #070908;
            color: #ffffff;
            font-family: monospace;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            height: 100vh;
            margin: 0;
            overflow: hidden;
          }
          .console-box {
            max-width: 500px;
            width: 90%;
            border: 1px solid rgba(0, 255, 102, 0.15);
            background: #0a0d0c;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 0 40px rgba(0, 255, 102, 0.03);
            text-align: center;
            position: relative;
          }
          .spinner {
            width: 40px;
            height: 40px;
            border: 2px solid rgba(0, 255, 102, 0.1);
            border-top-color: #00ff66;
            border-radius: 50%;
            animation: spin 1s infinite linear;
            margin: 0 auto 24px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          h1 {
            font-size: 14px;
            letter-spacing: 0.25em;
            color: #00ff66;
            margin: 0 0 10px 0;
            text-transform: uppercase;
            font-weight: 900;
          }
          .status {
            font-size: 10px;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 0.15em;
            margin-bottom: 24px;
          }
          .log {
            font-size: 11px;
            color: #94a3b8;
            line-height: 1.8;
            text-align: left;
            background: #020302;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.02);
            max-height: 120px;
            overflow-y: auto;
          }
          .error-text {
            color: #f43f5e !important;
          }
        </style>
        <!-- NextAuth client integration script -->
        <script src="https://cdn.jsdelivr.net/npm/next-auth@4.24.5/dist/client.js" defer></script>
      </head>
      <body>
        <div class="console-box">
          <div class="spinner" id="spinner"></div>
          <h1>ESTABLISHING LINK</h1>
          <div class="status" id="status-sub">Arming cryptographic secure conduit</div>
          
          <div class="log" id="log-box">
            <div>&gt; Spawn secure link runtime...</div>
            <div>&gt; Origin token check verified.</div>
            <div id="auth-status">&gt; Contacting local key ledger...</div>
          </div>
        </div>

        <script>
          window.addEventListener('DOMContentLoaded', async () => {
            const logBox = document.getElementById('log-box');
            const authStatus = document.getElementById('auth-status');
            const statusSub = document.getElementById('status-sub');
            const spinner = document.getElementById('spinner');

            function addLog(text, isError = false) {
              const div = document.createElement('div');
              div.textContent = '> ' + text;
              if (isError) div.className = 'error-text';
              logBox.appendChild(div);
              logBox.scrollTop = logBox.scrollHeight;
            }

            try {
              // Wait 1.5s to present elegant telemetry trace
              await new Promise(r => setTimeout(r, 1200));
              addLog('Deploying local credentials provider auth handshake...');

              // Direct client-side POST fetch to NextAuth API handler
              const res = await fetch('/api/auth/callback/credentials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                  email: ${JSON.stringify(email).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')},
                  password: ${JSON.stringify(token).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')},
                  action: 'magic_login',
                  redirect: 'false',
                  callbackUrl: '/dashboard'
                })
              });

              if (!res.ok) throw new Error('Handshake response status error.');

              addLog('Conduit confirmed. Dispatching authentication tokens...');
              statusSub.innerText = 'Redirecting to secure cockpit...';
              
              // Trigger final window redirect to clean session
              setTimeout(() => {
                window.location.href = '/dashboard';
              }, 800);

            } catch (err) {
              logger.error(err);
              spinner.style.borderTopColor = '#f43f5e';
              statusSub.innerText = 'LINK PROTOCOL FAILURE';
              statusSub.className = 'status error-text';
              addLog('Handshake fatal error: Session verification denied.', true);
              addLog('Please request a new magic link.', true);
            }
          });
        </script>
      </body>
      </html>
    `;

    return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
  } catch (error: any) {
    logger.error("[MAGIC_CALLBACK_ERROR]", error);
    return NextResponse.json({ error: "Magic authentication callback fatal error." }, { status: 500 });
  }
}
