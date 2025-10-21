import React from "react";
import { KanbanBoardView } from "./KanbanBoardView";
import { TicketModalProvider } from "../../lib/contexts/TicketModalContext";
import { TicketModal } from "../TicketModal";

export const KanbanBoardIsland: React.FC = () => {
  return (
    <TicketModalProvider>
      <KanbanBoardView />
      <TicketModal />
    </TicketModalProvider>
  );
};
