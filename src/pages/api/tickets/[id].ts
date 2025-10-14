import type { APIRoute } from "astro";
import { createTicketService } from "../../../lib/services/ticket.service";
import type { FullTicketDTO } from "../../../types";
import { DEVELOPMENT_USER_ID } from "../../../lib/constants";
import { ticketIdParamsSchema } from "../../../lib/validation/ticket.validation";
import { isZodError, createZodValidationResponse } from "../../../lib/utils";

export const prerender = false;

/**
 * GET /api/tickets/[id]
 *
 * Pobiera pojedynczy ticket wraz z kompletnymi informacjami o reporterze i przypisanym użytkowniku.
 * Endpoint wymaga autoryzacji, ale każdy zalogowany użytkownik może czytać wszystkie tickety.
 *
 * URL Params: id (UUID) - identyfikator ticketu
 * Response: 200 OK - FullTicketDTO
 * Error Responses: 400 Bad Request, 401 Unauthorized, 404 Not Found, 500 Internal Server Error
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Walidacja parametrów URL używając Zod
    const validatedParams = ticketIdParamsSchema.parse(params);
    const ticketId = validatedParams.id;

    // Użyj stałego user ID dla developmentu
    // TODO: Zastąpić pełnym uwierzytelnieniem gdy będzie gotowe
    const userId = DEVELOPMENT_USER_ID;
    const supabase = locals.supabase;

    // Sprawdź czy użytkownik jest uwierzytelniony (prosta weryfikacja dla developmentu)
    if (!userId) {
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

    // Utwórz ticket service i wywołaj metodę pobrania ticketu
    const ticketService = createTicketService(supabase);
    const ticket: FullTicketDTO = await ticketService.getTicketById(ticketId);

    // Zwróć pomyślną odpowiedź z ticketem
    return new Response(JSON.stringify(ticket), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching ticket:", error);

    // Obsługa błędów walidacji Zod
    if (isZodError(error)) {
      return createZodValidationResponse(error);
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
