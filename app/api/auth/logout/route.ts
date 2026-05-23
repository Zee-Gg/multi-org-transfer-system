import { NextResponse, NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { AUTH_COOKIE } from "@/lib/auth";
import { serverError, unauthorized } from "@/lib/response";
import { logAuditEvent, AuditEventType, getIpAddress } from "@/lib/logging";

export async function POST(req: NextRequest) {
  const ipAddress = getIpAddress(req.headers);
  
  try {
    const session = await getSession();
    if (!session) {
      // Log unauthorized logout attempt
      await logAuditEvent({
        eventType: AuditEventType.UNAUTHORIZED_ACCESS,
        email: "unknown",
        ipAddress,
        action: "Logout attempted without session",
        result: "failure",
        errorMessage: "No active session",
      }).catch(() => {});

      return unauthorized();
    }

    // Log successful logout
    await logAuditEvent({
      eventType: AuditEventType.AUTH_LOGOUT,
      email: session.email,
      orgId: session?.orgId ? String(session.orgId) : undefined,
      ipAddress,
      action: "User logged out",
      result: "success",
      details: { orgName: session.orgName },
    }).catch(() => {});

    const res = NextResponse.json({ success: true, message: "Logged out." });
    res.cookies.delete(AUTH_COOKIE.name);
    return res;
  } catch (e) {
    // Log system errors
    const session = await getSession().catch(() => null);
    await logAuditEvent({
      eventType: AuditEventType.SYSTEM_ERROR,
      email: session?.email,
      orgId: session?.orgId ? String(session.orgId) : undefined,
      ipAddress,
      action: "logout error",
      result: "failure",
      errorMessage: e instanceof Error ? e.message : String(e),
    }).catch(() => {});

    return serverError(`logout: ${e}`);
  }
}