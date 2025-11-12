import React, { createContext, type ReactNode } from "react";
import { useUser } from "../../lib/hooks/useUser";
import type { ProfileDTO } from "../../types";

/**
 * Interfejs kontekstu użytkownika
 */
interface UserContextType {
  user: ProfileDTO | null;
  currentUser: { id: string; role: "USER" | "ADMIN" } | null;
  isAdmin: boolean;
  isLoading: boolean;
  error: Error | null;
  refetchUser: () => Promise<void>;
}

/**
 * Kontekst do przechowywania stanu użytkownika
 */
export const UserContext = createContext<UserContextType | undefined>(undefined);

/**
 * Props dla UserProvider
 */
interface UserProviderProps {
  children: ReactNode;
}

/**
 * Provider kontekstu użytkownika
 * Udostępnia stan użytkownika wszystkim podkomponentom
 */
export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const userState = useUser();

  return <UserContext.Provider value={userState}>{children}</UserContext.Provider>;
};
