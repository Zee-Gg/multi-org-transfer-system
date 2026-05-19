import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { SessionPayload } from "../types";

const COOKIE_NAME   = "auth_token";
const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours

function getSecret(): Uint8Array {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(process.env.JWT_SECRET);
}

export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function setSessionCookie(res: Response, token: string): void {
  // Used in route handlers via NextResponse
  (res as { cookies?: { set: (name: string, value: string, options: Record<string, unknown>) => void } }).cookies?.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export const AUTH_COOKIE = {
  name:     COOKIE_NAME,
  maxAge:   COOKIE_MAX_AGE,
  httpOnly: true,
  secure:   process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path:     "/",
};