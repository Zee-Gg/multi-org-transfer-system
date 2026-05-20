/**
 * Example API Route Using New Error Handling System
 * 
 * This demonstrates best practices for:
 * - Using withErrorHandler middleware
 * - Throwing typed errors
 * - Proper error responses
 * 
 * Apply this pattern to all API routes for consistency
 */

import { NextRequest } from "next/server";
import { withErrorHandler } from "@/lib/error-handler";
import { ok, notFound, conflict } from "@/lib/response";
import { UnauthorizedError, ValidationError } from "@/lib/errors";
import { sendOtpSchema } from "@/lib/validations";
import { generateOTP, saveOTP } from "@/lib/otp";
import { sendOTPEmail } from "@/lib/email";
import sql from "@/lib/db";

/**
 * POST /api/auth/send-otp
 * 
 * Sends an OTP to the registered email
 * Errors handled:
 * - 422: Invalid email format (Zod validation)
 * - 400: Email not registered (custom error)
 * - 500: Email service failure
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
  // Parse and validate request body
  const body = await req.json().catch(() => ({}));
  const { email } = sendOtpSchema.parse(body); // Throws ValidationError if invalid

  // Normalize email
  const normalizedEmail = email.toLowerCase().trim();

  // Check if organization exists
  const orgs = await sql`
    SELECT id, name FROM organizations WHERE email = ${normalizedEmail}
  `;

  if (orgs.length === 0) {
    // Intentionally vague for security - don't reveal if email exists
    return ok(undefined, "If this email is registered, a code will be sent.");
  }

  // Generate and save OTP
  const code = generateOTP();
  await saveOTP(normalizedEmail, code);

  // Send OTP email - may throw DatabaseError or EmailError
  try {
    await sendOTPEmail(normalizedEmail, code, orgs[0].name);
  } catch (error) {
    // Log but don't expose email service errors to client
    console.error("Failed to send OTP email:", error);
    throw new Error("Failed to send OTP. Please try again later.");
  }

  return ok(undefined, "Login code sent. Check your email.");
});

/**
 * Example of more complex error handling
 * Uncomment and modify for your routes
 */

/*
export const DELETE = withErrorHandler(async (req: NextRequest) => {
  // Get authenticated user - throws UnauthorizedError if not logged in
  const user = await getAuthenticatedUser(req);
  if (!user) {
    throw new UnauthorizedError("You must be logged in to perform this action");
  }

  // Get and validate resource ID from query params
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  
  if (!id) {
    throw new ValidationError("Missing required parameter: id");
  }

  // Check if resource exists and user owns it
  const resource = await sql`SELECT * FROM resources WHERE id = ${id}`;
  if (!resource) {
    throw new NotFoundError("Resource");
  }

  if (resource.user_id !== user.id) {
    throw new ForbiddenError("You can only delete your own resources");
  }

  // Perform delete
  await sql`DELETE FROM resources WHERE id = ${id}`;

  return ok(undefined, "Resource deleted successfully");
});
*/
