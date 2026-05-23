/**
 * CENTRALIZED SECURE EMAIL DELIVERY INTERFACE
 * Dispatches high-fidelity, zero-jargon transactional communications using the Brevo REST API.
 */

import { getEnv } from './db';

export interface SendEmailOptions {
  to: string;
  subject: string;
  htmlContent: string;
  brevoApiKey?: string;
}

export async function sendEmail({ to, subject, htmlContent, brevoApiKey }: SendEmailOptions): Promise<boolean> {
  const { logAudit } = await import('@/lib/audit');
  
  // 1. Try Mailchannels Delivery Bridge First (Cloudflare Edge Outbound)
  try {
    console.log(`[EMAIL_ROUTING] Attempting native Mailchannels edge broadcast for: ${to}`);
    const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: to }]
          }
        ],
        from: {
          email: 'info@stealthrelay.com',
          name: 'StealthRelay'
        },
        subject: subject,
        content: [
          {
            type: 'text/html',
            value: htmlContent
          }
        ]
      })
    });

    if (response.ok || response.status === 202) {
      console.log(`[EMAIL_ROUTING] Mailchannels edge broadcast succeeded for: ${to}`);
      await logAudit({
        userId: to,
        action: 'EMAIL_DISPATCH_SUCCESS',
        resourceType: 'RELAY',
        severity: 'INFO',
        details: { to, subject, provider: 'Mailchannels' }
      });
      return true;
    } else {
      const errText = await response.text().catch(() => '');
      console.warn(`[EMAIL_ROUTING] Mailchannels rejected edge dispatch: ${response.status} - ${errText}. Attempting fallback...`);
    }
  } catch (error) {
    console.warn('[EMAIL_ROUTING] Mailchannels transmission failed. Attempting fallback...', error);
  }

  // 2. Fallback to Brevo SMTP REST API
  if (brevoApiKey) {
    try {
      console.log(`[EMAIL_ROUTING] Initiating Brevo SMTP fallback transmission for: ${to}`);
      const payload = {
        sender: { name: 'StealthRelay', email: 'info@stealthrelay.com' },
        to: [{ email: to }],
        subject: subject,
        htmlContent: htmlContent
      };

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': brevoApiKey
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        console.log(`[EMAIL_ROUTING] Brevo SMTP fallback transmission succeeded for: ${to}`);
        await logAudit({
          userId: to,
          action: 'EMAIL_DISPATCH_SUCCESS',
          resourceType: 'RELAY',
          severity: 'INFO',
          details: { to, subject, provider: 'Brevo' }
        });
        return true;
      }

      const errBody = await response.text().catch(() => '');
      console.error('[EMAIL_ROUTING] Brevo SMTP fallback failed:', errBody);
    } catch (error) {
      console.error('[EMAIL_ROUTING] Brevo SMTP fallback exception:', error);
    }
  } else {
    console.warn('[EMAIL_ROUTING] Brevo API Key missing. Fallback path unavailable.');
  }

  await logAudit({
    userId: to,
    action: 'EMAIL_DISPATCH_FAILURE',
    resourceType: 'RELAY',
    severity: 'WARNING',
    details: { to, subject }
  });

  return false;
}

/**
 * Generates the HTML structure for Mailbox Verification.
 */
