import React from "react";
import { Button } from "@/components/ui/button";
import type { TicketModalMode } from "@/types";

interface ActionButtonsProps {
  onCancel: () => void;
  onSave: () => void;
  onEdit?: () => void;
  isLoading: boolean;
  isValid?: boolean;
  mode: TicketModalMode;
  canEdit?: boolean;
}

/**
 * Przyciski akcji na dole modalu ticketa
 */
export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onCancel,
  onSave,
  onEdit,
  isLoading,
  isValid = true,
  mode,
  canEdit = false,
}) => {
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

      {isViewMode && canEdit && onEdit && (
        <Button
          type="button"
          variant="outline"
          onClick={onEdit}
          disabled={isLoading}
          aria-label="Switch to edit mode for this ticket"
        >
          Edit
        </Button>
      )}

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
