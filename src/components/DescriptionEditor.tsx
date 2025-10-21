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
    <div className="space-y-2">
      <Label htmlFor="description">Opis</Label>
      <Textarea
        id="description"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={isDisabled}
        className={error ? "border-destructive" : ""}
        placeholder="Opisz ticket..."
        rows={6}
      />
      <div className="flex justify-between text-sm text-muted-foreground">
        <span className={isNearLimit ? "text-warning" : ""}>
          {charCount}/{maxChars} znaków
        </span>
        {isNearLimit && <span className="text-warning">Zbliżasz się do limitu znaków</span>}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
};
