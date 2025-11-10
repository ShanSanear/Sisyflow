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
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(mode === "edit");
  const rightPanelRef = useRef<PanelRef>(null);

  useEffect(() => {
    if (mode === "edit") {
      rightPanelRef.current?.collapse();
    } else {
      rightPanelRef.current?.expand();
    }
  }, [mode]);

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
    <ResizablePanelGroup direction="horizontal" className="h-full w-full" data-testid="ticket-modal-content">
      <ResizablePanel defaultSize={60} minSize={40}>
        <div className="flex h-full flex-col">
          <div className="grow overflow-y-auto p-6">
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
          </div>
          <div className="border-t bg-background p-6">
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
                  <AISuggestionsList
                    suggestions={aiSuggestions.suggestions}
                    onApplyInsert={handleApplyInsert}
                    onApplyQuestion={handleApplyQuestion}
                  />
                )}

                {hasAppliedSuggestions && aiSuggestions && <AIRating rating={aiRating} onRate={handleAIRating} />}
              </div>
            </div>
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  );
};
