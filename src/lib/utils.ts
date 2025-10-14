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
