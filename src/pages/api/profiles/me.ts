import type { APIRoute } from "astro";
import { createProfileService } from "../../lib/services/profile.service";

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
    // Sprawdź czy użytkownik jest zalogowany poprzez sprawdzenie sesji
    if (!locals.session || !locals.session.user) {
      return new Response(null, { status: 401 });
    }

    // Utwórz profile service i wywołaj metodę
    const profileService = createProfileService(locals.supabase);
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

    // Obsługa błędów specyficznych dla tej operacji
    if (error instanceof Error) {
      if (error.message === "Not Found") {
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

      if (error.message === "User not authenticated") {
        return new Response(null, { status: 401 });
      }
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
