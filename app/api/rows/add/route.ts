import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { addRowSchema } from "@/lib/validations";
import { created, unauthorized, zodError, serverError } from "@/lib/response";
import sql from "@/lib/db";
import { ZodError } from "zod";
import { logAuditEvent, AuditEventType, getIpAddress } from "@/lib/logging";

export async function POST(req: NextRequest) {
  const ipAddress = getIpAddress(req.headers);

  try {
    const session = await getSession();
    if (!session) {
      // Log unauthorized access
      await logAuditEvent({
        eventType: AuditEventType.UNAUTHORIZED_ACCESS,
        email: "unknown",
        ipAddress,
        action: "Add row attempted without session",
        result: "failure",
      }).catch(() => {});

      return unauthorized();
    }

    const body = await req.json().catch(() => ({}));
    const { fieldOne, fieldTwo, fieldThree } = addRowSchema.parse(body);

    const [row] = await sql`
      INSERT INTO data_rows (org_id, field_one, field_two, field_three)
      VALUES (${session.orgId}, ${fieldOne}, ${fieldTwo}, ${fieldThree})
      RETURNING id, field_one, field_two, field_three, created_at
    `;

    // Log row added
    await logAuditEvent({
      eventType: AuditEventType.DATA_VIEWED,
      email: session.email,
      orgId: session.orgId,
      ipAddress,
      action: "Row added",
      result: "success",
      details: { rowId: row.id, fields: 3 },
    }).catch(() => {});

    return created({ row }, "Row added successfully.");
  } catch (e) {
    // Log system errors
    const session = await getSession().catch(() => null);
    await logAuditEvent({
      eventType: AuditEventType.SYSTEM_ERROR,
      email: session?.email,
      orgId: session?.orgId,
      ipAddress,
      action: "rows/add error",
      result: "failure",
      errorMessage: e instanceof Error ? e.message : String(e),
    }).catch(() => {});

    if (e instanceof ZodError) return zodError(e.issues);
    return serverError(`rows/add: ${e}`);
  }
}