import type { APIRoute } from "astro";
import { createAISuggestionSessionsService } from "../../../../lib/services/ai-suggestion-sessions.service";
import { createSupabaseServerInstance } from "../../../../db/supabase.client";
import { rateAiSuggestionSchema } from "../../../../lib/validation/schemas/ai";
import {
  isZodError,
  createZodValidationResponse,
  isDatabaseConnectionError,
  createDatabaseConnectionErrorResponse,
} from "../../../../lib/utils";

export const prerender = false;

/**
 * PUT /api/ai-suggestion-sessions/[id]/rating
 *
 * Aktualizuje ocenę sesji sugestii AI.
 * Wymaga uwierzytelnienia użytkownika i własności sesji.
 *
 * Request Body: { rating: number (1-5) }
 * Response: 200 OK - { session_id: string, suggestions: Array<{ type: "INSERT"|"QUESTION", content: string, applied: boolean }> }
 * Error Responses: 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error
 */
export const PUT: APIRoute = async ({ request, locals, params, cookies }) => {
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
    const sessionId = params.id;

    if (!sessionId) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Session ID is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    let requestData: { rating: number };
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
    const validation = rateAiSuggestionSchema.safeParse(requestData);
    if (!validation.success) {
      return createZodValidationResponse(validation.error);
    }

    // Utwórz serwis AI suggestion sessions i zaktualizuj ocenę
    const aiSuggestionSessionsService = createAISuggestionSessionsService(supabase);
    const sessionResult = await aiSuggestionSessionsService.rateAISuggestionSession(
      sessionId,
      validation.data.rating,
      userId
    );

    return new Response(JSON.stringify(sessionResult), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error in PUT /api/ai-suggestion-sessions/[id]/rating:", error);

    // Sprawdź czy to błąd połączenia z bazą danych
    if (isDatabaseConnectionError(error)) {
      return createDatabaseConnectionErrorResponse("AI suggestion session rating");
    }

    // Obsługa błędów walidacji Zod
    if (isZodError(error)) {
      return createZodValidationResponse(error);
    }

    // Sprawdź czy to błąd dostępu lub nieznalezienia
    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return new Response(
          JSON.stringify({
            error: "Not Found",
            message: "AI suggestion session not found",
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (error.message.includes("Access denied")) {
        return new Response(
          JSON.stringify({
            error: "Forbidden",
            message: "You don't have permission to rate this AI suggestion session",
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Obsługa innych błędów
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "Failed to rate AI suggestion session. Please try again later.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
