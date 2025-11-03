import { useState, useCallback } from "react";
import { toast } from "../../components/ui/sonner";
import type { FullTicketDTO } from "../../types";
import type { TicketFormData } from "../validation/schemas/ticket";
import { createTicket, updateTicket, getTicket, updateTicketAssignee, TicketNotFoundError } from "../api";

/**
 * Custom hook do zarządzania stanem modalu ticketa
 * Obsługuje ładowanie, zapisywanie i walidację formularza
 */
export const useTicketModal = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  /**
   * Tworzy nowego ticketa
   */
  const createTicketModal = useCallback(async (data: TicketFormData): Promise<FullTicketDTO | null> => {
    setIsSubmitting(true);
    setLastError(null);

    try {
      const requestData = {
        title: data.title,
        description: data.description,
        type: data.type,
        assignee: data.assignee || null, // Ensure assignee is null when not provided
      };

      const createdTicket = await createTicket(requestData);
      toast.success("Ticket created successfully");
      return createdTicket;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create ticket";
      setLastError(message);
      toast.error(message);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  /**
   * Aktualizuje istniejącego ticketa
   */
  const updateTicketModal = useCallback(
    async (ticketId: string, data: TicketFormData): Promise<FullTicketDTO | null> => {
      setIsSubmitting(true);
      setLastError(null);

      try {
        const requestData = {
          title: data.title,
          description: data.description,
          type: data.type,
          assignee_id: data.assignee ? data.assignee.id : null,
        };

        const updatedTicket = await updateTicket(ticketId, requestData);
        toast.success("Ticket updated successfully");
        return updatedTicket;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to update ticket";
        setLastError(message);
        toast.error(message);
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  /**
   * Ładuje dane ticketa
   */
  const loadTicket = useCallback(async (ticketId: string): Promise<FullTicketDTO | null> => {
    try {
      const ticket = await getTicket(ticketId);
      return ticket;
    } catch (error) {
      if (error instanceof TicketNotFoundError) {
        toast.error("Ticket not found");
        return null;
      }
      const message = error instanceof Error ? error.message : "Failed to load ticket";
      toast.error(message);
      return null;
    }
  }, []);

  /**
   * Aktualizuje przypisanie ticketa
   */
  const updateAssignee = useCallback(async (ticketId: string, assigneeId: string | null): Promise<boolean> => {
    try {
      await updateTicketAssignee(ticketId, { assignee_id: assigneeId });
      toast.success("Assignee updated successfully");
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update assignee";
      toast.error(message);
      return false;
    }
  }, []);

  return {
    isSubmitting,
    lastError,
    createTicket: createTicketModal,
    updateTicket: updateTicketModal,
    loadTicket,
    updateAssignee,
  };
};
