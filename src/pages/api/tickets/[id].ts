import type { APIRoute } from "astro";
import { createTicketService } from "../../../lib/services/ticket.service";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import type { FullTicketDTO, UpdateTicketCommand } from "../../../types";
import { ticketIdParamsSchema, updateTicketSchema } from "../../../lib/validation/ticket.validation";
import {
  isZodError,
  createZodValidationResponse,
  isDatabaseConnectionError,
  createDatabaseConnectionErrorResponse,
} from "../../../lib/utils";

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
export const GET: APIRoute = async ({ params, locals, cookies, request }) => {
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

    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

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

    // Sprawdź czy to błąd połączenia z bazą danych
    if (isDatabaseConnectionError(error)) {
      return createDatabaseConnectionErrorResponse("ticket retrieval");
    }

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

/**
 * PUT /api/tickets/[id]
 *
 * Aktualizuje istniejący ticket. Dostęp mają wyłącznie reporter zgłoszenia, przypisany użytkownik (assignee) lub administrator (ADMIN).
 * Wszystkie pola w żądaniu są opcjonalne, ale przynajmniej jedno pole musi zostać podane do aktualizacji.
 *
 * URL Params: id (UUID) - identyfikator ticketu
 * Request Body: UpdateTicketCommand - pola do aktualizacji (title, description, type)
 * Response: 200 OK - FullTicketDTO zawierający zaktualizowane dane ticketu
 * Error Responses: 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error
 */
export const PUT: APIRoute = async ({ params, request, locals, cookies }) => {
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

    // Parsuj i waliduj ciało żądania
    let requestBody: UpdateTicketCommand;
    try {
      requestBody = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Invalid JSON in request body",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Walidacja danych wejściowych używając Zod
    const validatedData = updateTicketSchema.parse(requestBody);

    // Utwórz ticket service i wywołaj metodę aktualizacji ticketu
    const ticketService = createTicketService(supabase);
    const updatedTicket: FullTicketDTO = await ticketService.updateTicket(ticketId, validatedData, userId);

    // Zwróć pomyślną odpowiedź z zaktualizowanym ticketem
    return new Response(JSON.stringify(updatedTicket), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error updating ticket:", error);

    // Sprawdź czy to błąd połączenia z bazą danych
    if (isDatabaseConnectionError(error)) {
      return createDatabaseConnectionErrorResponse("ticket update");
    }

    // Obsługa błędów walidacji Zod
    if (isZodError(error)) {
      return createZodValidationResponse(error);
    }

    // Obsługa błędów "access denied" (403 Forbidden)
    if (error instanceof Error && error.message === "Access denied: You don't have permission to update this ticket") {
      return new Response(
        JSON.stringify({
          error: "Forbidden",
          message: "You don't have permission to update this ticket",
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

    // Obsługa błędów "user profile not found" (403 Forbidden)
    if (error instanceof Error && error.message === "User profile not found") {
      return new Response(
        JSON.stringify({
          error: "Forbidden",
          message: "User profile not found - access denied",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Dla innych błędów
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
 * DELETE /api/tickets/[id]
 *
 * Usuwa istniejący ticket. Dostęp mają wyłącznie użytkownicy z rolą administratora (ADMIN).
 * Operacja jest nieodwracalna - usunięty ticket nie może zostać przywrócony.
 *
 * URL Params: id (UUID) - identyfikator ticketu do usunięcia
 * Request Body: Brak (DELETE request nie zawiera ciała żądania)
 * Response: 204 No Content - ticket został pomyślnie usunięty
 * Error Responses: 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error
 */
export const DELETE: APIRoute = async ({ params, locals, cookies, request }) => {
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

    // Utwórz ticket service i wywołaj metodę usunięcia ticketu
    const ticketService = createTicketService(supabase);
    await ticketService.deleteTicket(ticketId, userId);

    // Zwróć pomyślną odpowiedź bez treści (204 No Content)
    return new Response(null, {
      status: 204,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error deleting ticket:", error);

    // Sprawdź czy to błąd połączenia z bazą danych
    if (isDatabaseConnectionError(error)) {
      return createDatabaseConnectionErrorResponse("ticket deletion");
    }

    // Obsługa błędów walidacji Zod
    if (isZodError(error)) {
      return createZodValidationResponse(error);
    }

    // Obsługa błędów "access denied" (403 Forbidden)
    if (error instanceof Error && error.message === "Access denied: Only administrators can delete tickets") {
      return new Response(
        JSON.stringify({
          error: "Forbidden",
          message: "You don't have permission to delete tickets. Only administrators can perform this action.",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Obsługa błędów "user profile not found" (403 Forbidden)
    if (error instanceof Error && error.message === "User profile not found") {
      return new Response(
        JSON.stringify({
          error: "Forbidden",
          message: "User profile not found - access denied",
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

    // Dla innych błędów
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
