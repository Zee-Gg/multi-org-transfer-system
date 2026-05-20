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
        action: "Profile accessed without session",
        result: "failure",
      }).catch(() => {});

      return unauthorized();
    }

    // Get organization details
    const org = await sql`
      SELECT id, name, email, slug, created_at
      FROM organizations
      WHERE id = ${session.orgId}
    `;

    if (org.length === 0) {
      return serverError("Organization not found");
    }

    // Get row count for this org
    const [rowCount] = await sql`
      SELECT COUNT(*)::int as total
      FROM data_rows
      WHERE org_id = ${session.orgId}
    `;

    // Get transfer statistics
    const [transferStats] = await sql`
      SELECT 
        COUNT(*)::int as total_transfers,
        COALESCE(SUM(CASE WHEN from_org_id = ${session.orgId} THEN row_count ELSE 0 END), 0)::int as rows_sent,
        COALESCE(SUM(CASE WHEN to_org_id = ${session.orgId} THEN row_count ELSE 0 END), 0)::int as rows_received
      FROM transfers
      WHERE from_org_id = ${session.orgId} OR to_org_id = ${session.orgId}
    `;

    const profile = {
      ...org[0],
      totalRows: rowCount.total,
      totalTransfers: transferStats.total_transfers,
      rowsSent: transferStats.rows_sent,
      rowsReceived: transferStats.rows_received,
    };

    // Log profile access
    await logAuditEvent({
      eventType: AuditEventType.DATA_VIEWED,
      email: session.email,
      orgId: session.orgId,
      ipAddress,
      action: "Organization profile viewed",
      result: "success",
      details: { orgName: org[0].name, totalRows: rowCount.total, totalTransfers: transferStats.total_transfers },
    }).catch(() => {});

    return ok({ profile });
  } catch (e) {
    // Log system errors
    const session = await getSession().catch(() => null);
    await logAuditEvent({
      eventType: AuditEventType.SYSTEM_ERROR,
      email: session?.email,
      orgId: session?.orgId,
      ipAddress,
      action: "org/profile error",
      result: "failure",
      errorMessage: e instanceof Error ? e.message : String(e),
    }).catch(() => {});

    return serverError(`org/profile: ${e}`);
  }
}
