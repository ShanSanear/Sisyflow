import type { APIRoute } from "astro";
import type { AISuggestionSessionDTO } from "../../../types";
import { AnalyzeAiSuggestionsSchema } from "../../../lib/validation/ai.validation";
import { z } from "zod";
import {
  isZodError,
  isDatabaseConnectionError,
  createDatabaseConnectionErrorResponse,
  createZodValidationResponse,
} from "../../../lib/utils";

export const prerender = false;

/**
 * POST /api/ai-suggestion-sessions/analyze
 *
 * Returns dummy AI suggestions for testing purposes (OpenRouter integration commented out).
 * Previously: Generated AI suggestions for tickets based on title and description.
 * Currently: Returns static dummy data to enable testing without external API dependencies.
 * Wymaga uwierzytelnienia użytkownika.
 *
 * Request Body: { ticket_id: string, title: string, description?: string }
 * Response: 200 OK - { session_id: string, suggestions: Array<{ type: "INSERT"|"QUESTION", content: string, applied: boolean }> }
 * Error Responses: 400 Bad Request, 401 Unauthorized, 500 Internal Server Error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Sprawdź czy użytkownik jest uwierzytelniony
    if (!locals.user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Authentication required",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // TODO: Re-enable when OpenRouter API integration is needed for production
    // const userId = locals.user.id;
    // const supabase = createSupabaseServerInstance({
    //   cookies,
    //   headers: request.headers,
    // });

    // Parsuj ciało żądania
    let requestData: z.infer<typeof AnalyzeAiSuggestionsSchema>;
    try {
      requestData = await request.json();
    } catch (parseError) {
      console.error("JSON parsing error:", parseError);
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Invalid JSON in request body",
          details: parseError instanceof Error ? parseError.message : "Unknown parsing error",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Walidacja danych wejściowych
    const validation = AnalyzeAiSuggestionsSchema.safeParse(requestData);
    if (!validation.success) {
      return createZodValidationResponse(validation.error);
    }

    // Note: title and description not used for dummy data, but validated for API contract consistency

    // TODO: Re-enable when OpenRouter API integration is needed for production
    // Currently commented out to allow easier testing without API keys and external dependencies
    // const openRouterService = createOpenRouterService(supabase);
    // const suggestions = await openRouterService.getSuggestions({
    //   title,
    //   description,
    //   userId,
    // });

    // Return dummy AI suggestions for testing purposes
    // This allows testing the entire flow without requiring OpenRouter API calls
    const dummySuggestions = [
      {
        type: "INSERT" as const,
        content: "Consider adding more specific error messages to help users understand what went wrong.",
        applied: false,
      },
      {
        type: "QUESTION" as const,
        content: "Have you checked the browser console for additional error details?",
        applied: false,
      },
      {
        type: "INSERT" as const,
        content: "Add steps to reproduce the issue in the ticket description.",
        applied: false,
      },
      {
        type: "QUESTION" as const,
        content: "Is this issue occurring on all browsers or specific ones?",
        applied: false,
      },
      {
        type: "INSERT" as const,
        content: "Include information about the user's environment (OS, browser version, etc.).",
        applied: false,
      },
    ];

    // Utwórz obiekt sesji AI bez zapisywania do bazy danych
    const sessionResult: AISuggestionSessionDTO = {
      session_id: crypto.randomUUID(), // Generuj tymczasowe ID sesji
      ticket_id: requestData.ticket_id,
      suggestions: dummySuggestions,
    };

    return new Response(JSON.stringify(sessionResult), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error in /api/ai-suggestion-sessions/analyze:", error);

    // Sprawdź czy to błąd połączenia z bazą danych
    if (isDatabaseConnectionError(error)) {
      return createDatabaseConnectionErrorResponse("AI suggestions generation");
    }

    // Obsługa błędów walidacji Zod (choć większość walidacji już wykonana)
    if (isZodError(error)) {
      return createZodValidationResponse(error);
    }

    // Obsługa innych błędów
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "Failed to generate AI suggestions. Please try again later.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
