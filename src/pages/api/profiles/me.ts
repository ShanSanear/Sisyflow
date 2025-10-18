import type { APIRoute } from "astro";
import { createProfileService } from "../../../lib/services/profile.service";
import { isDatabaseConnectionError, createDatabaseConnectionErrorResponse } from "../../../lib/utils";

export const prerender = false;

/**
 * GET /api/profiles/me
 *
 * Pobiera profil aktualnie uwierzytelnionego użytkownika.
 * Wymaga aktywnej sesji użytkownika.
 *
 * Response: 200 OK - ProfileDTO
 * Error Responses: 401 Unauthorized, 404 Not Found, 500 Internal Server Error
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    // Użyj stałego user ID dla developmentu
    // TODO: Zastąpić pełnym uwierzytelnieniem gdy będzie gotowe
    const supabase = locals.supabase;

    // Utwórz profile service i wywołaj metodę
    const profileService = createProfileService(supabase);
    const profile = await profileService.getCurrentUserProfile();

    // Zwróć pomyślną odpowiedź
    return new Response(JSON.stringify(profile), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);

    // Sprawdź czy to błąd połączenia z bazą danych
    if (isDatabaseConnectionError(error)) {
      return createDatabaseConnectionErrorResponse("user profile retrieval");
    }

    // Obsługa błędów specyficznych dla tej operacji
    if (error instanceof Error && error.message === "Not Found") {
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "User profile not found",
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
