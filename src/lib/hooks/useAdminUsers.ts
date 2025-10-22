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
   * Fetches list of users from API
   * For MVP, fetches all users with a high limit instead of implementing pagination controls
   */
  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Use high limit to get all users for MVP (no pagination UI)
      const response = await fetch("/api/users?limit=100", {
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
   * Adds a new user
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
          showError("User with this username or email already exists.");
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const newUser: UserDTO = await response.json();
        setUsers((prev) => [...prev, newUser]);
        showSuccess("User added successfully.");
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error occurred");
        showError("An error occurred while adding the user.");
        throw error;
      }
    },
    [showSuccess, showError]
  );

  /**
   * Deletes a user
   */
  const deleteUser = useCallback(
    async (userId: string) => {
      try {
        // Set isDeleting flag
        setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, isDeleting: true } : user)));

        const response = await fetch(`/api/users/${userId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.status === 404) {
          showError("User not found.");
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        setUsers((prev) => prev.filter((user) => user.id !== userId));
        showSuccess("User deleted successfully.");
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error occurred");
        // Reset isDeleting flag
        setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, isDeleting: false } : user)));
        showError("Failed to delete user.");
        throw error;
      }
    },
    [showSuccess, showError]
  );

  // Fetch users on mount
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
