import type { APIRoute } from "astro";
import { createTicketService } from "../../lib/services/ticket.service";
import type { CreateTicketCommand } from "../../types";
import { DEVELOPMENT_USER_ID } from "../../lib/constants";
import { isZodError, createZodValidationResponse } from "../../lib/utils";

export const prerender = false;

/**
 * GET /api/tickets
 *
 * Pobiera listę ticketów z opcjonalnym filtrowaniem, sortowaniem i paginacją.
 * Wymaga uwierzytelnienia użytkownika.
 *
 * Query Parameters: limit, offset, status, type, assignee_id, reporter_id, sort
 * Response: 200 OK - { tickets: TicketDTO[], pagination: PaginationDTO }
 * Error Responses: 400 Bad Request, 401 Unauthorized, 500 Internal Server Error
 */
export const GET: APIRoute = async ({ locals, url }) => {
  try {
    // Użyj stałego user ID dla developmentu
    // TODO: Zastąpić pełnym uwierzytelnieniem gdy będzie gotowe
    const supabase = locals.supabase;

    // Parsuj parametry query z URL
    const queryParams = Object.fromEntries(url.searchParams.entries());

    // Utwórz ticket service i wywołaj metodę
    const ticketService = createTicketService(supabase);
    const result = await ticketService.getTickets(queryParams);

    // Zwróć pomyślną odpowiedź
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching tickets:", error);

    // Obsługa błędów walidacji Zod
    if (isZodError(error)) {
      return createZodValidationResponse(error, "Invalid query parameters");
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

/**
 * POST /api/tickets
 *
 * Tworzy nowy ticket w systemie.
 * Wymaga uwierzytelnienia użytkownika.
 *
 * Request Body: CreateTicketCommand
 * Response: 201 Created - FullTicketDTO
 * Error Responses: 400 Bad Request, 401 Unauthorized, 500 Internal Server Error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Użyj stałego user ID dla developmentu
    // TODO: Zastąpić pełnym uwierzytelnieniem gdy będzie gotowe
    const userId = DEVELOPMENT_USER_ID;
    const supabase = locals.supabase;

    // Parsuj request body
    let requestData: CreateTicketCommand;
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

    // Utwórz ticket service i wywołaj metodę
    const ticketService = createTicketService(supabase);
    const ticket = await ticketService.createTicket(requestData, userId);

    // Zwróć pomyślną odpowiedź
    return new Response(JSON.stringify(ticket), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
        Location: `/api/tickets/${ticket.id}`,
      },
    });
  } catch (error) {
    console.error("Error creating ticket:", error);

    // Obsługa błędów walidacji Zod
    if (isZodError(error)) {
      return createZodValidationResponse(error);
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
