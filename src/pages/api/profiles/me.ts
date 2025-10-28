import type { APIRoute } from "astro";
import {
  createProfileService,
  ProfileNotFoundError,
  UsernameAlreadyTakenError,
} from "../../../lib/services/profile.service";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import {
  isDatabaseConnectionError,
  createDatabaseConnectionErrorResponse,
  createZodValidationResponse,
} from "../../../lib/utils";
import { updateProfileSchema } from "../../../lib/validation/schemas/user";
import type { UpdateProfileCommand } from "../../../types";

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
export const GET: APIRoute = async ({ locals, cookies, request }) => {
  try {
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

    // Utwórz profile service i wywołaj metodę
    const profileService = createProfileService(supabase);
    const profile = await profileService.getUserProfileById(locals.user.id);

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

/**
 * PUT /api/profiles/me
 *
 * Aktualizuje profil aktualnie uwierzytelnionego użytkownika.
 * Umożliwia zmianę nazwy użytkownika (username).
 * Wymaga aktywnej sesji użytkownika.
 *
 * Request Body: UpdateProfileCommand { username: string }
 * Response: 200 OK - ProfileDTO
 * Error Responses: 400 Bad Request, 401 Unauthorized, 404 Not Found, 409 Conflict, 500 Internal Server Error
 */
export const PUT: APIRoute = async ({ locals, cookies, request }) => {
  try {
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

    // Parse and validate request body
    let requestBody: unknown;
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

    // Validate request body against schema
    const validationResult = updateProfileSchema.safeParse(requestBody);
    if (!validationResult.success) {
      return createZodValidationResponse(validationResult.error);
    }

    const command: UpdateProfileCommand = validationResult.data;

    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Create profile service and call update method
    const profileService = createProfileService(supabase);
    const updatedProfile = await profileService.updateProfile(locals.user.id, command);

    // Return successful response
    return new Response(JSON.stringify(updatedProfile), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error updating user profile:", error);

    // Check if it's a database connection error
    if (isDatabaseConnectionError(error)) {
      return createDatabaseConnectionErrorResponse("user profile update");
    }

    // Handle specific business logic errors
    if (error instanceof ProfileNotFoundError) {
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

    if (error instanceof UsernameAlreadyTakenError) {
      return new Response(
        JSON.stringify({
          error: "Conflict",
          message: "Username is already taken",
        }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle other errors
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
