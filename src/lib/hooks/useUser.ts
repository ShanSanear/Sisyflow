import { useState, useEffect, useCallback } from "react";
import type { ProfileDTO } from "../../types";
import { ApiError, getCurrentUserProfile } from "../api";

interface CurrentUser {
  id: string;
  role: "USER" | "ADMIN";
}

// Shared state across all useUser hook instances
// This prevents multiple API calls when useUser is used in multiple components
let sharedUser: ProfileDTO | null = null;
let sharedError: Error | null = null;
let fetchPromise: Promise<ProfileDTO> | null = null;
let isLoadingShared = false;
const subscribers = new Set<() => void>();

/**
 * Notify all subscribers that user data has changed
 */
const notifySubscribers = () => {
  subscribers.forEach((callback) => callback());
};

/**
 * Hook do zarządzania stanem zalogowanego użytkownika
 * Abstrahuje logikę pobierania i cachowania danych użytkownika
 * Uses singleton pattern to prevent multiple API calls
 */
export const useUser = () => {
  const [user, setUser] = useState<ProfileDTO | null>(sharedUser);
  const [isLoading, setIsLoading] = useState(isLoadingShared);
  const [error, setError] = useState<Error | null>(sharedError);

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
   * Uses singleton pattern to prevent multiple simultaneous API calls
   */
  const fetchUser = useCallback(async () => {
    // If there's already a fetch in progress, wait for it
    if (fetchPromise) {
      try {
        await fetchPromise;
        // Update local state - sharedUser should already be set by the original fetch
        setUser(sharedUser);
        setError(null);
        setIsLoading(false);
        // No need to notify subscribers here - the original fetch already did that
        return;
      } catch (err) {
        const error = err as ApiError;
        // Update local state - sharedError should already be set by the original fetch
        setError(sharedError);
        setUser(null);
        setIsLoading(false);
        // No need to notify subscribers here - the original fetch already did that

        if (error.status === 401 || error.status === 404) {
          // Nieprawidłowa sesja - przekierowanie na login
          window.location.href = "/login";
          return;
        }

        console.error("Error fetching user data:", error);
        return;
      }
    }

    // If we already have user data, use it
    if (sharedUser) {
      setUser(sharedUser);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Start new fetch
    try {
      setIsLoading(true);
      setError(null);
      isLoadingShared = true;

      // Create and store the promise so other instances can wait for it
      fetchPromise = getCurrentUserProfile();

      const userData = await fetchPromise;
      sharedUser = userData;
      sharedError = null;
      setUser(userData);
      setError(null);
      notifySubscribers();
    } catch (err) {
      const error = err as ApiError;
      sharedError = error;
      sharedUser = null;
      setError(error);
      setUser(null);
      notifySubscribers();

      if (error.status === 401 || error.status === 404) {
        // Nieprawidłowa sesja - przekierowanie na login
        window.location.href = "/login";
        return;
      }

      console.error("Error fetching user data:", error);
    } finally {
      setIsLoading(false);
      isLoadingShared = false;
      fetchPromise = null;
    }
  }, []);

  // Subscribe to shared state changes
  useEffect(() => {
    const updateState = () => {
      setUser(sharedUser);
      setError(sharedError);
      setIsLoading(isLoadingShared);
    };

    subscribers.add(updateState);

    // If we already have shared data, use it immediately
    if (sharedUser) {
      updateState();
    } else {
      // Always call fetchUser - it will handle waiting for existing promises
      // and prevent duplicate API calls
      void fetchUser();
    }

    return () => {
      subscribers.delete(updateState);
    };
  }, [fetchUser]);

  /**
   * Force refetch user data, clearing cache
   */
  const retry = useCallback(async () => {
    if (!sharedError) {
      return;
    }
    // Clear cache to force refetch
    sharedUser = null;
    sharedError = null;
    fetchPromise = null;
    isLoadingShared = false;
    await fetchUser();
  }, [fetchUser]);

  return {
    user,
    currentUser,
    isAdmin,
    isLoading,
    error,
    retry, // Możliwość ponownego pobrania danych
  };
};
