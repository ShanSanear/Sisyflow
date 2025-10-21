import { useState, useCallback } from "react";
import { toast } from "../../components/ui/sonner";
import type { FullTicketDTO } from "../../types";
import type { TicketFormData } from "../validation/schemas/ticket";

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
  const createTicket = useCallback(async (data: TicketFormData): Promise<FullTicketDTO | null> => {
    setIsSubmitting(true);
    setLastError(null);

    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to create ticket" }));
        throw new Error(errorData.message || "Failed to create ticket");
      }

      const createdTicket: FullTicketDTO = await response.json();
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
  const updateTicket = useCallback(async (ticketId: string, data: TicketFormData): Promise<FullTicketDTO | null> => {
    setIsSubmitting(true);
    setLastError(null);

    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to update ticket" }));
        throw new Error(errorData.message || "Failed to update ticket");
      }

      const updatedTicket: FullTicketDTO = await response.json();
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
  }, []);

  /**
   * Ładuje dane ticketa
   */
  const loadTicket = useCallback(async (ticketId: string): Promise<FullTicketDTO | null> => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`);

      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Ticket not found");
          return null;
        }
        throw new Error("Failed to load ticket");
      }

      const ticket: FullTicketDTO = await response.json();
      return ticket;
    } catch (error) {
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
      const response = await fetch(`/api/tickets/${ticketId}/assignee`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ assignee_id: assigneeId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to update assignee" }));
        throw new Error(errorData.message || "Failed to update assignee");
      }

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
    createTicket,
    updateTicket,
    loadTicket,
    updateAssignee,
  };
};
