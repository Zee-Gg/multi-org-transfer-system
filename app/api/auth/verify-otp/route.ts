import { NextRequest, NextResponse } from "next/server";
import { verifyOtpSchema } from "@/lib/validations";
import { verifyOTP } from "@/lib/otp";
import { signToken, AUTH_COOKIE } from "@/lib/auth";
import { err, zodError, serverError } from "@/lib/response";
import sql from "@/lib/db";
import { ZodError } from "zod";
import type { SessionPayload } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, code } = verifyOtpSchema.parse(body);

    // Normalize email for consistency
    const normalizedEmail = email.toLowerCase().trim();

    const valid = await verifyOTP(normalizedEmail, code);
    if (!valid) {
      return err("Invalid or expired code. Please try again.", 401);
    }

    const orgs = await sql`
      SELECT id, name, slug FROM organizations WHERE email = ${normalizedEmail}
    `;
    if (orgs.length === 0) return err("Organization not found.", 404);

    const org = orgs[0];
    const payload: SessionPayload = {
      orgId:   org.id,
      email: normalizedEmail,
      orgName: org.name,
      orgSlug: org.slug,
    };

    const token = await signToken(payload);
    const res   = NextResponse.json(
      { success: true, data: { orgName: org.name, orgSlug: org.slug }, message: "Logged in successfully." },
      { status: 200 }
    );
    res.cookies.set({ ...AUTH_COOKIE, value: token });
    return res;
  } catch (e) {
    if (e instanceof ZodError) return zodError(e.issues);
    return serverError(`verify-otp: ${e}`);
  }
}