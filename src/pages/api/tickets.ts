import type { APIRoute } from "astro";
import { createTicketService } from "../../lib/services/ticket.service";
import type { CreateTicketCommand } from "../../types";
import { DEVELOPMENT_USER_ID, ATTACHMENT_LIMITS } from "../../lib/constants";

export const prerender = false;

/**
 * POST /api/tickets
 *
 * Tworzy nowy ticket w systemie.
 * Wymaga uwierzytelnienia użytkownika.
 *
 * Request Body: CreateTicketCommand
 * Response: 201 Created - FullTicketDTO
 * Error Responses: 400 Bad Request, 401 Unauthorized, 413 Payload Too Large, 500 Internal Server Error
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

    // Sprawdź limity załączników
    if (requestData.attachments && requestData.attachments.length > 0) {
      // Sprawdź liczbę załączników
      if (requestData.attachments.length > ATTACHMENT_LIMITS.MAX_PER_TICKET) {
        return new Response(
          JSON.stringify({
            error: "Payload Too Large",
            message: `Too many attachments. Maximum ${ATTACHMENT_LIMITS.MAX_PER_TICKET} allowed.`,
          }),
          {
            status: 413,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Sprawdź rozmiar każdego załącznika
      for (const attachment of requestData.attachments) {
        const size = attachment.content?.length || 0;
        if (size > ATTACHMENT_LIMITS.MAX_SIZE_PER_ATTACHMENT) {
          return new Response(
            JSON.stringify({
              error: "Payload Too Large",
              message: `Attachment "${attachment.filename}" exceeds size limit (${ATTACHMENT_LIMITS.MAX_SIZE_PER_ATTACHMENT / 1024}KB)`,
            }),
            {
              status: 413,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      }
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
    if (error && typeof error === "object" && "issues" in error) {
      const zodError = error as { issues: { message: string }[] };
      return new Response(
        JSON.stringify({
          error: "Validation Error",
          message: "Invalid request data",
          details: zodError.issues.map((issue) => issue.message),
        }),
        {
          status: 400,
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
