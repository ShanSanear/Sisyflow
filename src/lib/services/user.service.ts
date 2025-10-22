import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { CreateUserCommand, UserDTO, Profile } from "../../types";
import { createUserSchema } from "../validation/schemas/user";
import { extractSupabaseError } from "../utils";
import { POSTGREST_ERROR_CODES } from "../constants";
import { createSupabaseAdminInstance } from "../../db/supabase.client";
import { z } from "zod";

/**
 * Custom error classes for user service operations
 */
export class UserServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserServiceError";
  }
}

export class AccessDeniedError extends UserServiceError {
  constructor(message = "Access denied") {
    super(message);
    this.name = "AccessDeniedError";
  }
}

export class UserProfileNotFoundError extends UserServiceError {
  constructor(message = "User profile not found") {
    super(message);
    this.name = "UserProfileNotFoundError";
  }
}

export class EmailAlreadyExistsError extends UserServiceError {
  constructor(message = "Email already exists") {
    super(message);
    this.name = "EmailAlreadyExistsError";
  }
}

export class UsernameAlreadyExistsError extends UserServiceError {
  constructor(message = "Username already exists") {
    super(message);
    this.name = "Username already exists";
  }
}

export class AuthUserCreationError extends UserServiceError {
  constructor(message = "Failed to retrieve email from auth user") {
    super(message);
    this.name = "AuthUserCreationError";
  }
}

/**
 * Service odpowiedzialny za operacje na użytkownikach
 * Implementuje logikę biznesową dla tworzenia i zarządzania użytkownikami
 */
export class UserService {
  private supabaseAdmin: SupabaseClient<Database>;

  constructor(private supabase: SupabaseClient<Database>) {
    // Inicjalizuj admin client dla operacji wymagających uprawnień administratora
    this.supabaseAdmin = createSupabaseAdminInstance();
  }

  /**
   * Tworzy nowego użytkownika wraz z kontem w Supabase Auth i profilem
   * Wykonuje operację dwuetapową: najpierw Auth, potem profiles
   *
   * @param command Dane do utworzenia użytkownika
   * @param adminUserId ID administratora wykonującego operację
   * @returns Pełny obiekt użytkownika z danymi z Auth i profiles
   * @throws Error jeśli walidacja nie powiedzie się, użytkownik nie ma uprawnień lub wystąpi błąd bazy danych
   */
  async createUser(command: CreateUserCommand, adminUserId: string): Promise<UserDTO> {
    // Walidacja danych wejściowych
    const validatedData = createUserSchema.parse(command);

    try {
      // Sprawdź czy użytkownik wykonujący operację ma rolę ADMIN
      const { data: adminProfile, error: adminCheckError } = await this.supabase
        .from("profiles")
        .select("role")
        .eq("id", adminUserId)
        .single();

      if (adminCheckError || !adminProfile) {
        throw new UserProfileNotFoundError();
      }

      if (adminProfile.role !== ("ADMIN" as Profile["role"])) {
        throw new AccessDeniedError("Only administrators can create users");
      }

      // Sprawdź czy email już istnieje w auth.users
      const { data: existingAuthUsers, error: authCheckError } = await this.supabaseAdmin.auth.admin.listUsers();

      if (authCheckError) {
        throw extractSupabaseError(authCheckError, "Failed to check existing users in auth");
      }

      const emailExists = existingAuthUsers.users.some((user) => user.email === validatedData.email);
      if (emailExists) {
        throw new EmailAlreadyExistsError();
      }

      // Sprawdź czy username już istnieje w profiles
      const { data: existingProfile, error: profileCheckError } = await this.supabase
        .from("profiles")
        .select("id")
        .eq("username", validatedData.username)
        .single();

      if (profileCheckError && profileCheckError.code !== POSTGREST_ERROR_CODES.NO_ROWS_RETURNED_FOR_SINGLE) {
        // PGRST116 to kod dla "no rows returned", co oznacza że username jest dostępny
        throw extractSupabaseError(profileCheckError, "Failed to check existing username");
      }

      if (existingProfile) {
        throw new UsernameAlreadyExistsError();
      }

      // Utwórz użytkownika w Supabase Auth
      const { data: authUser, error: authError } = await this.supabaseAdmin.auth.admin.createUser({
        email: validatedData.email,
        password: validatedData.password,
        email_confirm: true, // Automatycznie potwierdzony email dla nowych użytkowników
      });

      if (authError || !authUser.user) {
        throw extractSupabaseError(authError, "Failed to create user in auth");
      }

      // Utwórz profil w tabeli profiles
      const { data: profile, error: profileError } = await this.supabase
        .from("profiles")
        .insert({
          id: authUser.user.id,
          username: validatedData.username,
          role: validatedData.role,
        })
        .select()
        .single();

      if (profileError) {
        // Jeśli tworzenie profilu się nie powiedzie, spróbuj usunąć użytkownika z Auth
        try {
          await this.supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        } catch (cleanupError) {
          console.error("Failed to cleanup auth user after profile creation failed:", cleanupError);
        }
        throw extractSupabaseError(profileError, "Failed to create user profile");
      }

      // Sprawdź czy email istnieje w danych auth
      if (!authUser.user.email) {
        throw new AuthUserCreationError();
      }

      // Formatuj odpowiedź zgodnie z UserDTO
      const result: UserDTO = {
        id: profile.id,
        email: authUser.user.email,
        username: profile.username,
        role: profile.role,
        created_at: profile.created_at,
      };

      return result;
    } catch (error) {
      // Przekaż błędy walidacji Zod bez zmian
      if (error instanceof z.ZodError) {
        throw error;
      }

      // Dla innych błędów, opakuj w bardziej przyjazny komunikat
      throw new Error(`Failed to create user: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}

/**
 * Factory function do tworzenia instancji UserService
 * @param supabase Supabase client instance
 * @returns UserService instance
 */
export function createUserService(supabase: SupabaseClient<Database>): UserService {
  return new UserService(supabase);
}
