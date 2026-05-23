import { NextRequest } from "next/server";
import { sendOtpSchema } from "@/lib/validations";
import { generateOTP, saveOTP } from "@/lib/otp";
import { sendOTPEmail } from "@/lib/email";
import { ok, zodError, serverError } from "@/lib/response";
import sql from "@/lib/db";
import { ZodError } from "zod";
import { logAuditEvent, AuditEventType, getIpAddress } from "@/lib/logging";

export async function POST(req: NextRequest) {
  const ipAddress = getIpAddress(req.headers);
  const body = await req.json().catch(() => ({}));

  try {
    const { email } = sendOtpSchema.parse(body);
    const normalizedEmail = email.toLowerCase().trim();

    const users = await sql`
      SELECT u.id, u.name, o.name as org_name
      FROM users u
      JOIN organizations o ON o.id = u.org_id
      WHERE u.email = ${normalizedEmail}
    `;

    if (users.length === 0) {
      await logAuditEvent({
        eventType: AuditEventType.AUTH_LOGIN_FAILED,
        email: normalizedEmail,
        ipAddress,
        action: "OTP requested for unregistered email",
        result: "failure",
      }).catch(() => {});
      return ok(undefined, "If this email is registered, a code will be sent.");
    }

    const user = users[0];
    const code = generateOTP();
    await saveOTP(user.id, code);
    await sendOTPEmail(normalizedEmail, code, user.org_name);

    await logAuditEvent({
      eventType: AuditEventType.AUTH_OTP_SENT,
      email: normalizedEmail,
      ipAddress,
      action: "OTP sent successfully",
      result: "success",
    }).catch(() => {});

    return ok(undefined, "Login code sent. Check your email.");
  } catch (e) {
    await logAuditEvent({
      eventType: AuditEventType.SYSTEM_ERROR,
      email: body?.email,
      ipAddress,
      action: "send-otp error",
      result: "failure",
      errorMessage: e instanceof Error ? e.message : String(e),
    }).catch(() => {});
    if (e instanceof ZodError) return zodError(e.issues);
    return serverError(`send-otp: ${e}`);
  }
}