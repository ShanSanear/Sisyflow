import React from "react";
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { TicketModalMode } from "@/types";

interface TicketModalHeaderProps {
  mode: TicketModalMode;
}

export const TicketModalHeader: React.FC<TicketModalHeaderProps> = ({ mode }) => {
  const getTitle = () => {
    switch (mode) {
      case "create":
        return "Create new ticket";
      case "edit":
        return "Edit ticket";
      case "view":
        return "View ticket";
      default:
        return "Ticket";
    }
  };

  const getDescription = () => {
    switch (mode) {
      case "create":
        return "Fill in the details to create a new ticket";
      case "edit":
        return "Make changes to the ticket details";
      case "view":
        return "View ticket information";
      default:
        return "";
    }
  };

  return (
    <DialogHeader data-testid="ticket-modal-header">
      <DialogTitle data-testid="ticket-modal-title">{getTitle()}</DialogTitle>
      <DialogDescription data-testid="ticket-modal-description">{getDescription()}</DialogDescription>
    </DialogHeader>
  );
};
