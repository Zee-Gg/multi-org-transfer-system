import { NextRequest, NextResponse } from "next/server";
import { verifyOtpSchema } from "@/lib/validations";
import { verifyOTP } from "@/lib/otp";
import { signToken, AUTH_COOKIE } from "@/lib/auth";
import { err, zodError, serverError } from "@/lib/response";
import sql from "@/lib/db";
import { ZodError } from "zod";
import type { SessionPayload } from "@/types";
import { logAuditEvent, AuditEventType, getIpAddress } from "@/lib/logging";

export async function POST(req: NextRequest) {
  const ipAddress = getIpAddress(req.headers);
  const body = await req.json().catch(() => ({}));
  
  try {
    const { email, code } = verifyOtpSchema.parse(body);

    // Normalize email for consistency
    const normalizedEmail = email.toLowerCase().trim();

    const valid = await verifyOTP(normalizedEmail, code);
    if (!valid) {
      // Log failed OTP verification
      await logAuditEvent({
        eventType: AuditEventType.AUTH_OTP_FAILED,
        email: normalizedEmail,
        ipAddress,
        action: "Invalid or expired OTP",
        result: "failure",
        errorMessage: "Verification code rejected",
      }).catch(() => {});

      return err("Invalid or expired code. Please try again.", 401);
    }

    const orgs = await sql`
      SELECT id, name, slug FROM organizations WHERE email = ${normalizedEmail}
    `;
    if (orgs.length === 0) {
      // Log org not found
      await logAuditEvent({
        eventType: AuditEventType.AUTH_LOGIN_FAILED,
        email: normalizedEmail,
        ipAddress,
        action: "Organization not found after OTP verify",
        result: "failure",
        errorMessage: "Org lookup failed",
      }).catch(() => {});

      return err("Organization not found.", 404);
    }

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

    // Log successful login
    await logAuditEvent({
      eventType: AuditEventType.AUTH_LOGIN_SUCCESS,
      email: normalizedEmail,
      ipAddress,
      orgId: org.id,
      action: "User logged in successfully",
      result: "success",
      details: { orgName: org.name, orgSlug: org.slug },
    }).catch(() => {});

    return res;
  } catch (e) {
    // Log system errors
    const normalizedEmail = body?.email?.toLowerCase().trim();
    await logAuditEvent({
      eventType: AuditEventType.SYSTEM_ERROR,
      email: normalizedEmail,
      ipAddress,
      action: "verify-otp error",
      result: "failure",
      errorMessage: e instanceof Error ? e.message : String(e),
    }).catch(() => {});

    if (e instanceof ZodError) return zodError(e.issues);
    return serverError(`verify-otp: ${e}`);;
  }
}