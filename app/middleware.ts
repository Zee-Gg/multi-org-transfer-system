import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { authRateLimiter, transferRateLimiter, listRateLimiter, searchRateLimiter, recordRateLimitViolation } from "@/lib/ratelimit";
import { logAuditEvent, AuditEventType, getIpAddress } from "@/lib/logging";

const secret = () => new TextEncoder().encode(process.env.JWT_SECRET ?? "");

function addSecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-XSS-Protection", "1; mode=block");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return res;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip = getIpAddress(req.headers);

  // ── Rate limit auth endpoints ─────────────────────────────────────────────
  if (pathname.startsWith("/api/auth")) {
    const limit = await authRateLimiter.limit(ip);
    if (!limit.success) {
      await recordRateLimitViolation(ip, "auth");
      await logAuditEvent({
        eventType: AuditEventType.RATE_LIMITED,
        ipAddress: ip,
        action: "Auth endpoint rate limited",
        result: "failure",
        details: { remaining: limit.remaining },
      }).catch(() => {}); // Ignore logging errors

      return NextResponse.json(
        { success: false, error: "Too many requests. Try again in a minute." },
        { status: 429 }
      );
    }
  }

  // ── Rate limit transfer endpoint ──────────────────────────────────────────
  if (pathname.startsWith("/api/transfer")) {
    const limit = await transferRateLimiter.limit(ip);
    if (!limit.success) {
      await recordRateLimitViolation(ip, "transfer");
      await logAuditEvent({
        eventType: AuditEventType.RATE_LIMITED,
        ipAddress: ip,
        action: "Transfer endpoint rate limited",
        result: "failure",
        details: { remaining: limit.remaining },
      }).catch(() => {}); // Ignore logging errors

      return NextResponse.json(
        { success: false, error: "Too many transfer requests." },
        { status: 429 }
      );
    }
  }

  // ── Rate limit search endpoint ───────────────────────────────────────────
  if (pathname.startsWith("/api/rows/search")) {
    const limit = await searchRateLimiter.limit(ip);
    if (!limit.success) {
      await recordRateLimitViolation(ip, "search");
      return NextResponse.json(
        { success: false, error: "Too many search requests." },
        { status: 429 }
      );
    }
  }

  // ── Rate limit list endpoint ─────────────────────────────────────────────
  if (pathname.startsWith("/api/rows/list")) {
    const limit = await listRateLimiter.limit(ip);
    if (!limit.success) {
      await recordRateLimitViolation(ip, "list");
      return NextResponse.json(
        { success: false, error: "Too many requests." },
        { status: 429 }
      );
    }
  }

  // ── Protect dashboard routes ──────────────────────────────────────────────
  if (pathname.startsWith("/dashboard")) {
    const token = req.cookies.get("auth_token")?.value;

    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    try {
      const { payload } = await jwtVerify(token, secret());
      const orgSlug = payload.orgSlug as string;

      // Enforce org-slug routing: users can only access their own org's dashboard
      // Extract the slug from the path to enforce ownership
      const pathMatch = pathname.match(/^\/dashboard\/([^/]+)/);
      const requestedSlug = pathMatch?.[1];

      if (requestedSlug && requestedSlug !== orgSlug) {
        return NextResponse.redirect(new URL(`/dashboard/${orgSlug}`, req.url));
      }
    } catch {
      const res = NextResponse.redirect(new URL("/login", req.url));
      res.cookies.delete("auth_token");
      return addSecurityHeaders(res);
    }
  }

  // ── Redirect authenticated users away from login ──────────────────────────
  if (pathname === "/login" || pathname === "/") {
    const token = req.cookies.get("auth_token")?.value;
    if (token) {
      try {
        const { payload } = await jwtVerify(token, secret());
        const orgSlug = payload.orgSlug as string;
        return NextResponse.redirect(new URL(`/dashboard/${orgSlug}`, req.url));
      } catch {
        // Invalid token — let them through to login
      }
    }
  }

  return addSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/dashboard/:path*",
    "/api/auth/:path*",
    "/api/transfer/:path*",
    "/api/rows/:path*",
  ],
};