import { NextResponse } from "next/server";
import type { ApiSuccess, ApiError } from "../types";
import { AppError, errorLogger } from "./errors";

export function ok<T>(data?: T, message?: string, status = 200) {
  const body: ApiSuccess<T> = { success: true, ...(data !== undefined && { data }), ...(message && { message }) };
  return NextResponse.json(body, { status });
}

export function created<T>(data: T, message?: string) {
  return ok(data, message, 201);
}

export function err(error: string, status = 400, code?: string) {
  const body: ApiError = { success: false, error, ...(code && { code }) };
  return NextResponse.json(body, { status });
}

/**
 * Handle AppError with consistent response format
 */
export function handleAppError(error: AppError) {
  errorLogger.error(error.message, error, error.context);
  
  const body: { success: false; error: string; code: string; details?: unknown } = {
    success: false,
    error: error.message,
    code: error.code,
  };

  // Include details in development
  if (process.env.NODE_ENV === "development" && error.details && Object.keys(error.details).length > 0) {
    body.details = error.details;
  }

  return NextResponse.json(body, { status: error.statusCode });
}

/**
 * Handle unknown errors
 */
export function handleUnknownError(error: unknown, context?: string) {
  errorLogger.error("Unknown error occurred", error, context);

  return err("An unexpected error occurred.", 500, "INTERNAL_ERROR");
}

export function unauthorized() {
  return err("Unauthorized. Please log in.", 401, "UNAUTHORIZED");
}

export function forbidden() {
  return err("Access denied.", 403, "FORBIDDEN");
}

export function notFound(resource = "Resource") {
  return err(`${resource} not found.`, 404, "NOT_FOUND");
}

export function tooManyRequests() {
  return err("Too many requests. Please try again later.", 429, "TOO_MANY_REQUESTS");
}

export function serverError(context?: string) {
  if (context) errorLogger.error("Server error", new Error(context), context);
  return err("An unexpected error occurred.", 500, "INTERNAL_ERROR");
}

export function zodError(errors: { message: string }[]) {
  return err(errors[0]?.message ?? "Validation failed.", 422, "VALIDATION_ERROR");
}

export function conflict(message: string) {
  return err(message, 409, "CONFLICT");
}

export function alreadyExists(resource = "Resource") {
  return err(`${resource} already exists.`, 409, "ALREADY_EXISTS");
}