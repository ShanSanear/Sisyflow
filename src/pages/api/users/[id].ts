import type { APIRoute } from "astro";
import {
  createUserService,
  AccessDeniedError,
  UserProfileNotFoundError,
  UserDeletionError,
  SelfDeletionError,
  UserToDeleteNotFoundError,
} from "../../../lib/services/user.service";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import { userIdParamsSchema } from "../../../lib/validation/schemas/user";
import {
  isZodError,
  createZodValidationResponse,
  isDatabaseConnectionError,
  createDatabaseConnectionErrorResponse,
} from "../../../lib/utils";

export const prerender = false;

/**
 * DELETE /api/users/:id
 *
 * Usuwa użytkownika z systemu. Dostęp mają wyłącznie użytkownicy z rolą administratora (ADMIN).
 * Operacja jest nieodwracalna i obejmuje usunięcie rekordu zarówno z tabeli auth.users (zarządzanej przez Supabase Auth),
 * jak i powiązanej tabeli profiles (przez cascade delete). Jeśli usunięty użytkownik był reporterem lub assignee
 * w ticketach, odpowiednie pola zostaną automatycznie ustawione na null.
 *
 * Path Parameters:
 * - id (wymagany): UUID identyfikatora użytkownika do usunięcia
 *
 * Response: 204 No Content - użytkownik został pomyślnie usunięty
 * Error Responses: 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error
 */
export const DELETE: APIRoute = async ({ params, request, locals, cookies }) => {
  try {
    // Sprawdź czy użytkownik jest uwierzytelniony przez middleware
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

    const adminUserId = locals.user.id;
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Walidacja parametrów ścieżki
    const validatedParams = userIdParamsSchema.parse(params);
    const userIdToDelete = validatedParams.id;

    // Utwórz user service i wywołaj metodę usunięcia użytkownika
    const userService = createUserService(supabase);
    await userService.deleteUser(userIdToDelete, adminUserId);

    // Zwróć pomyślną odpowiedź - 204 No Content (bez ciała odpowiedzi)
    return new Response(null, {
      status: 204,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error deleting user:", error);

    // Sprawdź czy to błąd połączenia z bazą danych
    if (isDatabaseConnectionError(error)) {
      return createDatabaseConnectionErrorResponse("user deletion");
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
          message: "You don't have permission to delete users. Only administrators can perform this action.",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Obsługa błędów użytkownika do usunięcia nie znaleziony (404 Not Found)
    if (error instanceof UserToDeleteNotFoundError) {
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "User not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Obsługa błędów profilu administratora nie znaleziony (403 Forbidden)
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

    // Obsługa błędów próby usunięcia własnego konta (403 Forbidden)
    if (error instanceof SelfDeletionError) {
      return new Response(
        JSON.stringify({
          error: "Forbidden",
          message: "You cannot delete your own account",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Obsługa błędów usunięcia użytkownika (500 Internal Server Error)
    if (error instanceof UserDeletionError) {
      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: "Failed to delete user",
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
