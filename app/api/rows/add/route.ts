import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { addRowSchema } from "@/lib/validations";
import { created, unauthorized, zodError, serverError } from "@/lib/response";
import sql from "@/lib/db";
import { ZodError } from "zod";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const body = await req.json().catch(() => ({}));
    const { fieldOne, fieldTwo, fieldThree } = addRowSchema.parse(body);

    const [row] = await sql`
      INSERT INTO data_rows (org_id, field_one, field_two, field_three)
      VALUES (${session.orgId}, ${fieldOne}, ${fieldTwo}, ${fieldThree})
      RETURNING id, field_one, field_two, field_three, created_at
    `;

    return created({ row }, "Row added successfully.");
  } catch (e) {
    if (e instanceof ZodError) return zodError(e.issues);
    return serverError(`rows/add: ${e}`);
  }
}