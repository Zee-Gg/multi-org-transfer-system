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
        action: "List rows attempted without session",
        result: "failure",
      }).catch(() => {});

      return unauthorized();
    }

    const { searchParams } = new URL(req.url);
    const page  = Math.max(1, parseInt(searchParams.get("page")  ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const offset = (page - 1) * limit;

    const [rows, countRes] = await Promise.all([
      sql`
        SELECT id, field_one, field_two, field_three, created_at
        FROM   data_rows
        WHERE  org_id = ${session.orgId}
        ORDER  BY id ASC
        LIMIT  ${limit}
        OFFSET ${offset}
      `,
      sql`
        SELECT COUNT(*)::int AS total
        FROM   data_rows
        WHERE  org_id = ${session.orgId}
      `,
    ]);

    const total      = countRes[0].total as number;
    const totalPages = Math.ceil(total / limit);

    // Log data list access
    await logAuditEvent({
      eventType: AuditEventType.DATA_VIEWED,
      email: session.email,
      orgId: session.orgId,
      ipAddress,
      action: "Data list viewed",
      result: "success",
      details: { rowCount: rows.length, total, page, limit },
    }).catch(() => {});

    return ok({ rows, total, page, limit, totalPages });
  } catch (e) {
    // Log system errors
    const session = await getSession().catch(() => null);
    await logAuditEvent({
      eventType: AuditEventType.SYSTEM_ERROR,
      email: session?.email,
      orgId: session?.orgId,
      ipAddress,
      action: "rows/list error",
      result: "failure",
      errorMessage: e instanceof Error ? e.message : String(e),
    }).catch(() => {});

    return serverError(`rows/list: ${e}`);
  }
}