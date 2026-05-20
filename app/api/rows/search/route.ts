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
        action: "Search attempted without session",
        result: "failure",
      }).catch(() => {});

      return unauthorized();
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const offset = (page - 1) * limit;

    // If no query, return all rows
    if (!query) {
      const [rows, countRes] = await Promise.all([
        sql`
          SELECT id, field_one, field_two, field_three, created_at
          FROM data_rows
          WHERE org_id = ${session.orgId}
          ORDER BY id ASC
          LIMIT ${limit}
          OFFSET ${offset}
        `,
        sql`
          SELECT COUNT(*)::int AS total
          FROM data_rows
          WHERE org_id = ${session.orgId}
        `,
      ]);

      const total = countRes[0].total as number;
      const totalPages = Math.ceil(total / limit);

      // Log data list access (no search query)
      await logAuditEvent({
        eventType: AuditEventType.DATA_VIEWED,
        email: session.email,
        orgId: session.orgId,
        ipAddress,
        action: "Data list viewed (no query)",
        result: "success",
        details: { rowCount: rows.length, total },
      }).catch(() => {});

      return ok({ rows, total, page, limit, totalPages, query });
    }

    // Search across all text fields with case-insensitive matching
    const searchPattern = `%${query}%`;

    const [rows, countRes] = await Promise.all([
      sql`
        SELECT id, field_one, field_two, field_three, created_at
        FROM data_rows
        WHERE org_id = ${session.orgId}
          AND (
            field_one ILIKE ${searchPattern}
            OR field_two ILIKE ${searchPattern}
            OR field_three ILIKE ${searchPattern}
          )
        ORDER BY id ASC
        LIMIT ${limit}
        OFFSET ${offset}
      `,
      sql`
        SELECT COUNT(*)::int AS total
        FROM data_rows
        WHERE org_id = ${session.orgId}
          AND (
            field_one ILIKE ${searchPattern}
            OR field_two ILIKE ${searchPattern}
            OR field_three ILIKE ${searchPattern}
          )
      `,
    ]);

    const total = countRes[0].total as number;
    const totalPages = Math.ceil(total / limit);

    // Log data search
    await logAuditEvent({
      eventType: AuditEventType.DATA_SEARCHED,
      email: session.email,
      orgId: session.orgId,
      ipAddress,
      action: "Data searched",
      result: "success",
      details: { query, resultCount: rows.length, total },
    }).catch(() => {});

    return ok({ rows, total, page, limit, totalPages, query });
  } catch (e) {
    // Log system errors
    const session = await getSession().catch(() => null);
    await logAuditEvent({
      eventType: AuditEventType.SYSTEM_ERROR,
      email: session?.email,
      orgId: session?.orgId,
      ipAddress,
      action: "rows/search error",
      result: "failure",
      errorMessage: e instanceof Error ? e.message : String(e),
    }).catch(() => {});

    return serverError(`rows/search: ${e}`);
  }
}
