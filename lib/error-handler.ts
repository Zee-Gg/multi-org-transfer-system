import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError, errorLogger, normalizeError } from "./errors";
import { handleAppError, handleUnknownError, zodError as formatZodError } from "./response";

/**
 * Wraps API route handlers with centralized error handling
 * Usage: export const POST = withErrorHandler(async (req) => { ... });
 */
export function withErrorHandler(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    try {
      return await handler(req);
    } catch (error) {
      // Handle Zod validation errors
      if (error instanceof ZodError) {
        errorLogger.warn(`Validation error: ${error.issues[0]?.message}`);
        return formatZodError(
          error.issues.map((issue) => ({
            message: `${issue.path.join(".")}: ${issue.message}`,
          }))
        );
      }

      // Handle custom AppErrors
      if (error instanceof AppError) {
        return handleAppError(error);
      }

      // Handle standard errors
      if (error instanceof Error) {
        errorLogger.error(`API Route Error: ${error.message}`, error, req.url);

        // Check for common error patterns
        if (error.message.includes("Invalid JSON")) {
          return formatZodError([{ message: "Invalid request body" }]);
        }

        if (error.message.includes("database") || error.message.includes("sql")) {
          return handleUnknownError(error, "Database operation failed");
        }

        return handleUnknownError(error, `API Error in ${req.url}`);
      }

      // Handle unknown error types
      errorLogger.error("Unknown error in API route", error, req.url);
      return handleUnknownError(error, `Unknown error in ${req.url}`);
    }
  };
}

/**
 * Middleware for request validation and error handling setup
 */
export function createErrorContext(req: NextRequest) {
  return {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries()),
    timestamp: new Date().toISOString(),
  };
}
