import React from "react";

/**
 * Logo - Komponent prezentacyjny dla logo aplikacji
 * Prosty komponent bez logiki, tylko prezentacja
 */
export const Logo: React.FC = () => {
  return (
    <a
      data-testid="logo"
      href="/"
      className="flex items-center space-x-3 rounded-md px-2 py-1 text-gray-900 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      aria-label="Go to the Kanban board"
    >
      <span className="text-xl font-semibold tracking-tight">Sisyflow</span>
    </a>
  );
};
