import React from "react";
import { NavigationBar } from "./NavigationBar";
import { UserProvider } from "./UserContext";
import { TicketModalProvider } from "../../lib/contexts/TicketModalContext";
import { TicketModal } from "../TicketModal";

export const NavigationBarIsland: React.FC = () => {
  return (
    <UserProvider>
      <TicketModalProvider>
        <NavigationBar />
        <TicketModal />
      </TicketModalProvider>
    </UserProvider>
  );
};
