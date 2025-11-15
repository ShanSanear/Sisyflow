import React, { useState, useRef, useEffect } from "react";
import type { FullTicketDTO, ProfileDTO, TicketModalMode, AISuggestionsResponse } from "@/types";
import type { TicketFormData } from "@/lib/validation/schemas/ticket";
import { TicketForm } from "@/components/TicketForm";
import { ActionButtons } from "@/components/ActionButtons";
import { AIAnalysisButton } from "@/components/ticket/AIAnalysisButton";
import { AISuggestionsList } from "@/components/ticket/AISuggestionsList";
import { AIRating } from "@/components/ticket/AIRating";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./ui/resizable";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { announceToScreenReader } from "@/lib/utils";

type PanelRef = React.ComponentRef<typeof ResizablePanel>;

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
  titleInputRef?: React.Ref<HTMLInputElement>;
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
  titleInputRef,
}) => {
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestionsResponse | null>(null);
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);
  const [aiRating, setAiRating] = useState<number | null>(null);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(mode === "edit");
  const rightPanelRef = useRef<PanelRef>(null);

  // Reset AI suggestions when modal opens or mode changes
  useEffect(() => {
    setAiSuggestions(null);
    setAiRating(null);
    setAiAnalysisLoading(false);
  }, [mode]);

  useEffect(() => {
    if (mode === "edit") {
      rightPanelRef.current?.collapse();
    } else {
      rightPanelRef.current?.expand();
    }
  }, [mode]);

  // Handle Ctrl+Enter (or Cmd+Enter on Mac) to submit the form
  useEffect(() => {
    // Only handle keyboard shortcuts in create or edit mode
    if (mode === "view") return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl+Enter or Cmd+Enter
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation();

        // Only submit if form is valid (has at least title)
        if (isFormValid && formData.title.trim().length > 0) {
          onSave();
        } else {
          announceToScreenReader("Cannot save ticket. Please provide a title.", {
            priority: "assertive",
            role: "alert",
            duration: 2000,
          });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode, isFormValid, formData.title, onSave]);

  const handleTogglePanel = () => {
    const panel = rightPanelRef.current;
    if (panel) {
      if (isRightPanelCollapsed) {
        panel.resize(40);
      } else {
        panel.collapse();
      }
    }
  };

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
    <ResizablePanelGroup direction="horizontal" className="w-full h-full" data-testid="ticket-modal-content">
      <ResizablePanel defaultSize={mode === "view" ? 100 : 60} minSize={mode === "view" ? 100 : 40}>
        <div className="flex h-full flex-col overflow-y-auto">
          <div className="grow p-6">
            <TicketForm
              formData={formData}
              onChange={onFormChange}
              errors={errors}
              mode={mode}
              user={user}
              isAdmin={isAdmin}
              ticket={ticket}
              onAssigneeChange={onAssigneeChange}
              titleInputRef={titleInputRef}
            />
          </div>
          <div className="border-t bg-background p-1">
            {hasAppliedSuggestions && <AIRating rating={aiRating} onRate={handleAIRating} />}
            <ActionButtons
              data-testid="ticket-modal-action-buttons"
              onCancel={onCancel}
              onSave={onSave}
              onEdit={onEdit}
              isLoading={loading}
              isValid={isFormValid}
              mode={mode}
              canEdit={canEdit}
              showKeyboardHint={mode === "create" || mode === "edit"}
            />
          </div>
        </div>
      </ResizablePanel>

      {(mode === "create" || mode === "edit") && (
        <>
          <ResizableHandle withHandle />
          <ResizablePanel
            ref={rightPanelRef}
            defaultSize={mode === "edit" ? 0 : 40}
            minSize={20}
            collapsible
            collapsedSize={0}
            onCollapse={() => setIsRightPanelCollapsed(true)}
            onExpand={() => setIsRightPanelCollapsed(false)}
            className="overflow-visible"
          >
            <button
              onClick={handleTogglePanel}
              className="absolute top-1/2 z-40 -translate-x-1/2 -translate-y-1/2 rounded-full border bg-background p-2 text-primary shadow-lg transition-colors hover:bg-muted"
              aria-label={isRightPanelCollapsed ? "Expand panel" : "Collapse panel"}
            >
              {isRightPanelCollapsed ? <ChevronLeft className={"h-5 w-5"} /> : <ChevronRight className={"h-5 w-5"} />}
            </button>
            <div className="relative h-full overflow-y-auto p-6">
              <div className="space-y-4">
                <AIAnalysisButton
                  title={formData.title}
                  description={formData.description}
                  onAnalyze={handleAIAnalysis}
                  isLoading={aiAnalysisLoading}
                  setIsLoading={setAiAnalysisLoading}
                />

                {aiSuggestions && (
                  <div>
                    <AISuggestionsList
                      suggestions={aiSuggestions.suggestions}
                      onApplyInsert={handleApplyInsert}
                      onApplyQuestion={handleApplyQuestion}
                    />
                  </div>
                )}
              </div>
            </div>
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  );
};
