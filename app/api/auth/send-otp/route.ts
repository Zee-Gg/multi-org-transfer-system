import { NextRequest } from "next/server";
import { sendOtpSchema } from "@/lib/validations";
import { generateOTP, saveOTP } from "@/lib/otp";
import { sendOTPEmail } from "@/lib/email";
import { ok, err, zodError, serverError } from "@/lib/response";
import sql from "@/lib/db";
import { ZodError } from "zod";
import { logAuditEvent, AuditEventType, getIpAddress } from "@/lib/logging";

export async function POST(req: NextRequest) {
  const ipAddress = getIpAddress(req.headers);
  const body  = await req.json().catch(() => ({}));
  
  try {
    const { email } = sendOtpSchema.parse(body);

    // Normalize email for consistency
    const normalizedEmail = email.toLowerCase().trim();

    // Log login attempt
    await logAuditEvent({
      eventType: AuditEventType.AUTH_LOGIN_STARTED,
      email: normalizedEmail,
      ipAddress,
      action: "Login attempt started",
      result: "success",
    }).catch(() => {});

    const orgs = await sql`
      SELECT id, name FROM organizations WHERE email = ${normalizedEmail}
    `;

    if (orgs.length === 0) {
      // Log failed login attempt
      await logAuditEvent({
        eventType: AuditEventType.AUTH_LOGIN_FAILED,
        email: normalizedEmail,
        ipAddress,
        action: "Email not found",
        result: "failure",
        errorMessage: "Organization not registered",
      }).catch(() => {});

      // Intentionally vague — don't reveal whether email exists
      return err("If this email is registered, a code will be sent.", 200);
    }

    const code = generateOTP();
    await saveOTP(normalizedEmail, code);
    await sendOTPEmail(normalizedEmail, code, orgs[0].name);

    // Log successful OTP send
    await logAuditEvent({
      eventType: AuditEventType.AUTH_OTP_SENT,
      email: normalizedEmail,
      ipAddress,
      action: "OTP sent to email",
      result: "success",
      details: { orgId: orgs[0].id },
    }).catch(() => {});

    return ok(undefined, "Login code sent. Check your email.");
  } catch (e) {
    // Log system errors
    const normalizedEmail = body?.email?.toLowerCase().trim();
    await logAuditEvent({
      eventType: AuditEventType.SYSTEM_ERROR,
      email: normalizedEmail,
      ipAddress,
      action: "send-otp error",
      result: "failure",
      errorMessage: e instanceof Error ? e.message : String(e),
    }).catch(() => {});

    if (e instanceof ZodError) return zodError(e.issues);
    return serverError(`send-otp: ${e}`);
  }
}