import { NextResponse } from "next/server";
import { initStripe, getStripeWebhookSecret } from "@/lib/stripe";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { sendEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

export const runtime = "edge";

async function getDynamicEmailTemplate(db: any, templateId: string, defaults: { subject: string; body: string }) {
  try {
    const row: any = await db.prepare("SELECT subject, body, status FROM email_templates WHERE id = ?").bind(templateId).first();
    if (row && row.status === 'ENABLED') {
      return { subject: row.subject, body: row.body };
    }
  } catch (err) {
    logger.warn(`[DYNAMIC_TEMPLATE_WARNING] Failed to fetch template ${templateId}. Falling back to default.`);
  }
  return defaults;
}

export async function POST(req: Request) {
  const stripe = initStripe();
  const webhookSecret = getStripeWebhookSecret();
  const context = getRequestContext();
  const db = context.env.DB;
  const env = context.env as any;

  let event: any;
  const payload = await req.text();
  const sig = req.headers.get("stripe-signature");

  // In production, reject unauthenticated webhook requests
  if (process.env.NODE_ENV === "production" && (!webhookSecret || !sig)) {
    logger.error("[STRIPE_WEBHOOK_ERROR] Signature and Webhook Secret are mandatory in production nodes.");
    return NextResponse.json({ error: "Signature and Webhook Secret are mandatory in production nodes." }, { status: 400 });
  }

  try {
    if (webhookSecret && sig) {
      // Strict signature verification in production
      event = await stripe.webhooks.constructEventAsync(payload, sig, webhookSecret);
    } else {
      logger.warn("[STRIPE_WEBHOOK] Signature verification skipped (missing webhook secret). Parsing raw payload.");
      event = JSON.parse(payload);
    }
  } catch (err: any) {
    logger.error(`[STRIPE_WEBHOOK_VERIFY_ERROR] ${err.message}`);
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
  }

  const type = event.type;
  logger.info(`[STRIPE_WEBHOOK] Received event: ${type}`);

  try {
    // 1. Subscription completed / checkout succeeded
    if (type === "checkout.session.completed") {
      const session = event.data.object;
      const rawEmail = session.customer_email || session.metadata?.userId;
      const email = rawEmail ? String(rawEmail).trim().toLowerCase() : null;
      const subscriptionId = session.subscription;
      const metadataPlan = (session.metadata?.plan || "CONTRACTOR").toUpperCase();

      if (email) {
        let periodEnd: string | null = null;
        if (subscriptionId) {
          const subDetails = (await stripe.subscriptions.retrieve(String(subscriptionId))) as any;
          periodEnd = new Date(subDetails.current_period_end * 1000).toISOString();
        }

        const now = new Date().toISOString();
        await db.prepare(`
          INSERT INTO user_subscriptions (user_id, plan, status, current_period_end, updated_at, source)
          VALUES (?, ?, 'ACTIVE', ?, ?, 'stripe_webhook')
          ON CONFLICT(user_id) DO UPDATE SET
            plan = ?,
            status = 'ACTIVE',
            current_period_end = ?,
            updated_at = ?,
            source = 'stripe_webhook'
        `).bind(email, metadataPlan, periodEnd, now, metadataPlan, periodEnd, now).run();

        logger.info(`[STRIPE_WEBHOOK] Successfully activated ${metadataPlan} for: ${email}`);

        // DISPATCH SECURE SUBSCRIPTION CONFIRMATION EMAIL
        const brevoApiKey = env.BREVO_API_KEY || process.env.BREVO_API_KEY;
        if (brevoApiKey) {
          const tData = await getDynamicEmailTemplate(db, "checkout_paid", {
            subject: `StealthRelay Plan Activated: ${metadataPlan}`,
            body: `
              <div style="background-color: #050507; color: #ffffff; font-family: monospace; padding: 30px; border: 1px solid #10b981; border-radius: 8px; max-width: 600px; margin: auto;">
                <h2 style="color: #10b981; text-transform: uppercase; border-bottom: 1px solid #10b981; padding-bottom: 10px; margin-top: 0;">StealthRelay Activated</h2>
                <p>Operative, your secure data forwarder plan <strong>${metadataPlan}</strong> has been successfully authorized and activated.</p>
                <p>Your subscription details are updated in your dashboard cockpit. Secure transmission routes are fully operational.</p>
                <br/>
                <p style="font-size: 10px; color: #52526b; margin-bottom: 0;">Security Identity: ${email}</p>
              </div>
            `
          });

          const subject = tData.subject
            .replace(/\{\{\s*sitename\s*\}\}/g, "StealthRelay")
            .replace(/\{\{\s*plan\s*\}\}/g, metadataPlan)
            .replace(/\{\{\s*membership_level_name\s*\}\}/g, metadataPlan);

          const htmlContent = tData.body
            .replace(/\{\{\s*sitename\s*\}\}/g, "StealthRelay")
            .replace(/\{\{\s*plan\s*\}\}/g, metadataPlan)
            .replace(/\{\{\s*membership_level_name\s*\}\}/g, metadataPlan)
            .replace(/\{\{\s*display_name\s*\}\}/g, email)
            .replace(/\{\{\s*user_login\s*\}\}/g, email);

          await sendEmail({ to: email, subject, htmlContent, brevoApiKey });
        }
      }
    }

    // 2. Invoice payment succeeded (subscription renewed)
    if (type === "invoice.payment_succeeded") {
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription;
      const rawEmail = invoice.customer_email || invoice.customer_name;
      const email = rawEmail ? String(rawEmail).trim().toLowerCase() : null;

      if (subscriptionId && email) {
        const subDetails = (await stripe.subscriptions.retrieve(String(subscriptionId))) as any;
        const metadataPlan = (subDetails.metadata?.plan || "CONTRACTOR").toUpperCase();
        const periodEnd = new Date(subDetails.current_period_end * 1000).toISOString();
        const now = new Date().toISOString();

        await db.prepare(`
          INSERT INTO user_subscriptions (user_id, plan, status, current_period_end, updated_at, source)
          VALUES (?, ?, 'ACTIVE', ?, ?, 'stripe_webhook')
          ON CONFLICT(user_id) DO UPDATE SET
            plan = ?,
            status = 'ACTIVE',
            current_period_end = ?,
            updated_at = ?,
            source = 'stripe_webhook'
        `).bind(email, metadataPlan, periodEnd, now, metadataPlan, periodEnd, now).run();

        logger.info(`[STRIPE_WEBHOOK] Successfully renewed subscription ${metadataPlan} for: ${email}`);

        // DISPATCH SECURE RENEWAL NOTIFICATION EMAIL
        const brevoApiKey = env.BREVO_API_KEY || process.env.BREVO_API_KEY;
        if (brevoApiKey) {
          const tData = await getDynamicEmailTemplate(db, "billing_info_updated", {
            subject: `StealthRelay Plan Renewed: ${metadataPlan}`,
            body: `
              <div style="background-color: #050507; color: #ffffff; font-family: monospace; padding: 30px; border: 1px solid #10b981; border-radius: 8px; max-width: 600px; margin: auto;">
                <h2 style="color: #10b981; text-transform: uppercase; border-bottom: 1px solid #10b981; padding-bottom: 10px; margin-top: 0;">StealthRelay Contract Renewed</h2>
                <p>Operative, your secure relay contract <strong>${metadataPlan}</strong> has been successfully renewed.</p>
                <p>Your subscription validity has been extended to <strong>${new Date(subDetails.current_period_end * 1000).toLocaleDateString()}</strong>.</p>
                <br/>
                <p style="font-size: 10px; color: #52526b; margin-bottom: 0;">Security Identity: ${email}</p>
              </div>
            `
          });

          const subject = tData.subject
            .replace(/\{\{\s*sitename\s*\}\}/g, "StealthRelay")
            .replace(/\{\{\s*plan\s*\}\}/g, metadataPlan)
            .replace(/\{\{\s*membership_level_name\s*\}\}/g, metadataPlan);

          const htmlContent = tData.body
            .replace(/\{\{\s*sitename\s*\}\}/g, "StealthRelay")
            .replace(/\{\{\s*plan\s*\}\}/g, metadataPlan)
            .replace(/\{\{\s*membership_level_name\s*\}\}/g, metadataPlan)
            .replace(/\{\{\s*display_name\s*\}\}/g, email)
            .replace(/\{\{\s*user_login\s*\}\}/g, email);

          await sendEmail({ to: email, subject, htmlContent, brevoApiKey });
        }
      }
    }

    // 3. Subscription deleted / expired
    if (type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      const customer = await stripe.customers.retrieve(String(subscription.customer));
      const rawEmail = (customer as any).email;
      const email = rawEmail ? String(rawEmail).trim().toLowerCase() : null;

      if (email) {
        const now = new Date().toISOString();
        await db.prepare(`
          UPDATE user_subscriptions
          SET status = 'EXPIRED', updated_at = ?
          WHERE user_id = ?
        `).bind(now, email).run();

        logger.info(`[STRIPE_WEBHOOK] Subscription state updated to EXPIRED for: ${email}`);

        // DISPATCH SUBSCRIPTION EXPIRY/CANCELLATION NOTIFICATION EMAIL
        const brevoApiKey = env.BREVO_API_KEY || process.env.BREVO_API_KEY;
        if (brevoApiKey) {
          const tData = await getDynamicEmailTemplate(db, "cancel", {
            subject: `StealthRelay Plan Expired / Terminated`,
            body: `
              <div style="background-color: #050507; color: #ffffff; font-family: monospace; padding: 30px; border: 1px solid #ef4444; border-radius: 8px; max-width: 600px; margin: auto;">
                <h2 style="color: #ef4444; text-transform: uppercase; border-bottom: 1px solid #ef4444; padding-bottom: 10px; margin-top: 0;">StealthRelay Terminated</h2>
                <p>Warning: your secure data forwarder subscription has expired or has been cancelled.</p>
                <p>Relay limits have reverted to Free Trial parameters. To prevent routing disruptions, please reactivate your plan.</p>
                <br/>
                <p style="font-size: 10px; color: #52526b; margin-bottom: 0;">Security Identity: ${email}</p>
              </div>
            `
          });

          const subject = tData.subject
            .replace(/\{\{\s*sitename\s*\}\}/g, "StealthRelay")
            .replace(/\{\{\s*plan\s*\}\}/g, "Premium Plan")
            .replace(/\{\{\s*membership_level_name\s*\}\}/g, "Premium Plan");

          const htmlContent = tData.body
            .replace(/\{\{\s*sitename\s*\}\}/g, "StealthRelay")
            .replace(/\{\{\s*plan\s*\}\}/g, "Premium Plan")
            .replace(/\{\{\s*membership_level_name\s*\}\}/g, "Premium Plan")
            .replace(/\{\{\s*display_name\s*\}\}/g, email)
            .replace(/\{\{\s*user_login\s*\}\}/g, email);

          await sendEmail({ to: email, subject, htmlContent, brevoApiKey });
        }
      }
    }

    // 4. Subscription updated (upgrade / downgrade / renewal)
    if (type === "customer.subscription.updated") {
      const subscription = event.data.object;
      const status = subscription.status;
      const customer = await stripe.customers.retrieve(String(subscription.customer));
      const rawEmail = (customer as any).email;
      const email = rawEmail ? String(rawEmail).trim().toLowerCase() : null;

      if (email) {
        const now = new Date().toISOString();
        const dbStatus = (status === "canceled" || status === "unpaid") ? "EXPIRED" : "ACTIVE";

        let plan = "CONTRACTOR";
        const metadataPlan = subscription.metadata?.plan;
        if (metadataPlan) {
          plan = metadataPlan.toUpperCase();
        } else {
          // Deduce from price item product
          const productName = subscription.items.data[0]?.price?.product;
          if (productName) {
            const product = await stripe.products.retrieve(String(productName));
            if (product.name.toUpperCase().includes("PHANTOM")) {
              plan = "PHANTOM";
            } else if (product.name.toUpperCase().includes("ENTERPRISE")) {
              plan = "ENTERPRISE";
            }
          }
        }

        const periodEnd = new Date(subscription.current_period_end * 1000).toISOString();

        await db.prepare(`
          INSERT INTO user_subscriptions (user_id, plan, status, current_period_end, updated_at, source)
          VALUES (?, ?, ?, ?, ?, 'stripe_webhook')
          ON CONFLICT(user_id) DO UPDATE SET
            plan = ?,
            status = ?,
            current_period_end = ?,
            updated_at = ?,
            source = 'stripe_webhook'
        `).bind(email, plan, dbStatus, periodEnd, now, plan, dbStatus, periodEnd, now).run();

        logger.info(`[STRIPE_WEBHOOK] Subscription updated for ${email} -> Plan: ${plan}, Status: ${dbStatus}`);

        // DISPATCH SUBSCRIPTION UPDATE EMAIL
        const brevoApiKey = env.BREVO_API_KEY || process.env.BREVO_API_KEY;
        if (brevoApiKey && dbStatus === "ACTIVE") {
          const tData = await getDynamicEmailTemplate(db, "admin_change", {
            subject: `StealthRelay Subscription Modified: ${plan}`,
            body: `
              <div style="background-color: #050507; color: #ffffff; font-family: monospace; padding: 30px; border: 1px solid #10b981; border-radius: 8px; max-width: 600px; margin: auto;">
                <h2 style="color: #10b981; text-transform: uppercase; border-bottom: 1px solid #10b981; padding-bottom: 10px; margin-top: 0;">StealthRelay Contract Adjusted</h2>
                <p>Operative, your secure relay subscription has been adjusted or renewed.</p>
                <p>New active plan tier: <strong>${plan}</strong>.</p>
                <p>Your subscription validity is active until <strong>${new Date(subscription.current_period_end * 1000).toLocaleDateString()}</strong>.</p>
                <br/>
                <p style="font-size: 10px; color: #52526b; margin-bottom: 0;">Security Identity: ${email}</p>
              </div>
            `
          });

          const subject = tData.subject
            .replace(/\{\{\s*sitename\s*\}\}/g, "StealthRelay")
            .replace(/\{\{\s*plan\s*\}\}/g, plan)
            .replace(/\{\{\s*membership_level_name\s*\}\}/g, plan);

          const htmlContent = tData.body
            .replace(/\{\{\s*sitename\s*\}\}/g, "StealthRelay")
            .replace(/\{\{\s*plan\s*\}\}/g, plan)
            .replace(/\{\{\s*membership_level_name\s*\}\}/g, plan)
            .replace(/\{\{\s*display_name\s*\}\}/g, email)
            .replace(/\{\{\s*user_login\s*\}\}/g, email);

          await sendEmail({ to: email, subject, htmlContent, brevoApiKey });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    logger.error("[STRIPE_WEBHOOK_PROCESSING_ERROR]", error);
    return NextResponse.json({ error: "Failed to compile webhook update." }, { status: 500 });
  }
}
