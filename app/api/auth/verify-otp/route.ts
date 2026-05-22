import { NextRequest, NextResponse } from "next/server";
import { verifyOtpSchema } from "@/lib/validations";
import { verifyOTP } from "@/lib/otp";
import { signToken, AUTH_COOKIE } from "@/lib/auth";
import { err, zodError, serverError } from "@/lib/response";
import sql from "@/lib/db";
import { ZodError } from "zod";
import type { SessionPayload } from "@/types";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  try {
    const { email, code } = verifyOtpSchema.parse(body);
    const normalizedEmail = email.toLowerCase().trim();

    // Look up user and their org by email
    const users = await sql`
      SELECT u.id as user_id, u.email, o.id as org_id, o.name as org_name, o.slug as org_slug
      FROM users u
      JOIN organizations o ON o.id = u.org_id
      WHERE u.email = ${normalizedEmail}
    `;

    if (users.length === 0) {
      return err("Invalid or expired code. Please try again.", 401);
    }

    const user = users[0];
    const valid = await verifyOTP(user.user_id, code);

    if (!valid) {
      return err("Invalid or expired code. Please try again.", 401);
    }

    const payload: SessionPayload = {
      userId:  user.user_id,
      orgId:   user.org_id,
      email:   normalizedEmail,
      orgName: user.org_name,
      orgSlug: user.org_slug,
    };

    const token = await signToken(payload);
    const res = NextResponse.json(
      { 
        success: true, 
        data: { orgName: user.org_name, orgSlug: user.org_slug }, 
        message: "Logged in successfully." 
      },
      { status: 200 }
    );
    res.cookies.set({ ...AUTH_COOKIE, value: token });
    return res;

  } catch (e) {
    if (e instanceof ZodError) return zodError(e.issues);
    return serverError(`verify-otp: ${e}`);
  }
}