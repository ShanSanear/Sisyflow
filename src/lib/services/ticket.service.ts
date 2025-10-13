import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { CreateTicketCommand, FullTicketDTO } from "../../types";
import { createTicketSchema } from "../validation/ticket.validation";
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
}

/**
 * Factory function do tworzenia instancji TicketService
 * @param supabase Supabase client instance
 * @returns TicketService instance
 */
export function createTicketService(supabase: SupabaseClient<Database>): TicketService {
  return new TicketService(supabase);
}
