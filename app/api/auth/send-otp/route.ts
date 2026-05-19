import { NextRequest } from "next/server";
import { sendOtpSchema } from "@/lib/validations";
import { generateOTP, saveOTP } from "@/lib/otp";
import { sendOTPEmail } from "@/lib/email";
import { ok, err, zodError, serverError } from "@/lib/response";
import sql from "@/lib/db";
import { ZodError } from "zod";

export async function POST(req: NextRequest) {
  try {
    const body  = await req.json().catch(() => ({}));
    const { email } = sendOtpSchema.parse(body);

    // Normalize email for consistency
    const normalizedEmail = email.toLowerCase().trim();

    const orgs = await sql`
      SELECT id, name FROM organizations WHERE email = ${normalizedEmail}
    `;

    if (orgs.length === 0) {
      // Intentionally vague — don't reveal whether email exists
      return err("If this email is registered, a code will be sent.", 200);
    }

    const code = generateOTP();
    await saveOTP(normalizedEmail, code);
    await sendOTPEmail(normalizedEmail, code, orgs[0].name);

    return ok(undefined, "Login code sent. Check your email.");
  } catch (e) {
    if (e instanceof ZodError) return zodError(e.issues);
    return serverError(`send-otp: ${e}`);
  }
}