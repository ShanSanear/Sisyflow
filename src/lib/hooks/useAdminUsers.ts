import { useState, useEffect, useCallback } from "react";
import { useUser } from "./useUser";
import { useToast } from "./useToast";
import type { UserViewModel, CreateUserCommand } from "@/types";
import {
  getUsers,
  createUser,
  deleteUser as deleteUserApi,
  UserAlreadyExistsError,
  UserNotFoundError,
  UserValidationError,
  ForbiddenError,
} from "../api";

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
      const data = await getUsers({ limit: 100 });
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
        const newUser = await createUser(command);
        setUsers((prev) => [...prev, newUser]);
        showSuccess("User added successfully.");
      } catch (error) {
        if (error instanceof UserAlreadyExistsError) {
          showError("User with this username or email already exists.");
          return;
        }
        if (error instanceof UserValidationError) {
          showError(error.message || "Invalid user data provided.");
          return;
        }
        showError("An error occurred while adding the user.");
        throw error;
      }
    },
    [showSuccess, showError]
  );

  /**
   * Deletes a user
   */
  const deleteUserHook = useCallback(
    async (userId: string) => {
      try {
        // Set isDeleting flag
        setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, isDeleting: true } : user)));

        await deleteUserApi(userId);

        setUsers((prev) => prev.filter((user) => user.id !== userId));
        showSuccess("User deleted successfully.");
      } catch (error) {
        // Reset isDeleting flag
        setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, isDeleting: false } : user)));

        if (error instanceof UserNotFoundError) {
          showError("User not found.");
          return;
        }
        if (error instanceof ForbiddenError) {
          showError("You don't have permission to delete this user.");
          return;
        }

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
    deleteUser: deleteUserHook,
    refetchUsers: fetchUsers,
  };
};
