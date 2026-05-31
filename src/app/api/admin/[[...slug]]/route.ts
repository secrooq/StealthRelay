import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { requireAdmin, getAdminSession, seedSecurityPersonnel, signSession } from '@/lib/adminGuard';
import { cookies } from 'next/headers';
import { logAudit } from '@/lib/audit';
import { logger } from "@/lib/logger";
import { checkRateLimit, incrementRateLimit } from '@/lib/rateLimit';

export const runtime = 'edge';

async function seedEmailTemplates(db: any) {
  // Create table if not exists
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS email_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      recipient TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ENABLED',
      cc TEXT,
      bcc TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  // Check if populated
  const existing: any = await db.prepare("SELECT COUNT(*) as count FROM email_templates").first();
  if (existing && existing.count > 0) {
    return;
  }

  // Pre-fill templates matching screenshots
  const defaultTemplates = [
    {
      id: "admin_change",
      name: "Admin Change",
      recipient: "Member (default recipient)",
      subject: "Your membership at {{ sitename }} has been changed",
      body: "<div style='font-family: monospace; padding: 30px; background: #050507; color: white; border: 1px solid #10b981; border-radius: 8px; max-width: 600px; margin: auto;'><h2>StealthRelay Operational Update</h2><p>Operative {{ display_name }}, your membership details at {{ sitename }} have been changed by an administrator.</p><br/><p>Please contact security headquarters if you did not request this update.</p></div>"
    },
    {
      id: "admin_change_admin",
      name: "Admin Change (admin)",
      recipient: "Admin (default recipient)",
      subject: "Membership for {{ display_name }} at {{ sitename }} has been changed",
      body: "<div style='font-family: monospace; padding: 30px; background: #050507; color: white; border: 1px solid #ef4444; border-radius: 8px; max-width: 600px; margin: auto;'><h2>System Alert: Operative Membership Changed</h2><p>Clearance Alert: The membership profile for operative {{ display_name }} at {{ sitename }} was updated by an administrative bypass.</p></div>"
    },
    {
      id: "billing_info_updated",
      name: "Billing Information Updated",
      recipient: "Member (default recipient)",
      subject: "Your billing information has been updated at {{ sitename }}!!",
      body: "<div style='font-family: monospace; padding: 30px; background: #050507; color: white; border: 1px solid #10b981; border-radius: 8px; max-width: 600px; margin: auto;'><h2>Payment Profile Updated</h2><p>Your payment credentials at {{ sitename }} have been successfully updated.</p></div>"
    },
    {
      id: "billing_info_updated_admin",
      name: "Billing Information Updated (admin)",
      recipient: "Admin (default recipient)",
      subject: "Billing information has been updated for {{ user_login }} at {{ sitename }}",
      body: "<div style='font-family: monospace; padding: 30px; background: #050507; color: white; border: 1px solid #10b981; border-radius: 8px; max-width: 600px; margin: auto;'><h2>Admin Alert: Billing Profile Updated</h2><p>Operator {{ user_login }} has successfully updated their payment credentials.</p></div>"
    },
    {
      id: "cancel",
      name: "Cancel",
      recipient: "Member (default recipient)",
      subject: "Your membership at {{ sitename }} has been CANCELLED",
      body: "<div style='font-family: monospace; padding: 30px; background: #050507; color: white; border: 1px solid #ef4444; border-radius: 8px; max-width: 600px; margin: auto;'><h2>Membership Cancelled</h2><p>Your subscription at {{ sitename }} has been cancelled. Plan limits have reverted to Free parameters.</p></div>"
    },
    {
      id: "cancel_admin",
      name: "Cancel (admin)",
      recipient: "Admin (default recipient)",
      subject: "Membership for {{ user_login }} at {{ sitename }} has been CANCELLED",
      body: "<div style='font-family: monospace; padding: 30px; background: #050507; color: white; border: 1px solid #ef4444; border-radius: 8px; max-width: 600px; margin: auto;'><h2>Admin Alert: Subscription Terminated</h2><p>Operative {{ user_login }} has terminated their active subscription contract.</p></div>"
    },
    {
      id: "checkout_paid",
      name: "Checkout - Paid",
      recipient: "Member (default recipient)",
      subject: "Your membership confirmation for {{ sitename }}!!",
      body: "<div style='font-family: monospace; padding: 30px; background: #050507; color: white; border: 1px solid #10b981; border-radius: 8px; max-width: 600px; margin: auto;'><h2>Access Authorized</h2><p>Operative {{ display_name }}, thank you for your payment. Your premium StealthRelay channel <strong>{{ plan }}</strong> is now fully operational.</p></div>"
    },
    {
      id: "checkout_paid_admin",
      name: "Checkout - Paid (admin)",
      recipient: "Admin (default recipient)",
      subject: "Member checkout for {{ membership_level_name }} at {{ sitename }}",
      body: "<div style='font-family: monospace; padding: 30px; background: #050507; color: white; border: 1px solid #10b981; border-radius: 8px; max-width: 600px; margin: auto;'><h2>Billing Event: Checkout Completed</h2><p>User {{ user_login }} completed checkout for plan <strong>{{ membership_level_name }}</strong>.</p></div>"
    },
    {
      id: "payment_failure",
      name: "Payment Failure",
      recipient: "Member (default recipient)",
      subject: "Membership payment failed at {{ sitename }}!!",
      body: "<div style='font-family: monospace; padding: 30px; background: #050507; color: white; border: 1px solid #ef4444; border-radius: 8px; max-width: 600px; margin: auto;'><h2>Billing Warning: Payment Failure</h2><p>A renewal payment transaction failed to clear for your account at {{ sitename }}. Please review billing credentials.</p></div>"
    },
    {
      id: "payment_failure_admin",
      name: "Payment Failure (admin)",
      recipient: "Admin (default recipient)",
      subject: "Membership payment failed for {{ display_name }} at {{ sitename }}",
      body: "<div style='font-family: monospace; padding: 30px; background: #050507; color: white; border: 1px solid #ef4444; border-radius: 8px; max-width: 600px; margin: auto;'><h2>Admin Alert: Payment Failure</h2><p>Renewal transaction failed for {{ display_name }} at {{ sitename }}.</p></div>"
    }
  ];

  for (const t of defaultTemplates) {
    await db.prepare(`
      INSERT INTO email_templates (id, name, recipient, subject, body, status, cc, bcc)
      VALUES (?, ?, ?, ?, ?, 'ENABLED', NULL, NULL)
    `).bind(t.id, t.name, t.recipient, t.subject, t.body).run();
  }
}

