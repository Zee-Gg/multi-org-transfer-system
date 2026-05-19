import sql from "./db";
import crypto from "crypto";

const OTP_EXPIRY_MINUTES = 10;

export function generateOTP(): string {
  // Cryptographically secure 6-digit code
  const buffer = crypto.randomBytes(3);
  const num = buffer.readUIntBE(0, 3) % 1_000_000;
  return num.toString().padStart(6, "0");
}

export async function saveOTP(email: string, code: string): Promise<void> {
  // Normalize email to lowercase to ensure consistency
  const normalizedEmail = email.toLowerCase().trim();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Invalidate all previous unused OTPs for this email
  await sql`
    UPDATE otp_tokens
    SET used = TRUE
    WHERE email = ${normalizedEmail} AND used = FALSE
  `;

  await sql`
    INSERT INTO otp_tokens (email, code, expires_at)
    VALUES (${normalizedEmail}, ${code}, ${expiresAt})
  `;
}

export async function verifyOTP(email: string, code: string): Promise<boolean> {
  // Normalize email to lowercase to ensure consistency
  const normalizedEmail = email.toLowerCase().trim();
  // Trim code to remove any accidental whitespace
  const normalizedCode = code.trim();

  const rows = await sql`
    SELECT id
    FROM otp_tokens
    WHERE email      = ${normalizedEmail}
      AND code       = ${normalizedCode}
      AND used       = FALSE
      AND expires_at > NOW()
    LIMIT 1
  `;

  if (rows.length === 0) return false;

  // Mark as used immediately (single-use)
  await sql`
    UPDATE otp_tokens
    SET used = TRUE
    WHERE id = ${rows[0].id}
  `;

  return true;
}

export async function cleanExpiredOTPs(): Promise<void> {
  await sql`DELETE FROM otp_tokens WHERE expires_at < NOW() - INTERVAL '1 hour'`;
}