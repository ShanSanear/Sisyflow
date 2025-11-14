import type { APIRoute } from "astro";
import {
  createAIErrorsService,
  AIErrorsServiceError,
  AIErrorsNotFoundError,
} from "../../../lib/services/aiErrors.service";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import { getAIErrorsQuerySchema } from "../../../lib/validation/schemas/aiErrors";
import {
  isZodError,
  createZodValidationResponse,
  isDatabaseConnectionError,
  createDatabaseConnectionErrorResponse,
} from "../../../lib/utils";

export const prerender = false;

/**
 * GET /api/ai-errors
 *
 * Pobiera paginowaną listę błędów komunikacji z AI. Dostęp mają wyłącznie użytkownicy z rolą administratora (ADMIN).
 * Umożliwia filtrowanie błędów po identyfikatorze ticketu oraz obsługuje standardową paginację.
 *
 * Query Parameters:
 * - limit (opcjonalny): liczba błędów na stronę (domyślnie 50, maksymalnie 100)
 * - offset (opcjonalny): przesunięcie w wynikach (domyślnie 0)
 * - ticket_id (opcjonalny): UUID ticketu do filtrowania błędów
 *
 * Response: 200 OK - obiekt zawierający listę błędów AI i metadane paginacji
 * Error Responses: 401 Unauthorized, 403 Forbidden, 400 Bad Request, 500 Internal Server Error
 */
export const GET: APIRoute = async ({ request, locals, cookies, url }) => {
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

    // Sprawdź czy użytkownik ma rolę ADMIN
    const { data: userProfile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", currentUserId)
      .single();

    if (profileError || !userProfile) {
      return new Response(
        JSON.stringify({
          error: "Forbidden",
          message: "User profile not found",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (userProfile.role !== "ADMIN") {
      return new Response(
        JSON.stringify({
          error: "Forbidden",
          message: "Access denied. Only administrators can view AI errors.",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Parsuj i waliduj parametry query
    const urlParams = new URL(url).searchParams;
    const queryParams = {
      limit: urlParams.get("limit") || undefined,
      offset: urlParams.get("offset") || undefined,
      ticket_id: urlParams.get("ticket_id") || undefined,
      search: urlParams.get("search") || undefined,
    };

    const validatedQuery = getAIErrorsQuerySchema.parse(queryParams);

    // Pobierz błędy AI używając AIErrorsService
    const aiErrorsService = createAIErrorsService(supabase);
    const { aiErrors: errors, pagination } = await aiErrorsService.getAIErrorsPaginated(
      validatedQuery.limit,
      validatedQuery.offset,
      {
        ticket_id: validatedQuery.ticket_id,
        search: validatedQuery.search,
      }
    );

    // Zwróć pomyślną odpowiedź
    return new Response(
      JSON.stringify({
        errors,
        pagination,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching AI errors:", error);

    // Sprawdź czy to błąd połączenia z bazą danych
    if (isDatabaseConnectionError(error)) {
      return createDatabaseConnectionErrorResponse("AI errors retrieval");
    }

    // Obsługa błędów walidacji Zod
    if (isZodError(error)) {
      return createZodValidationResponse(error);
    }

    // Obsługa błędów serwisu AI Errors (500 Internal Server Error)
    if (error instanceof AIErrorsServiceError) {
      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: "Failed to retrieve AI errors from database",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Obsługa błędów gdy błędy AI nie zostały znalezione (500 Internal Server Error)
    if (error instanceof AIErrorsNotFoundError) {
      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: "AI errors data not accessible",
        }),
        {
          status: 500,
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