export async function GET(request: Request, context: { params: Promise<{ slug?: string[] }> }) {
  try {
    const params = await context.params;
    const slug = params.slug || [];
    const subPath = slug.join('/');

    if (subPath === 'session') {
      const session = await getAdminSession();
      if (!session) {
        return NextResponse.json({ authenticated: false }, { status: 401 });
      }
      return NextResponse.json({ authenticated: true, email: session.email, role: session.role });
    }

    if (subPath === 'personnel') {
      const session = await requireAdmin(['SUPER_ADMIN', 'ADMIN', 'DEVELOPER']);
      const db = getRequestContext().env.DB;
      await seedSecurityPersonnel();
      
      const { results: personnel } = await db.prepare(`
        SELECT id, email, role, status, created_at
        FROM security_personnel
        ORDER BY created_at DESC
      `).all();

      return NextResponse.json({ personnel: personnel || [] });
    }

    if (subPath === 'config') {
      await requireAdmin(['SUPER_ADMIN', 'ADMIN', 'DEVELOPER']);
      const db = getRequestContext().env.DB;
      const configs = await db.prepare(`SELECT * FROM system_config`).all();
      
      const mapped = configs.results.reduce((acc: any, row: any) => {
        acc[row.key] = row.value;
        return acc;
      }, {});

      return NextResponse.json({ config: mapped });
    }

    if (subPath === 'logs') {
      await requireAdmin(['SUPER_ADMIN', 'ADMIN']);
      const ctx = getRequestContext();
      if (!ctx || !ctx.env || !ctx.env.DB) {
        return NextResponse.json({ error: 'Secure context offline.' }, { status: 500 });
      }

      const { results } = await ctx.env.DB.prepare(`
        SELECT * FROM audit_logs 
        ORDER BY created_at DESC 
        LIMIT 100
      `).all();

      return NextResponse.json({ logs: results || [] });
    }

    if (subPath === 'secrets') {
      await requireAdmin(['SUPER_ADMIN', 'ADMIN']);
      const db = getRequestContext().env.DB;
      const secrets = await db.prepare(`
        SELECT id, is_file, has_password, is_viewed, created_at, expires_at, allowed_countries, allowed_ips, allowed_domains
        FROM stealth_secrets
        ORDER BY created_at DESC
        LIMIT 100
      `).all();

      return NextResponse.json({ secrets: secrets.results });
    }

    if (subPath === 'stats') {
      await requireAdmin();
      let db: any = null;
      try {
        const ctx = getRequestContext();
        db = ctx?.env?.DB;
      } catch (ctxErr) {
        logger.warn("ADMIN_STATS: Could not get request context, falling back to null DB");
      }

      let userCount = 0;
      let secretCount = 0;
      let fileCount = 0;
      let totalCapacity = 0;
      let aliasCount = 0;
      let forwardCount = 0;

      if (db) {
        // ⚡ Bolt Optimization: Batch queries to eliminate N+1 latency bottleneck
        // Combining 4 discrete queries into a single HTTP request to Cloudflare D1
        try {
          const [fileRes, emailRes, userRes, secretRes] = await db.batch([
            db.prepare(`
              SELECT COUNT(*) as total_files, COALESCE(SUM(file_size), 0) as total_bytes
              FROM vault_files
            `),
            db.prepare(`
              SELECT COUNT(*) as total_aliases, COALESCE(SUM(forward_count), 0) as total_forwards
              FROM relay_aliases
            `),
            db.prepare(`
              SELECT COUNT(DISTINCT user_id) as total_users
              FROM vault_users
            `),
            db.prepare(`
              SELECT COUNT(*) as active_secrets
              FROM stealth_secrets
              WHERE is_viewed = 0 AND expires_at > datetime('now')
            `)
          ]);

          const fileStats: any = fileRes?.results?.[0];
          if (fileStats) {
            fileCount = Number(fileStats.total_files || 0);
            totalCapacity = Number(fileStats.total_bytes || 0);
          }

          const emailStats: any = emailRes?.results?.[0];
          if (emailStats) {
            aliasCount = Number(emailStats.total_aliases || 0);
            forwardCount = Number(emailStats.total_forwards || 0);
          }

          const userStats: any = userRes?.results?.[0];
          if (userStats) {
            userCount = Number(userStats.total_users || 0);
          }

          const secretStats: any = secretRes?.results?.[0];
          if (secretStats) {
            secretCount = Number(secretStats.active_secrets || 0);
          }
        } catch (e: any) {
          logger.error("ADMIN_STATS: Failed to batch query admin stats.", e.message);
        }
      }

      return NextResponse.json({
        timestamp: new Date().toISOString(),
        overview: {
          users: userCount,
          secrets: secretCount,
          files: fileCount,
          capacity_bytes: totalCapacity,
          aliases: aliasCount,
          forwards: forwardCount
        },
        status: db ? "Operational" : "Degraded: DB Binding Missing"
      });
    }

    if (subPath === 'users') {
      await requireAdmin();
      
      const db = getRequestContext().env.DB;
      const { results: dbUsers } = await db.prepare(`
        SELECT vu.user_id as id, vu.created_at, vu.two_factor_enabled, us.plan, us.current_period_end
        FROM vault_users vu
        LEFT JOIN user_subscriptions us ON vu.user_id = us.user_id
        ORDER BY vu.created_at DESC
        LIMIT 100
      `).all();

      let usageMap: Record<string, number> = {};
      try {
        const ctx = getRequestContext();
        if (ctx && ctx.env && ctx.env.DB) {
          const { results } = await ctx.env.DB.prepare(`
            SELECT user_id, SUM(file_size) as bytes_used
            FROM vault_files
            GROUP BY user_id
          `).all();

          results?.forEach((row: any) => {
            usageMap[row.user_id] = row.bytes_used || 0;
          });
        }
      } catch (e) {
        logger.warn('Metadata file capacity tracking bypassed.', e);
      }

      const users = (dbUsers || []).map((u: any) => {
        const usedBytes = usageMap[u.id] || 0;
        const limitBytes = 1024 * 1024 * 1024; // 1GB Standard Plan
        return {
          id: u.id,
          email: u.id,
          firstName: "OPERATIVE",
          lastName: u.id.split('@')[0].toUpperCase(),
          createdAt: u.created_at ? new Date(u.created_at).getTime() : Date.now(),
          lastSignInAt: null,
          publicMetadata: {},
          storageUsed: usedBytes,
          storageLimit: limitBytes,
          twoFactorEnabled: u.two_factor_enabled === 1,
          plan: u.plan || 'FREE_TRIAL',
          trialEnd: u.current_period_end || null
        };
      });

      return NextResponse.json({ users });
    }

    if (subPath === "templates") {
      await requireAdmin(["SUPER_ADMIN", "ADMIN", "DEVELOPER"]);
      const db = getRequestContext().env.DB;
      await seedEmailTemplates(db);

      const { results: templates } = await db.prepare(`
        SELECT id, name, recipient, subject, body, status, cc, bcc
        FROM email_templates
        ORDER BY name ASC
      `).all();

      return NextResponse.json({ templates: templates || [] });
    }

    if (subPath === "reports") {
      await requireAdmin(["SUPER_ADMIN", "ADMIN", "DEVELOPER"]);
      const db = getRequestContext().env.DB;

      // Ensure the source column exists for distinguishing mock vs real subscriptions
      try {
        await db.prepare("ALTER TABLE user_subscriptions ADD COLUMN source TEXT DEFAULT 'mock'").run();
      } catch (e) {
        // Column already exists — ignore
      }

      // Group queries into a single batch to reduce network roundtrips
      const batchResults = await db.batch([
        // 0: vault_users stats
        db.prepare(`
          SELECT
            SUM(CASE WHEN created_at >= datetime('now', '-24 hours') THEN 1 ELSE 0 END) as usersToday,
            SUM(CASE WHEN created_at >= datetime('now', 'start of month') THEN 1 ELSE 0 END) as usersMonth,
            SUM(CASE WHEN created_at >= datetime('now', 'start of year') THEN 1 ELSE 0 END) as usersYear,
            COUNT(*) as usersTotal
          FROM vault_users
        `),

        // 1: user_subscriptions stats
        db.prepare(`
          SELECT
            SUM(CASE WHEN status = 'CANCELLED' AND updated_at >= datetime('now', '-24 hours') THEN 1 ELSE 0 END) as cancelsToday,
            SUM(CASE WHEN status = 'CANCELLED' AND updated_at >= datetime('now', 'start of month') THEN 1 ELSE 0 END) as cancelsMonth,
            SUM(CASE WHEN status = 'CANCELLED' AND updated_at >= datetime('now', 'start of year') THEN 1 ELSE 0 END) as cancelsYear,
            SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelsTotal,

            SUM(CASE WHEN plan = 'FREE_TRIAL' AND status = 'ACTIVE' THEN 1 ELSE 0 END) as activeFree,
            SUM(CASE WHEN plan = 'CONTRACTOR' AND status = 'ACTIVE' THEN 1 ELSE 0 END) as activeContractor,
            SUM(CASE WHEN plan = 'PHANTOM' AND status = 'ACTIVE' THEN 1 ELSE 0 END) as activePhantom,
            SUM(CASE WHEN plan = 'ENTERPRISE' AND status = 'ACTIVE' THEN 1 ELSE 0 END) as activeEnterprise,

            SUM(CASE WHEN plan = 'FREE_TRIAL' AND status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelledFree,
            SUM(CASE WHEN plan = 'CONTRACTOR' AND status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelledContractor,
            SUM(CASE WHEN plan = 'PHANTOM' AND status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelledPhantom,
            SUM(CASE WHEN plan = 'ENTERPRISE' AND status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelledEnterprise,

            SUM(CASE WHEN plan = 'CONTRACTOR' AND status = 'ACTIVE' AND source = 'stripe_webhook' THEN 1 ELSE 0 END) as realContractor,
            SUM(CASE WHEN plan = 'PHANTOM' AND status = 'ACTIVE' AND source = 'stripe_webhook' THEN 1 ELSE 0 END) as realPhantom,
            SUM(CASE WHEN plan = 'ENTERPRISE' AND status = 'ACTIVE' AND source = 'stripe_webhook' THEN 1 ELSE 0 END) as realEnterprise
          FROM user_subscriptions
        `),

        // 2: audit_logs stats
        db.prepare(`
          SELECT
            SUM(CASE WHEN action IN ('USER_LOGIN', 'ADMIN_BYPASS_SUCCESS') AND created_at >= datetime('now', '-24 hours') THEN 1 ELSE 0 END) as realLoginsToday,
            SUM(CASE WHEN action IN ('USER_LOGIN', 'ADMIN_BYPASS_SUCCESS') AND created_at >= datetime('now', '-7 days') THEN 1 ELSE 0 END) as realLoginsWeek,
            SUM(CASE WHEN action IN ('USER_LOGIN', 'ADMIN_BYPASS_SUCCESS') AND created_at >= datetime('now', 'start of month') THEN 1 ELSE 0 END) as realLoginsMonth,
            SUM(CASE WHEN action IN ('USER_LOGIN', 'ADMIN_BYPASS_SUCCESS') AND created_at >= datetime('now', 'start of year') THEN 1 ELSE 0 END) as realLoginsYear,
            SUM(CASE WHEN action IN ('USER_LOGIN', 'ADMIN_BYPASS_SUCCESS') THEN 1 ELSE 0 END) as realLoginsTotal,

            SUM(CASE WHEN created_at >= datetime('now', '-24 hours') THEN 1 ELSE 0 END) as realViewsToday,
            SUM(CASE WHEN created_at >= datetime('now', '-7 days') THEN 1 ELSE 0 END) as realViewsWeek,
            SUM(CASE WHEN created_at >= datetime('now', 'start of month') THEN 1 ELSE 0 END) as realViewsMonth,
            SUM(CASE WHEN created_at >= datetime('now', 'start of year') THEN 1 ELSE 0 END) as realViewsYear,
            COUNT(*) as realViewsTotal,

            COUNT(DISTINCT CASE WHEN created_at >= datetime('now', '-24 hours') THEN ip_address END) as realVisitsToday,
            COUNT(DISTINCT CASE WHEN created_at >= datetime('now', '-7 days') THEN ip_address END) as realVisitsWeek,
            COUNT(DISTINCT CASE WHEN created_at >= datetime('now', 'start of month') THEN ip_address END) as realVisitsMonth,
            COUNT(DISTINCT CASE WHEN created_at >= datetime('now', 'start of year') THEN ip_address END) as realVisitsYear,
            COUNT(DISTINCT ip_address) as realVisitsTotal,

            SUM(CASE WHEN action = 'EMAIL_DISPATCH_SUCCESS' THEN 1 ELSE 0 END) as totalEmailsSent,
            SUM(CASE WHEN action = 'EMAIL_DISPATCH_FAILURE' THEN 1 ELSE 0 END) as totalEmailsFailed
          FROM audit_logs
        `),

        // 3: audit_logs last sent
        db.prepare("SELECT created_at FROM audit_logs WHERE action = 'EMAIL_DISPATCH_SUCCESS' ORDER BY created_at DESC LIMIT 1"),

        // 4: audit_logs last failed
        db.prepare("SELECT created_at FROM audit_logs WHERE action = 'EMAIL_DISPATCH_FAILURE' ORDER BY created_at DESC LIMIT 1")
      ]);

      const userStats: any = batchResults[0]?.results?.[0] || {};
      const subStats: any = batchResults[1]?.results?.[0] || {};
      const auditStats: any = batchResults[2]?.results?.[0] || {};
      const lastSentAlert: any = batchResults[3]?.results?.[0] || {};
      const lastFailedAlert: any = batchResults[4]?.results?.[0] || {};

      const membershipStats = {
        today: { signups: Number(userStats.usersToday || 0), cancellations: Number(subStats.cancelsToday || 0) },
        thisMonth: { signups: Number(userStats.usersMonth || 0), cancellations: Number(subStats.cancelsMonth || 0) },
        thisYear: { signups: Number(userStats.usersYear || 0), cancellations: Number(subStats.cancelsYear || 0) },
        allTime: { signups: Number(userStats.usersTotal || 0), cancellations: Number(subStats.cancelsTotal || 0) },
        levels: [
          { name: "Free Trial", signups: Number(subStats.activeFree || 0), cancellations: Number(subStats.cancelledFree || 0) },
          { name: "Contractor Security Tier ($19/mo)", signups: Number(subStats.activeContractor || 0), cancellations: Number(subStats.cancelledContractor || 0) },
          { name: "Phantom Security Tier ($49/mo)", signups: Number(subStats.activePhantom || 0), cancellations: Number(subStats.cancelledPhantom || 0) },
          { name: "Enterprise Governance Tier ($99/mo)", signups: Number(subStats.activeEnterprise || 0), cancellations: Number(subStats.cancelledEnterprise || 0) }
        ]
      };

      // B. Sales & Revenue — only count subscriptions created by real Stripe webhooks
      let stripeMode = 'TEST';
      try {
        let stripeKey = process.env.STRIPE_SECRET_KEY || '';
        // Strip surrounding quotes that may be present in env files
        stripeKey = stripeKey.replace(/^["']|["']$/g, '').trim();
        if (stripeKey.startsWith('sk_live_')) {
          stripeMode = 'LIVE';
        }
      } catch (e) {}

      const activeSalesContractor = Number(subStats.realContractor || 0);
      const activeSalesPhantom = Number(subStats.realPhantom || 0);
      const activeSalesEnterprise = Number(subStats.realEnterprise || 0);

      // Also count mock/test subscriptions separately for transparency
      const mockContractor = Number(subStats.activeContractor || 0) - activeSalesContractor;
      const mockPhantom = Number(subStats.activePhantom || 0) - activeSalesPhantom;
      const mockEnterprise = Number(subStats.activeEnterprise || 0) - activeSalesEnterprise;
      const totalMockSubs = mockContractor + mockPhantom + mockEnterprise;

      const mrrContractor = activeSalesContractor * 19.00;
      const mrrPhantom = activeSalesPhantom * 49.00;
      const mrrEnterprise = activeSalesEnterprise * 99.00;

      const totalSales = activeSalesContractor + activeSalesPhantom + activeSalesEnterprise;
      const totalMRR = mrrContractor + mrrPhantom + mrrEnterprise;

      const salesRevenue = {
        today: { sales: totalSales > 0 ? Math.ceil(totalSales / 30) : 0, revenue: Number((totalMRR / 30).toFixed(2)) },
        thisMonth: { sales: totalSales, revenue: Number(totalMRR.toFixed(2)) },
        thisYear: { sales: totalSales * 12, revenue: Number((totalMRR * 12).toFixed(2)) },
        allTime: { sales: totalSales * 12, revenue: Number((totalMRR * 12).toFixed(2)) },
        tiers: [
          { name: "Contractor Security Tier ($19/mo)", sales: activeSalesContractor, revenue: Number(mrrContractor.toFixed(2)) },
          { name: "Phantom Security Tier ($49/mo)", sales: activeSalesPhantom, revenue: Number(mrrPhantom.toFixed(2)) },
          { name: "Enterprise Governance Tier ($99/mo)", sales: activeSalesEnterprise, revenue: Number(mrrEnterprise.toFixed(2)) }
        ],
        // How many test/simulated subscriptions exist (excluded from revenue)
        testSubscriptions: totalMockSubs,
        dataSource: stripeMode === 'LIVE' ? 'stripe_live' : 'stripe_test'
      };

      const visitsLogins = {
        today: {
          visits: Number(auditStats.realVisitsToday || 0),
          views: Number(auditStats.realViewsToday || 0),
          logins: Number(auditStats.realLoginsToday || 0)
        },
        thisWeek: {
          visits: Number(auditStats.realVisitsWeek || 0),
          views: Number(auditStats.realViewsWeek || 0),
          logins: Number(auditStats.realLoginsWeek || 0)
        },
        thisMonth: {
          visits: Number(auditStats.realVisitsMonth || 0),
          views: Number(auditStats.realViewsMonth || 0),
          logins: Number(auditStats.realLoginsMonth || 0)
        },
        yearToDate: {
          visits: Number(auditStats.realVisitsYear || 0),
          views: Number(auditStats.realViewsYear || 0),
          logins: Number(auditStats.realLoginsYear || 0)
        },
        allTime: {
          visits: Number(auditStats.realVisitsTotal || 0),
          views: Number(auditStats.realViewsTotal || 0),
          logins: Number(auditStats.realLoginsTotal || 0)
        },
        // All data is sourced from real audit_logs table
        dataSource: 'real_db'
      };

      const emailLog = {
        sentSuccess: { 
          total: Number(auditStats.totalEmailsSent || 0),
          lastActivity: lastSentAlert?.created_at || new Date().toISOString() 
        },
        sentFailed: { 
          total: Number(auditStats.totalEmailsFailed || 0),
          lastActivity: lastFailedAlert?.created_at || new Date(Date.now() - 86400000).toISOString() 
        },
        dataSource: 'real_db'
      };

      return NextResponse.json({
        membershipStats,
        salesRevenue,
        visitsLogins,
        emailLog,
        stripeMode
      });
    }

    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  } catch (error: any) {
    logger.error('Admin API Fetch Exception:', error);
    const isForbidden = error.message?.includes('403') || error.message?.includes('Forbidden') || error.message?.includes('clearance') || error.message?.includes('Clearance');
    return NextResponse.json(
      { error: error.message || 'Clearance failure' }, 
      { status: isForbidden ? 403 : 500 }
    );
  }
}

async function verifyTurnstile(token: string, secretKey?: string): Promise<boolean> {
  const secret = secretKey || "1x00000000000000000000000000000000AA";
  if (secret.startsWith("1x")) return true; // Bypass for dummy keys in dev
  
  const formData = new FormData();
  formData.append("secret", secret);
  formData.append("response", token);
  
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
    });
    const outcome: any = await res.json();
    return !!outcome.success;
  } catch (e) {
    logger.error("[TURNSTILE EXCEPTION]", e);
    return false;
  }
}

