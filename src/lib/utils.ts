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
      details: zodError.issues.map((issue) => issue.message),
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

  // Log the full error for debugging (in development)
  console.error(`Supabase Error in ${operation}:`, {
    message,
    code,
    details,
    hint,
    fullError: error,
  });

  return new Error(detailedMessage);
}
