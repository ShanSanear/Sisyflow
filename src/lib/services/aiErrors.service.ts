import { createSupabaseServerInstance } from "../../db/supabase.client";
import type { AIErrorDTO, PaginationDTO, CreateAIErrorCommand } from "../../types";
import { extractSupabaseError } from "../utils";
import { createAIErrorSchema } from "../validation/schemas/aiErrors";

type SupabaseType = ReturnType<typeof createSupabaseServerInstance>;

/**
 * Custom error classes for AI errors service operations
 */
export class AIErrorsServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIErrorsServiceError";
  }
}

export class AIErrorsNotFoundError extends AIErrorsServiceError {
  constructor(message = "AI errors not found") {
    super(message);
    this.name = "AIErrorsNotFoundError";
  }
}

/**
 * Service odpowiedzialny za operacje na błędach AI
 * Implementuje logikę biznesową dla pobierania i zarządzania błędami komunikacji z AI
 */
export class AIErrorsService {
  constructor(private supabase: SupabaseType) {}

  /**
   * Pobiera paginowaną listę błędów AI z opcjonalnym filtrowaniem po ticket_id
   * Sortuje wyniki malejąco po created_at dla najnowszych błędów
   * Wykorzystuje istniejące indeksy bazy danych dla optymalizacji zapytań
   *
   * @param limit Liczba błędów na stronę (1-100)
   * @param offset Przesunięcie w wynikach (minimum 0)
   * @param ticketId Opcjonalny UUID ticketu do filtrowania błędów
   * @returns Obiekt zawierający listę błędów AI i metadane paginacji
   * @throws Error jeśli wystąpi błąd bazy danych
   */
  async getAIErrorsPaginated(
    limit: number,
    offset: number,
    filters: { ticket_id?: string; search?: string }
  ): Promise<{ aiErrors: AIErrorDTO[]; pagination: PaginationDTO }> {
    try {
      // Buduj zapytanie bazowe
      let query = this.supabase
        .from("ai_errors")
        .select("*, user:profiles(id, username)", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      // Dodaj filtrowanie po ticket_id jeśli podane
      if (filters.ticket_id) {
        query = query.eq("ticket_id", filters.ticket_id);
      }

      // Dodaj wyszukiwanie tekstowe jeśli podane
      if (filters.search) {
        query = query.ilike("error_message", `%${filters.search}%`);
      }

      // Wykonaj zapytanie
      const { data: aiErrors, error, count } = await query;

      if (error) {
        throw extractSupabaseError(error, "Failed to fetch AI errors");
      }

      if (!aiErrors) {
        return {
          aiErrors: [],
          pagination: {
            page: Math.floor(offset / limit) + 1,
            limit,
            total: 0,
          },
        };
      }

      // Mapuj dane na AIErrorDTO
      const errors: AIErrorDTO[] = aiErrors.map((error) => ({
        id: error.id,
        ticket_id: error.ticket_id,
        user_id: error.user_id,
        error_message: error.error_message,
        error_details: error.error_details,
        created_at: error.created_at,
        user: error.user,
      }));

      // Oblicz metadane paginacji
      const total = count || 0;
      const pagination: PaginationDTO = {
        page: Math.floor(offset / limit) + 1,
        limit,
        total,
      };

      return {
        aiErrors: errors,
        pagination,
      };
    } catch (error) {
      throw new AIErrorsServiceError(
        `Failed to fetch AI errors: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Tworzy nowy błąd AI
   * Dodaje rekord do tabeli ai_errors z walidacją danych wejściowych
   *
   * @param command Dane błędu AI do utworzenia
   * @returns Utworzony obiekt błędu AI
   * @throws Error jeśli walidacja nie powiedzie się lub wystąpi błąd bazy danych
   */
  async createAIError(command: CreateAIErrorCommand): Promise<AIErrorDTO> {
    // Walidacja danych wejściowych
    const validatedData = createAIErrorSchema.parse(command);

    try {
      // Dodaj nowy błąd AI do bazy danych
      const { data: createdError, error: createError } = await this.supabase
        .from("ai_errors")
        .insert({
          error_message: validatedData.error_message,
          error_details: validatedData.error_details,
          ticket_id: validatedData.ticket_id,
          user_id: validatedData.user_id,
        })
        .select("*")
        .single();

      if (createError) {
        throw extractSupabaseError(createError, "Failed to create AI error");
      }

      if (!createdError) {
        throw new AIErrorsServiceError("Failed to retrieve created AI error");
      }

      // Przekształć dane do oczekiwanego formatu DTO
      const result: AIErrorDTO = {
        id: createdError.id,
        ticket_id: createdError.ticket_id,
        user_id: createdError.user_id,
        error_message: createdError.error_message,
        error_details: createdError.error_details,
        created_at: createdError.created_at,
      };

      return result;
    } catch (error) {
      // Re-throw custom errors
      if (error instanceof AIErrorsServiceError) {
        throw error;
      }

      // Wrap other errors
      throw new AIErrorsServiceError(
        error instanceof Error ? error.message : "Unknown error occurred while creating AI error"
      );
    }
  }
}

/**
 * Factory function do tworzenia instancji AIErrorsService
 * @param supabase Supabase client instance
 * @returns AIErrorsService instance
 */
export function createAIErrorsService(supabase: SupabaseType): AIErrorsService {
  return new AIErrorsService(supabase);
}
