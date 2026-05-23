import { getDb } from "./db";
import { initStripe } from "./stripe";
import { isAdminUser } from "./adminGuard";
import { logger } from "@/lib/logger";

export interface UserSubscription {
  user_id: string;
  plan: string;
  status: string;
  current_period_end: string | null;
  billing_period?: string;
}

export async function getSubscriptionStatus(userId: string): Promise<UserSubscription> {
  const db = getDb();
  const cleanEmail = userId.trim().toLowerCase();

  // 1. Fetch current status from local database
  let sub = await db.prepare(
    "SELECT * FROM user_subscriptions WHERE user_id = ? LIMIT 1"
  ).bind(cleanEmail).first() as UserSubscription | null;

  // 2. Proactively sync from Stripe to bypass signature issues or webhook delivery failures.
  // We check Stripe if there is no record, if the user is on the FREE_TRIAL plan, or if current_period_end is missing.
  if (!sub || sub.plan === 'FREE_TRIAL' || !sub.current_period_end) {
    try {
      logger.info(`[STRIPE_PROACTIVE_SYNC] Initiating sync for email: ${cleanEmail}`);
      const stripe = initStripe();
      
      // List all customers matching this email (up to 5 to handle duplicate records)
      const customers = await stripe.customers.list({
        email: cleanEmail,
        limit: 5
      });

      logger.info(`[STRIPE_PROACTIVE_SYNC] Found ${customers.data.length} customer records.`);

      let activeSub: any = null;
      let deducedPlan = "FREE_TRIAL";

      // Scan customers for any active subscription
      for (const customer of customers.data) {
        const subscriptions = await stripe.subscriptions.list({
          customer: customer.id,
          status: 'active',
          limit: 5
        });

        if (subscriptions.data.length > 0) {
          // Found an active subscription!
          activeSub = subscriptions.data[0];
          logger.info(`[STRIPE_PROACTIVE_SYNC] Found active subscription ${activeSub.id} for customer ${customer.id}`);
          break;
        }
      }

      if (activeSub) {
        // Deduce plan name
        let plan = "CONTRACTOR"; // Fallback default
        
        // A. Try metadata
        const metadataPlan = activeSub.metadata?.plan;
        if (metadataPlan) {
          plan = metadataPlan.toUpperCase();
        } else {
          // B. Try to deduce based on pricing/item details without retrieving product (fast & robust)
          const item = activeSub.items?.data?.[0];
          const price = item?.price;
          const unitAmount = price?.unit_amount || 0;
          
          if (unitAmount >= 9900) {
            plan = "ENTERPRISE";
          } else if (unitAmount >= 4900) {
            plan = "PHANTOM";
          } else if (unitAmount >= 1900) {
            plan = "CONTRACTOR";
          } else {
            // Check product name from pricing description/item if available
            const name = price?.nickname || "";
            if (name.toUpperCase().includes("ENTERPRISE")) {
              plan = "ENTERPRISE";
            } else if (name.toUpperCase().includes("PHANTOM")) {
              plan = "PHANTOM";
            } else if (name.toUpperCase().includes("CONTRACTOR")) {
              plan = "CONTRACTOR";
            }
          }
        }

        // C. Clean and format dates (Support standard current_period_end and nested item structure)
        let rawPeriodEnd = activeSub.current_period_end || activeSub.items?.data?.[0]?.current_period_end;
        let periodEnd: string | null = null;
        if (rawPeriodEnd) {
          periodEnd = new Date(rawPeriodEnd * 1000).toISOString();
        }
        
        const now = new Date().toISOString();
        deducedPlan = plan;

        logger.info(`[STRIPE_PROACTIVE_SYNC] Deduced plan: ${plan}, Period End: ${periodEnd}`);

        // Update database with the active subscription details
        await db.prepare(`
          INSERT INTO user_subscriptions (user_id, plan, status, current_period_end, updated_at)
          VALUES (?, ?, 'ACTIVE', ?, ?)
          ON CONFLICT(user_id) DO UPDATE SET
            plan = ?,
            status = 'ACTIVE',
            current_period_end = ?,
            updated_at = ?
        `).bind(cleanEmail, plan, periodEnd, now, plan, periodEnd, now).run();

        // Query the updated record to keep local state in sync
        sub = {
          user_id: cleanEmail,
          plan,
          status: 'ACTIVE',
          current_period_end: periodEnd
        };
      }
    } catch (stripeErr: any) {
      logger.error("[STRIPE_SYNC_WARNING] Proactive subscription lookup failed.", stripeErr.message, stripeErr.stack);
    }
  }

  // 3. Fallback bootstrapping to trial plan
  if (!sub) {
    const now = new Date().toISOString();
    const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    await db.prepare(
      "INSERT INTO user_subscriptions (user_id, plan, status, current_period_end, created_at) VALUES (?, ?, ?, ?, ?)"
    ).bind(cleanEmail, 'CONTRACTOR', 'ACTIVE', trialEnd, now).run();
    
    sub = {
      user_id: cleanEmail,
      plan: 'CONTRACTOR',
      status: 'ACTIVE',
      current_period_end: trialEnd
    };
  }

  // 4. Automated 3-day post-expiration zero-knowledge data purge
  let isExempt = false;
  try {
    const personnel: any = await db.prepare("SELECT status FROM security_personnel WHERE email = ?").bind(cleanEmail).first();
    if (personnel && personnel.status === 'ACTIVE') {
      isExempt = true;
    }
  } catch {}
  if (cleanEmail === 'admin@stealthrelay.com') {
    isExempt = true;
  }

  if (sub && sub.current_period_end && !isExempt) {
    const expiry = new Date(sub.current_period_end).getTime();
    if (expiry + 3 * 24 * 60 * 60 * 1000 < Date.now()) {
      if (sub.status === 'EXPIRED' || (sub.plan === 'CONTRACTOR' && sub.status === 'ACTIVE')) {
        try {
          logger.info(`[TRIAL_EXPIRED_PURGE] 3 Days Past Expiration. Purging expired trial data for user: ${cleanEmail}`);
          await db.prepare("DELETE FROM vault_files WHERE user_id = ?").bind(cleanEmail).run();
          await db.prepare("DELETE FROM relay_aliases WHERE user_id = ?").bind(cleanEmail).run();
          await db.prepare("DELETE FROM user_mailboxes WHERE user_id = ?").bind(cleanEmail).run();
          await db.prepare("DELETE FROM custom_domains WHERE user_id = ?").bind(cleanEmail).run();
          await db.prepare("DELETE FROM vault_users WHERE user_id = ?").bind(cleanEmail).run();
          
          // Update subscription status to EXPIRED permanently
          const now = new Date().toISOString();
          await db.prepare(`
            UPDATE user_subscriptions 
            SET status = 'EXPIRED', plan = 'CONTRACTOR', updated_at = ?
            WHERE user_id = ?
          `).bind(now, cleanEmail).run();

          sub.status = 'EXPIRED';
        } catch (purgeErr) {
          logger.error("[PURGE_ERROR] Failed to auto-delete user data:", purgeErr);
        }
      }
    }
  }

  let billing_period = 'monthly';
  if (sub && sub.current_period_end) {
    try {
      const end = new Date(sub.current_period_end).getTime();
      const diffDaysFromNow = (end - Date.now()) / (1000 * 60 * 60 * 24);
      if (diffDaysFromNow > 35) {
        billing_period = 'yearly';
      }
    } catch {}
  }

  return {
    ...sub,
    billing_period
  };
}

export async function verifyActiveAccess(userId: string): Promise<boolean> {
  try {
    const db = getDb();
    const cleanEmail = userId.trim().toLowerCase();
    const personnel: any = await db.prepare(`
      SELECT status FROM security_personnel WHERE email = ?
    `).bind(cleanEmail).first();
    if (personnel && personnel.status === 'ACTIVE') {
      return true;
    }
  } catch (e) {
    logger.warn("verifyActiveAccess: Failed querying security_personnel. Falling back to default role checks.");
  }

  if (await isAdminUser()) {
    return true;
  }

  const sub = await getSubscriptionStatus(userId);
  
  if (sub.status !== 'ACTIVE') {
    return false;
  }

  // Check expiration if date set
  if (sub.current_period_end) {
    const expiry = new Date(sub.current_period_end).getTime();
    if (expiry < Date.now()) {
      return false;
    }
  }

  return true;
}
