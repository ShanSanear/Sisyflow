import type { APIRoute } from "astro";
import {
  createProjectDocumentationService,
  AccessDeniedError,
  UserProfileNotFoundError,
} from "../../../lib/services/projectDocumentation.service";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import type { UpdateProjectDocumentationCommand, ProjectDocumentationDTO } from "../../../types";
import { updateProjectDocumentationSchema } from "../../../lib/validation/schemas/projectDocumentation";
import {
  isZodError,
  createZodValidationResponse,
  isDatabaseConnectionError,
  createDatabaseConnectionErrorResponse,
} from "../../../lib/utils";

export const prerender = false;

/**
 * PUT /api/project-documentation
 *
 * Aktualizuje dokumentację projektu używaną jako kontekst dla AI. Endpoint obsługuje tylko jeden rekord dokumentacji projektu. Dostęp jest ograniczony wyłącznie do użytkowników z rolą ADMIN.
 *
 * Request Body: UpdateProjectDocumentationCommand - nowa treść dokumentacji projektu
 * Response: 200 OK - ProjectDocumentationDTO zawierający zaktualizowaną dokumentację wraz z informacjami o użytkowniku
 * Error Responses: 400 Bad Request, 401 Unauthorized, 403 Forbidden, 500 Internal Server Error
 */
export const PUT: APIRoute = async ({ request, locals, cookies }) => {
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

    const currentUserId = locals.user.id;
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Parsuj i waliduj ciało żądania
    let requestBody: UpdateProjectDocumentationCommand;
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
    const validatedData = updateProjectDocumentationSchema.parse(requestBody);

    // Utwórz service i wywołaj metodę aktualizacji dokumentacji
    const projectDocumentationService = createProjectDocumentationService(supabase);
    const updatedDocumentation: ProjectDocumentationDTO = await projectDocumentationService.updateProjectDocumentation(
      validatedData,
      currentUserId
    );

    // Zwróć pomyślną odpowiedź z zaktualizowaną dokumentacją
    return new Response(JSON.stringify(updatedDocumentation), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error updating project documentation:", error);

    // Sprawdź czy to błąd połączenia z bazą danych
    if (isDatabaseConnectionError(error)) {
      return createDatabaseConnectionErrorResponse("project documentation update");
    }

    // Obsługa błędów walidacji Zod
    if (isZodError(error)) {
      return createZodValidationResponse(error);
    }

    // Obsługa błędów dostępu (403 Forbidden)
    if (error instanceof AccessDeniedError) {
      return new Response(
        JSON.stringify({
          error: "Forbidden",
          message:
            "You don't have permission to update project documentation. Only administrators can perform this action.",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Obsługa błędów profilu użytkownika nie znaleziony (403 Forbidden)
    if (error instanceof UserProfileNotFoundError) {
      return new Response(
        JSON.stringify({
          error: "Forbidden",
          message: "Your user profile not found - access denied",
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
