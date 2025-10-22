import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type {
  CreateTicketCommand,
  FullTicketDTO,
  TicketDTO,
  PaginationDTO,
  UpdateTicketStatusCommand,
  UpdateTicketCommand,
  UpdateTicketAssigneeCommand,
} from "../../types";
import {
  createTicketSchema,
  getTicketsQuerySchema,
  updateTicketStatusSchema,
  updateTicketSchema,
  updateTicketAssigneeSchema,
} from "../validation/ticket.validation";
import { POSTGREST_ERROR_CODES } from "../constants";
import { calculatePagination } from "../utils";
import { z } from "zod";

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
 * Service odpowiedzialny za operacje na ticketach
 * Implementuje logikę biznesową dla tworzenia i zarządzania ticketami
 */
export class TicketService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Tworzy nowy ticket wraz z opcjonalnymi załącznikami
   * Wykonuje operację w transakcji aby zapewnić atomowość
   *
   * @param command Dane do utworzenia ticketu
   * @param reporterId ID użytkownika tworzącego ticket (reporter)
   * @returns Pełny obiekt ticketu z powiązanymi danymi
   * @throws Error jeśli walidacja nie powiedzie się lub wystąpi błąd bazy danych
   */
  async createTicket(command: CreateTicketCommand, reporterId: string): Promise<FullTicketDTO> {
    // Walidacja danych wejściowych
    const validatedData = createTicketSchema.parse(command);

    try {
      // Rozpocznij transakcję - najpierw utwórz ticket
      const { data: ticket, error: ticketError } = await this.supabase
        .from("tickets")
        .insert({
          title: validatedData.title,
          description: validatedData.description || null,
          type: validatedData.type,
          status: "OPEN",
          reporter_id: reporterId,
          // TODO - when implementing AI-related endpoints at one point - make sure to take this into account
          ai_enhanced: false,
        })
        .select()
        .single();

      if (ticketError) {
        throw extractSupabaseError(ticketError, "Failed to create ticket");
      }

      // Pobierz pełne dane ticketu z reporter'em
      const { data: fullTicket, error: fetchError } = await this.supabase
        .from("tickets")
        .select(
          `
          id,
          title,
          description,
          type,
          status,
          reporter_id,
          assignee_id,
          ai_enhanced,
          created_at,
          updated_at,
          reporter:profiles!tickets_reporter_id_fkey(id, username),
          assignee:profiles!tickets_assignee_id_fkey(id, username)
        `
        )
        .eq("id", ticket.id)
        .single();

      if (fetchError) {
        throw extractSupabaseError(fetchError, "Failed to fetch created ticket");
      }

      // Sprawdź czy reporter istnieje - powinien istnieć ponieważ właśnie utworzyliśmy ticket
      if (!fullTicket.reporter) {
        throw new Error("Failed to fetch reporter data for created ticket");
      }

      // Formatuj odpowiedź zgodnie z FullTicketDTO
      const result: FullTicketDTO = {
        id: fullTicket.id,
        title: fullTicket.title,
        description: fullTicket.description,
        type: fullTicket.type,
        status: fullTicket.status,
        reporter_id: fullTicket.reporter_id,
        assignee_id: fullTicket.assignee_id,
        ai_enhanced: fullTicket.ai_enhanced,
        created_at: fullTicket.created_at,
        updated_at: fullTicket.updated_at,
        reporter: { id: fullTicket.reporter.id, username: fullTicket.reporter.username },
        assignee: fullTicket.assignee
          ? { id: fullTicket.assignee.id, username: fullTicket.assignee.username }
          : undefined,
      };

      return result;
    } catch (error) {
      // Przekaż błędy walidacji Zod bez zmian
      if (error instanceof z.ZodError) {
        throw error;
      }

      // Dla innych błędów, opakuj w bardziej przyjazny komunikat
      throw new Error(`Failed to create ticket: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Pobiera listę ticketów z opcjonalnym filtrowaniem, sortowaniem i paginacją
   *
   * @param queryParams Parametry zapytania zawierające filtry, sortowanie i paginację
   * @returns Obiekt zawierający listę ticketów i metadane paginacji
   * @throws Error jeśli wystąpi błąd bazy danych
   */
  async getTickets(queryParams: Record<string, unknown>): Promise<{ tickets: TicketDTO[]; pagination: PaginationDTO }> {
    try {
      // Walidacja parametrów wejściowych
      const validatedParams = getTicketsQuerySchema.parse(queryParams);
      // Budowanie zapytania bazowego z JOIN do profiles
      let query = this.supabase.from("tickets").select(
        `
          id,
          title,
          description,
          type,
          status,
          reporter_id,
          assignee_id,
          ai_enhanced,
          created_at,
          updated_at,
          reporter:profiles!tickets_reporter_id_fkey(id, username),
          assignee:profiles!tickets_assignee_id_fkey(id, username)
        `,
        { count: "exact" }
      );

      // Zastosuj filtry jeśli zostały podane
      if (validatedParams.status) {
        query = query.eq("status", validatedParams.status);
      }

      if (validatedParams.type) {
        query = query.eq("type", validatedParams.type);
      }

      if (validatedParams.assignee_id) {
        query = query.eq("assignee_id", validatedParams.assignee_id);
      }

      if (validatedParams.reporter_id) {
        query = query.eq("reporter_id", validatedParams.reporter_id);
      }

      // Parsuj parametr sortowania (format: "field direction")
      const sortParts = validatedParams.sort.split(" ");
      const sortField = sortParts[0] || "created_at";
      const sortDirection = sortParts[1]?.toLowerCase() === "asc" ? false : true; // true = desc

      // Zastosuj sortowanie
      query = query.order(sortField, { ascending: !sortDirection });

      // Zastosuj paginację
      query = query.range(validatedParams.offset, validatedParams.offset + validatedParams.limit - 1);

      // Wykonaj zapytanie
      const { data: tickets, error: queryError, count } = await query;

      if (queryError) {
        throw extractSupabaseError(queryError, "Failed to fetch tickets");
      }

      // Sprawdź czy wszystkie tickety mają reporter'a (powinny mieć)
      if (tickets && tickets.some((ticket) => !ticket.reporter)) {
        throw new Error("Some tickets are missing reporter data");
      }

      // Mapuj wyniki na TicketDTO[]
      const ticketDTOs: TicketDTO[] = (tickets || []).map((ticket) => {
        if (!ticket.reporter) {
          throw new Error("Ticket is missing reporter data");
        }

        return {
          id: ticket.id,
          title: ticket.title,
          description: ticket.description,
          type: ticket.type,
          status: ticket.status,
          reporter_id: ticket.reporter_id,
          assignee_id: ticket.assignee_id,
          ai_enhanced: ticket.ai_enhanced,
          created_at: ticket.created_at,
          updated_at: ticket.updated_at,
          reporter: { username: ticket.reporter.username },
          assignee: ticket.assignee ? { username: ticket.assignee.username } : undefined,
        };
      });

      // Przygotuj metadane paginacji
      const pagination: PaginationDTO = calculatePagination(validatedParams.offset, validatedParams.limit, count || 0);

      return {
        tickets: ticketDTOs,
        pagination,
      };
    } catch (error) {
      // Przekaż błędy walidacji Zod bez zmian
      if (error instanceof z.ZodError) {
        throw error;
      }

      // Dla innych błędów, opakuj w bardziej przyjazny komunikat
      throw new Error(`Failed to get tickets: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Pobiera pojedynczy ticket wraz z danymi reportera i assignee'a
   *
   * @param ticketId ID ticketu do pobrania
   * @returns Pełny obiekt ticketu z powiązanymi danymi reportera i assignee'a
   * @throws Error jeśli ticket nie istnieje lub wystąpi błąd bazy danych
   */
  async getTicketById(ticketId: string): Promise<FullTicketDTO> {
    try {
      // Wykonaj zapytanie z JOIN do tabeli profiles dla reportera i assignee'a
      const { data: ticket, error } = await this.supabase
        .from("tickets")
        .select(
          `
          id,
          title,
          description,
          type,
          status,
          reporter_id,
          assignee_id,
          ai_enhanced,
          created_at,
          updated_at,
          reporter:profiles!tickets_reporter_id_fkey(id, username),
          assignee:profiles!tickets_assignee_id_fkey(id, username)
        `
        )
        .eq("id", ticketId)
        .single();

      if (error) {
        // Sprawdź czy to błąd "not found" (brak rekordu dla zapytania .single())
        if (error.code === POSTGREST_ERROR_CODES.NO_ROWS_RETURNED_FOR_SINGLE) {
          throw new Error("Ticket not found");
        }
        throw extractSupabaseError(error, "Failed to fetch ticket");
      }

      if (!ticket) {
        throw new Error("Ticket not found");
      }

      // Sprawdź czy reporter istnieje - powinien istnieć dla wszystkich ticketów
      if (!ticket.reporter) {
        throw new Error("Failed to fetch reporter data for ticket");
      }

      // Formatuj odpowiedź zgodnie z FullTicketDTO
      const result: FullTicketDTO = {
        id: ticket.id,
        title: ticket.title,
        description: ticket.description,
        type: ticket.type,
        status: ticket.status,
        reporter_id: ticket.reporter_id,
        assignee_id: ticket.assignee_id,
        ai_enhanced: ticket.ai_enhanced,
        created_at: ticket.created_at,
        updated_at: ticket.updated_at,
        reporter: { id: ticket.reporter.id, username: ticket.reporter.username },
        assignee: ticket.assignee ? { id: ticket.assignee.id, username: ticket.assignee.username } : undefined,
      };

      return result;
    } catch (error) {
      // Przekaż błędy walidacji Zod bez zmian (choć nie ma walidacji w tej metodzie)
      if (error instanceof z.ZodError) {
        throw error;
      }

      // Dla innych błędów, opakuj w bardziej przyjazny komunikat
      throw new Error(`Failed to get ticket: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Aktualizuje status istniejącego ticketu
   * Sprawdza uprawnienia użytkownika (reporter/assignee/ADMIN) przed aktualizacją
   *
   * @param ticketId ID ticketu do aktualizacji
   * @param command Dane zawierające nowy status
   * @param userId ID użytkownika wykonującego operację
   * @returns Zaktualizowany ticket z pełnymi danymi
   * @throws Error jeśli ticket nie istnieje, użytkownik nie ma uprawnień lub wystąpi błąd bazy danych
   */
  async updateTicketStatus(ticketId: string, command: UpdateTicketStatusCommand, userId: string): Promise<TicketDTO> {
    // Walidacja danych wejściowych
    const validatedData = updateTicketStatusSchema.parse(command);

    try {
      // Najpierw sprawdź czy ticket istnieje i pobierz jego dane
      const { data: existingTicket, error: fetchError } = await this.supabase
        .from("tickets")
        .select("id, reporter_id, assignee_id")
        .eq("id", ticketId)
        .single();

      if (fetchError || !existingTicket) {
        throw new Error("Ticket not found");
      }

      // Sprawdź uprawnienia: użytkownik musi być reporter'em, assignee'em lub mieć rolę ADMIN
      const isReporter = existingTicket.reporter_id === userId;
      const isAssignee = existingTicket.assignee_id === userId;

      // Sprawdź rolę użytkownika - dla ADMIN pozwól na aktualizację
      let isAdmin = false;
      // TODO - disable this for now - assume ADMIN is always used
      isAdmin = true;
      if (!isReporter && !isAssignee) {
        const { data: userProfile, error: profileError } = await this.supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .single();

        if (profileError || !userProfile) {
          throw new Error("User profile not found");
        }

        isAdmin = userProfile.role === "ADMIN";
      }

      if (!isReporter && !isAssignee && !isAdmin) {
        throw new Error("Access denied: You don't have permission to update this ticket's status");
      }

      // Aktualizuj status ticketu
      const { error: updateError } = await this.supabase
        .from("tickets")
        .update({
          status: validatedData.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", ticketId);

      if (updateError) {
        throw extractSupabaseError(updateError, "Failed to update ticket status");
      }

      // Pobierz zaktualizowane dane ticketu z reporter'em i assignee'em
      const { data: updatedTicket, error: refetchError } = await this.supabase
        .from("tickets")
        .select(
          `
          id,
          title,
          description,
          type,
          status,
          reporter_id,
          assignee_id,
          ai_enhanced,
          created_at,
          updated_at,
          reporter:profiles!tickets_reporter_id_fkey(id, username),
          assignee:profiles!tickets_assignee_id_fkey(id, username)
        `
        )
        .eq("id", ticketId)
        .single();

      if (refetchError || !updatedTicket) {
        throw new Error(`Failed to fetch updated ticket: ${refetchError?.message || "Unknown error"}`);
      }

      // Sprawdź czy reporter istnieje - powinien istnieć
      if (!updatedTicket.reporter) {
        throw new Error("Failed to fetch reporter data for updated ticket");
      }

      // Formatuj odpowiedź zgodnie z TicketDTO
      const result: TicketDTO = {
        id: updatedTicket.id,
        title: updatedTicket.title,
        description: updatedTicket.description,
        type: updatedTicket.type,
        status: updatedTicket.status,
        reporter_id: updatedTicket.reporter_id,
        assignee_id: updatedTicket.assignee_id,
        ai_enhanced: updatedTicket.ai_enhanced,
        created_at: updatedTicket.created_at,
        updated_at: updatedTicket.updated_at,
        reporter: { username: updatedTicket.reporter.username },
        assignee: updatedTicket.assignee ? { username: updatedTicket.assignee.username } : undefined,
      };

      return result;
    } catch (error) {
      // Przekaż błędy walidacji Zod bez zmian
      if (error instanceof z.ZodError) {
        throw error;
      }

      // Dla innych błędów, opakuj w bardziej przyjazny komunikat
      throw new Error(`Failed to update ticket status: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Aktualizuje istniejący ticket (title, description, type)
   * Sprawdza uprawnienia użytkownika (reporter/assignee/ADMIN) przed aktualizacją
   *
   * @param ticketId ID ticketu do aktualizacji
   * @param command Dane zawierające pola do aktualizacji
   * @param userId ID użytkownika wykonującego operację
   * @returns Zaktualizowany ticket z pełnymi danymi
   * @throws Error jeśli ticket nie istnieje, użytkownik nie ma uprawnień lub wystąpi błąd bazy danych
   */
  async updateTicket(ticketId: string, command: UpdateTicketCommand, userId: string): Promise<FullTicketDTO> {
    // Walidacja danych wejściowych
    const validatedData = updateTicketSchema.parse(command);

    try {
      // Najpierw sprawdź czy ticket istnieje i pobierz jego dane
      const { data: existingTicket, error: fetchError } = await this.supabase
        .from("tickets")
        .select("id, reporter_id, assignee_id")
        .eq("id", ticketId)
        .single();

      if (fetchError || !existingTicket) {
        throw new Error("Ticket not found");
      }

      // Sprawdź uprawnienia: użytkownik musi być reporter'em, assignee'em lub mieć rolę ADMIN
      const isReporter = existingTicket.reporter_id === userId;
      const isAssignee = existingTicket.assignee_id === userId;

      // Sprawdź rolę użytkownika - dla ADMIN pozwól na aktualizację
      let isAdmin = false;
      if (!isReporter && !isAssignee) {
        const { data: userProfile, error: profileError } = await this.supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .single();

        if (profileError || !userProfile) {
          throw new Error("User profile not found");
        }

        isAdmin = userProfile.role === "ADMIN";
      }

      if (!isReporter && !isAssignee && !isAdmin) {
        throw new Error("Access denied: You don't have permission to update this ticket");
      }

      // Przygotuj dane do aktualizacji - tylko pola które zostały podane
      const updateData: {
        title?: string;
        description?: string | null;
        type?: "BUG" | "IMPROVEMENT" | "TASK";
      } = {};

      if (validatedData.title !== undefined) {
        updateData.title = validatedData.title;
      }

      if (validatedData.description !== undefined) {
        updateData.description = validatedData.description;
      }

      if (validatedData.type !== undefined) {
        updateData.type = validatedData.type;
      }

      // Aktualizuj ticket
      const { error: updateError } = await this.supabase.from("tickets").update(updateData).eq("id", ticketId);

      if (updateError) {
        throw extractSupabaseError(updateError, "Failed to update ticket");
      }

      // Pobierz zaktualizowane dane ticketu z reporter'em i assignee'em
      const { data: updatedTicket, error: refetchError } = await this.supabase
        .from("tickets")
        .select(
          `
          id,
          title,
          description,
          type,
          status,
          reporter_id,
          assignee_id,
          ai_enhanced,
          created_at,
          updated_at,
          reporter:profiles!tickets_reporter_id_fkey(id, username),
          assignee:profiles!tickets_assignee_id_fkey(id, username)
        `
        )
        .eq("id", ticketId)
        .single();

      if (refetchError || !updatedTicket) {
        throw new Error(`Failed to fetch updated ticket: ${refetchError?.message || "Unknown error"}`);
      }

      // Sprawdź czy reporter istnieje - powinien istnieć
      if (!updatedTicket.reporter) {
        throw new Error("Failed to fetch reporter data for updated ticket");
      }

      // Formatuj odpowiedź zgodnie z FullTicketDTO
      const result: FullTicketDTO = {
        id: updatedTicket.id,
        title: updatedTicket.title,
        description: updatedTicket.description,
        type: updatedTicket.type,
        status: updatedTicket.status,
        reporter_id: updatedTicket.reporter_id,
        assignee_id: updatedTicket.assignee_id,
        ai_enhanced: updatedTicket.ai_enhanced,
        created_at: updatedTicket.created_at,
        updated_at: updatedTicket.updated_at,
        reporter: { id: updatedTicket.reporter.id, username: updatedTicket.reporter.username },
        assignee: updatedTicket.assignee
          ? { id: updatedTicket.assignee.id, username: updatedTicket.assignee.username }
          : undefined,
      };

      return result;
    } catch (error) {
      // Przekaż błędy walidacji Zod bez zmian
      if (error instanceof z.ZodError) {
        throw error;
      }

      // Dla innych błędów, opakuj w bardziej przyjazny komunikat
      throw new Error(`Failed to update ticket: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Aktualizuje przypisanie ticketu (assignee)
   * Sprawdza uprawnienia użytkownika (ADMIN lub self-assignment) przed aktualizacją
   *
   * @param ticketId ID ticketu do aktualizacji
   * @param command Dane zawierające nowego assignee'a
   * @param userId ID użytkownika wykonującego operację
   * @returns Zaktualizowany ticket z pełnymi danymi
   * @throws Error jeśli ticket nie istnieje, użytkownik nie ma uprawnień, assignee nie istnieje lub wystąpi błąd bazy danych
   */
  async updateTicketAssignee(
    ticketId: string,
    command: UpdateTicketAssigneeCommand,
    userId: string
  ): Promise<TicketDTO> {
    // Walidacja danych wejściowych
    const validatedData = updateTicketAssigneeSchema.parse(command);

    try {
      // Najpierw sprawdź czy ticket istnieje i pobierz jego dane
      const { data: existingTicket, error: fetchError } = await this.supabase
        .from("tickets")
        .select("id, reporter_id, assignee_id")
        .eq("id", ticketId)
        .single();

      if (fetchError || !existingTicket) {
        throw new Error("Ticket not found");
      }

      // Sprawdź czy nowy assignee istnieje (jeśli nie jest null)
      if (validatedData.assignee_id !== null) {
        const { data: assigneeProfile, error: assigneeError } = await this.supabase
          .from("profiles")
          .select("id")
          .eq("id", validatedData.assignee_id)
          .single();

        if (assigneeError || !assigneeProfile) {
          throw new Error("Assignee not found");
        }
      }

      // Sprawdź uprawnienia: użytkownik musi być administratorem, przypisywać siebie lub odprzypisywać się od własnych ticketów
      const isSelfAssignment = validatedData.assignee_id === userId;
      const isSelfUnassignment = validatedData.assignee_id === null && existingTicket.assignee_id === userId;

      // Sprawdź rolę użytkownika - dla ADMIN pozwól na aktualizację
      let isAdmin = false;
      if (!isSelfAssignment && !isSelfUnassignment) {
        const { data: userProfile, error: profileError } = await this.supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .single();

        if (profileError || !userProfile) {
          throw new Error("User profile not found");
        }

        isAdmin = userProfile.role === "ADMIN";
      }

      if (!isSelfAssignment && !isSelfUnassignment && !isAdmin) {
        throw new Error(
          "Access denied: You don't have permission to assign this ticket. Only administrators can assign tickets to other users, or you can assign/unassign tickets to/from yourself."
        );
      }

      // Aktualizuj assignee_id ticketu
      const { error: updateError } = await this.supabase
        .from("tickets")
        .update({
          assignee_id: validatedData.assignee_id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", ticketId);

      if (updateError) {
        throw extractSupabaseError(updateError, "Failed to update ticket assignee");
      }

      // Pobierz zaktualizowane dane ticketu z reporter'em i assignee'em
      const { data: updatedTicket, error: refetchError } = await this.supabase
        .from("tickets")
        .select(
          `
          id,
          title,
          description,
          type,
          status,
          reporter_id,
          assignee_id,
          ai_enhanced,
          created_at,
          updated_at,
          reporter:profiles!tickets_reporter_id_fkey(id, username),
          assignee:profiles!tickets_assignee_id_fkey(id, username)
        `
        )
        .eq("id", ticketId)
        .single();

      if (refetchError || !updatedTicket) {
        throw new Error(`Failed to fetch updated ticket: ${refetchError?.message || "Unknown error"}`);
      }

      // Sprawdź czy reporter istnieje - powinien istnieć
      if (!updatedTicket.reporter) {
        throw new Error("Failed to fetch reporter data for updated ticket");
      }

      // Formatuj odpowiedź zgodnie z TicketDTO
      const result: TicketDTO = {
        id: updatedTicket.id,
        title: updatedTicket.title,
        description: updatedTicket.description,
        type: updatedTicket.type,
        status: updatedTicket.status,
        reporter_id: updatedTicket.reporter_id,
        assignee_id: updatedTicket.assignee_id,
        ai_enhanced: updatedTicket.ai_enhanced,
        created_at: updatedTicket.created_at,
        updated_at: updatedTicket.updated_at,
        reporter: { username: updatedTicket.reporter.username },
        assignee: updatedTicket.assignee ? { username: updatedTicket.assignee.username } : undefined,
      };

      return result;
    } catch (error) {
      // Przekaż błędy walidacji Zod bez zmian
      if (error instanceof z.ZodError) {
        throw error;
      }

      // Dla innych błędów, opakuj w bardziej przyjazny komunikat
      throw new Error(`Failed to update ticket assignee: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Usuwa istniejący ticket
   * Sprawdza uprawnienia użytkownika - tylko administratorzy mogą usuwać tickety
   *
   * @param ticketId ID ticketu do usunięcia
   * @param userId ID użytkownika wykonującego operację
   * @throws Error jeśli ticket nie istnieje, użytkownik nie ma uprawnień lub wystąpi błąd bazy danych
   */
  async deleteTicket(ticketId: string, userId: string): Promise<void> {
    try {
      // Najpierw sprawdź czy ticket istnieje
      const { data: existingTicket, error: fetchError } = await this.supabase
        .from("tickets")
        .select("id")
        .eq("id", ticketId)
        .single();

      if (fetchError || !existingTicket) {
        throw new Error("Ticket not found");
      }

      // Sprawdź rolę użytkownika - tylko ADMIN może usuwać tickety
      const { data: userProfile, error: profileError } = await this.supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (profileError || !userProfile) {
        throw new Error("User profile not found");
      }

      if (userProfile.role !== "ADMIN") {
        throw new Error("Access denied: Only administrators can delete tickets");
      }

      // Usuń ticket
      const { error: deleteError } = await this.supabase.from("tickets").delete().eq("id", ticketId);

      if (deleteError) {
        throw extractSupabaseError(deleteError, "Failed to delete ticket");
      }
    } catch (error) {
      // Przekaż błędy walidacji Zod bez zmian (choć nie ma walidacji w tej metodzie)
      if (error instanceof z.ZodError) {
        throw error;
      }

      // Dla innych błędów, opakuj w bardziej przyjazny komunikat
      throw new Error(`Failed to delete ticket: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}

/**
 * Factory function do tworzenia instancji TicketService
 * @param supabase Supabase client instance
 * @returns TicketService instance
 */
export function createTicketService(supabase: SupabaseClient<Database>): TicketService {
  return new TicketService(supabase);
}
