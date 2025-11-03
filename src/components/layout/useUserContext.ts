import { useContext } from "react";
import { UserContext } from "./UserContext";

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
