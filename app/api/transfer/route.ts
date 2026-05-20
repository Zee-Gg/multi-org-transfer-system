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
      // Log unauthorized transfer attempt
      await logAuditEvent({
        eventType: AuditEventType.UNAUTHORIZED_ACCESS,
        email: "unknown",
        ipAddress,
        action: "Transfer attempted without session",
        result: "failure",
      }).catch(() => {});

      return unauthorized();
    }

    // Log transfer initiated
    await logAuditEvent({
      eventType: AuditEventType.TRANSFER_INITIATED,
      email: session.email,
      orgId: session.orgId,
      ipAddress,
      action: "Transfer initiated",
      result: "success",
      details: { endpoint: "transfer" },
    }).catch(() => {});

    const body = await req.json().catch(() => ({}));
    const { message } = transferSchema.parse(body);

    // Find the recipient org (the other one)
    const [toOrg] = await sql`
      SELECT id, name, email FROM organizations WHERE id != ${session.orgId} LIMIT 1
    `;
    if (!toOrg) {
      // Log transfer failed - no recipient
      await logAuditEvent({
        eventType: AuditEventType.TRANSFER_FAILED,
        email: session.email,
        orgId: session.orgId,
        ipAddress,
        action: "Transfer failed - no recipient org",
        result: "failure",
        errorMessage: "No recipient organization found",
      }).catch(() => {});

      return err("No recipient organization found.", 400);
    }

    // Get all source rows
    const sourceRows = await sql`
      SELECT field_one, field_two, field_three
      FROM   data_rows
      WHERE  org_id = ${session.orgId}
    `;
    if (sourceRows.length === 0) {
      // Log transfer failed - no data
      await logAuditEvent({
        eventType: AuditEventType.TRANSFER_FAILED,
        email: session.email,
        orgId: session.orgId,
        ipAddress,
        action: "Transfer failed - no data",
        result: "failure",
        errorMessage: "No data to transfer",
      }).catch(() => {});

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

    // Log transfer in audit trail
    await sql`
      INSERT INTO transfers (from_org_id, to_org_id, message, row_count)
      VALUES (${session.orgId}, ${toOrg.id}, ${message ?? null}, ${sourceRows.length})
    `;

    // Log successful transfer
    await logAuditEvent({
      eventType: AuditEventType.TRANSFER_COMPLETED,
      email: session.email,
      orgId: session.orgId,
      ipAddress,
      action: "Data transfer completed",
      result: "success",
      details: {
        toOrgId: toOrg.id,
        toOrgName: toOrg.name,
        rowCount: sourceRows.length,
        message: message ?? "No message",
      },
    }).catch(() => {});

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
    // Log system errors
    const session = await getSession().catch(() => null);
    await logAuditEvent({
      eventType: AuditEventType.SYSTEM_ERROR,
      email: session?.email,
      orgId: session?.orgId,
      ipAddress,
      action: "transfer POST error",
      result: "failure",
      errorMessage: e instanceof Error ? e.message : String(e),
    }).catch(() => {});

    if (e instanceof ZodError) return zodError(e.issues);
    return serverError(`transfer: ${e}`);
  }
}

// GET — transfer history for this org
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
        action: "Transfer history accessed without session",
        result: "failure",
      }).catch(() => {});

      return unauthorized();
    }

    // Log transfer history access
    await logAuditEvent({
      eventType: AuditEventType.DATA_VIEWED,
      email: session.email,
      orgId: session.orgId,
      ipAddress,
      action: "Transfer history viewed",
      result: "success",
    }).catch(() => {});

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
    // Log system errors
    const session = await getSession().catch(() => null);
    await logAuditEvent({
      eventType: AuditEventType.SYSTEM_ERROR,
      email: session?.email,
      orgId: session?.orgId,
      ipAddress,
      action: "transfer GET error",
      result: "failure",
      errorMessage: e instanceof Error ? e.message : String(e),
    }).catch(() => {});

    return serverError(`transfer/history: ${e}`);
  }
}