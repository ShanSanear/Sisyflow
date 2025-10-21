import React, { createContext, useContext, type ReactNode } from "react";
import { useUser } from "../../lib/hooks/useUser";
import type { UserDTO } from "../../types";

/**
 * Interfejs kontekstu użytkownika
 */
interface UserContextType {
  user: UserDTO | null;
  isAdmin: boolean;
  isLoading: boolean;
  error: Error | null;
  refetchUser: () => Promise<void>;
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
