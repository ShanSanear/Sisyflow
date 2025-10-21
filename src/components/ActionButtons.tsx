import React from "react";
import { Button } from "@/components/ui/button";
import type { TicketModalMode } from "@/types";

interface ActionButtonsProps {
  onCancel: () => void;
  onSave: () => void;
  isLoading: boolean;
  mode: TicketModalMode;
}

/**
 * Przyciski akcji na dole modalu ticketa
 */
export const ActionButtons: React.FC<ActionButtonsProps> = ({ onCancel, onSave, isLoading, mode }) => {
  const isViewMode = mode === "view";

  return (
    <div className="flex justify-end gap-2 pt-4 border-t">
      <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
        {isViewMode ? "Close" : "Cancel"}
      </Button>

      {!isViewMode && (
        <Button type="button" onClick={onSave} disabled={isLoading}>
          {isLoading ? "Saving..." : "Save"}
        </Button>
      )}
    </div>
  );
};
