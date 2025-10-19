import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type {
  AISuggestionSessionDTO,
  CreateTicketCommand,
  FullTicketDTO,
  Ticket,
  TicketModalMode,
  UserDTO,
} from "@/types";
import { TicketForm } from "./TicketForm";

interface TicketModalState {
  mode: TicketModalMode;
  ticket?: FullTicketDTO;
  formData: Partial<CreateTicketCommand>;
  suggestions?: AISuggestionSessionDTO;
  rating: number | null;
  aiEnhanced: boolean;
  loading: boolean;
  analyzing: boolean;
  users: UserDTO[];
  assigneeId: string | null;
  formErrors: Record<string, string>;
  isFormValid: boolean;
}

export interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: TicketModalMode;
  initialTicket?: FullTicketDTO;
  onSave: (ticket: FullTicketDTO) => void;
  users?: UserDTO[];
}

const DEFAULT_FORM_DATA: Readonly<Partial<CreateTicketCommand>> = {
  title: "",
  description: "",
  type: "BUG" as Ticket["type"],
};

const getInitialFormState = (
  mode: TicketModalMode,
  ticket?: FullTicketDTO,
  users: UserDTO[] = []
): TicketModalState => {
  if (mode === "create" || !ticket) {
    return {
      mode,
      ticket,
      formData: { ...DEFAULT_FORM_DATA },
      suggestions: undefined,
      rating: null,
      aiEnhanced: false,
      loading: false,
      analyzing: false,
      users,
      assigneeId: null,
      formErrors: {},
      isFormValid: false,
    };
  }

  return {
    mode,
    ticket,
    formData: {
      title: ticket.title,
      description: ticket.description ?? "",
      type: ticket.type,
    },
    suggestions: undefined,
    rating: null,
    aiEnhanced: ticket.ai_enhanced,
    loading: false,
    analyzing: false,
    users,
    assigneeId: ticket.assignee_id ?? null,
    formErrors: {},
    isFormValid: true,
  };
};

export const TicketModal: React.FC<TicketModalProps> = ({
  isOpen,
  onClose,
  mode,
  initialTicket,
  onSave,
  users = [],
}) => {
  void onSave; // avoid unused prop warning before API integration is implemented

  const [state, setState] = useState<TicketModalState>(() => getInitialFormState(mode, initialTicket, users));

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setState(getInitialFormState(mode, initialTicket, users));
  }, [initialTicket, isOpen, mode, users]);

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

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        onClose();
      }
    },
    [onClose]
  );

  const handleFormChange = useCallback((updates: Partial<CreateTicketCommand>) => {
    setState((prev) => ({
      ...prev,
      formData: {
        ...prev.formData,
        ...updates,
      },
    }));
  }, []);

  const handleValidationChange = useCallback((validationErrors: Record<string, string>, isValid: boolean) => {
    setState((prev) => ({
      ...prev,
      formErrors: validationErrors,
      isFormValid: isValid,
      loading: prev.loading && isValid ? prev.loading : false,
    }));
  }, []);

  const handleAssignChange = useCallback((assigneeId: string | null) => {
    setState((prev) => ({
      ...prev,
      assigneeId,
    }));
  }, []);

  const handleSelfAssign = useCallback(() => {
    // Self-assign logic will be implemented alongside API integration
  }, []);

  const handleAnalyzeRequest = useCallback(() => {
    // AI analysis logic will be implemented in later steps
  }, []);

  const handleSuggestionApply = useCallback((content: string) => {
    setState((prev) => ({
      ...prev,
      formData: {
        ...prev.formData,
        description: `${prev.formData.description ? `${prev.formData.description}\n\n` : ""}${content}`,
      },
      aiEnhanced: true,
    }));
  }, []);

  const handleQuestionToggle = useCallback((index: number) => {
    setState((prev) => {
      if (!prev.suggestions) {
        return prev;
      }

      const updatedSuggestions = prev.suggestions.suggestions.map((suggestion, suggestionIndex) =>
        suggestionIndex === index
          ? {
              ...suggestion,
              applied: !suggestion.applied,
            }
          : suggestion
      );

      return {
        ...prev,
        suggestions: {
          ...prev.suggestions,
          suggestions: updatedSuggestions,
        },
        aiEnhanced: updatedSuggestions.some((suggestion) => suggestion.applied || suggestion.type === "INSERT"),
      };
    });
  }, []);

  const handleRatingChange = useCallback((rating: number) => {
    setState((prev) => ({
      ...prev,
      rating,
    }));
  }, []);

  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  const isViewMode = mode === "view";

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <div className="flex flex-col gap-4 p-6">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>

          <TicketForm
            mode={mode}
            formData={state.formData}
            onChange={handleFormChange}
            onValidationChange={handleValidationChange}
            assigneeId={state.assigneeId}
            assigneeUsername={state.ticket?.assignee?.username}
            reporterUsername={state.ticket?.reporter?.username}
            users={state.users}
            onAssignChange={handleAssignChange}
            onSelfAssign={handleSelfAssign}
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
                onClick={handleAnalyzeRequest}
              >
                {state.analyzing ? "Analyzing..." : "Request AI Suggestions"}
              </Button>
            </div>

            <AISuggestionsList
              suggestions={state.suggestions?.suggestions ?? []}
              onApplyInsert={handleSuggestionApply}
              onToggleQuestion={handleQuestionToggle}
              disabled={isViewMode}
            />
          </div>

          <AIRating rating={state.rating} onChange={handleRatingChange} disabled={isViewMode} />

          <ActionButtons
            mode={mode}
            onCancel={handleCancel}
            isSubmitting={state.loading || state.analyzing}
            isFormValid={state.isFormValid || isViewMode}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface AISuggestionsListProps {
  suggestions: AISuggestionSessionDTO["suggestions"];
  onApplyInsert: (content: string) => void;
  onToggleQuestion: (index: number) => void;
  disabled?: boolean;
}

const AISuggestionsList: React.FC<AISuggestionsListProps> = ({
  suggestions,
  onApplyInsert,
  onToggleQuestion,
  disabled,
}) => {
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
              <Button type="button" size="sm" disabled={disabled} onClick={() => onApplyInsert(suggestion.content)}>
                Add to description
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
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ mode, onCancel, isSubmitting, isFormValid }) => {
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
      <Button type="submit" form="ticket-modal-form" disabled={!isFormValid || isSubmitting}>
        {isSubmitting ? "Saving..." : "Save"}
      </Button>
    </div>
  );
};
