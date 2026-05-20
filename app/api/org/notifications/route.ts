import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { ok, unauthorized, serverError } from "@/lib/response";
import sql from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

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

    return ok({
      notifications: transfers,
      unreadCount: transfers.length,
      totalCount: countResult.total,
    });
  } catch (e) {
    return serverError(`notifications: ${e}`);
  }
}
