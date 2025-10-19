import { useEffect } from "react";

interface LogoutHandlerProps {
  onLogout: () => void;
}

export const LogoutHandler = ({ onLogout }: LogoutHandlerProps) => {
  useEffect(() => {
    const performLogout = async () => {
      try {
        const response = await fetch("/api/auth/sign-out", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          // Call the callback and redirect
          onLogout();
          window.location.href = "/login";
        } else {
          console.error("Logout failed");
        }
      } catch (error) {
        console.error("Logout error:", error);
      }
    };

    performLogout();
  }, [onLogout]);

  return null; // This component doesn't render anything
};
