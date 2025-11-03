import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { Assignee } from "@/types";
import { updateTicketAssignee, TicketNotFoundError, TicketValidationError, TicketForbiddenError } from "../api";

interface UseAssigneeActionsProps {
  ticketId?: string;
  onAssign?: (assignee: Assignee | null) => void;
}

interface UseAssigneeActionsReturn {
  updateAssignee: (assigneeId: string | null) => Promise<void>;
  isUpdating: boolean;
}

/**
 * Hook do zarządzania akcjami przypisywania użytkowników do ticketów
 * Abstrahuje logikę aktualizacji assignee'a przez API
 */
export const useAssigneeActions = ({ ticketId, onAssign }: UseAssigneeActionsProps): UseAssigneeActionsReturn => {
  const [isUpdating, setIsUpdating] = useState(false);

  const updateAssignee = useCallback(
    async (assigneeId: string | null) => {
      if (!ticketId) {
        console.warn("useAssigneeActions: ticketId is required");
        return;
      }

      // Check if online
      if (!navigator.onLine) {
        toast.error("No internet connection", {
          description: "Please check your connection and try again",
        });
        return;
      }

      setIsUpdating(true);
      try {
        const updatedTicket = await updateTicketAssignee(ticketId, { assignee_id: assigneeId });
        // The API returns the full ticket, but we need to pass the assignee to the callback
        const assignee = updatedTicket.assignee
          ? {
              id: updatedTicket.assignee.id,
              username: updatedTicket.assignee.username,
            }
          : null;
        onAssign?.(assignee);

        // Emit custom event for components to react to ticket changes
        window.dispatchEvent(new CustomEvent("ticket:saved", { detail: updatedTicket }));
      } catch (error) {
        console.error("Error updating assignee:", error);

        if (error instanceof TicketNotFoundError) {
          toast.error("Ticket not found.");
        } else if (error instanceof TicketValidationError) {
          toast.error("Invalid assignee update.");
        } else if (error instanceof TicketForbiddenError) {
          toast.error("You don't have permission to update this ticket's assignee.");
        } else {
          toast.error("Failed to update assignee", {
            description: error instanceof Error ? error.message : "An unexpected error occurred",
          });
        }
        throw error; // Re-throw to allow caller to handle rollback
      } finally {
        setIsUpdating(false);
      }
    },
    [ticketId, onAssign]
  );

  return {
    updateAssignee,
    isUpdating,
  };
};
