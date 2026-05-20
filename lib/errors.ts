/**
 * Centralized error handling utilities
 * Provides custom error classes and error formatting for the application
 */

export enum ErrorCode {
  // Authentication errors
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  SESSION_EXPIRED = "SESSION_EXPIRED",

  // Validation errors
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_INPUT = "INVALID_INPUT",

  // Resource errors
  NOT_FOUND = "NOT_FOUND",
  ALREADY_EXISTS = "ALREADY_EXISTS",
  CONFLICT = "CONFLICT",

  // Server errors
  INTERNAL_ERROR = "INTERNAL_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  EMAIL_ERROR = "EMAIL_ERROR",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",

  // Rate limiting
  TOO_MANY_REQUESTS = "TOO_MANY_REQUESTS",

  // Unknown error
  UNKNOWN = "UNKNOWN",
}

export interface ErrorContext {
  code?: ErrorCode;
  statusCode?: number;
  message: string;
  context?: string;
  originalError?: Error;
  details?: Record<string, any>;
}

export class AppError extends Error {
  code: ErrorCode;
  statusCode: number;
  details: Record<string, any>;
  context?: string;

  constructor(errorContext: ErrorContext) {
    const { code = ErrorCode.UNKNOWN, statusCode = 500, message, context, details } = errorContext;
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.context = context;
    this.details = details || {};
    this.name = "AppError";

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super({
      code: ErrorCode.VALIDATION_ERROR,
      statusCode: 422,
      message,
      details,
    });
    this.name = "ValidationError";
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super({
      code: ErrorCode.NOT_FOUND,
      statusCode: 404,
      message: `${resource} not found.`,
    });
    this.name = "NotFoundError";
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized. Please log in.") {
    super({
      code: ErrorCode.UNAUTHORIZED,
      statusCode: 401,
      message,
    });
    this.name = "UnauthorizedError";
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Access denied.") {
    super({
      code: ErrorCode.FORBIDDEN,
      statusCode: 403,
      message,
    });
    this.name = "ForbiddenError";
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super({
      code: ErrorCode.CONFLICT,
      statusCode: 409,
      message,
    });
    this.name = "ConflictError";
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    const details: Record<string, any> = {};
    if (retryAfter) details.retryAfter = retryAfter;

    super({
      code: ErrorCode.TOO_MANY_REQUESTS,
      statusCode: 429,
      message: "Too many requests. Please try again later.",
      details,
    });
    this.name = "RateLimitError";
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, originalError?: Error) {
    super({
      code: ErrorCode.DATABASE_ERROR,
      statusCode: 500,
      message: "Database operation failed.",
      context: message,
      originalError,
      details: {
        isDatabaseError: true,
      },
    });
    this.name = "DatabaseError";
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

/**
 * Logger utility for error logging
 */
export const errorLogger = {
  log: (message: string, context?: string) => {
    console.log(`[${new Date().toISOString()}] ${message}`, context ? ` (${context})` : "");
  },

  error: (message: string, error?: Error | unknown, context?: string) => {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` (${context})` : "";
    console.error(`[${timestamp}] ERROR: ${message}${contextStr}`);

    if (error instanceof Error) {
      console.error(`  Error: ${error.message}`);
      if (error.stack) {
        console.error(`  Stack: ${error.stack}`);
      }
    } else if (error) {
      console.error(`  Details: ${JSON.stringify(error)}`);
    }
  },

  warn: (message: string, context?: string) => {
    console.warn(`[${new Date().toISOString()}] WARNING: ${message}`, context ? ` (${context})` : "");
  },
};

/**
 * Convert unknown errors to AppError
 */
export function normalizeError(error: unknown, fallbackMessage = "An unexpected error occurred."): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError({
      message: error.message || fallbackMessage,
      statusCode: 500,
      code: ErrorCode.INTERNAL_ERROR,
      originalError: error,
    });
  }

  return new AppError({
    message: fallbackMessage,
    statusCode: 500,
    code: ErrorCode.UNKNOWN,
  });
}
