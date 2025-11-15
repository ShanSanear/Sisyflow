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
  showKeyboardHint?: boolean;
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
  showKeyboardHint = false,
}) => {
  const isViewMode = mode === "view";

  return (
    <div data-testid="ticket-modal-action-buttons" className="flex flex-col gap-2 pt-4 border-t">
      {showKeyboardHint && (
        <p className="text-xs text-muted-foreground text-right" aria-label="Keyboard shortcut hint">
          Press <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-xs font-mono">Ctrl+Enter</kbd>{" "}
          (<kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-xs font-mono">Cmd+Enter</kbd> on
          Mac) to save
        </p>
      )}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        <Button
          data-testid="ticket-modal-action-buttons-close-cancel"
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
            data-testid="ticket-modal-action-buttons-edit"
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
            data-testid="ticket-modal-action-buttons-save"
            type="button"
            onClick={onSave}
            disabled={isLoading || !isValid}
            aria-label={isLoading ? "Saving ticket..." : "Save ticket changes"}
          >
            {isLoading ? "Saving..." : "Save"}
          </Button>
        )}
      </div>
    </div>
  );
};
