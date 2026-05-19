import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = () => new TextEncoder().encode(process.env.JWT_SECRET ?? "");

// In-memory rate limiter (resets per cold start — good enough for serverless)
interface RateLimitEntry { count: number; reset: number }
const store = new Map<string, RateLimitEntry>();

function isRateLimited(key: string, max: number, windowMs: number): boolean {
  const now   = Date.now();
  const entry = store.get(key);
  if (!entry || now > entry.reset) {
    store.set(key, { count: 1, reset: now + windowMs });
    return false;
  }
  if (entry.count >= max) return true;
  entry.count++;
  return false;
}

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
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";

  // ── Rate limit auth endpoints ─────────────────────────────────────────────
  if (pathname.startsWith("/api/auth")) {
    if (isRateLimited(`auth:${ip}`, 10, 60_000)) {
      return NextResponse.json({ success: false, error: "Too many requests. Try again in a minute." }, { status: 429 });
    }
  }

  // ── Rate limit transfer endpoint ──────────────────────────────────────────
  if (pathname.startsWith("/api/transfer")) {
    if (isRateLimited(`transfer:${ip}`, 5, 60_000)) {
      return NextResponse.json({ success: false, error: "Too many transfer requests." }, { status: 429 });
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