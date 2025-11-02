import { useEffect, useCallback } from "react";

/**
 * Hook do obsługi ostrzeżeń o niezapisanych zmianach
 * Dodaje event listener na beforeunload, który pokazuje dialog przeglądarki
 * @param enabled - czy ostrzeżenie ma być włączone
 */
export const useUnsavedChangesPrompt = (enabled: boolean) => {
  const handleBeforeUnload = useCallback(
    (event: BeforeUnloadEvent) => {
      if (enabled) {
        // Standardowy sposób na pokazanie dialogu przeglądarki
        event.preventDefault();
        event.returnValue = ""; // Chrome wymaga ustawienia returnValue
        return ""; // Dla innych przeglądarek
      }
    },
    [enabled]
  );

  useEffect(() => {
    if (enabled) {
      window.addEventListener("beforeunload", handleBeforeUnload);
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [enabled, handleBeforeUnload]);
};
