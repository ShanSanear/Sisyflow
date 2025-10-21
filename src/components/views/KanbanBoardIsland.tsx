import React from "react";
import { KanbanBoardView } from "./KanbanBoardView";
import { TicketModalProvider } from "../../lib/contexts/TicketModalContext";

export const KanbanBoardIsland: React.FC = () => {
  return (
    <TicketModalProvider>
      <KanbanBoardView />
    </TicketModalProvider>
  );
};
