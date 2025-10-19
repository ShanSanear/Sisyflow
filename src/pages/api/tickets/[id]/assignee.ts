import type { APIRoute } from "astro";
import { createTicketService } from "../../../../lib/services/ticket.service";
import { createSupabaseServerInstance } from "../../../../db/supabase.client";
import type { UpdateTicketAssigneeCommand } from "../../../../types";
import { ticketIdParamsSchema } from "../../../../lib/validation/ticket.validation";
import {
  isZodError,
  createZodValidationResponse,
  isDatabaseConnectionError,
  createDatabaseConnectionErrorResponse,
} from "../../../../lib/utils";

export const prerender = false;

/**
 * PATCH /api/tickets/[id]/assignee
 *
 * Aktualizuje przypisanie ticketu (assignee).
 * Dostęp mają wyłącznie administratorzy systemu lub użytkownik dokonujący self-assignment.
 * Głównie przeznaczony dla operacji przypisywania ticketów w interfejsie zarządzania.
 *
 * Request Body: UpdateTicketAssigneeCommand { assignee_id: "uuid | null" }
 * Response: 200 OK - TicketDTO
 * Error Responses: 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error
 */
export const PATCH: APIRoute = async ({ request, params, locals, cookies }) => {
  try {
    // Walidacja parametrów URL używając Zod
    const validatedParams = ticketIdParamsSchema.parse(params);
    const ticketId = validatedParams.id;

    // Check if user is authenticated via middleware
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

    // Parsuj request body
    let requestData: UpdateTicketAssigneeCommand;
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

    // Utwórz ticket service i wywołaj metodę aktualizacji assignee'a
    const ticketService = createTicketService(supabase);
    const updatedTicket = await ticketService.updateTicketAssignee(ticketId, requestData, userId);

    // Zwróć pomyślną odpowiedź z zaktualizowanym ticketem
    return new Response(JSON.stringify(updatedTicket), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error updating ticket assignee:", error);

    // Sprawdź czy to błąd połączenia z bazą danych
    if (isDatabaseConnectionError(error)) {
      return createDatabaseConnectionErrorResponse("ticket assignee update");
    }

    // Obsługa błędów walidacji Zod
    if (isZodError(error)) {
      return createZodValidationResponse(error);
    }

    // Obsługa błędów autoryzacji (403 Forbidden)
    if (error instanceof Error && error.message.includes("Access denied")) {
      return new Response(
        JSON.stringify({
          error: "Forbidden",
          message: error.message,
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Obsługa błędów "ticket not found" (404 Not Found)
    if (error instanceof Error && error.message === "Ticket not found") {
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

    // Obsługa błędów "assignee not found" (404 Not Found)
    if (error instanceof Error && error.message === "Assignee not found") {
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Assignee not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Obsługa błędów "user profile not found" (401 Unauthorized - brak profilu)
    if (error instanceof Error && error.message === "User profile not found") {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "User authentication required",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Obsługa innych błędów
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
