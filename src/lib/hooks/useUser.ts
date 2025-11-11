import { useState, useEffect, useCallback } from "react";
import type { ProfileDTO } from "../../types";
import { ApiError, getCurrentUserProfile } from "../api";

interface CurrentUser {
  id: string;
  role: "USER" | "ADMIN";
}

/**
 * Hook do zarządzania stanem zalogowanego użytkownika
 * Abstrahuje logikę pobierania i cachowania danych użytkownika
 */
export const useUser = () => {
  const [user, setUser] = useState<ProfileDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Sprawdza czy użytkownik jest administratorem
   */
  const isAdmin = user?.role === "ADMIN";

  /**
   * Simplified current user object for authorization purposes
   */
  const currentUser: CurrentUser | null = user
    ? {
        id: user.id,
        role: user.role,
      }
    : null;

  /**
   * Pobiera dane użytkownika z API
   */
  const fetchUser = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const userData = await getCurrentUserProfile();
      setUser(userData);
    } catch (err) {
      const error = err as ApiError;
      setError(error);

      if (error.status === 401 || error.status === 404) {
        // Nieprawidłowa sesja - przekierowanie na login
        window.location.href = "/login";
        return;
      }

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
    currentUser,
    isAdmin,
    isLoading,
    error,
    refetchUser: fetchUser, // Możliwość ponownego pobrania danych
  };
};
