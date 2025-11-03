import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { FullTicketDTO, UserDTO, TicketModalMode, CreateTicketCommand, UpdateTicketCommand } from "@/types";
import type { TicketFormData } from "@/lib/validation/schemas/ticket";
import { createTicket, updateTicket, TicketValidationError, TicketForbiddenError } from "../api";

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
          const changed: Partial<UpdateTicketCommand> = {};
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
            changed.assignee_id = data.assignee ? data.assignee.id : null;
          }

          if (Object.keys(changed).length === 0) {
            toast.info("No changes detected");
            return;
          }

          requestBody = changed;
        } else {
          throw new Error("Invalid mode or missing ticket ID");
        }

        let savedTicket: FullTicketDTO;

        if (mode === "create") {
          savedTicket = await createTicket(requestBody as CreateTicketCommand);
        } else if (ticketId) {
          savedTicket = await updateTicket(ticketId, requestBody as UpdateTicketCommand);
        } else {
          throw new Error("Ticket ID is required for update mode");
        }
        onSave(savedTicket);

        // Emit custom event for components to react to ticket changes
        window.dispatchEvent(new CustomEvent("ticket:saved", { detail: savedTicket }));

        toast.success(mode === "create" ? "Ticket created" : "Ticket updated");
        onClose();
      } catch (error) {
        console.error("Error saving ticket:", error);

        if (error instanceof TicketValidationError) {
          toast.error(error.message || "Invalid ticket data provided.");
          return;
        }
        if (error instanceof TicketForbiddenError) {
          toast.error("You don't have permission to perform this action.");
          return;
        }

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
