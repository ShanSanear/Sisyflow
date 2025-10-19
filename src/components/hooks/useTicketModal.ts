import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  AISuggestionSessionDTO,
  CreateTicketCommand,
  FullTicketDTO,
  Ticket,
  TicketModalMode,
  UserDTO,
} from "@/types";
import { useToast } from "./useToast";
import { useAuth } from "./useAuth";

interface UseTicketModalParams {
  isOpen: boolean;
  mode: TicketModalMode;
  initialTicket?: FullTicketDTO;
  users?: UserDTO[];
  onClose: () => void;
  onSave: (ticket: FullTicketDTO) => void;
}

export interface TicketModalState {
  mode: TicketModalMode;
  ticket?: FullTicketDTO;
  formData: Partial<CreateTicketCommand>;
  assigneeId: string | null;
  users: UserDTO[];
  suggestions?: AISuggestionSessionDTO;
  rating: number | null;
  aiEnhanced: boolean;
  loading: boolean;
  analyzing: boolean;
  formErrors: Record<string, string>;
  isFormValid: boolean;
}

const DEFAULT_FORM_DATA: Readonly<Partial<CreateTicketCommand>> = {
  title: "",
  description: "",
  type: "BUG" as Ticket["type"],
};

const buildInitialState = (
  mode: TicketModalMode,
  ticket: FullTicketDTO | undefined,
  users: UserDTO[]
): TicketModalState => {
  if (!ticket || mode === "create") {
    return {
      mode,
      ticket,
      formData: { ...DEFAULT_FORM_DATA },
      assigneeId: null,
      users,
      suggestions: undefined,
      rating: null,
      aiEnhanced: false,
      loading: false,
      analyzing: false,
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
    assigneeId: ticket.assignee_id ?? null,
    users,
    suggestions: undefined,
    rating: null,
    aiEnhanced: ticket.ai_enhanced,
    loading: false,
    analyzing: false,
    formErrors: {},
    isFormValid: true,
  };
};

export const useTicketModal = ({ isOpen, mode, initialTicket, users = [], onClose, onSave }: UseTicketModalParams) => {
  const { showSuccess, showError } = useToast();
  const { currentUser } = useAuth();

  const [state, setState] = useState<TicketModalState>(() => buildInitialState(mode, initialTicket, users));

  const isCreateMode = useMemo(() => mode === "create", [mode]);
  const isViewMode = useMemo(() => mode === "view", [mode]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setState(buildInitialState(mode, initialTicket, users));
  }, [initialTicket, isOpen, mode, users]);

  const updateFormData = useCallback((updates: Partial<CreateTicketCommand>) => {
    setState((prev) => ({
      ...prev,
      formData: {
        ...prev.formData,
        ...updates,
      },
    }));
  }, []);

  const updateValidation = useCallback((errors: Record<string, string>, isValid: boolean) => {
    setState((prev) => ({
      ...prev,
      formErrors: errors,
      isFormValid: isValid,
      loading: prev.loading && isValid ? prev.loading : false,
    }));
  }, []);

  const updateAssignee = useCallback((assigneeId: string | null) => {
    setState((prev) => ({
      ...prev,
      assigneeId,
    }));
  }, []);

  const handleSelfAssign = useCallback(async () => {
    if (!currentUser) {
      showError("You must be signed in to self-assign this ticket.");
      return;
    }

    if (isCreateMode) {
      updateAssignee(currentUser.id);
      return;
    }

    if (!state.ticket) {
      showError("Ticket data is not available.");
      return;
    }

    try {
      setState((prev) => ({ ...prev, loading: true }));

      const response = await fetch(`/api/tickets/${state.ticket.id}/assignee`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ assignee_id: currentUser.id }),
      });

      if (!response.ok) {
        throw new Error(`Failed to assign ticket: ${response.status}`);
      }

      const updatedTicket = (await response.json()) as FullTicketDTO;
      setState((prev) => ({
        ...prev,
        ticket: updatedTicket,
        assigneeId: updatedTicket.assignee_id ?? null,
        loading: false,
      }));
      showSuccess("Ticket assigned to you.");
    } catch (error) {
      console.error(error);
      setState((prev) => ({ ...prev, loading: false }));
      showError("Unable to assign ticket. Please try again.");
    }
  }, [currentUser, isCreateMode, showError, showSuccess, state.ticket, updateAssignee]);

  const ensureAssigneeUpdated = useCallback(
    async (ticketId: string, desiredAssigneeId: string | null, previousAssigneeId: string | null | undefined) => {
      if (desiredAssigneeId === previousAssigneeId) {
        return;
      }

      const response = await fetch(`/api/tickets/${ticketId}/assignee`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ assignee_id: desiredAssigneeId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update ticket assignee: ${response.status}`);
      }
    },
    []
  );

  const createTicket = useCallback(async () => {
    const body: CreateTicketCommand = {
      title: state.formData.title?.trim() ?? "",
      description: state.formData.description?.trim() || undefined,
      type: (state.formData.type ?? "BUG") as Ticket["type"],
    };

    const response = await fetch("/api/tickets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Failed to create ticket: ${response.status}`);
    }

    const createdTicket = (await response.json()) as FullTicketDTO;

    if (state.assigneeId) {
      await ensureAssigneeUpdated(createdTicket.id, state.assigneeId, createdTicket.assignee_id);
      createdTicket.assignee_id = state.assigneeId;
    }

    return createdTicket;
  }, [ensureAssigneeUpdated, state.assigneeId, state.formData]);

  const updateTicket = useCallback(async () => {
    if (!state.ticket) {
      throw new Error("Ticket is not available for update.");
    }

    const response = await fetch(`/api/tickets/${state.ticket.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: state.formData.title?.trim() ?? state.ticket.title,
        description: state.formData.description ?? state.ticket.description ?? "",
        type: state.formData.type ?? state.ticket.type,
        ai_enhanced: state.aiEnhanced,
        rating: state.rating,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update ticket: ${response.status}`);
    }

    const updatedTicket = (await response.json()) as FullTicketDTO;

    if (state.assigneeId !== state.ticket.assignee_id) {
      await ensureAssigneeUpdated(updatedTicket.id, state.assigneeId, state.ticket.assignee_id);
      updatedTicket.assignee_id = state.assigneeId;
    }

    return updatedTicket;
  }, [ensureAssigneeUpdated, state.aiEnhanced, state.assigneeId, state.formData, state.rating, state.ticket]);

  const submitTicket = useCallback(async () => {
    if (isViewMode) {
      return;
    }

    if (!state.isFormValid) {
      showError("Please fix validation errors before saving.");
      return;
    }

    setState((prev) => ({ ...prev, loading: true }));

    try {
      const ticket = isCreateMode ? await createTicket() : await updateTicket();

      setState((prev) => ({
        ...prev,
        ticket,
        loading: false,
        formErrors: {},
      }));

      onSave(ticket);
      showSuccess(isCreateMode ? "Ticket created successfully." : "Ticket updated successfully.");
      onClose();
    } catch (error) {
      console.error(error);
      showError("Failed to save ticket. Please try again.");
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [
    createTicket,
    isCreateMode,
    isViewMode,
    onClose,
    onSave,
    showError,
    showSuccess,
    state.isFormValid,
    updateTicket,
  ]);

  const requestAISuggestions = useCallback(() => {
    if (isViewMode) {
      return;
    }

    setState((prev) => ({ ...prev, analyzing: true }));

    window.setTimeout(() => {
      setState((prev) => ({
        ...prev,
        analyzing: false,
        suggestions: {
          session_id: crypto.randomUUID(),
          suggestions: [
            {
              type: "INSERT",
              content: "Consider adding acceptance criteria to clarify the expected outcome.",
              applied: false,
            },
            {
              type: "QUESTION",
              content: "Are there any device-specific constraints to account for?",
              applied: false,
            },
          ],
        },
      }));
    }, 800);
  }, [isViewMode]);

  const applyAISuggestion = useCallback((content: string) => {
    setState((prev) => ({
      ...prev,
      formData: {
        ...prev.formData,
        description: `${prev.formData.description ? `${prev.formData.description}\n\n` : ""}${content}`,
      },
      aiEnhanced: true,
    }));
  }, []);

  const toggleAIQuestion = useCallback((index: number) => {
    setState((prev) => {
      if (!prev.suggestions) {
        return prev;
      }

      const suggestions = prev.suggestions.suggestions.map((suggestion, suggestionIndex) =>
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
          suggestions,
        },
        aiEnhanced: suggestions.some((suggestion) => suggestion.applied || suggestion.type === "INSERT"),
      };
    });
  }, []);

  const rateAISuggestions = useCallback((rating: number) => {
    setState((prev) => ({
      ...prev,
      rating,
    }));
  }, []);

  const closeModal = useCallback(() => {
    onClose();
  }, [onClose]);

  return {
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
  };
};

export type UseTicketModalResult = ReturnType<typeof useTicketModal>;
