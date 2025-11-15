import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { z } from "zod";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Sprawdza czy błąd jest błędem walidacji Zod
 * @param error Błąd do sprawdzenia
 * @returns true jeśli błąd pochodzi z walidacji Zod
 */
export function isZodError(error: unknown): error is z.ZodError {
  return error instanceof z.ZodError;
}

/**
 * Tworzy odpowiedź błędu walidacji Zod dla API
 * @param zodError Błąd walidacji Zod
 * @param message Opcjonalna wiadomość błędu (domyślnie "Invalid request data")
 * @returns Response object z błędem walidacji
 */
export function createZodValidationResponse(zodError: z.ZodError, message = "Invalid request data"): Response {
  return new Response(
    JSON.stringify({
      error: "Validation Error",
      message,
      details: zodError.issues.map((issue) => {
        // Create more informative error messages by including the field path
        const fieldPath = issue.path.length > 0 ? issue.path.join(".") : "unknown field";
        return `${fieldPath}: ${issue.message}`;
      }),
    }),
    {
      status: 400,
      headers: { "Content-Type": "application/json" },
    }
  );
}

/**
 * Interface for Supabase error objects
 */
interface SupabaseError {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
}

/**
 * Interface for network/connection errors
 */
interface NetworkError extends Error {
  cause?: Error;
  code?: string;
}

/**
 * Sprawdza czy błąd jest błędem połączenia z bazą danych
 * Wykrywa typowe błędy sieciowe i połączenia
 * @param error Błąd do sprawdzenia
 * @returns true jeśli błąd wskazuje na problem z połączeniem do bazy danych
 */
export function isDatabaseConnectionError(error: unknown): boolean {
  if (!error) return false;

  const networkError = error as NetworkError;

  // Sprawdź bezpośrednie właściwości błędu
  if (networkError.message?.includes("fetch failed")) return true;
  if (networkError.code === "ECONNREFUSED") return true;
  if (networkError.code === "ENOTFOUND") return true;
  if (networkError.code === "ETIMEDOUT") return true;
  if (networkError.code === "ENETUNREACH") return true;

  // Sprawdź cause (jeśli błąd jest opakowany)
  if (networkError.cause) {
    const cause = networkError.cause as NetworkError;
    if (cause.message?.includes("fetch failed")) return true;
    if (cause.code === "ECONNREFUSED") return true;
    if (cause.code === "ENOTFOUND") return true;
    if (cause.code === "ETIMEDOUT") return true;
    if (cause.code === "ENETUNREACH") return true;
  }

  // Sprawdź czy to błąd Supabase związany z połączeniem
  const supabaseError = error as SupabaseError;
  if (supabaseError.message?.includes("fetch failed")) return true;
  if (supabaseError.details?.includes("fetch failed")) return true;

  return false;
}

/**
 * Tworzy odpowiedź błędu połączenia z bazą danych dla API
 * @param operation Nazwa operacji która się nie powiodła
 * @returns Response object z błędem połączenia
 */
export function createDatabaseConnectionErrorResponse(operation: string): Response {
  return new Response(
    JSON.stringify({
      error: "Database Connection Error",
      message: `Failed to connect to database during ${operation}. Please check if the database is running and accessible.`,
    }),
    {
      status: 503, // Service Unavailable - bardziej odpowiedni dla problemów z bazą danych
      headers: { "Content-Type": "application/json" },
    }
  );
}

/**
 * Helper function to extract detailed error information from Supabase errors
 * Provides more context for debugging database issues
 */
export function extractSupabaseError(error: unknown, operation: string): Error {
  if (!error) return new Error(`${operation}: Unknown error`);

  // Extract available error properties
  const supabaseError = error as SupabaseError;
  const message = supabaseError.message || "No message provided";
  const code = supabaseError.code || "No code provided";
  const details = supabaseError.details || "No details provided";
  const hint = supabaseError.hint || "No hint provided";

  // Create a detailed error message
  const detailedMessage = [`${operation}: ${message}`, `Code: ${code}`, `Details: ${details}`, `Hint: ${hint}`].join(
    " | "
  );

  // Log a clean, readable error message
  if (isDatabaseConnectionError(error)) {
    console.error(`${operation} failed: Database connection refused`);
  } else {
    console.error(`Supabase Error in ${operation}: ${message}`);
  }

  return new Error(detailedMessage);
}

/**
 * Helper function to calculate pagination metadata
 * @param offset - Current offset in results
 * @param limit - Number of items per page
 * @param total - Total number of items
 * @returns Pagination metadata object
 */
export function calculatePagination(offset: number, limit: number, total: number) {
  const page = Math.floor(offset / limit) + 1;
  return {
    page,
    limit,
    total,
  };
}

/**
 * Generates a username from an email address
 * - Extracts the part before @
 * - Removes all non-alphanumeric characters
 * - Preserves original case
 * - Truncates to maxLength (default 12)
 * @param email - Email address to generate username from
 * @param maxLength - Maximum length of generated username (default 12)
 * @returns Generated username
 */
export function generateUsernameFromEmail(email: string, maxLength = 12): string {
  // Extract part before @
  const emailPrefix = email.split("@")[0];

  // Remove all non-alphanumeric characters, preserving case
  const sanitized = emailPrefix.replace(/[^a-zA-Z0-9]/g, "");

  // Truncate to maxLength
  const baseUsername = sanitized.slice(0, maxLength);

  // Ensure minimum length of 3 characters (database constraint)
  if (baseUsername.length < 3) {
    // If too short, pad with numbers
    const padded = baseUsername + "123".slice(0, 3 - baseUsername.length);
    return padded.slice(0, maxLength);
  }

  return baseUsername;
}

/**
 * Creates an ARIA live region announcement for screen readers
 * @param message - The message to announce
 * @param options - Configuration options
 * @param options.priority - "polite" (default) or "assertive" for urgency
 * @param options.role - "status" (default) or "alert" for the announcement type
 * @param options.duration - How long to keep the announcement in DOM (default: 1000ms)
 */
export function announceToScreenReader(
  message: string,
  options: {
    priority?: "polite" | "assertive";
    role?: "status" | "alert";
    duration?: number;
  } = {}
): void {
  const { priority = "polite", role = "status", duration = 1000 } = options;

  const announcement = document.createElement("div");
  announcement.setAttribute("role", role);
  announcement.setAttribute("aria-live", priority);
  announcement.setAttribute("aria-atomic", "true");
  announcement.className = "sr-only";
  announcement.textContent = message;
  document.body.appendChild(announcement);

  setTimeout(() => {
    if (document.body.contains(announcement)) {
      document.body.removeChild(announcement);
    }
  }, duration);
}
