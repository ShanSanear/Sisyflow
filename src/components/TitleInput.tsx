import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TicketModalMode } from "@/types";

interface TitleInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  mode: TicketModalMode;
}

/**
 * Pole wejściowe dla tytułu ticketa
 */
export const TitleInput: React.FC<TitleInputProps> = ({ value, onChange, error, mode }) => {
  const isDisabled = mode === "view";

  return (
    <div className="space-y-2">
      <Label htmlFor="title">Title *</Label>
      <Input
        id="title"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={isDisabled}
        className={error ? "border-destructive" : ""}
        placeholder="Enter ticket title..."
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
};
