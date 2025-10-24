import { useState } from "react";
import { DEVELOPMENT_USER_ID } from "../constants";

interface CurrentUser {
  id: string;
  role: "USER" | "ADMIN";
}

/**
 * Custom hook for authentication state
 * Currently returns mock data until full authentication is implemented
 */
export const useAuth = () => {
  // Mock user data - replace with real auth logic when implemented
  const [currentUser] = useState<CurrentUser | null>({
    id: DEVELOPMENT_USER_ID, // This should be replaced with actual user ID
    role: "ADMIN", // Change to "USER" to test non-admin permissions
  });

  return {
    currentUser,
    // Add other auth methods when implementing full authentication
    // isAuthenticated: true,
    // login: () => {},
    // logout: () => {},
  };
};
