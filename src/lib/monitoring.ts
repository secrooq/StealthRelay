import { sendEmail } from '@/lib/email';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { logger } from "@/lib/logger";

export async function sendSecurityAlert(subject: string, message: string) {
  try {
    let brevoApiKey = process.env.BREVO_API_KEY;
    try {
      const ctx = getRequestContext();
      if ((ctx?.env as any)?.BREVO_API_KEY) {
        brevoApiKey = (ctx.env as any).BREVO_API_KEY as string;
      }
    } catch (e) {}

    if (!brevoApiKey) {
      logger.error('[SECURITY_MONITOR] Missing BREVO_API_KEY. Cannot dispatch alert:', subject);
      return false;
    }

    const htmlContent = `
      <div style="font-family: monospace; background-color: #000; color: #00ff66; padding: 20px; border-radius: 5px;">
        <h2 style="color: #ff3333; margin-top: 0;">⚠️ CRITICAL SECURITY ALERT ⚠️</h2>
        <p><strong>Event:</strong> ${subject}</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <hr style="border-color: #333;" />
        <pre style="white-space: pre-wrap; font-family: monospace; color: #fff;">${message}</pre>
        <hr style="border-color: #333;" />
        <p style="font-size: 12px; color: #888;">StealthRelay Autonomous Monitoring System</p>
      </div>
    `;

    // Always dispatch to the master root admin email
    const adminEmail = 'info@stealthrelay.com';
    
    await sendEmail({
      to: adminEmail,
      subject: `[StealthRelay Security] ${subject}`,
      htmlContent,
      brevoApiKey
    });

    return true;
  } catch (error) {
    logger.error('[SECURITY_MONITOR] Failed to dispatch security alert:', error);
    return false;
  }
}
