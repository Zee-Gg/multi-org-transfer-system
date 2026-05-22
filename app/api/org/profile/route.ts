import { getSession } from "@/lib/auth";
import { ok, unauthorized, serverError } from "@/lib/response";
import sql from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const [org] = await sql`
      SELECT id, name, email, slug, created_at
      FROM   organizations
      WHERE  id = ${session.orgId}
    `;
    if (!org) return serverError("Organization not found");

    const [rowCount] = await sql`
      SELECT COUNT(*)::int AS total
      FROM   data_rows
      WHERE  org_id     = ${session.orgId}
        AND  is_deleted = FALSE
    `;

    const [transferStats] = await sql`
      SELECT
        COUNT(*)::int AS total_transfers,
        COALESCE(SUM(CASE WHEN from_org_id = ${session.orgId} THEN 1 ELSE 0 END), 0)::int AS transfers_sent,
        COALESCE(SUM(CASE WHEN to_org_id   = ${session.orgId} THEN 1 ELSE 0 END), 0)::int AS transfers_received
      FROM transfers
      WHERE from_org_id = ${session.orgId}
         OR to_org_id   = ${session.orgId}
    `;

    return ok({
      profile: {
        ...org,
        totalRows:          rowCount.total,
        totalTransfers:     transferStats.total_transfers,
        transfersSent:      transferStats.transfers_sent,
        transfersReceived:  transferStats.transfers_received,
      }
    });
  } catch (e) {
    return serverError(`org/profile: ${e}`);
  }
}
