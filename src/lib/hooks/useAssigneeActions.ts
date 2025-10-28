import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { Assignee } from "@/types";

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
        const response = await fetch(`/api/tickets/${ticketId}/assignee`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ assignee_id: assigneeId }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to update assignee");
        }

        const updatedTicket = await response.json();
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
        toast.error("Failed to update assignee", {
          description: error instanceof Error ? error.message : "An unexpected error occurred",
        });
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
