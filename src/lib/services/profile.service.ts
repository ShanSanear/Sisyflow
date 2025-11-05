import { createSupabaseServerInstance } from "../../db/supabase.client";
import type { ProfileDTO, UpdateProfileCommand } from "../../types";
import { updateProfileSchema } from "../validation/schemas/user";
import { POSTGREST_ERROR_CODES } from "../constants";
import { extractSupabaseError } from "../utils";
import { z } from "zod";

type SupabaseType = ReturnType<typeof createSupabaseServerInstance>;

/**
 * Custom error classes for profile service operations
 */
export class ProfileServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProfileServiceError";
  }
}

export class ProfileNotFoundError extends ProfileServiceError {
  constructor(message = "Profile not found") {
    super(message);
    this.name = "ProfileNotFoundError";
  }
}

export class UsernameAlreadyTakenError extends ProfileServiceError {
  constructor(message = "Username is already taken") {
    super(message);
    this.name = "UsernameAlreadyTakenError";
  }
}

/**
 * Service odpowiedzialny za operacje na profilach użytkowników
 * Implementuje logikę biznesową dla zarządzania profilami
 */
export class ProfileService {
  constructor(private supabase: SupabaseType) {}

  /**
   * Pobiera profil użytkownika po ID
   *
   * @param userId - ID użytkownika
   * @returns Profil użytkownika w formacie ProfileDTO
   * @throws Error jeśli użytkownik nie istnieje
   */
  async getUserProfileById(userId: string): Promise<ProfileDTO> {
    try {
      // Pobierz profil użytkownika z bazy danych
      const { data: profile, error: profileError } = await this.supabase
        .from("profiles")
        .select("id, username, role, created_at, updated_at")
        .eq("id", userId)
        .single();

      if (profileError) {
        // Sprawdź czy to błąd "not found" (brak rekordu dla zapytania .single())
        if (profileError.code === POSTGREST_ERROR_CODES.NO_ROWS_RETURNED_FOR_SINGLE) {
          throw new ProfileNotFoundError();
        }
        throw extractSupabaseError(profileError, "Failed to fetch user profile");
      }

      if (!profile) {
        throw new ProfileNotFoundError();
      }

      // Mapuj wynik na ProfileDTO
      const result: ProfileDTO = {
        id: profile.id,
        username: profile.username,
        role: profile.role,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      };

      return result;
    } catch (error) {
      // Przekaż błędy walidacji Zod bez zmian (choć nie ma walidacji w tej metodzie)
      if (error instanceof ProfileNotFoundError) {
        throw error;
      }

      // Dla innych błędów, opakuj w bardziej przyjazny komunikat
      throw new Error(`Failed to get user profile: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Aktualizuje profil użytkownika
   *
   * @param userId - ID użytkownika którego profil ma być zaktualizowany
   * @param command - dane do aktualizacji (username)
   * @returns Zaktualizowany profil użytkownika w formacie ProfileDTO
   * @throws Error jeśli użytkownik nie istnieje lub nazwa użytkownika jest zajęta
   */
  async updateProfile(userId: string, command: UpdateProfileCommand): Promise<ProfileDTO> {
    // Waliduj dane wejściowe za pomocą schematu Zod
    const validatedCommand = updateProfileSchema.parse(command);

    try {
      // Najpierw sprawdź czy nowa nazwa użytkownika nie jest już zajęta przez innego użytkownika
      const { data: existingUser, error: checkError } = await this.supabase
        .from("profiles")
        .select("id")
        .eq("username", validatedCommand.username)
        .neq("id", userId)
        .single();

      if (checkError && checkError.code !== POSTGREST_ERROR_CODES.NO_ROWS_RETURNED_FOR_SINGLE) {
        throw extractSupabaseError(checkError, "Failed to check username availability");
      }

      // Jeśli znaleziono innego użytkownika z tą samą nazwą, rzuć błąd
      if (existingUser) {
        throw new UsernameAlreadyTakenError();
      }

      // Aktualizuj profil użytkownika
      const { data: updatedProfile, error: updateError } = await this.supabase
        .from("profiles")
        .update({
          username: validatedCommand.username,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select("id, username, role, created_at, updated_at")
        .single();

      if (updateError) {
        // Sprawdź czy to błąd "not found" (brak rekordu dla zapytania .single())
        if (updateError.code === POSTGREST_ERROR_CODES.NO_ROWS_RETURNED_FOR_SINGLE) {
          throw new ProfileNotFoundError();
        }
        throw extractSupabaseError(updateError, "Failed to update user profile");
      }

      if (!updatedProfile) {
        throw new ProfileNotFoundError();
      }

      // Mapuj wynik na ProfileDTO
      const result: ProfileDTO = {
        id: updatedProfile.id,
        username: updatedProfile.username,
        role: updatedProfile.role,
        created_at: updatedProfile.created_at,
        updated_at: updatedProfile.updated_at,
      };

      return result;
    } catch (error) {
      // Przekaż błędy walidacji Zod bez zmian
      if (error instanceof z.ZodError) {
        throw error;
      }
      // Przekaż custom errors
      if (error instanceof ProfileNotFoundError || error instanceof UsernameAlreadyTakenError) {
        throw error;
      }

      // Dla innych błędów, opakuj w bardziej przyjazny komunikat
      throw new Error(`Failed to update user profile: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}

/**
 * Factory function do tworzenia instancji ProfileService
 * @param supabase Supabase client instance
 * @returns ProfileService instance
 */
export function createProfileService(supabase: SupabaseType): ProfileService {
  return new ProfileService(supabase);
}
