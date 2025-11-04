import type { APIRoute } from "astro";
import { createAISuggestionSessionsService } from "../../../../lib/services/ai-suggestion-sessions.service";
import { createSupabaseServerInstance } from "../../../../db/supabase.client";
import { updateAISuggestionSessionTicketIdSchema } from "../../../../lib/validation/schemas/ai";
import {
  isZodError,
  createZodValidationResponse,
  isDatabaseConnectionError,
  createDatabaseConnectionErrorResponse,
} from "../../../../lib/utils";
import {
  AISuggestionSessionNotFoundError,
  AISuggestionSessionAccessDeniedError,
  TicketNotFoundError,
} from "../../../../lib/services/ai-suggestion-sessions.service";

export const prerender = false;

/**
 * PATCH /api/ai-suggestion-sessions/[id]/ticket-id
 *
 * Aktualizuje identyfikator ticketu w istniejącej sesji sugestii AI.
 * Wymaga uwierzytelnienia użytkownika i własności sesji.
 *
 * Request Body: { ticket_id: string (UUID) }
 * Response: 200 OK - Empty response body
 * Error Responses: 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error
 */
export const PATCH: APIRoute = async ({ request, locals, params, cookies }) => {
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

    let requestData: { ticket_id: string };
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
    const validation = updateAISuggestionSessionTicketIdSchema.safeParse(requestData);
    if (!validation.success) {
      return createZodValidationResponse(validation.error);
    }

    // Utwórz serwis AI suggestion sessions i zaktualizuj ticket_id
    const aiSuggestionSessionsService = createAISuggestionSessionsService(supabase);
    await aiSuggestionSessionsService.updateAISuggestionSessionTicketId(sessionId, validation.data, userId);

    // Zwróć pustą odpowiedź przy sukcesie
    return new Response(null, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error in PATCH /api/ai-suggestion-sessions/[id]/ticket-id:", error);

    // Sprawdź czy to błąd połączenia z bazą danych
    if (isDatabaseConnectionError(error)) {
      return createDatabaseConnectionErrorResponse("AI suggestion session ticket ID update");
    }

    // Obsługa błędów walidacji Zod
    if (isZodError(error)) {
      return createZodValidationResponse(error);
    }

    // Obsługa specyficznych błędów serwisu z typowanych klas błędów
    if (error instanceof AISuggestionSessionNotFoundError) {
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

    if (error instanceof AISuggestionSessionAccessDeniedError) {
      return new Response(
        JSON.stringify({
          error: "Forbidden",
          message: "You don't have permission to modify this AI suggestion session",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (error instanceof TicketNotFoundError) {
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Ticket not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Obsługa innych błędów
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "Failed to update AI suggestion session ticket ID. Please try again later.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
