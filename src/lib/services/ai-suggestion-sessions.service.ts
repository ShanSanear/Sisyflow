import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { AISuggestionSessionDTO, AnalyzeTicketCommand } from "../../types";
import type { AiResponse } from "../validation/schemas/ai";
import {
  createAiSuggestionSessionCommandSchema,
  rateAiSuggestionSchema,
  type AiSuggestion,
} from "../validation/schemas/ai";
import { createTicketService } from "./ticket.service";
import { POSTGREST_ERROR_CODES } from "../constants";
import { extractSupabaseError } from "../utils";
import { z } from "zod";

/**
 * Service odpowiedzialny za operacje na sesjach sugestii AI
 * Implementuje logikę biznesową dla tworzenia i zarządzania sesjami sugestii AI
 */
export class AISuggestionSessionsService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Tworzy nową sesję sugestii AI wraz z sugestiami
   * Wykonuje operację w transakcji aby zapewnić atomowość
   *
   * @param command Dane analizy ticketu zawierające tytuł i opcjonalny opis
   * @param suggestions Sugestie wygenerowane przez AI
   * @param userId ID użytkownika tworzącego sesję
   * @returns Pełny obiekt sesji sugestii AI
   * @throws Error jeśli walidacja nie powiedzie się lub wystąpi błąd bazy danych
   */
  async createAISuggestionSession(
    command: AnalyzeTicketCommand,
    suggestions: AiResponse,
    userId: string
  ): Promise<AISuggestionSessionDTO> {
    // Walidacja danych wejściowych
    const validatedCommand = createAiSuggestionSessionCommandSchema.parse(command);

    try {
      // Sprawdź czy ticket istnieje używając ticket service (tylko jeśli ticket_id jest podane)
      if (validatedCommand.ticket_id) {
        const ticketService = createTicketService(this.supabase);
        await ticketService.getTicketById(validatedCommand.ticket_id);
      }

      // Przygotuj dane sugestii do zapisania (z flagą applied: false)
      const suggestionsWithApplied: AiSuggestion[] = suggestions.suggestions.map((suggestion) => ({
        ...suggestion,
        applied: false,
      }));

      // Utwórz sesję sugestii AI
      const { data: session, error: sessionError } = await this.supabase
        .from("ai_suggestion_sessions")
        .insert({
          ticket_id: validatedCommand.ticket_id,
          user_id: userId,
          suggestions: suggestionsWithApplied,
        })
        .select()
        .single();

      if (sessionError) {
        throw extractSupabaseError(sessionError, "Failed to create AI suggestion session");
      }

      // Formatuj odpowiedź zgodnie z AISuggestionSessionDTO
      const result: AISuggestionSessionDTO = {
        session_id: session.id,
        ticket_id: session.ticket_id,
        suggestions: suggestionsWithApplied,
      };

      return result;
    } catch (error) {
      // Przekaż błędy walidacji Zod bez zmian
      if (error instanceof z.ZodError) {
        throw error;
      }

      // Dla innych błędów, opakuj w bardziej przyjazny komunikat
      throw new Error(
        `Failed to create AI suggestion session: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

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
          throw new Error("AI suggestion session not found");
        }
        throw extractSupabaseError(error, "Failed to fetch AI suggestion session");
      }

      if (!session) {
        throw new Error("AI suggestion session not found");
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
      throw new Error(
        `Failed to get AI suggestion session: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Aktualizuje ocenę sesji sugestii AI
   * Sprawdza uprawnienia użytkownika przed aktualizacją
   *
   * @param sessionId ID sesji do aktualizacji
   * @param rating Ocena sesji (1-5)
   * @param userId ID użytkownika wykonującego operację
   * @returns Zaktualizowany obiekt sesji sugestii AI
   * @throws Error jeśli sesja nie istnieje, użytkownik nie ma uprawnień lub wystąpi błąd bazy danych
   */
  async rateAISuggestionSession(sessionId: string, rating: number, userId: string): Promise<AISuggestionSessionDTO> {
    // Walidacja danych wejściowych
    const validatedRating = rateAiSuggestionSchema.shape.rating.parse(rating);

    try {
      // Najpierw sprawdź czy sesja istnieje i pobierz jej dane
      const { data: existingSession, error: fetchError } = await this.supabase
        .from("ai_suggestion_sessions")
        .select("id, user_id")
        .eq("id", sessionId)
        .single();

      if (fetchError || !existingSession) {
        throw new Error("AI suggestion session not found");
      }

      // Sprawdź uprawnienia: użytkownik musi być właścicielem sesji
      if (existingSession.user_id !== userId) {
        throw new Error("Access denied: You can only rate your own AI suggestion sessions");
      }

      // Aktualizuj ocenę sesji
      const { error: updateError } = await this.supabase
        .from("ai_suggestion_sessions")
        .update({
          rating: validatedRating,
        })
        .eq("id", sessionId);

      if (updateError) {
        throw extractSupabaseError(updateError, "Failed to update AI suggestion session rating");
      }

      // Pobierz zaktualizowane dane sesji
      const { data: updatedSession, error: refetchError } = await this.supabase
        .from("ai_suggestion_sessions")
        .select("id, ticket_id, suggestions")
        .eq("id", sessionId)
        .single();

      if (refetchError || !updatedSession) {
        throw new Error(`Failed to fetch updated AI suggestion session: ${refetchError?.message || "Unknown error"}`);
      }

      // Formatuj odpowiedź zgodnie z AISuggestionSessionDTO
      const result: AISuggestionSessionDTO = {
        session_id: updatedSession.id,
        ticket_id: updatedSession.ticket_id,
        suggestions: updatedSession.suggestions as AISuggestionSessionDTO["suggestions"],
      };

      return result;
    } catch (error) {
      // Przekaż błędy walidacji Zod bez zmian
      if (error instanceof z.ZodError) {
        throw error;
      }

      // Dla innych błędów, opakuj w bardziej przyjazny komunikat
      throw new Error(
        `Failed to rate AI suggestion session: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
}

/**
 * Factory function do tworzenia instancji AISuggestionSessionsService
 * @param supabase Supabase client instance
 * @returns AISuggestionSessionsService instance
 */
export function createAISuggestionSessionsService(supabase: SupabaseClient<Database>): AISuggestionSessionsService {
  return new AISuggestionSessionsService(supabase);
}
