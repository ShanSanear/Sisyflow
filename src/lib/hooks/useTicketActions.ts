import { useCallback } from "react";
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
  const handleSave = useCallback(
    async (data: TicketFormData) => {
      if (!user) return;

      try {
        let response: Response;
        console.log("handleSave data:", data);
        console.log("HandleSave mode:", mode);

        if (mode === "create") {
          response = await fetch("/api/tickets", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          });
        } else if (mode === "edit" && ticketId) {
          response = await fetch(`/api/tickets/${ticketId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          });
        } else {
          throw new Error("Invalid mode or missing ticket ID");
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
    [user, mode, ticketId, onSave, onClose]
  );

  // Handler do przełączania w tryb edycji
  const handleEditMode = useCallback(() => {
    if (ticket) {
      // Resetuj formData do wartości z ticket (zachowaj dane ale wyczyść ewentualne niezapisane zmiany)
      const formData = {
        title: ticket.title,
        description: ticket.description || "",
        type: ticket.type,
      };
      onFormReset(formData);

      // Przełącz na tryb edit
      setOpen({ mode: "edit", ticketId: ticket.id });
    }
  }, [ticket, onFormReset, setOpen]);

  return {
    handleSave,
    handleEditMode,
  };
};
