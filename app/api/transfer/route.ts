import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { transferSchema } from "@/lib/validations";
import { sendTransferNotification } from "@/lib/email";
import { ok, err, unauthorized, zodError, serverError } from "@/lib/response";
import sql from "@/lib/db";
import { ZodError } from "zod";
import { logAuditEvent, AuditEventType, getIpAddress } from "@/lib/logging";

export async function POST(req: NextRequest) {
  const ipAddress = getIpAddress(req.headers);
  try {
    const session = await getSession();
    if (!session) {
      await logAuditEvent({
        eventType: AuditEventType.UNAUTHORIZED_ACCESS,
        ipAddress,
        action: "Transfer attempted without session",
        result: "failure",
      }).catch(() => {});
      return unauthorized();
    }

    const body = await req.json().catch(() => ({}));
    const { message } = transferSchema.parse(body);

    const [toOrg] = await sql`
      SELECT id, name, email
      FROM organizations
      WHERE id != ${session.orgId}
      LIMIT 1
    `;
    if (!toOrg) return err("No recipient organization found.", 400);

    const [countRes] = await sql`
      SELECT COUNT(*)::int AS total
      FROM data_rows
      WHERE org_id     = ${session.orgId}
        AND is_deleted = FALSE
    `;
    if (countRes.total === 0) {
      return err("No data to transfer. Add some rows first.", 400);
    }

    const [transfer] = await sql`
      INSERT INTO transfers (from_org_id, to_org_id, message, initiated_by)
      VALUES (
        ${session.orgId},
        ${toOrg.id},
        ${message ?? null},
        ${session.userId}
      )
      RETURNING id
    `;

    await sql`
      INSERT INTO data_rows (org_id, transfer_id, field_one, field_two, field_three)
      SELECT
        ${toOrg.id}::uuid,
        ${transfer.id}::uuid,
        field_one,
        field_two,
        field_three
      FROM data_rows
      WHERE org_id     = ${session.orgId}
        AND is_deleted = FALSE
    `;

    await logAuditEvent({
      eventType: AuditEventType.TRANSFER_COMPLETED,
      email: session.email,
      orgId: session.orgId,
      ipAddress,
      action: "Data transfer completed",
      result: "success",
      details: {
        toOrgId:   toOrg.id,
        toOrgName: toOrg.name,
        rowCount:  countRes.total,
      },
    }).catch(() => {});

    sendTransferNotification({
      to:          toOrg.email,
      toOrgName:   toOrg.name,
      fromOrgName: session.orgName,
      message,
      rowCount:    countRes.total,
    }).catch((e) => console.error("[transfer email]", e));

    return ok(
      { rowCount: countRes.total, toOrg: toOrg.name },
      `${countRes.total} records transferred to ${toOrg.name}.`
    );
  } catch (e) {
    await logAuditEvent({
      eventType: AuditEventType.SYSTEM_ERROR,
      ipAddress,
      action: "transfer POST error",
      result: "failure",
      errorMessage: e instanceof Error ? e.message : String(e),
    }).catch(() => {});
    if (e instanceof ZodError) return zodError(e.issues);
    return serverError(`transfer: ${e}`);
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const transfers = await sql`
      SELECT
        t.id,
        t.message,
        t.transferred_at,
        f.name AS from_org_name,
        r.name AS to_org_name
      FROM   transfers t
      JOIN   organizations f ON f.id = t.from_org_id
      JOIN   organizations r ON r.id = t.to_org_id
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