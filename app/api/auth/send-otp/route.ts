import { NextRequest } from "next/server";
import { sendOtpSchema } from "@/lib/validations";
import { generateOTP, saveOTP } from "@/lib/otp";
import { sendOTPEmail } from "@/lib/email";
import { ok, err, zodError, serverError } from "@/lib/response";
import sql from "@/lib/db";
import { ZodError } from "zod";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  try {
    const { email } = sendOtpSchema.parse(body);
    const normalizedEmail = email.toLowerCase().trim();

    // Look up user by email
    const users = await sql`
      SELECT u.id, u.name, o.name as org_name
      FROM users u
      JOIN organizations o ON o.id = u.org_id
      WHERE u.email = ${normalizedEmail}
    `;

    if (users.length === 0) {
      // Vague message - do not reveal if email exists
      return ok(undefined, "If this email is registered, a code will be sent.");
    }

    const user = users[0];
    const code = generateOTP();
    await saveOTP(user.id, code);
    await sendOTPEmail(normalizedEmail, code, user.org_name);

    return ok(undefined, "Login code sent. Check your email.");
  } catch (e) {
    if (e instanceof ZodError) return zodError(e.issues);
    return serverError(`send-otp: ${e}`);
  }
}