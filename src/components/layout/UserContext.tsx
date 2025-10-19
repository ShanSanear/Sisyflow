import React, { createContext, useContext, type ReactNode } from "react";
import { useUser } from "../../hooks/useUser";
import type { UserViewModel } from "./types";

/**
 * Interfejs kontekstu użytkownika
 */
interface UserContextType {
  user: UserViewModel | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Kontekst do przechowywania stanu użytkownika
 */
const UserContext = createContext<UserContextType | undefined>(undefined);

/**
 * Hook do używania kontekstu użytkownika
 * Rzuca błąd jeśli używany poza UserProvider
 */
export const useUserContext = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
};

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