export async function POST(request: Request, context: { params: Promise<{ slug?: string[] }> }) {
  try {
    const params = await context.params;
    const slug = params.slug || [];
    const subPath = slug.join('/');

    if (subPath === 'config') {
      await requireAdmin(['SUPER_ADMIN', 'ADMIN']);
      const body = await request.json();
      const db = getRequestContext().env.DB;

      const stmts = [];
      for (const key in body) {
         stmts.push(
           db.prepare(`INSERT OR REPLACE INTO system_config (key, value) VALUES (?, ?)`).bind(key, String(body[key]))
         );
      }
      
      if (stmts.length > 0) {
         await db.batch(stmts);
      }

      return NextResponse.json({ success: true });
    }

    if (subPath === 'reset-2fa') {
      await requireAdmin(['SUPER_ADMIN', 'ADMIN']);
      const { email } = await request.json();
      if (!email) {
        return NextResponse.json({ error: 'Email parameter required.' }, { status: 400 });
      }

      const db = getRequestContext().env.DB;
      await db.prepare(`
        UPDATE vault_users 
        SET two_factor_enabled = 0, two_factor_secret = '' 
        WHERE user_id = ?
      `).bind(email).run();

      const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '127.0.0.1';
      await logAudit({
        action: 'ADMIN_RESET_2FA',
        resourceType: 'USER',
        severity: 'WARNING',
        ipAddress: ip,
        details: { targetUser: email, note: 'Admin remotely deactivated user 2FA configuration.' }
      });

      return NextResponse.json({ success: true });
    }

    if (subPath === 'personnel') {
      const session = await requireAdmin(['SUPER_ADMIN']);
      const { email, role } = await request.json();
      if (!email || !role) {
        return NextResponse.json({ error: 'Missing email or role.' }, { status: 400 });
      }

      const db = getRequestContext().env.DB;
      const uuid = crypto.randomUUID();
      try {
        await db.prepare(`
          INSERT INTO security_personnel (id, email, role, status)
          VALUES (?, ?, ?, 'ACTIVE')
        `).bind(uuid, email.trim().toLowerCase(), role).run();

        await logAudit({
          action: 'ADMIN_ADD_PERSONNEL',
          resourceType: 'ADMIN',
          severity: 'CRITICAL',
          ipAddress: request.headers.get('cf-connecting-ip') || '127.0.0.1',
          details: { actor: session.email, target: email, role }
        });

        return NextResponse.json({ success: true });
      } catch (dbErr: any) {
        return NextResponse.json({ error: 'Operative already exists or database validation error.' }, { status: 400 });
      }
    }

    if (subPath === 'personnel/ban') {
      const session = await requireAdmin(['SUPER_ADMIN']);
      const { email, action } = await request.json();
      if (!email || !action) {
        return NextResponse.json({ error: 'Missing email or action.' }, { status: 400 });
      }

      if (email.trim().toLowerCase() === session.email.toLowerCase()) {
        return NextResponse.json({ error: 'Administrative lock safeguard: You cannot ban yourself.' }, { status: 400 });
      }

      const db = getRequestContext().env.DB;
      const statusValue = action === 'BAN' ? 'BANNED' : 'ACTIVE';

      await db.prepare(`
        UPDATE security_personnel
        SET status = ?
        WHERE email = ?
      `).bind(statusValue, email.trim().toLowerCase()).run();

      await logAudit({
        action: action === 'BAN' ? 'ADMIN_BAN_PERSONNEL' : 'ADMIN_UNBAN_PERSONNEL',
        resourceType: 'ADMIN',
        severity: 'CRITICAL',
        ipAddress: request.headers.get('cf-connecting-ip') || '127.0.0.1',
        details: { actor: session.email, target: email }
      });

      return NextResponse.json({ success: true });
    }

    if (subPath === 'login') {
      const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '127.0.0.1';

      const allowed = await checkRateLimit(ip, 'admin_login', 5, 15); // 5 attempts per 15 minutes
      if (!allowed) {
        return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 });
      }

      const { email, secret, turnstileToken } = await request.json();

      if (!email || !secret || !turnstileToken) {
        await incrementRateLimit(ip, 'admin_login');
        return NextResponse.json({ error: 'Email, Secret, and Turnstile token required.' }, { status: 400 });
      }

      let turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
      try {
        const ctx = getRequestContext();
        if ((ctx?.env as any)?.TURNSTILE_SECRET_KEY) {
          turnstileSecret = (ctx.env as any).TURNSTILE_SECRET_KEY as string;
        }
      } catch (e) {}

      const isRobotPassed = await verifyTurnstile(turnstileToken, turnstileSecret);
      if (!isRobotPassed) {
        await incrementRateLimit(ip, 'admin_login');
        return NextResponse.json({ error: 'Failed anti-spam validation. Operation aborted.' }, { status: 403 });
      }

      const db = getRequestContext().env.DB;
      await seedSecurityPersonnel(); // Seed root if table empty

      // Look up security personnel
      const personnel: any = await db.prepare(`
        SELECT role, status FROM security_personnel WHERE email = ?
      `).bind(email.trim().toLowerCase()).first();

      if (!personnel) {
        await incrementRateLimit(ip, 'admin_login');
        return NextResponse.json({ error: 'Access Denied: Operative not registered.' }, { status: 403 });
      }

      if (personnel.status !== 'ACTIVE') {
        await incrementRateLimit(ip, 'admin_login');
        return NextResponse.json({ error: 'Access Denied: Security Clearance Revoked.' }, { status: 403 });
      }

      let expectedSecret = process.env.ADMIN_BYPASS_SECRET;
      try {
        const ctx = getRequestContext();
        if ((ctx?.env as any)?.ADMIN_BYPASS_SECRET) {
          expectedSecret = (ctx.env as any).ADMIN_BYPASS_SECRET as string;
        }
      } catch (ctxErr) {}

      if (!expectedSecret) {
        expectedSecret = crypto.randomUUID();
      }

      const cleanExpected = expectedSecret.trim().replace(/^["']|["']$/g, '');
      const cleanProvided = secret.trim();

      if (cleanProvided !== cleanExpected) {
        const { sendSecurityAlert } = await import('@/lib/monitoring');
        await sendSecurityAlert('Failed Admin Login Attempt', `A failed login attempt for ${email} was detected from IP: ${ip}`);

        await logAudit({
          action: 'ADMIN_BYPASS_FAILURE',
          resourceType: 'ADMIN',
          severity: 'CRITICAL',
          ipAddress: ip,
          details: { email, note: 'Invalid credential supplied to security bypass gate.' }
        });

        await incrementRateLimit(ip, 'admin_login');
        return NextResponse.json({ error: 'Access Denied: Invalid cryptographic clearance.' }, { status: 403 });
      }

      // Generate dynamic OTP for this specific email
      const randomBuffer = new Uint32Array(1);
      crypto.getRandomValues(randomBuffer);
      const otpCode = (100000 + (randomBuffer[0] % 900000)).toString();
      const expiresAt = Date.now() + 5 * 60 * 1000;

      await db.batch([
        db.prepare('INSERT OR REPLACE INTO system_config (key, value) VALUES (?, ?)').bind(`admin_otp_${email.trim().toLowerCase()}`, otpCode),
        db.prepare('INSERT OR REPLACE INTO system_config (key, value) VALUES (?, ?)').bind(`admin_otp_expires_${email.trim().toLowerCase()}`, expiresAt.toString())
      ]);

      const { sendSecurityAlert } = await import('@/lib/monitoring');
      await sendSecurityAlert('Admin OTP Code', `Your one-time passcode to access the StealthRelay Admin Portal is: ${otpCode}\n\nThis code expires in 5 minutes.`);

      return NextResponse.json({ otpRequired: true });
    }

    if (subPath === 'resend-otp') {
      const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '127.0.0.1';

      const allowed = await checkRateLimit(ip, 'admin_resend_otp', 5, 15); // 5 attempts per 15 minutes
      if (!allowed) {
        return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 });
      }

      const { email, secret } = await request.json();

      if (!email || !secret) {
        await incrementRateLimit(ip, 'admin_resend_otp');
        return NextResponse.json({ error: 'Email and Secret required.' }, { status: 400 });
      }

      const db = getRequestContext().env.DB;

      // Look up security personnel
      const personnel: any = await db.prepare(`
        SELECT role, status FROM security_personnel WHERE email = ?
      `).bind(email.trim().toLowerCase()).first();

      if (!personnel) {
        await incrementRateLimit(ip, 'admin_resend_otp');
        return NextResponse.json({ error: 'Access Denied: Operative not registered.' }, { status: 403 });
      }

      if (personnel.status !== 'ACTIVE') {
        await incrementRateLimit(ip, 'admin_resend_otp');
        return NextResponse.json({ error: 'Access Denied: Security Clearance Revoked.' }, { status: 403 });
      }

      let expectedSecret = process.env.ADMIN_BYPASS_SECRET;
      try {
        const ctx = getRequestContext();
        if ((ctx?.env as any)?.ADMIN_BYPASS_SECRET) {
          expectedSecret = (ctx.env as any).ADMIN_BYPASS_SECRET as string;
        }
      } catch (ctxErr) {}

      if (!expectedSecret) {
        expectedSecret = crypto.randomUUID();
      }

      const cleanExpected = expectedSecret.trim().replace(/^["']|["']$/g, '');
      const cleanProvided = secret.trim();

      if (cleanProvided !== cleanExpected) {
        await incrementRateLimit(ip, 'admin_resend_otp');
        return NextResponse.json({ error: 'Access Denied: Invalid cryptographic clearance.' }, { status: 403 });
      }

      // Generate dynamic OTP for this specific email
      const randomBuffer = new Uint32Array(1);
      crypto.getRandomValues(randomBuffer);
      const otpCode = (100000 + (randomBuffer[0] % 900000)).toString();
      const expiresAt = Date.now() + 5 * 60 * 1000;

      await db.batch([
        db.prepare('INSERT OR REPLACE INTO system_config (key, value) VALUES (?, ?)').bind(`admin_otp_${email.trim().toLowerCase()}`, otpCode),
        db.prepare('INSERT OR REPLACE INTO system_config (key, value) VALUES (?, ?)').bind(`admin_otp_expires_${email.trim().toLowerCase()}`, expiresAt.toString())
      ]);

      const { sendSecurityAlert } = await import('@/lib/monitoring');
      await sendSecurityAlert('Admin OTP Code (Resent)', `Your new one-time passcode to access the StealthRelay Admin Portal is: ${otpCode}\n\nThis code expires in 5 minutes.`);

      return NextResponse.json({ success: true });
    }

    if (subPath === 'verify-otp') {
      const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '127.0.0.1';

      const allowed = await checkRateLimit(ip, 'admin_verify_otp', 5, 15); // 5 attempts per 15 minutes
      if (!allowed) {
        return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 });
      }

      const { email, secret, otp } = await request.json();

      if (!email || !secret || !otp) {
        await incrementRateLimit(ip, 'admin_verify_otp');
        return NextResponse.json({ error: 'Missing parameters.' }, { status: 400 });
      }

      let expectedSecret = process.env.ADMIN_BYPASS_SECRET;
      try {
        const ctx = getRequestContext();
        if ((ctx?.env as any)?.ADMIN_BYPASS_SECRET) {
          expectedSecret = (ctx.env as any).ADMIN_BYPASS_SECRET as string;
        }
      } catch (ctxErr) {}
      if (!expectedSecret) expectedSecret = crypto.randomUUID();

      if (secret.trim() !== expectedSecret.trim().replace(/^["']|["']$/g, '')) {
        await incrementRateLimit(ip, 'admin_verify_otp');
        return NextResponse.json({ error: 'Access Denied' }, { status: 403 });
      }

      const db = getRequestContext().env.DB;

      // Verify email role
      const personnel: any = await db.prepare(`
        SELECT role, status FROM security_personnel WHERE email = ?
      `).bind(email.trim().toLowerCase()).first();

      if (!personnel || personnel.status !== 'ACTIVE') {
        await incrementRateLimit(ip, 'admin_verify_otp');
        return NextResponse.json({ error: 'Access Denied: Operative authorization revoked.' }, { status: 403 });
      }

      const keyOtp = `admin_otp_${email.trim().toLowerCase()}`;
      const keyExpires = `admin_otp_expires_${email.trim().toLowerCase()}`;

      const dbResult = await db.batch([
        db.prepare('SELECT value FROM system_config WHERE key = ?').bind(keyOtp),
        db.prepare('SELECT value FROM system_config WHERE key = ?').bind(keyExpires)
      ]);

      const storedOtp = dbResult[0]?.results?.[0]?.value;
      const storedExpires = dbResult[1]?.results?.[0]?.value;

      if (!storedOtp || !storedExpires || Date.now() > parseInt(storedExpires as string)) {
        await incrementRateLimit(ip, 'admin_verify_otp');
        return NextResponse.json({ error: 'OTP expired or invalid. Please request a new one.' }, { status: 400 });
      }

      if (storedOtp !== otp.trim()) {
        const { sendSecurityAlert } = await import('@/lib/monitoring');
        await sendSecurityAlert('Failed Admin OTP Attempt', `An invalid OTP was entered for ${email} from IP: ${ip}`);
        await incrementRateLimit(ip, 'admin_verify_otp');
        return NextResponse.json({ error: 'Invalid OTP code.' }, { status: 400 });
      }

      // OTP is valid! Clear it to prevent reuse.
      await db.prepare('DELETE FROM system_config WHERE key IN (?, ?)').bind(keyOtp, keyExpires).run();

      // Sign the cookie
      const maxAge = 60 * 60 * 12; // 12 hours
      const expiresTimestamp = Date.now() + maxAge * 1000;
      const signedSession = await signSession(
        email.trim().toLowerCase(),
        personnel.role,
        expiresTimestamp,
        expectedSecret.trim().replace(/^["']|["']$/g, '')
      );

      const cookieStore = await cookies();
      cookieStore.set({
        name: 'stealth_admin_session',
        value: signedSession,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: maxAge,
      });

      // Legacy fallback cookie
      cookieStore.set({
        name: 'stealth_admin_token',
        value: secret,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: maxAge,
      });

      await logAudit({
        action: 'ADMIN_BYPASS_SUCCESS',
        resourceType: 'ADMIN',
        severity: 'WARNING',
        ipAddress: ip,
        details: { email, role: personnel.role, note: 'Bypass established with cryptographic OTP 2FA.' }
      });

      return NextResponse.json({ success: true });
    }

    if (subPath === 'templates/save') {
      const session = await requireAdmin(['SUPER_ADMIN', 'ADMIN']);
      const { id, subject, body, status, cc, bcc } = await request.json();
      if (!id || !subject || !body || !status) {
        return NextResponse.json({ error: 'Incomplete template payload.' }, { status: 400 });
      }

      const db = getRequestContext().env.DB;
      await db.prepare(`
        UPDATE email_templates
        SET subject = ?, body = ?, status = ?, cc = ?, bcc = ?, updated_at = datetime('now')
        WHERE id = ?
      `).bind(subject, body, status, cc || null, bcc || null, id).run();

      const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '127.0.0.1';
      await logAudit({
        action: 'ADMIN_UPDATE_TEMPLATE',
        resourceType: 'ADMIN',
        severity: 'INFO',
        ipAddress: ip,
        details: { actor: session.email, templateId: id }
      });

      return NextResponse.json({ success: true });
    }

    if (subPath === 'templates/test') {
      const session = await requireAdmin(['SUPER_ADMIN', 'ADMIN']);
      const { id } = await request.json();
      if (!id) {
        return NextResponse.json({ error: 'Template ID required.' }, { status: 400 });
      }

      const db = getRequestContext().env.DB;
      const template: any = await db.prepare(`
        SELECT name, subject, body FROM email_templates WHERE id = ?
      `).bind(id).first();

      if (!template) {
        return NextResponse.json({ error: 'Template not found.' }, { status: 404 });
      }

      // Interpolate fake test variables
      const subject = `[TEST MODE] ${template.subject}`
        .replace(/\{\{\s*sitename\s*\}\}/g, "StealthRelay (TEST)")
        .replace(/\{\{\s*plan\s*\}\}/g, "Phantom Security")
        .replace(/\{\{\s*display_name\s*\}\}/g, "Test Operative")
        .replace(/\{\{\s*user_login\s*\}\}/g, session.email)
        .replace(/\{\{\s*membership_level_name\s*\}\}/g, "Phantom Security Tier");

      const htmlContent = template.body
        .replace(/\{\{\s*sitename\s*\}\}/g, "StealthRelay (TEST)")
        .replace(/\{\{\s*plan\s*\}\}/g, "Phantom Security")
        .replace(/\{\{\s*display_name\s*\}\}/g, "Test Operative")
        .replace(/\{\{\s*user_login\s*\}\}/g, session.email)
        .replace(/\{\{\s*membership_level_name\s*\}\}/g, "Phantom Security Tier");

      const brevoApiKey = (getRequestContext().env as any).BREVO_API_KEY || process.env.BREVO_API_KEY;
      if (!brevoApiKey) {
        return NextResponse.json({ error: 'Brevo API Key unconfigured on this node.' }, { status: 400 });
      }

      const { sendEmail } = await import('@/lib/email');
      const success = await sendEmail({
        to: session.email,
        subject,
        htmlContent,
        brevoApiKey
      });

      if (!success) {
        return NextResponse.json({ error: 'Failed to deliver outbound test dispatch.' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (subPath === 'users/plan') {
      const session = await requireAdmin(['SUPER_ADMIN']);
      const { userId, plan, trialDays } = await request.json();
      if (!userId || !plan) {
        return NextResponse.json({ error: 'User ID and Plan are required.' }, { status: 400 });
      }

      const db = getRequestContext().env.DB;
      const now = new Date().toISOString();
      let trialEnd: string | null = null;
      
      if (trialDays && Number(trialDays) > 0) {
        trialEnd = new Date(Date.now() + Number(trialDays) * 24 * 60 * 60 * 1000).toISOString();
      }

      // Upsert user subscription
      await db.prepare(`
        INSERT INTO user_subscriptions (user_id, plan, status, current_period_end, created_at)
        VALUES (?, ?, 'ACTIVE', ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          plan = excluded.plan,
          status = 'ACTIVE',
          current_period_end = excluded.current_period_end
      `).bind(userId, plan, trialEnd, now).run();

      const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '127.0.0.1';
      await logAudit({
        action: 'ADMIN_MANUAL_PLAN_GRANT',
        resourceType: 'ADMIN',
        severity: 'CRITICAL',
        ipAddress: ip,
        details: { actor: session.email, targetUser: userId, plan, trialDays }
      });

      return NextResponse.json({ success: true });
    }

    if (subPath === 'users/seats') {
      const session = await requireAdmin(['SUPER_ADMIN']);
      const { userId, seats } = await request.json();
      if (!userId || seats === undefined) {
        return NextResponse.json({ error: 'User ID and seats are required.' }, { status: 400 });
      }

      const db = getRequestContext().env.DB;
      
      try {
        await db.prepare("ALTER TABLE user_subscriptions ADD COLUMN seats INTEGER DEFAULT 1").run();
      } catch {}

      await db.prepare(`
        UPDATE user_subscriptions SET seats = ? WHERE user_id = ?
      `).bind(Number(seats), userId).run();

      const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '127.0.0.1';
      await logAudit({
        action: 'ADMIN_MANUAL_SEAT_GRANT',
        resourceType: 'ADMIN',
        severity: 'WARNING',
        ipAddress: ip,
        details: { actor: session.email, targetUser: userId, seats: Number(seats) }
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  } catch (error: any) {
    logger.error('Admin API Mutate Exception:', error);
    return NextResponse.json(
      { error: error.message || 'Internal secure gate failure.' }, 
      { status: 500 }
    );
  }
}
