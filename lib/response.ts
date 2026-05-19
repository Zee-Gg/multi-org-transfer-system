import { NextResponse } from "next/server";
import type { ApiSuccess, ApiError } from "../types";

export function ok<T>(data?: T, message?: string, status = 200) {
  const body: ApiSuccess<T> = { success: true, ...(data !== undefined && { data }), ...(message && { message }) };
  return NextResponse.json(body, { status });
}

export function created<T>(data: T, message?: string) {
  return ok(data, message, 201);
}

export function err(error: string, status = 400) {
  const body: ApiError = { success: false, error };
  return NextResponse.json(body, { status });
}

export function unauthorized() {
  return err("Unauthorized. Please log in.", 401);
}

export function forbidden() {
  return err("Access denied.", 403);
}

export function notFound(resource = "Resource") {
  return err(`${resource} not found.`, 404);
}

export function tooManyRequests() {
  return err("Too many requests. Please try again later.", 429);
}

export function serverError(context?: string) {
  if (context) console.error(`[server-error] ${context}`);
  return err("An unexpected error occurred.", 500);
}

export function zodError(errors: { message: string }[]) {
  return err(errors[0]?.message ?? "Validation failed.", 422);
}