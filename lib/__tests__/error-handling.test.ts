/**
 * Error Handling Test Examples
 * 
 * This file demonstrates how to test API routes with the error handling system
 * and verify error boundaries are working correctly.
 * 
 * Run with: npm test
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  UnauthorizedError,
  ValidationError,
  NotFoundError,
  DatabaseError,
  errorLogger,
} from "@/lib/errors";
import { withErrorHandler } from "@/lib/error-handler";
import { ok } from "@/lib/response";

describe("Error Handling System", () => {
  describe("Custom Error Classes", () => {
    it("should create UnauthorizedError with 401 status", () => {
      const error = new UnauthorizedError("Custom message");
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe("Custom message");
      expect(error.code).toBe("UNAUTHORIZED");
    });

    it("should create ValidationError with 422 status", () => {
      const error = new ValidationError("Invalid email", { field: "email" });
      expect(error.statusCode).toBe(422);
      expect(error.message).toBe("Invalid email");
      expect(error.details.field).toBe("email");
    });

    it("should create NotFoundError with 404 status", () => {
      const error = new NotFoundError("User");
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe("User not found.");
    });

    it("should convert to JSON", () => {
      const error = new ValidationError("Test error", { field: "test" });
      const json = error.toJSON();
      expect(json.code).toBe("VALIDATION_ERROR");
      expect(json.message).toBe("Test error");
      expect(json.statusCode).toBe(422);
    });
  });

  describe("withErrorHandler Middleware", () => {
    it("should catch thrown AppErrors and return formatted response", async () => {
      const handler = withErrorHandler(async (req) => {
        throw new UnauthorizedError("Test error");
      });

      const req = new NextRequest("http://localhost/api/test", {
        method: "POST",
      });

      const response = await handler(req);
      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.code).toBe("UNAUTHORIZED");
      expect(data.error).toBe("Test error");
    });

    it("should catch standard Error and return 500", async () => {
      const handler = withErrorHandler(async (req) => {
        throw new Error("Unexpected error");
      });

      const req = new NextRequest("http://localhost/api/test", {
        method: "POST",
      });

      const response = await handler(req);
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.code).toBe("INTERNAL_ERROR");
    });

    it("should allow successful responses to pass through", async () => {
      const handler = withErrorHandler(async (req) => {
        return ok({ id: 1, name: "Test" }, "Success");
      });

      const req = new NextRequest("http://localhost/api/test", {
        method: "POST",
      });

      const response = await handler(req);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toEqual({ id: 1, name: "Test" });
      expect(data.message).toBe("Success");
    });

    it("should handle validation errors gracefully", async () => {
      const handler = withErrorHandler(async (req) => {
        throw new ValidationError("Invalid input", {
          field: "email",
          reason: "Must be valid email",
        });
      });

      const req = new NextRequest("http://localhost/api/test", {
        method: "POST",
      });

      const response = await handler(req);
      expect(response.status).toBe(422);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("Error Logger", () => {
    beforeEach(() => {
      vi.spyOn(console, "log").mockImplementation(() => {});
      vi.spyOn(console, "error").mockImplementation(() => {});
      vi.spyOn(console, "warn").mockImplementation(() => {});
    });

    it("should log messages with context", () => {
      errorLogger.log("Test message", "test-context");
      expect(console.log).toHaveBeenCalled();
    });

    it("should log errors with stack traces", () => {
      const error = new Error("Test error");
      errorLogger.error("Something failed", error, "test-context");
      expect(console.error).toHaveBeenCalled();
    });

    it("should log warnings", () => {
      errorLogger.warn("Warning message", "test-context");
      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe("Integration Tests", () => {
    it("should handle database errors properly", async () => {
      const handler = withErrorHandler(async (req) => {
        throw new DatabaseError("Query failed", new Error("Connection timeout"));
      });

      const req = new NextRequest("http://localhost/api/test", {
        method: "POST",
      });

      const response = await handler(req);
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.code).toBe("DATABASE_ERROR");
    });

    it("should preserve error context through error handler", async () => {
      const handler = withErrorHandler(async (req) => {
        const error = new ValidationError("Invalid email format", {
          field: "email",
          expectedFormat: "user@example.com",
          received: "invalid-email",
        });
        throw error;
      });

      const req = new NextRequest("http://localhost/api/test", {
        method: "POST",
      });

      const response = await handler(req);
      const data = await response.json();

      // In development, details should be included
      if (process.env.NODE_ENV === "development") {
        expect(data.details).toBeDefined();
        expect(data.details.field).toBe("email");
      }
    });
  });
});

/**
 * Component Error Boundary Tests
 * 
 * Testing error boundaries requires a test framework like Vitest or Jest
 * with React testing utilities
 */

/*
describe("ClientErrorBoundary", () => {
  it("should catch and display errors", () => {
    // Implementation depends on your test setup
    // See React Testing Library documentation
  });

  it("should display custom fallback UI", () => {
    // Implementation depends on your test setup
  });

  it("should call onError callback", () => {
    // Implementation depends on your test setup
  });
});
*/
