import React from "react";
import type { ProfileDTO } from "../../types";

/**
 * Props dla komponentu NavLinks
 */
interface NavLinksProps {
  role: ProfileDTO["role"];
}

/**
 * NavLinks - Komponent prezentacyjny renderujący listę linków nawigacyjnych.
 * Warunkowo wyświetla link "Panel Administratora" na podstawie roli użytkownika.
 */
export const NavLinks: React.FC<NavLinksProps> = ({ role }) => {
  const handleKanbanClick = () => {
    // Nawigacja do głównej strony tablicy
    window.location.href = "/";
  };

  const handleAdminClick = () => {
    // Nawigacja do panelu administracyjnego
    window.location.href = "/admin";
  };

  return (
    <nav className="hidden md:flex items-center space-x-6">
      <button
        onClick={handleKanbanClick}
        className="text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium transition-colors"
      >
        Kanban Board
      </button>

      {/* Warunkowe wyświetlanie linku do panelu administratora */}
      {role === "ADMIN" && (
        <button
          onClick={handleAdminClick}
          className="text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Panel Administratora
        </button>
      )}
    </nav>
  );
};
