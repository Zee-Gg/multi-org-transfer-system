import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { created, unauthorized, serverError } from "@/lib/response";
import sql from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const [row] = await sql`
      INSERT INTO data_rows (org_id, field_one, field_two, field_three)
      VALUES (
        ${session.orgId},
        'unlisted',
        'unlisted',
        'unlisted'
      )
      RETURNING id, field_one, field_two, field_three, created_at
    `;

    return created({ row }, "Row added successfully.");
  } catch (e) {
    return serverError(`rows/add: ${e}`);
  }
}