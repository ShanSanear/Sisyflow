import React, { useState } from "react";
import type { FullTicketDTO, ProfileDTO, TicketModalMode, AISuggestionsResponse } from "@/types";
import type { TicketFormData } from "@/lib/validation/schemas/ticket";
import { TicketForm } from "@/components/TicketForm";
import { ActionButtons } from "@/components/ActionButtons";
import { AIAnalysisButton } from "@/components/ticket/AIAnalysisButton";
import { AISuggestionsList } from "@/components/ticket/AISuggestionsList";
import { AIRating } from "@/components/ticket/AIRating";

interface TicketModalContentProps {
  formData: TicketFormData;
  errors: Record<string, string>;
  isFormValid: boolean;
  loading: boolean;
  mode: TicketModalMode;
  user: ProfileDTO | null;
  isAdmin: boolean;
  ticket?: FullTicketDTO;
  canEdit: boolean;
  onFormChange: (data: Partial<TicketFormData>) => void;
  onSave: () => void;
  onEdit: () => void;
  onCancel: () => void;
  onAssigneeChange?: () => void;
  onAISessionChange?: (suggestions: AISuggestionsResponse | null, rating?: number | null) => void;
}

export const TicketModalContent: React.FC<TicketModalContentProps> = ({
  formData,
  errors,
  isFormValid,
  loading,
  mode,
  user,
  isAdmin,
  ticket,
  canEdit,
  onFormChange,
  onSave,
  onEdit,
  onCancel,
  onAssigneeChange,
  onAISessionChange,
}) => {
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestionsResponse | null>(null);
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);
  const [aiRating, setAiRating] = useState<number | null>(null);

  const handleAIAnalysis = (suggestions: AISuggestionsResponse) => {
    setAiSuggestions(suggestions);
    setAiRating(null); // Reset rating when new suggestions arrive
    onAISessionChange?.(suggestions, null); // Notify parent that suggestions are available
  };

  const handleApplyInsert = (content: string, index: number) => {
    if (!aiSuggestions) return;

    // Update suggestion as applied
    const updatedSuggestions: AISuggestionsResponse = {
      suggestions: aiSuggestions.suggestions.map((suggestion, i) =>
        i === index ? { ...suggestion, applied: true } : suggestion
      ),
    };
    setAiSuggestions(updatedSuggestions);

    // Append content to description
    const currentDescription = formData.description || "";
    const separator = currentDescription ? "\n\n" : "";
    const newDescription = currentDescription + separator + content;

    onFormChange({
      description: newDescription,
      ai_enhanced: true, // Mark as AI enhanced
    });
  };

  const handleApplyQuestion = (index: number) => {
    if (!aiSuggestions) return;

    // Update suggestion as applied
    const updatedSuggestions: AISuggestionsResponse = {
      suggestions: aiSuggestions.suggestions.map((suggestion, i) =>
        i === index ? { ...suggestion, applied: true } : suggestion
      ),
    };
    setAiSuggestions(updatedSuggestions);

    // Mark as AI enhanced
    onFormChange({ ai_enhanced: true });
  };

  const handleAIRating = (rating: number) => {
    setAiRating(rating);
    onAISessionChange?.(aiSuggestions, rating); // Notify parent that rating changed
  };

  const hasAppliedSuggestions = aiSuggestions?.suggestions.some((s) => s.applied) ?? false;

  if (loading) {
    return (
      <div data-testid="ticket-modal-loading" className="flex justify-center items-center py-8">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div data-testid="ticket-modal-content">
      <TicketForm
        formData={formData}
        onChange={onFormChange}
        errors={errors}
        mode={mode}
        user={user}
        isAdmin={isAdmin}
        ticket={ticket}
        onAssigneeChange={onAssigneeChange}
      />

      {/* AI Components - only show in create/edit modes */}
      {(mode === "create" || mode === "edit") && (
        <div className="space-y-4">
          <AIAnalysisButton
            title={formData.title}
            description={formData.description}
            onAnalyze={handleAIAnalysis}
            isLoading={aiAnalysisLoading}
            setIsLoading={setAiAnalysisLoading}
          />

          {aiSuggestions && (
            <AISuggestionsList
              suggestions={aiSuggestions.suggestions}
              onApplyInsert={handleApplyInsert}
              onApplyQuestion={handleApplyQuestion}
            />
          )}

          {hasAppliedSuggestions && aiSuggestions && <AIRating rating={aiRating} onRate={handleAIRating} />}
        </div>
      )}

      <ActionButtons
        data-testid="ticket-modal-action-buttons"
        onCancel={onCancel}
        onSave={onSave}
        onEdit={onEdit}
        isLoading={loading}
        isValid={isFormValid}
        mode={mode}
        canEdit={canEdit}
      />
    </div>
  );
};
