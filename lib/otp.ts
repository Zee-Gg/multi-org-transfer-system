import sql from "./db";
import crypto from "crypto";

const OTP_EXPIRY_MINUTES = 10;

export function generateOTP(): string {
  const buffer = crypto.randomBytes(3);
  const num = buffer.readUIntBE(0, 3) % 1_000_000;
  return num.toString().padStart(6, "0");
}

export async function saveOTP(userId: string, token: string): Promise<void> {
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Invalidate all previous unused OTPs for this user
  await sql`
    UPDATE otp_tokens
    SET used = TRUE
    WHERE user_id = ${userId} AND used = FALSE
  `;

  await sql`
    INSERT INTO otp_tokens (user_id, token, expires_at)
    VALUES (${userId}, ${token}, ${expiresAt})
  `;
}

export async function verifyOTP(userId: string, token: string): Promise<boolean> {
  const normalizedToken = token.trim();

  const rows = await sql`
    SELECT id
    FROM otp_tokens
    WHERE user_id  = ${userId}
      AND token    = ${normalizedToken}
      AND used     = FALSE
      AND expires_at > NOW()
    LIMIT 1
  `;

  if (rows.length === 0) return false;

  await sql`
    UPDATE otp_tokens
    SET used = TRUE
    WHERE id = ${rows[0].id}
  `;

  return true;
}

export async function cleanExpiredOTPs(): Promise<void> {
  await sql`
    DELETE FROM otp_tokens 
    WHERE expires_at < NOW() - INTERVAL '1 hour'
  `;
}