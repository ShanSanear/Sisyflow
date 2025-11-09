import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import {
  cn,
  isZodError,
  createZodValidationResponse,
  isDatabaseConnectionError,
  createDatabaseConnectionErrorResponse,
  extractSupabaseError,
  calculatePagination,
} from "./utils";

// Mock console.error for extractSupabaseError tests
const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {
  // Empty function for mocking
});

describe("utils", () => {
  describe("cn", () => {
    it("should merge class names correctly", () => {
      expect(cn("bg-red-500", "text-white")).toBe("bg-red-500 text-white");
    });

    it("should handle conditional classes", () => {
      const isActive = true;
      const isInactive = false;
      expect(cn("base", isActive && "active", isInactive && "inactive")).toBe("base active");
    });

    it("should resolve Tailwind conflicts", () => {
      expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500");
    });

    it("should handle arrays and objects", () => {
      expect(cn(["bg-red", "text-white"], { "text-black": false, "font-bold": true })).toBe(
        "bg-red text-white font-bold"
      );
    });

    it("should handle empty inputs", () => {
      expect(cn()).toBe("");
      expect(cn("", null, undefined)).toBe("");
    });
  });

  describe("isZodError", () => {
    it("should return true for ZodError instances", () => {
      const schema = z.string().min(1);
      try {
        schema.parse("");
      } catch (error) {
        expect(isZodError(error)).toBe(true);
      }
    });

    it("should return false for non-ZodError instances", () => {
      expect(isZodError(new Error("regular error"))).toBe(false);
      expect(isZodError("string error")).toBe(false);
      expect(isZodError(null)).toBe(false);
      expect(isZodError(undefined)).toBe(false);
    });
  });

  describe("createZodValidationResponse", () => {
    it("should create a Response with correct structure and status", async () => {
      const schema = z.object({ name: z.string().min(1) });
      try {
        schema.parse({ name: "" });
      } catch (zodError) {
        if (isZodError(zodError)) {
          const response = createZodValidationResponse(zodError);
          expect(response.status).toBe(400);
          expect(response.headers.get("Content-Type")).toBe("application/json");

          // Test JSON content
          const data = await response.json();
          expect(data.error).toBe("Validation Error");
          expect(data.message).toBe("Invalid request data");
          expect(Array.isArray(data.details)).toBe(true);
          expect(data.details.length).toBeGreaterThan(0);
          // Check that details include field path
          expect(data.details[0]).toContain("name:");
        }
      }
    });

    it("should use custom message when provided", async () => {
      const schema = z.string().min(1);
      try {
        schema.parse("");
      } catch (zodError) {
        if (isZodError(zodError)) {
          const response = createZodValidationResponse(zodError, "Custom validation failed");
          const data = await response.json();
          expect(data.message).toBe("Custom validation failed");
          // Check that details include field path for top-level validation
          expect(data.details[0]).toContain("unknown field:");
        }
      }
    });

    it("should format field paths correctly in error messages", async () => {
      const schema = z.object({
        title: z.string().min(1),
        user: z.object({
          name: z.string().min(1),
          age: z.number().min(18),
        }),
      });
      try {
        schema.parse({
          title: "", // invalid
          user: {
            name: "", // invalid
            age: 16, // invalid
          },
        });
      } catch (zodError) {
        if (isZodError(zodError)) {
          const response = createZodValidationResponse(zodError);
          const data = await response.json();

          expect(data.details).toContain("title: String must contain at least 1 character(s)");
          expect(data.details).toContain("user.name: String must contain at least 1 character(s)");
          expect(data.details).toContain("user.age: Number must be greater than or equal to 18");
        }
      }
    });
  });

  describe("isDatabaseConnectionError", () => {
    it("should detect fetch failed errors", () => {
      const error = new Error("fetch failed");
      expect(isDatabaseConnectionError(error)).toBe(true);
    });

    it("should detect network error codes", () => {
      const errors = [{ code: "ECONNREFUSED" }, { code: "ENOTFOUND" }, { code: "ETIMEDOUT" }, { code: "ENETUNREACH" }];

      errors.forEach((error) => {
        expect(isDatabaseConnectionError(error)).toBe(true);
      });
    });

    it("should detect nested cause errors", () => {
      const error = new Error("Wrapper error");
      error.cause = new Error("fetch failed");
      expect(isDatabaseConnectionError(error)).toBe(true);

      const errorWithCode = new Error("Wrapper error");
      errorWithCode.cause = { code: "ECONNREFUSED" };
      expect(isDatabaseConnectionError(errorWithCode)).toBe(true);
    });

    it("should detect Supabase connection errors", () => {
      const error = { message: "fetch failed", details: "fetch failed" };
      expect(isDatabaseConnectionError(error)).toBe(true);
    });

    it("should return false for non-connection errors", () => {
      expect(isDatabaseConnectionError(new Error("Validation error"))).toBe(false);
      expect(isDatabaseConnectionError({ code: "SOME_OTHER_CODE" })).toBe(false);
      expect(isDatabaseConnectionError(null)).toBe(false);
      expect(isDatabaseConnectionError({})).toBe(false);
    });
  });

  describe("createDatabaseConnectionErrorResponse", () => {
    it("should create a Response with correct structure and status", async () => {
      const response = createDatabaseConnectionErrorResponse("user query");

      expect(response.status).toBe(503);
      expect(response.headers.get("Content-Type")).toBe("application/json");

      const data = await response.json();
      expect(data.error).toBe("Database Connection Error");
      expect(data.message).toContain("Failed to connect to database during user query");
      expect(data.message).toContain("Please check if the database is running and accessible");
    });
  });

  describe("extractSupabaseError", () => {
    it("should extract error details and log them", () => {
      const mockError = {
        message: "Test message",
        code: "TEST_CODE",
        details: "Test details",
        hint: "Test hint",
      };

      consoleErrorSpy.mockClear();
      const result = extractSupabaseError(mockError, "testOperation");

      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain("testOperation: Test message");
      expect(result.message).toContain("Code: TEST_CODE");
      expect(result.message).toContain("Details: Test details");
      expect(result.message).toContain("Hint: Test hint");

      expect(consoleErrorSpy).toHaveBeenCalledWith("Supabase Error in testOperation:", expect.any(Object));
    });

    it("should handle missing error properties with defaults", () => {
      const result = extractSupabaseError({}, "testOperation");

      expect(result.message).toContain("No message provided");
      expect(result.message).toContain("No code provided");
      expect(result.message).toContain("No details provided");
      expect(result.message).toContain("No hint provided");
    });

    it("should handle null/undefined error", () => {
      const result = extractSupabaseError(null, "testOperation");
      expect(result.message).toBe("testOperation: Unknown error");
    });
  });

  describe("calculatePagination", () => {
    it("should calculate page correctly for first page", () => {
      const result = calculatePagination(0, 10, 100);
      expect(result).toEqual({ page: 1, limit: 10, total: 100 });
    });

    it("should calculate page correctly for subsequent pages", () => {
      expect(calculatePagination(10, 10, 100)).toEqual({ page: 2, limit: 10, total: 100 });
      expect(calculatePagination(20, 10, 100)).toEqual({ page: 3, limit: 10, total: 100 });
      expect(calculatePagination(25, 10, 100)).toEqual({ page: 3, limit: 10, total: 100 }); // 25/10 = 2.5 -> floor(2.5)+1 = 3
    });

    it("should handle edge cases", () => {
      expect(calculatePagination(0, 5, 0)).toEqual({ page: 1, limit: 5, total: 0 });
      expect(calculatePagination(0, 1, 1)).toEqual({ page: 1, limit: 1, total: 1 });
    });
  });
});
