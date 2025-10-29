import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { FullTicketDTO } from "@/types";
import type { TicketModalMode } from "@/types";
import type { TicketFormData } from "@/lib/validation/schemas/ticket";

interface UseTicketDataProps {
  mode: TicketModalMode;
  ticketId?: string;
  onClose: () => void;
  onFormReset: (data?: Partial<TicketFormData>) => void;
}

export const useTicketData = ({ mode, ticketId, onClose, onFormReset }: UseTicketDataProps) => {
  const [ticket, setTicket] = useState<FullTicketDTO | undefined>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mode === "edit" || mode === "view") {
      if (!ticketId) return;

      const fetchTicket = async () => {
        setLoading(true);
        try {
          const response = await fetch(`/api/tickets/${ticketId}`);
          if (!response.ok) {
            throw new Error("Failed to fetch ticket");
          }
          const ticketData: FullTicketDTO = await response.json();
          setTicket(ticketData);

          const formData = {
            title: ticketData.title,
            description: ticketData.description || "",
            type: ticketData.type,
            assignee: ticketData.assignee
              ? { id: ticketData.assignee.id, username: ticketData.assignee.username }
              : undefined,
          };
          onFormReset(formData);
        } catch (error) {
          console.error("Error fetching ticket:", error);
          toast.error("Failed to load ticket");
          onClose();
        } finally {
          setLoading(false);
        }
      };

      fetchTicket();
    } else {
      // Reset dla trybu create
      setTicket(undefined);
      onFormReset();
    }
  }, [mode, ticketId, onClose, onFormReset]);

  const updateAssignee = (newAssignee: { id: string; username: string } | null) => {
    if (ticket) {
      setTicket({
        ...ticket,
        assignee: newAssignee || undefined,
      });
    }
  };

  return {
    ticket,
    loading,
    updateAssignee,
  };
};
