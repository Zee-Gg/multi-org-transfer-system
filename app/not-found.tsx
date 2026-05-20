import { NextResponse } from "next/server";

/**
 * Global not found page
 */
export default function NotFound() {
  return new NextResponse(
    JSON.stringify({
      success: false,
      error: "Page not found",
      code: "NOT_FOUND",
      statusCode: 404,
    }),
    { status: 404, headers: { "content-type": "application/json" } }
  );
}
