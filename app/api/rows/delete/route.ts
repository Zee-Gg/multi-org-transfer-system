import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { deleteRowSchema } from "@/lib/validations";
import { ok, unauthorized, notFound, zodError, serverError } from "@/lib/response";
import sql from "@/lib/db";
import { ZodError } from "zod";

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const body = await req.json().catch(() => ({}));
    const { id } = deleteRowSchema.parse(body);

    // Soft delete - only if row belongs to this org
    const updated = await sql`
      UPDATE data_rows
      SET    is_deleted = TRUE
      WHERE  id     = ${id}
        AND  org_id = ${session.orgId}
        AND  is_deleted = FALSE
      RETURNING id
    `;

    if (updated.length === 0) return notFound("Row");

    return ok({ id }, "Row deleted successfully.");
  } catch (e) {
    if (e instanceof ZodError) return zodError(e.issues);
    return serverError(`rows/delete: ${e}`);
  }
}