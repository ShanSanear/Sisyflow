import React, { useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { AISuggestionSessionDTO, FullTicketDTO, TicketModalMode, UserDTO } from "@/types";
import { TicketForm } from "./TicketForm";
import { useTicketModal } from "@/components/hooks/useTicketModal";

export interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: TicketModalMode;
  initialTicket?: FullTicketDTO;
  onSave: (ticket: FullTicketDTO) => void;
  users?: UserDTO[];
}

export const TicketModal: React.FC<TicketModalProps> = ({
  isOpen,
  onClose,
  mode,
  initialTicket,
  onSave,
  users = [],
}) => {
  const {
    state,
    updateFormData,
    updateValidation,
    updateAssignee,
    handleSelfAssign,
    requestAISuggestions,
    applyAISuggestion,
    toggleAIQuestion,
    rateAISuggestions,
    submitTicket,
    closeModal,
  } = useTicketModal({
    isOpen,
    mode,
    initialTicket,
    users,
    onClose,
    onSave,
  });

  const dialogTitle = useMemo(() => {
    switch (mode) {
      case "create":
        return "Create Ticket";
      case "edit":
        return "Edit Ticket";
      case "view":
      default:
        return "Ticket Details";
    }
  }, [mode]);

  const dialogDescription = useMemo(() => {
    if (mode === "create") {
      return "Fill out the form to create a new ticket.";
    }

    if (mode === "edit") {
      return "Update ticket details and save your changes.";
    }

    return "Review detailed ticket information.";
  }, [mode]);

  const isViewMode = mode === "view";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (open ? undefined : closeModal())}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <div className="flex flex-col gap-4 p-6">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>

          <TicketForm
            mode={mode}
            formData={state.formData}
            onChange={updateFormData}
            onValidationChange={updateValidation}
            assigneeId={state.assigneeId}
            assigneeUsername={state.ticket?.assignee?.username}
            reporterUsername={state.ticket?.reporter?.username}
            users={state.users}
            onAssignChange={updateAssignee}
            onSelfAssign={handleSelfAssign}
            onSubmit={submitTicket}
          />

          <div className="border-t" />

          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold">AI Suggestions</h3>
                <p className="text-sm text-muted-foreground">
                  Request analysis to get recommendations for your ticket.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={state.analyzing || isViewMode}
                onClick={requestAISuggestions}
              >
                {state.analyzing ? "Analyzing..." : "Request AI Suggestions"}
              </Button>
            </div>

            <AISuggestionsList
              suggestions={state.suggestions?.suggestions ?? []}
              onApplyInsert={applyAISuggestion}
              onToggleQuestion={toggleAIQuestion}
              disabled={isViewMode}
              isLoading={state.analyzing}
            />
          </div>

          <AIRating
            rating={state.rating}
            onChange={(rating) => {
              void rateAISuggestions(rating);
            }}
            disabled={isViewMode || !state.suggestions}
          />

          <ActionButtons
            mode={mode}
            onCancel={closeModal}
            isSubmitting={state.loading || state.analyzing}
            isFormValid={state.isFormValid || isViewMode}
            onSubmit={submitTicket}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface AISuggestionsListProps {
  suggestions: AISuggestionSessionDTO["suggestions"];
  onApplyInsert: (index: number, content: string) => void;
  onToggleQuestion: (index: number) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

const AISuggestionsList: React.FC<AISuggestionsListProps> = ({
  suggestions,
  onApplyInsert,
  onToggleQuestion,
  disabled,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
        Analyzing ticket details. This might take a few seconds.
      </div>
    );
  }

  if (!suggestions.length) {
    return (
      <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
        No suggestions yet. Use the button above to request an AI analysis.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {suggestions.map((suggestion, index) => (
        <li key={`${suggestion.type}-${index}`} className="rounded-md border p-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">
                {suggestion.type === "INSERT" ? "Content suggestion" : "Follow-up question"}
              </span>
            </div>
            <p className="text-sm whitespace-pre-wrap text-muted-foreground">{suggestion.content}</p>

            {suggestion.type === "INSERT" ? (
              <Button
                type="button"
                size="sm"
                disabled={disabled || suggestion.applied}
                onClick={() => onApplyInsert(index, suggestion.content)}
              >
                {suggestion.applied ? "Added" : "Add to description"}
              </Button>
            ) : (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border"
                  checked={suggestion.applied}
                  onChange={() => onToggleQuestion(index)}
                  disabled={disabled}
                />
                Applied
              </label>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
};

interface AIRatingProps {
  rating: number | null;
  onChange: (rating: number) => void;
  disabled?: boolean;
}

const AIRating: React.FC<AIRatingProps> = ({ rating, onChange, disabled }) => {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Rate AI Suggestions</h3>
          <p className="text-sm text-muted-foreground">
            Help us improve AI recommendations by selecting a score from 1 to 5.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {stars.map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`h-9 w-9 rounded-full border text-sm font-medium ${
              rating && rating >= star ? "bg-primary text-primary-foreground" : "bg-background"
            }`}
            disabled={disabled}
            aria-label={`Rate AI suggestions ${star} out of 5`}
          >
            {star}
          </button>
        ))}
      </div>
    </div>
  );
};

interface ActionButtonsProps {
  mode: TicketModalMode;
  onCancel: () => void;
  isSubmitting: boolean;
  isFormValid: boolean;
  onSubmit: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ mode, onCancel, isSubmitting, isFormValid, onSubmit }) => {
  if (mode === "view") {
    return (
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Close
        </Button>
      </div>
    );
  }

  return (
    <div className="flex justify-end gap-2">
      <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
        Cancel
      </Button>
      <Button type="button" disabled={!isFormValid || isSubmitting} onClick={onSubmit}>
        {isSubmitting ? "Saving..." : "Save"}
      </Button>
    </div>
  );
};
