import type { APIRoute } from "astro";
import { createOpenRouterService } from "../../../lib/services/OpenRouterService";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import { AnalyzeAiSuggestionsSchema } from "../../../lib/validation/ai.validation";
import { z } from "zod";
import {
  isZodError,
  createZodValidationResponse,
  isDatabaseConnectionError,
  createDatabaseConnectionErrorResponse,
} from "../../../lib/utils";

export const prerender = false;

/**
 * POST /api/ai-suggestion-sessions/analyze
 *
 * Generuje sugestie AI dla zgłoszenia na podstawie tytułu i opisu.
 * Wymaga uwierzytelnienia użytkownika.
 *
 * Request Body: { title: string, description?: string }
 * Response: 200 OK - { session_id: string, suggestions: Array<{ type: "INSERT"|"QUESTION", content: string, applied: boolean }> }
 * Error Responses: 400 Bad Request, 401 Unauthorized, 500 Internal Server Error
 */
export const POST: APIRoute = async ({ request, locals, cookies }) => {
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

    const userId = locals.user.id;
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

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

    const { title, description } = validation.data;

    // Utwórz serwis OpenRouter i wywołaj metodę
    const openRouterService = createOpenRouterService(supabase);
    const suggestions = await openRouterService.getSuggestions({
      title,
      description,
      userId,
    });

    // TODO: Zaimplementować zapis sesji i sugestii do bazy danych
    const sessionId = "generowane-uuid"; // Tymczasowe rozwiązanie

    // Przygotuj odpowiedź z sugestiami
    const response = {
      session_id: sessionId,
      suggestions: suggestions.suggestions.map((suggestion) => ({
        ...suggestion,
        applied: false, // Domyślnie sugestie nie są zastosowane
      })),
    };

    return new Response(JSON.stringify(response), {
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
