/**
 * Audit Logging System
 * Logs all significant events for compliance and debugging:
 * - Authentication events (login, logout)
 * - Transfer events
 * - Access control events
 * - Data modifications
 */

import sql from "./db";
import { errorLogger } from "./errors";

export enum AuditEventType {
  // Auth events
  AUTH_LOGIN_STARTED = "AUTH_LOGIN_STARTED",
  AUTH_LOGIN_SUCCESS = "AUTH_LOGIN_SUCCESS",
  AUTH_LOGIN_FAILED = "AUTH_LOGIN_FAILED",
  AUTH_OTP_SENT = "AUTH_OTP_SENT",
  AUTH_OTP_VERIFIED = "AUTH_OTP_VERIFIED",
  AUTH_OTP_FAILED = "AUTH_OTP_FAILED",
  AUTH_LOGOUT = "AUTH_LOGOUT",

  // Transfer events
  TRANSFER_INITIATED = "TRANSFER_INITIATED",
  TRANSFER_COMPLETED = "TRANSFER_COMPLETED",
  TRANSFER_FAILED = "TRANSFER_FAILED",

  // Data access
  DATA_VIEWED = "DATA_VIEWED",
  DATA_SEARCHED = "DATA_SEARCHED",

  // Access control
  UNAUTHORIZED_ACCESS = "UNAUTHORIZED_ACCESS",
  FORBIDDEN_ACCESS = "FORBIDDEN_ACCESS",

  // Rate limiting
  RATE_LIMITED = "RATE_LIMITED",

  // System errors
  SYSTEM_ERROR = "SYSTEM_ERROR",
}

export interface AuditLog {
  id: number;
  event_type: AuditEventType;
  org_id?: number;
  email?: string;
  ip_address: string;
  action: string;
  details?: Record<string, unknown>;
  result: "success" | "failure";
  error_message?: string;
  created_at: string;
}

/**
 * Log an audit event
 */
export async function logAuditEvent(params: {
  eventType: AuditEventType;
  orgId?: number;
  email?: string;
  ipAddress: string;
  action: string;
  result: "success" | "failure";
  details?: Record<string, unknown>;
  errorMessage?: string;
}): Promise<void> {
  try {
    await sql`
      INSERT INTO audit_logs (
        event_type, org_id, email, ip_address, action, details, result, error_message
      )
      VALUES (
        ${params.eventType},
        ${params.orgId ?? null},
        ${params.email ?? null},
        ${params.ipAddress},
        ${params.action},
        ${params.details ? JSON.stringify(params.details) : null},
        ${params.result},
        ${params.errorMessage ?? null}
      )
    `;
  } catch (error) {
    errorLogger.error("Failed to log audit event", error, params.eventType);
    // Don't throw - audit logging failures shouldn't break the application
  }
}

/**
 * Get audit logs for an organization
 */
export async function getAuditLogs(
  orgId: number,
  options: {
    limit?: number;
    offset?: number;
    eventType?: AuditEventType;
  } = {}
): Promise<AuditLog[]> {
  const limit = Math.min(options.limit ?? 100, 1000);
  const offset = options.offset ?? 0;

  if (options.eventType) {
    return sql`
      SELECT * FROM audit_logs
      WHERE org_id = ${orgId} AND event_type = ${options.eventType}
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;
  }

  return sql`
    SELECT * FROM audit_logs
    WHERE org_id = ${orgId}
    ORDER BY created_at DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;
}

/**
 * Get audit logs by email (for user-specific events)
 */
export async function getAuditLogsByEmail(
  email: string,
  options: {
    limit?: number;
    offset?: number;
  } = {}
): Promise<AuditLog[]> {
  const limit = Math.min(options.limit ?? 100, 1000);
  const offset = options.offset ?? 0;

  return sql`
    SELECT * FROM audit_logs
    WHERE email = ${email}
    ORDER BY created_at DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;
}

/**
 * Get audit logs by IP address (for security monitoring)
 */
export async function getAuditLogsByIp(
  ipAddress: string,
  options: {
    limit?: number;
    offset?: number;
  } = {}
): Promise<AuditLog[]> {
  const limit = Math.min(options.limit ?? 100, 1000);
  const offset = options.offset ?? 0;

  return sql`
    SELECT * FROM audit_logs
    WHERE ip_address = ${ipAddress}
    ORDER BY created_at DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;
}

/**
 * Count failed login attempts for an email
 */
export async function getFailedLoginAttempts(
  email: string,
  windowMinutes: number = 60
): Promise<number> {
  const result = await sql`
    SELECT COUNT(*)::int AS count
    FROM audit_logs
    WHERE email = ${email}
      AND event_type IN (${AuditEventType.AUTH_LOGIN_FAILED}, ${AuditEventType.AUTH_OTP_FAILED})
      AND created_at > NOW() - INTERVAL '${windowMinutes} minutes'
  `;

  return result[0]?.count ?? 0;
}

/**
 * Count rate limit violations for an IP
 */
export async function getRateLimitViolations(
  ipAddress: string,
  windowMinutes: number = 60
): Promise<number> {
  const result = await sql`
    SELECT COUNT(*)::int AS count
    FROM audit_logs
    WHERE ip_address = ${ipAddress}
      AND event_type = ${AuditEventType.RATE_LIMITED}
      AND created_at > NOW() - INTERVAL '${windowMinutes} minutes'
  `;

  return result[0]?.count ?? 0;
}

/**
 * Clean old audit logs (older than specified days)
 * Run this as a scheduled job or background task
 */
export async function cleanOldAuditLogs(retentionDays: number = 90): Promise<void> {
  try {
    const result = await sql`
      DELETE FROM audit_logs
      WHERE created_at < NOW() - INTERVAL '${retentionDays} days'
    `;

    errorLogger.log(`Cleaned old audit logs`, `Deleted ${result.count} records older than ${retentionDays} days`);
  } catch (error) {
    errorLogger.error("Failed to clean old audit logs", error);
  }
}

/**
 * Helper to extract IP address from request
 */
export function getIpAddress(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  return headers.get("x-real-ip") ?? headers.get("cf-connecting-ip") ?? "unknown";
}
