import { NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";
import { ok } from "@/lib/response";

export async function POST() {
  const res = NextResponse.json({ success: true, message: "Logged out." });
  res.cookies.delete(AUTH_COOKIE.name);
  return res;
}