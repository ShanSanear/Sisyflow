import type { APIRoute } from "astro";
import { createAISuggestionSessionsService } from "../../../lib/services/aiSuggestionSession.service";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import { z } from "zod";
import {
  isZodError,
  createZodValidationResponse,
  isDatabaseConnectionError,
  createDatabaseConnectionErrorResponse,
} from "../../../lib/utils";

// Schema for saving AI suggestion session
const SaveAISuggestionSessionSchema = z.object({
  session_id: z.string().uuid(),
  ticket_id: z.string().uuid(),
  suggestions: z.array(
    z.object({
      type: z.enum(["INSERT", "QUESTION"]),
      content: z.string(),
      applied: z.boolean(),
    })
  ),
  rating: z.number().min(1).max(5).optional(),
});

export const prerender = false;

/**
 * POST /api/ai-suggestion-sessions
 *
 * Saves an AI suggestion session to the database after ticket creation/editing.
 * Requires authentication.
 *
 * Request Body: {
 *   session_id: string (UUID),
 *   ticket_id: string (UUID),
 *   suggestions: Array<{ type: "INSERT"|"QUESTION", content: string, applied: boolean }>,
 *   rating?: number (1-5)
 * }
 * Response: 201 Created - { session_id: string, ticket_id: string, suggestions: Array }
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
    let requestData: z.infer<typeof SaveAISuggestionSessionSchema>;
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
    const validation = SaveAISuggestionSessionSchema.safeParse(requestData);
    if (!validation.success) {
      return createZodValidationResponse(validation.error);
    }

    const { ticket_id, suggestions, rating } = validation.data;

    // Utwórz serwis AI suggestion sessions
    const aiSuggestionSessionsService = createAISuggestionSessionsService(supabase);

    // Zapisz sesję do bazy danych używając istniejącej metody createAISuggestionSession
    const savedSession = await aiSuggestionSessionsService.createAISuggestionSession(
      {
        ticket_id,
      },
      suggestions, // Przekaż sugestie bezpośrednio jako tablicę AiSuggestion
      userId
    );

    // Jeśli użytkownik ocenił sugestie, zaktualizuj ocenę
    if (rating !== undefined) {
      await aiSuggestionSessionsService.rateAISuggestionSession(savedSession.session_id, rating, userId);
    }

    return new Response(JSON.stringify(savedSession), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error in /api/ai-suggestion-sessions:", error);

    // Sprawdź czy to błąd połączenia z bazą danych
    if (isDatabaseConnectionError(error)) {
      return createDatabaseConnectionErrorResponse("AI suggestion session creation");
    }

    // Obsługa błędów walidacji Zod
    if (isZodError(error)) {
      return createZodValidationResponse(error);
    }

    // Obsługa innych błędów
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "Failed to save AI suggestion session. Please try again later.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
