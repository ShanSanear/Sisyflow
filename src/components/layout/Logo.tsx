import React from "react";

/**
 * Logo - Komponent prezentacyjny dla logo aplikacji
 * Prosty komponent bez logiki, tylko prezentacja
 */
export const Logo: React.FC = () => {
  return (
    <div className="flex items-center space-x-4">
      <h1 className="text-xl font-semibold text-gray-900">Sisyflow</h1>
    </div>
  );
};
