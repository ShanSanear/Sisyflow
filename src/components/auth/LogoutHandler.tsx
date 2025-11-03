import { useEffect } from "react";
import { signOut } from "../../lib/api";

interface LogoutHandlerProps {
  onLogout: () => void;
}

export const LogoutHandler = ({ onLogout }: LogoutHandlerProps) => {
  useEffect(() => {
    const performLogout = async () => {
      try {
        await signOut();
        // Call the callback and redirect
        onLogout();
        window.location.href = "/login";
      } catch (error) {
        console.error("Logout error:", error);
      }
    };

    performLogout();
  }, [onLogout]);

  return null; // This component doesn't render anything
};
