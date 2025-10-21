import React from "react";
import { NavigationBar } from "./NavigationBar";
import { UserProvider } from "./UserContext";
import { TicketModalProvider } from "../../lib/contexts/TicketModalContext";

export const NavigationBarIsland: React.FC = () => {
  return (
    <UserProvider>
      <TicketModalProvider>
        <NavigationBar />
      </TicketModalProvider>
    </UserProvider>
  );
};
