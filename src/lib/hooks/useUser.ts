import { useState, useEffect, useCallback } from "react";
import type { ProfileDTO } from "../../types";
import type { UserViewModel } from "../../components/layout/types";

/**
 * Hook do zarządzania stanem zalogowanego użytkownika
 * Abstrahuje logikę pobierania i cachowania danych użytkownika
 */
export const useUser = () => {
  const [user, setUser] = useState<UserViewModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Funkcja pomocnicza do tworzenia inicjałów z username
   */
  const createInitials = useCallback((username: string): string => {
    return username
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("");
  }, []);

  /**
   * Mapuje ProfileDTO na UserViewModel
   */
  const mapProfileToViewModel = useCallback(
    (profile: ProfileDTO): UserViewModel => {
      return {
        username: profile.username,
        role: profile.role,
        initials: createInitials(profile.username),
      };
    },
    [createInitials]
  );

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

      const profileData: ProfileDTO = await response.json();
      const userViewModel = mapProfileToViewModel(profileData);

      setUser(userViewModel);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error occurred");
      setError(error);
      console.error("Error fetching user data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [mapProfileToViewModel]);

  // Pobierz dane użytkownika przy montowaniu komponentu
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    user,
    isLoading,
    error,
    refetch: fetchUser, // Możliwość ponownego pobrania danych
  };
};