export function buildVerificationEmailHtml(verificationLink: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #050507;
          color: #ffffff;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #0a0a0e;
          border: 1px solid #1e1e2a;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.5);
        }
        .header {
          background-color: #000000;
          padding: 30px;
          text-align: center;
          border-bottom: 1px solid #1e1e2a;
        }
        .logo {
          font-family: monospace;
          font-size: 24px;
          font-weight: 900;
          letter-spacing: 0.2em;
          color: #10b981;
          text-transform: uppercase;
          text-decoration: none;
        }
        .content {
          padding: 40px;
        }
        h1 {
          font-size: 22px;
          font-weight: 700;
          margin-top: 0;
          margin-bottom: 20px;
          color: #ffffff;
        }
        p {
          font-size: 16px;
          line-height: 1.6;
          color: #b3b3cc;
          margin-bottom: 24px;
        }
        .btn-container {
          text-align: center;
          margin: 35px 0;
        }
        .btn {
          background-color: #10b981;
          color: #000000 !important;
          font-weight: bold;
          font-size: 15px;
          text-decoration: none;
          padding: 14px 32px;
          border-radius: 8px;
          display: inline-block;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
        }
        .footer {
          padding: 30px;
          text-align: center;
          font-size: 12px;
          color: #52526b;
          background-color: #000000;
          border-top: 1px solid #1e1e2a;
        }
        .footer a {
          color: #10b981;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <a href="https://stealthrelay.com" class="logo">StealthRelay</a>
        </div>
        <div class="content">
          <h1>Verify your linked mailbox</h1>
          <p>Hello,</p>
          <p>You recently added this email address to your StealthRelay account as a destination mailbox. To begin safely routing encrypted aliases to this address, please confirm ownership by clicking the activation button below:</p>
          <div class="btn-container">
            <a href="${verificationLink}" class="btn">Verify Mailbox</a>
          </div>
          <p style="font-size: 14px; color: #6b6b83;">If the button doesn't work, copy and paste the following URL into your browser:<br/>
          <span style="word-break: break-all; color: #10b981;">${verificationLink}</span></p>
          <p>If you did not request this, you can safely ignore this email. The link will automatically expire.</p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} StealthRelay. Zero-Knowledge Privacy. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Resolves the dynamic Brevo contact list ID for "Stealthrelay list" or defaults to ID 2.
 */
export async function getBrevoListId(apiKey: string): Promise<number> {
  try {
    const res = await fetch('https://api.brevo.com/v3/contacts/lists?limit=50&offset=0', {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey
      }
    });
    if (res.ok) {
      const data = await res.json() as any;
      if (data && Array.isArray(data.lists)) {
        // Search for a list named "Stealthrelay list" or similar
        const found = data.lists.find((l: any) => 
          l.name.toLowerCase().replace(/[\s_-]/g, '') === 'stealthrelaylist'
        );
        if (found) {
          console.log(`[BREVO] Dynamically resolved "Stealthrelay list" to ID: ${found.id}`);
          return found.id;
        }
      }
    }
  } catch (err) {
    console.error('[BREVO] Error resolving contacts list ID:', err);
  }
  return 2; // Standard fallback list ID
}

/**
 * Enrolls a target email address into the dedicated Brevo contact list.
 */
export async function syncContactToBrevo(email: string, apiKey?: string): Promise<boolean> {
  // Gracefully resolve api key if not passed explicitly
  const brevoApiKey = apiKey || getEnv("BREVO_API_KEY");
  if (!brevoApiKey) {
    console.warn('[BREVO] API Key missing. Contact sync bypassed.');
    return false;
  }

  try {
    const listId = await getBrevoListId(brevoApiKey);
    console.log(`[BREVO] Registering email ${email} into list ${listId}`);
    
    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': brevoApiKey
      },
      body: JSON.stringify({
        email: email,
        listIds: [listId],
        updateEnabled: true
      })
    });

    if (response.ok) {
      console.log(`[BREVO] Contact ${email} successfully synchronized to list ID ${listId}`);
      return true;
    } else {
      const errText = await response.text();
      // If contact already exists but needs list enrollment update
      if (errText.includes("already exist") || response.status === 400) {
        console.log(`[BREVO] Contact ${email} already exists. Attempting enrollment update...`);
        try {
          const updateRes = await fetch(`https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`, {
            method: 'PUT',
            headers: {
              'accept': 'application/json',
              'content-type': 'application/json',
              'api-key': brevoApiKey
            },
            body: JSON.stringify({
              listIds: [listId]
            })
          });
          if (updateRes.ok) {
            console.log(`[BREVO] Contact ${email} membership successfully updated.`);
            return true;
          }
        } catch (updateErr) {
          console.error('[BREVO] Contact update request failed:', updateErr);
        }
      }
      console.warn(`[BREVO] Contacts sync endpoint returned status ${response.status}: ${errText}`);
    }
  } catch (error) {
    console.error('[BREVO] Contact registration exception:', error);
  }
  return false;
}

