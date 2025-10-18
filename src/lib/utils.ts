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
