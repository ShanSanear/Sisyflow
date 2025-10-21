import React, { createContext, useContext, useState, type ReactNode } from "react";
import type { FullTicketDTO } from "../../types";

export type TicketModalMode = "create" | "edit" | "view";

interface TicketModalContextType {
  isOpen: boolean;
  mode: TicketModalMode;
  ticketId?: string;
  setOpen: (data: { mode: TicketModalMode; ticketId?: string }) => void;
  onClose: () => void;
  onSave: (ticket: FullTicketDTO) => void;
}

const TicketModalContext = createContext<TicketModalContextType | undefined>(undefined);

interface TicketModalProviderProps {
  children: ReactNode;
  onSave?: (ticket: FullTicketDTO) => void;
}

export const TicketModalProvider: React.FC<TicketModalProviderProps> = ({ children, onSave = () => undefined }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<TicketModalMode>("create");
  const [ticketId, setTicketId] = useState<string | undefined>();

  const setOpen = ({ mode, ticketId }: { mode: TicketModalMode; ticketId?: string }) => {
    setMode(mode);
    setTicketId(ticketId);
    setIsOpen(true);
  };

  const onClose = () => {
    setIsOpen(false);
    setMode("create");
    setTicketId(undefined);
  };

  const contextValue: TicketModalContextType = {
    isOpen,
    mode,
    ticketId,
    setOpen,
    onClose,
    onSave,
  };

  return <TicketModalContext.Provider value={contextValue}>{children}</TicketModalContext.Provider>;
};

export const useTicketModal = () => {
  const context = useContext(TicketModalContext);
  if (context === undefined) {
    throw new Error("useTicketModal must be used within a TicketModalProvider");
  }
  return context;
};
