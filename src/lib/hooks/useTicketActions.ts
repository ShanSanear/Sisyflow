import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { FullTicketDTO, UserDTO, TicketModalMode } from "@/types";
import type { TicketFormData } from "@/lib/validation/schemas/ticket";

interface UseTicketActionsProps {
  user: UserDTO | null;
  mode: TicketModalMode;
  ticketId?: string;
  ticket?: FullTicketDTO;
  onSave: (ticket: FullTicketDTO) => void;
  onClose: () => void;
  onFormReset: (data?: Partial<TicketFormData>) => void;
  setOpen: (params: { mode: TicketModalMode; ticketId: string }) => void;
}

export const useTicketActions = ({
  user,
  mode,
  ticketId,
  ticket,
  onSave,
  onClose,
  onFormReset,
  setOpen,
}: UseTicketActionsProps) => {
  const [isAssigneeModified, setIsAssigneeModified] = useState(false);

  const onAssigneeChange = useCallback(() => {
    setIsAssigneeModified(true);
  }, []);

  const handleSave = useCallback(
    async (data: TicketFormData) => {
      if (!user) return;

      try {
        let response: Response;

        let requestBody: Partial<TicketFormData>;

        if (mode === "create") {
          requestBody = data;
        } else if (mode === "edit" && ticketId && ticket) {
          // Safety net: Restore assignee if undefined/null in data due to desync, but only if not explicitly modified
          const originalAssignee = ticket.assignee
            ? { id: ticket.assignee.id, username: ticket.assignee.username }
            : null;
          if (!isAssigneeModified && (data.assignee === null || data.assignee === undefined) && originalAssignee) {
            data.assignee = originalAssignee;
          }

          // Compute changed fields
          const changed: Partial<TicketFormData> = {};
          if (data.title !== ticket.title) {
            changed.title = data.title;
          }
          if (data.description !== (ticket.description || "")) {
            changed.description = data.description;
          }
          if (data.type !== ticket.type) {
            changed.type = data.type;
          }
          // Deep compare for assignee
          if (JSON.stringify(data.assignee) !== JSON.stringify(originalAssignee)) {
            changed.assignee = data.assignee;
          }

          if (Object.keys(changed).length === 0) {
            toast.info("No changes detected");
            return;
          }

          requestBody = changed;
        } else {
          throw new Error("Invalid mode or missing ticket ID");
        }

        if (mode === "create") {
          response = await fetch("/api/tickets", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
          });
        } else {
          response = await fetch(`/api/tickets/${ticketId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
          });
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to save ticket");
        }

        const savedTicket: FullTicketDTO = await response.json();
        onSave(savedTicket);

        // Emit custom event for components to react to ticket changes
        window.dispatchEvent(new CustomEvent("ticket:saved", { detail: savedTicket }));

        toast.success(mode === "create" ? "Ticket created" : "Ticket updated");
        onClose();
      } catch (error) {
        console.error("Error saving ticket:", error);
        toast.error(error instanceof Error ? error.message : "Failed to save ticket");
      }
    },
    [user, mode, ticketId, ticket, isAssigneeModified, onSave, onClose]
  );

  // Handler do przełączania w tryb edycji
  const handleEditMode = useCallback(() => {
    if (ticket) {
      // Resetuj formData do wartości z ticket (zachowaj dane ale wyczyść ewentualne niezapisane zmiany)
      const formData = {
        title: ticket.title,
        description: ticket.description || "",
        type: ticket.type,
        assignee: ticket.assignee,
      };
      setIsAssigneeModified(false);
      onFormReset(formData);

      // Przełącz na tryb edit
      setOpen({ mode: "edit", ticketId: ticket.id });
    }
  }, [ticket, onFormReset, setOpen]);

  return {
    handleSave,
    handleEditMode,
    onAssigneeChange,
  };
};
