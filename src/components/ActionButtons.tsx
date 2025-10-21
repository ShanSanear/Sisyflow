import React from "react";
import { Button } from "@/components/ui/button";
import type { TicketModalMode } from "@/types";

interface ActionButtonsProps {
  onCancel: () => void;
  onSave: () => void;
  isLoading: boolean;
  isValid?: boolean;
  mode: TicketModalMode;
}

/**
 * Przyciski akcji na dole modalu ticketa
 */
export const ActionButtons: React.FC<ActionButtonsProps> = ({ onCancel, onSave, isLoading, isValid = true, mode }) => {
  const isViewMode = mode === "view";

  return (
    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4 border-t">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isLoading}
        aria-label={isViewMode ? "Close ticket details" : "Cancel and close ticket form"}
      >
        {isViewMode ? "Close" : "Cancel"}
      </Button>

      {!isViewMode && (
        <Button
          type="button"
          onClick={onSave}
          disabled={isLoading || !isValid}
          aria-label={isLoading ? "Saving ticket..." : "Save ticket changes"}
        >
          {isLoading ? "Saving..." : "Save"}
        </Button>
      )}
    </div>
  );
};
