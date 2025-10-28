import { useEffect } from "react";
import { toast } from "sonner";
import type { FullTicketDTO, UserDTO } from "@/types";
import type { TicketModalMode } from "@/types";

interface UseTicketPermissionsProps {
  mode: TicketModalMode;
  ticket?: FullTicketDTO;
  user: UserDTO | null;
  isAdmin: boolean;
  setOpen: (params: { mode: TicketModalMode; ticketId: string }) => void;
}

export const useTicketPermissions = ({ mode, ticket, user, isAdmin, setOpen }: UseTicketPermissionsProps) => {
  // Sprawdzenie uprawnień - jeśli nie admin i nie właściciel, przełącz na view
  useEffect(() => {
    if (mode === "edit" && ticket && user && !isAdmin && ticket.reporter.id !== user.id) {
      toast.warning("You don't have permission to edit this ticket. Switching to view mode.");
      setOpen({ mode: "view", ticketId: ticket.id });
    }
  }, [mode, ticket, user, isAdmin, setOpen]);

  // Funkcja sprawdzająca czy użytkownik może edytować ticket
  const canEditTicket = (ticket: FullTicketDTO | undefined, user: UserDTO | null, isAdmin: boolean): boolean => {
    return isAdmin || Boolean(ticket && user && ticket.reporter.id === user.id);
  };

  return {
    canEditTicket,
  };
};
