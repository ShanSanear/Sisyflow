import { useState, useEffect, useCallback } from "react";
import { useUser } from "./useUser";
import { useToast } from "./useToast";
import type { UserDTO, UserViewModel, CreateUserCommand, PaginatedUsersResponseDTO } from "@/types";

/**
 * Hook do zarządzania użytkownikami w panelu administratora
 */
export const useAdminUsers = () => {
  const [users, setUsers] = useState<UserViewModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user: currentUser } = useUser();
  const { showSuccess, showError } = useToast();

  /**
   * Pobiera listę użytkowników z API
   */
  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/users", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: PaginatedUsersResponseDTO = await response.json();
      setUsers(data.users);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error occurred");
      setError(error);
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Dodaje nowego użytkownika
   */
  const addUser = useCallback(
    async (command: CreateUserCommand) => {
      try {
        const response = await fetch("/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(command),
        });

        if (response.status === 409) {
          showError("Użytkownik o tej nazwie lub adresie e-mail już istnieje.");
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const newUser: UserDTO = await response.json();
        setUsers((prev) => [...prev, newUser]);
        showSuccess("Użytkownik został dodany pomyślnie.");
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error occurred");
        showError("Wystąpił błąd podczas dodawania użytkownika.");
        throw error;
      }
    },
    [showSuccess, showError]
  );

  /**
   * Usuwa użytkownika
   */
  const deleteUser = useCallback(
    async (userId: string) => {
      try {
        // Ustaw flagę isDeleting
        setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, isDeleting: true } : user)));

        const response = await fetch(`/api/users/${userId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        setUsers((prev) => prev.filter((user) => user.id !== userId));
        showSuccess("Użytkownik został usunięty pomyślnie.");
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error occurred");
        // Resetuj flagę isDeleting
        setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, isDeleting: false } : user)));
        showError("Nie udało się usunąć użytkownika.");
        throw error;
      }
    },
    [showSuccess, showError]
  );

  // Pobierz użytkowników przy montowaniu
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    isLoading,
    error,
    currentUser,
    addUser,
    deleteUser,
    refetchUsers: fetchUsers,
  };
};
