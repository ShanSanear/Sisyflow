import { useState, useEffect, useCallback } from "react";
import type { UserDTO } from "../../types";

/**
 * Hook do zarządzania stanem zalogowanego użytkownika
 * Abstrahuje logikę pobierania i cachowania danych użytkownika
 */
export const useUser = () => {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Sprawdza czy użytkownik jest administratorem
   */
  const isAdmin = user?.role === "ADMIN";

  /**
   * Pobiera dane użytkownika z API
   */
  const fetchUser = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/profiles/me", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 404) {
          // Nieprawidłowa sesja - przekierowanie na login
          window.location.href = "/login";
          return;
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const userData: UserDTO = await response.json();
      setUser(userData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error occurred");
      setError(error);
      console.error("Error fetching user data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Pobierz dane użytkownika przy montowaniu komponentu
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    user,
    isAdmin,
    isLoading,
    error,
    refetchUser: fetchUser, // Możliwość ponownego pobrania danych
  };
};
