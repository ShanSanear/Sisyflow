import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { TicketModalMode } from "@/types";
import type { TicketType } from "@/components/views/KanbanBoardView.types";

interface TypeSelectProps {
  value: TicketType;
  onChange: (value: TicketType) => void;
  error?: string;
  mode: TicketModalMode;
}

/**
 * Dropdown do wyboru typu ticketa
 */
export const TypeSelect: React.FC<TypeSelectProps> = ({ value, onChange, error, mode }) => {
  const isDisabled = mode === "view";

  const typeOptions = [
    { value: "BUG", label: "Bug" },
    { value: "IMPROVEMENT", label: "Improvement" },
    { value: "TASK", label: "Task" },
  ] as const;

  return (
    <div data-testid="ticket-modal-form-type-select" className="space-y-2">
      <Label htmlFor="type">Type *</Label>
      <Select value={value} onValueChange={onChange} disabled={isDisabled}>
        <SelectTrigger
          className={error ? "border-destructive" : ""}
          aria-describedby={error ? "type-error" : undefined}
          aria-invalid={!!error}
          aria-label="Ticket type selection"
        >
          <SelectValue placeholder="Select ticket type..." />
        </SelectTrigger>
        <SelectContent>
          {typeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p id="type-error" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
};
