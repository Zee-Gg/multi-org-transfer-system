import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { ok, unauthorized, serverError } from "@/lib/response";
import sql from "@/lib/db";
import { logAuditEvent, AuditEventType, getIpAddress } from "@/lib/logging";

export async function GET(req: NextRequest) {
  const ipAddress = getIpAddress(req.headers);

  try {
    const session = await getSession();
    if (!session) {
      // Log unauthorized access
      await logAuditEvent({
        eventType: AuditEventType.UNAUTHORIZED_ACCESS,
        email: "unknown",
        ipAddress,
        action: "Notifications accessed without session",
        result: "failure",
      }).catch(() => {});

      return unauthorized();
    }

    // Get received transfers for this organization
    const transfers = await sql`
      SELECT
        t.id,
        t.row_count,
        t.message,
        t.transferred_at,
        f.name AS from_org_name,
        f.slug AS from_org_slug
      FROM transfers t
      JOIN organizations f ON f.id = t.from_org_id
      WHERE t.to_org_id = ${session.orgId}
      ORDER BY t.transferred_at DESC
      LIMIT 50
    `;

    // Count total received transfers
    const [countResult] = await sql`
      SELECT COUNT(*)::int as total
      FROM transfers
      WHERE to_org_id = ${session.orgId}
    `;

    // Log notifications access
    await logAuditEvent({
      eventType: AuditEventType.DATA_VIEWED,
      email: session.email,
      orgId: session.orgId,
      ipAddress,
      action: "Notifications viewed",
      result: "success",
      details: { notificationCount: transfers.length, totalCount: countResult.total },
    }).catch(() => {});

    return ok({
      notifications: transfers,
      unreadCount: transfers.length,
      totalCount: countResult.total,
    });
  } catch (e) {
    // Log system errors
    const session = await getSession().catch(() => null);
    await logAuditEvent({
      eventType: AuditEventType.SYSTEM_ERROR,
      email: session?.email,
      orgId: session?.orgId,
      ipAddress,
      action: "org/notifications error",
      result: "failure",
      errorMessage: e instanceof Error ? e.message : String(e),
    }).catch(() => {});

    return serverError(`notifications: ${e}`);
  }
}
