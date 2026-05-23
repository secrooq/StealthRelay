import { getRequestContext } from '@cloudflare/next-on-pages';
import { logger } from "@/lib/logger";

export type AuditAction = 
  | 'SECRET_CREATED' 
  | 'SECRET_VIEWED'
  | 'ALIAS_CREATED' 
  | 'ALIAS_DELETED' 
  | 'FILE_UPLOADED' 
  | 'FILE_DOWNLOADED' 
  | 'ADMIN_LOGIN'
  | 'ADMIN_BYPASS';

export type AuditSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

interface LogAuditParams {
  userId?: string | null;
  action: AuditAction | string;
  resourceType?: 'SECRET' | 'VAULT' | 'RELAY' | 'ADMIN' | string | null;
  resourceId?: string | null;
  severity?: AuditSeverity;
  details?: Record<string, any>;
  ipAddress?: string;
}

/**
 * Shared server-utility handling non-blocking commit of operational logs into D1
 */
export async function logAudit({
  userId = null,
  action,
  resourceType = null,
  resourceId = null,
  severity = 'INFO',
  details = {},
  ipAddress = ''
}: LogAuditParams): Promise<boolean> {
  try {
    const requestContext = getRequestContext();
    if (!requestContext || !requestContext.env || !requestContext.env.DB) {
      logger.warn(`[AUDIT LOCAL] ${action} - Severity: ${severity} - User: ${userId || 'GUEST'} - Details: ${JSON.stringify(details)}`);
      return false;
    }

    const detailsStr = JSON.stringify(details);

    const query = requestContext.env.DB.prepare(`
      INSERT INTO audit_logs (user_id, action, resource_type, resource_id, severity, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      userId,
      action,
      resourceType,
      resourceId,
      severity,
      detailsStr,
      ipAddress
    );

    // Use Cloudflare's waitUntil to log without delaying client response lifecycle
    if (requestContext.ctx && typeof requestContext.ctx.waitUntil === 'function') {
      requestContext.ctx.waitUntil(query.run());
    } else {
      await query.run();
    }

    return true;
  } catch (e) {
    logger.error('[AUDIT ERROR] Failed to commit audit event:', e);
    return false;
  }
}
