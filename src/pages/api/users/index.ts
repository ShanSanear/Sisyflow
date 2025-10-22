import type { APIRoute } from "astro";
import {
  createUserService,
  AccessDeniedError,
  UserProfileNotFoundError,
  EmailAlreadyExistsError,
  UsernameAlreadyExistsError,
  AuthUserCreationError,
} from "../../../lib/services/user.service";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import type { CreateUserCommand, UserDTO, PaginationDTO } from "../../../types";
import { createUserSchema, getUsersQuerySchema } from "../../../lib/validation/schemas/user";
import {
  isZodError,
  createZodValidationResponse,
  isDatabaseConnectionError,
  createDatabaseConnectionErrorResponse,
  calculatePagination,
} from "../../../lib/utils";

export const prerender = false;

/**
 * GET /api/users
 *
 * Pobiera paginowaną listę wszystkich użytkowników systemu. Dostęp mają wyłącznie użytkownicy z rolą administratora (ADMIN).
 * Łączy dane z tabeli profiles z informacjami o email z Supabase Auth.
 *
 * Query Parameters:
 * - limit (opcjonalny): liczba użytkowników na stronę (domyślnie 50, maksymalnie 100)
 * - offset (opcjonalny): przesunięcie w wynikach (domyślnie 0)
 *
 * Response: 200 OK - obiekt zawierający listę użytkowników i metadane paginacji
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
          message: "Access denied. Only administrators can view user list.",
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
    };

    const validatedQuery = getUsersQuerySchema.parse(queryParams);

    // Pobierz użytkowników używając UserService
    const userService = createUserService(supabase);
    const { users, total } = await userService.getUsersPaginated(validatedQuery.limit, validatedQuery.offset);

    // Oblicz metadane paginacji
    const pagination: PaginationDTO = calculatePagination(validatedQuery.offset, validatedQuery.limit, total);

    // Zwróć pomyślną odpowiedź
    return new Response(
      JSON.stringify({
        users,
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
    console.error("Error fetching users:", error);

    // Sprawdź czy to błąd połączenia z bazą danych
    if (isDatabaseConnectionError(error)) {
      return createDatabaseConnectionErrorResponse("user list retrieval");
    }

    // Obsługa błędów walidacji Zod
    if (isZodError(error)) {
      return createZodValidationResponse(error);
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
 * POST /api/users
 *
 * Tworzy nowego użytkownika w systemie. Dostęp mają wyłącznie użytkownicy z rolą administratora (ADMIN).
 * Tworzy konto w Supabase Auth oraz powiązany profil w tabeli profiles.
 *
 * Request Body: CreateUserCommand - dane nowego użytkownika (email, password, username, role)
 * Response: 201 Created - UserDTO zawierający utworzonego użytkownika
 * Error Responses: 400 Bad Request, 401 Unauthorized, 403 Forbidden, 409 Conflict, 500 Internal Server Error
 */
export const POST: APIRoute = async ({ request, locals, cookies }) => {
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

    const adminUserId = locals.user.id;
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Parsuj i waliduj ciało żądania
    let requestBody: CreateUserCommand;
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
    const validatedData = createUserSchema.parse(requestBody);

    // Utwórz user service i wywołaj metodę tworzenia użytkownika
    const userService = createUserService(supabase);
    const createdUser: UserDTO = await userService.createUser(validatedData, adminUserId);

    // Zwróć pomyślną odpowiedź z utworzonym użytkownikiem
    return new Response(JSON.stringify(createdUser), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);

    // Sprawdź czy to błąd połączenia z bazą danych
    if (isDatabaseConnectionError(error)) {
      return createDatabaseConnectionErrorResponse("user creation");
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
          message: "You don't have permission to create users. Only administrators can perform this action.",
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

    // Obsługa błędów konfliktu - email już istnieje (409 Conflict)
    if (error instanceof EmailAlreadyExistsError) {
      return new Response(
        JSON.stringify({
          error: "Conflict",
          message: "Email already exists",
        }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Obsługa błędów konfliktu - username już istnieje (409 Conflict)
    if (error instanceof UsernameAlreadyExistsError) {
      return new Response(
        JSON.stringify({
          error: "Conflict",
          message: "Username already exists",
        }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Obsługa błędów tworzenia użytkownika w auth (500 Internal Server Error)
    if (error instanceof AuthUserCreationError) {
      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: "Failed to create user account",
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
