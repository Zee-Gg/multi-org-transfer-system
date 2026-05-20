import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { deleteRowSchema } from "@/lib/validations";
import { ok, unauthorized, notFound, zodError, serverError } from "@/lib/response";
import sql from "@/lib/db";
import { ZodError } from "zod";
import { logAuditEvent, AuditEventType, getIpAddress } from "@/lib/logging";

export async function DELETE(req: NextRequest) {
  const ipAddress = getIpAddress(req.headers);

  try {
    const session = await getSession();
    if (!session) {
      // Log unauthorized access
      await logAuditEvent({
        eventType: AuditEventType.UNAUTHORIZED_ACCESS,
        email: "unknown",
        ipAddress,
        action: "Delete row attempted without session",
        result: "failure",
      }).catch(() => {});

      return unauthorized();
    }

    const body = await req.json().catch(() => ({}));
    const { id } = deleteRowSchema.parse(body);

    const deleted = await sql`
      DELETE FROM data_rows
      WHERE  id = ${id} AND org_id = ${session.orgId}
      RETURNING id
    `;

    if (deleted.length === 0) return notFound("Row");

    // Log row deleted
    await logAuditEvent({
      eventType: AuditEventType.DATA_VIEWED,
      email: session.email,
      orgId: session.orgId,
      ipAddress,
      action: "Row deleted",
      result: "success",
      details: { rowId: id },
    }).catch(() => {});

    return ok({ id }, "Row deleted successfully.");
  } catch (e) {
    // Log system errors
    const session = await getSession().catch(() => null);
    await logAuditEvent({
      eventType: AuditEventType.SYSTEM_ERROR,
      email: session?.email,
      orgId: session?.orgId,
      ipAddress,
      action: "rows/delete error",
      result: "failure",
      errorMessage: e instanceof Error ? e.message : String(e),
    }).catch(() => {});

    if (e instanceof ZodError) return zodError(e.issues);
    return serverError(`rows/delete: ${e}`);
  }
}