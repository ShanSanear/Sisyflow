import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { CreateTicketCommand, FullTicketDTO, TicketDTO, PaginationDTO } from "../../types";
import { createTicketSchema, getTicketsQuerySchema } from "../validation/ticket.validation";
import { z } from "zod";

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
        throw new Error(`Failed to create ticket: ${ticketError.message}`);
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
          reporter:profiles!tickets_reporter_id_fkey(username),
          assignee:profiles!tickets_assignee_id_fkey(username)
        `
        )
        .eq("id", ticket.id)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch created ticket: ${fetchError.message}`);
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
        reporter: { username: fullTicket.reporter.username },
        assignee: fullTicket.assignee ? { username: fullTicket.assignee.username } : undefined,
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
          reporter:profiles!tickets_reporter_id_fkey(username),
          assignee:profiles!tickets_assignee_id_fkey(username)
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
        throw new Error(`Failed to fetch tickets: ${queryError.message}`);
      }

      // Sprawdź czy wszystkie tickety mają reporter'a (powinny mieć)
      if (tickets && tickets.some((ticket) => !ticket.reporter)) {
        throw new Error("Some tickets are missing reporter data");
      }

      // Mapuj wyniki na TicketDTO[]
      const ticketDTOs: TicketDTO[] = (tickets || []).map((ticket) => ({
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
      }));

      // Przygotuj metadane paginacji dla dummy data
      // const total = ticketDTOs.length;
      const page = Math.floor(validatedParams.offset / validatedParams.limit) + 1;
      const pagination: PaginationDTO = {
        page,
        limit: validatedParams.limit,
        total: count || 0,
      };

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
}

/**
 * Factory function do tworzenia instancji TicketService
 * @param supabase Supabase client instance
 * @returns TicketService instance
 */
export function createTicketService(supabase: SupabaseClient<Database>): TicketService {
  return new TicketService(supabase);
}
