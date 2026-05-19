import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { transferSchema } from "@/lib/validations";
import { sendTransferNotification } from "@/lib/email";
import { ok, err, unauthorized, zodError, serverError } from "@/lib/response";
import sql from "@/lib/db";
import { ZodError } from "zod";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const body = await req.json().catch(() => ({}));
    const { message } = transferSchema.parse(body);

    // Find the recipient org (the other one)
    const [toOrg] = await sql`
      SELECT id, name, email FROM organizations WHERE id != ${session.orgId} LIMIT 1
    `;
    if (!toOrg) return err("No recipient organization found.", 400);

    // Get all source rows
    const sourceRows = await sql`
      SELECT field_one, field_two, field_three
      FROM   data_rows
      WHERE  org_id = ${session.orgId}
    `;
    if (sourceRows.length === 0) {
      return err("No data to transfer. Add some rows first.", 400);
    }

    // Deep-copy rows to recipient (independent state post-transfer)
    const newRows = sourceRows.map((r) => ({
      org_id:      toOrg.id as number,
      field_one:   r.field_one as string,
      field_two:   r.field_two as string,
      field_three: r.field_three as string,
    }));

    for (let i = 0; i < newRows.length; i += 100) {
      await sql`
        INSERT INTO data_rows ${sql(newRows.slice(i, i + 100), "org_id", "field_one", "field_two", "field_three")}
      `;
    }

    // Log transfer
    await sql`
      INSERT INTO transfers (from_org_id, to_org_id, message, row_count)
      VALUES (${session.orgId}, ${toOrg.id}, ${message ?? null}, ${sourceRows.length})
    `;

    // Send email notification (non-blocking — don't fail the transfer if email fails)
    sendTransferNotification({
      to:          toOrg.email,
      toOrgName:   toOrg.name,
      fromOrgName: session.orgName,
      message,
      rowCount:    sourceRows.length,
    }).catch((e) => console.error("[transfer email]", e));

    return ok(
      { rowCount: sourceRows.length, toOrg: toOrg.name },
      `${sourceRows.length} records transferred to ${toOrg.name}.`
    );
  } catch (e) {
    if (e instanceof ZodError) return zodError(e.issues);
    return serverError(`transfer: ${e}`);
  }
}

// GET — transfer history for this org
export async function GET() {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const transfers = await sql`
      SELECT
        t.id, t.row_count, t.message, t.transferred_at,
        f.name AS from_org_name,
        to_org.name AS to_org_name
      FROM   transfers t
      JOIN   organizations f      ON f.id = t.from_org_id
      JOIN   organizations to_org ON to_org.id = t.to_org_id
      WHERE  t.from_org_id = ${session.orgId}
          OR t.to_org_id   = ${session.orgId}
      ORDER  BY t.transferred_at DESC
      LIMIT  20
    `;

    return ok({ transfers });
  } catch (e) {
    return serverError(`transfer/history: ${e}`);
  }
}