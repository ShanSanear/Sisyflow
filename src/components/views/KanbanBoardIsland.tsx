import React from "react";
import { KanbanBoardView } from "./KanbanBoardView";
import { TicketModalProvider } from "../../lib/contexts/TicketModalContext";
import { TicketModal } from "../TicketModal";
import { UserProvider } from "../layout/UserContext";

export const KanbanBoardIsland: React.FC = () => {
  return (
    <UserProvider>
      <TicketModalProvider>
        <KanbanBoardView />
        <TicketModal />
      </TicketModalProvider>
    </UserProvider>
  );
};
