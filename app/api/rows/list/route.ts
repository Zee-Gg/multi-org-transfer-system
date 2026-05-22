import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { ok, unauthorized, serverError } from "@/lib/response";
import sql from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const { searchParams } = new URL(req.url);
    const page  = Math.max(1, parseInt(searchParams.get("page")  ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const offset = (page - 1) * limit;

    const [rows, countRes] = await Promise.all([
      sql`
        SELECT id, field_one, field_two, field_three, created_at
        FROM   data_rows
        WHERE  org_id     = ${session.orgId}
          AND  is_deleted = FALSE
        ORDER  BY created_at ASC
        LIMIT  ${limit}
        OFFSET ${offset}
      `,
      sql`
        SELECT COUNT(*)::int AS total
        FROM   data_rows
        WHERE  org_id     = ${session.orgId}
          AND  is_deleted = FALSE
      `,
    ]);

    const total      = countRes[0].total as number;
    const totalPages = Math.ceil(total / limit);

    return ok({ rows, total, page, limit, totalPages });
  } catch (e) {
    return serverError(`rows/list: ${e}`);
  }
}