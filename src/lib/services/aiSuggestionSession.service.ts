import { createSupabaseServerInstance } from "../../db/supabase.client";
import type { AISuggestionSessionDTO } from "../../types";
import { saveAiSuggestionSessionSchema, type AISuggestion } from "../validation/schemas/ai";
import { POSTGREST_ERROR_CODES } from "../constants";
import { extractSupabaseError } from "../utils";
import { z } from "zod";

type SupabaseType = ReturnType<typeof createSupabaseServerInstance>;

/**
 * Custom error classes for AI suggestion sessions service operations
 */
export class AISuggestionSessionsServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AISuggestionSessionsServiceError";
  }
}

export class AISuggestionSessionNotFoundError extends AISuggestionSessionsServiceError {
  constructor(message = "AI suggestion session not found") {
    super(message);
    this.name = "AISuggestionSessionNotFoundError";
  }
}

export class AISuggestionSessionAccessDeniedError extends AISuggestionSessionsServiceError {
  constructor(message = "Access denied: You can only modify your own AI suggestion sessions") {
    super(message);
    this.name = "AISuggestionSessionAccessDeniedError";
  }
}

export class TicketNotFoundError extends AISuggestionSessionsServiceError {
  constructor(message = "Ticket not found") {
    super(message);
    this.name = "TicketNotFoundError";
  }
}

/**
 * Service odpowiedzialny za operacje na sesjach sugestii AI
 * Implementuje logikę biznesową dla tworzenia i zarządzania sesjami sugestii AI
 */
export class AISuggestionSessionsService {
  constructor(private supabase: SupabaseType) {}

  /**
   * Pobiera sesję sugestii AI wraz z danymi ticketu i użytkownika
   *
   * @param sessionId ID sesji do pobrania
   * @returns Pełny obiekt sesji sugestii AI
   * @throws Error jeśli sesja nie istnieje lub wystąpi błąd bazy danych
   */
  async getAISuggestionSession(sessionId: string): Promise<AISuggestionSessionDTO> {
    try {
      // Wykonaj zapytanie z JOIN do tabeli tickets i profiles
      const { data: session, error } = await this.supabase
        .from("ai_suggestion_sessions")
        .select(
          `
          id,
          suggestions,
          ticket_id,
          user_id,
          rating,
          created_at,
          tickets:ai_suggestion_sessions_ticket_id_fkey(id, title, description),
          profiles:ai_suggestion_sessions_user_id_fkey(id, username)
        `
        )
        .eq("id", sessionId)
        .single();

      if (error) {
        // Sprawdź czy to błąd "not found"
        if (error.code === POSTGREST_ERROR_CODES.NO_ROWS_RETURNED_FOR_SINGLE) {
          throw new AISuggestionSessionNotFoundError("AI suggestion session not found");
        }
        throw extractSupabaseError(error, "Failed to fetch AI suggestion session");
      }

      if (!session) {
        throw new AISuggestionSessionNotFoundError("AI suggestion session not found");
      }

      // Formatuj odpowiedź zgodnie z AISuggestionSessionDTO
      const result: AISuggestionSessionDTO = {
        session_id: session.id,
        ticket_id: session.ticket_id,
        suggestions: session.suggestions as AISuggestionSessionDTO["suggestions"],
      };

      return result;
    } catch (error) {
      // Przekaż błędy walidacji Zod bez zmian (choć nie ma walidacji w tej metodzie)
      if (error instanceof z.ZodError) {
        throw error;
      }

      // Dla innych błędów, opakuj w bardziej przyjazny komunikat
      throw new AISuggestionSessionsServiceError(
        `Failed to get AI suggestion session: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Saves an existing AI suggestion session to the database
   * Used when persisting sessions that were created during ticket analysis
   *
   * @param sessionData Session data including ticket_id, suggestions, and optional rating
   * @param userId ID użytkownika zapisującego sesję
   * @returns Saved AI suggestion session data
   * @throws Error jeśli wystąpi błąd bazy danych
   */
  async saveAISuggestionSession(
    sessionData: {
      ticket_id: string;
      suggestions: AISuggestion[];
      rating?: number;
    },
    userId: string
  ): Promise<AISuggestionSessionDTO> {
    // Validate input data
    const validatedSessionData = saveAiSuggestionSessionSchema.parse(sessionData);

    try {
      const { data: session, error: sessionError } = await this.supabase
        .from("ai_suggestion_sessions")
        .insert({
          ticket_id: validatedSessionData.ticket_id,
          user_id: userId,
          suggestions: validatedSessionData.suggestions,
          rating: validatedSessionData.rating || null,
        })
        .select()
        .single();

      if (sessionError) {
        throw extractSupabaseError(sessionError, "Failed to save AI suggestion session");
      }

      // Format response according to AISuggestionSessionDTO
      const result: AISuggestionSessionDTO = {
        session_id: session.id,
        ticket_id: session.ticket_id,
        suggestions: validatedSessionData.suggestions,
        rating: session.rating,
      };

      return result;
    } catch (error) {
      // Pass through Zod errors unchanged
      if (error instanceof z.ZodError) {
        throw error;
      }

      // Wrap other errors in service-specific error
      throw new AISuggestionSessionsServiceError(
        `Failed to save AI suggestion session: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
}
/**
 * Factory function do tworzenia instancji AISuggestionSessionsService
 * @param supabase Supabase client instance
 * @returns AISuggestionSessionsService instance
 */
export function createAISuggestionSessionsService(supabase: SupabaseType): AISuggestionSessionsService {
  return new AISuggestionSessionsService(supabase);
}
