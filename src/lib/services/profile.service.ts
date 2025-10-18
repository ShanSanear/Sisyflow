import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { ProfileDTO } from "../../types";
import { POSTGREST_ERROR_CODES } from "../constants";

/**
 * Interface for Supabase error objects
 */
interface SupabaseError {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
}

/**
 * Helper function to extract detailed error information from Supabase errors
 * Provides more context for debugging database issues
 */
function extractSupabaseError(error: unknown, operation: string): Error {
  if (!error) return new Error(`${operation}: Unknown error`);

  // Extract available error properties
  const supabaseError = error as SupabaseError;
  const message = supabaseError.message || "No message provided";
  const code = supabaseError.code || "No code provided";
  const details = supabaseError.details || "No details provided";
  const hint = supabaseError.hint || "No hint provided";

  // Create a detailed error message
  const detailedMessage = [`${operation}: ${message}`, `Code: ${code}`, `Details: ${details}`, `Hint: ${hint}`].join(
    " | "
  );

  // Log the full error for debugging (in development)
  console.error(`Supabase Error in ${operation}:`, {
    message,
    code,
    details,
    hint,
    fullError: error,
  });

  return new Error(detailedMessage);
}

/**
 * Service odpowiedzialny za operacje na profilach użytkowników
 * Implementuje logikę biznesową dla zarządzania profilami
 */
export class ProfileService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Pobiera profil aktualnie uwierzytelnionego użytkownika
   *
   * @returns Profil użytkownika w formacie ProfileDTO
   * @throws Error jeśli użytkownik nie jest zalogowany lub profil nie istnieje
   */
  async getCurrentUserProfile(): Promise<ProfileDTO> {
    try {
      // Pobierz sesję użytkownika
      const { data: session, error: sessionError } = await this.supabase.auth.getSession();

      if (sessionError) {
        throw extractSupabaseError(sessionError, "Failed to get user session");
      }

      if (!session.session || !session.session.user) {
        throw new Error("User not authenticated");
      }

      const userId = session.session.user.id;

      // Pobierz profil użytkownika z bazy danych
      const { data: profile, error: profileError } = await this.supabase
        .from("profiles")
        .select("id, username, role, created_at, updated_at")
        .eq("id", userId)
        .single();

      if (profileError) {
        // Sprawdź czy to błąd "not found" (brak rekordu dla zapytania .single())
        if (profileError.code === POSTGREST_ERROR_CODES.NO_ROWS_RETURNED_FOR_SINGLE) {
          throw new Error("Not Found");
        }
        throw extractSupabaseError(profileError, "Failed to fetch user profile");
      }

      if (!profile) {
        throw new Error("Not Found");
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
      if (error instanceof Error && error.message === "Not Found") {
        throw error;
      }

      // Dla innych błędów, opakuj w bardziej przyjazny komunikat
      throw new Error(`Failed to get user profile: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}

/**
 * Factory function do tworzenia instancji ProfileService
 * @param supabase Supabase client instance
 * @returns ProfileService instance
 */
export function createProfileService(supabase: SupabaseClient<Database>): ProfileService {
  return new ProfileService(supabase);
}
