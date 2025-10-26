import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { TicketModalMode } from "@/types";

interface DescriptionEditorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  mode: TicketModalMode;
}

/**
 * Edytor tekstu dla opisu ticketa (prosta textarea w MVP)
 */
export const DescriptionEditor: React.FC<DescriptionEditorProps> = ({ value, onChange, error, mode }) => {
  const isDisabled = mode === "view";
  const charCount = value.length;
  const maxChars = 10000;
  const isNearLimit = charCount > 8000;

  return (
    <div data-testid="ticket-modal-description-editor" className="space-y-2">
      <Label htmlFor="description">Description</Label>
      <Textarea
        data-testid="ticket-modal-description-editor-textarea"
        id="description"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={isDisabled}
        className={error ? "border-destructive" : ""}
        placeholder="Describe the ticket..."
        rows={6}
        aria-describedby={error ? "description-error description-help" : "description-help"}
        aria-invalid={!!error}
      />
      <div
        data-testid="ticket-modal-description-editor-help"
        id="description-help"
        className="flex justify-between text-sm text-muted-foreground"
      >
        <span className={isNearLimit ? "text-warning" : ""}>
          {charCount}/{maxChars} characters
        </span>
        {isNearLimit && <span className="text-warning">Approaching character limit</span>}
      </div>
      {error && (
        <p
          data-testid="ticket-modal-description-editor-error"
          id="description-error"
          className="text-sm text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  );
};
