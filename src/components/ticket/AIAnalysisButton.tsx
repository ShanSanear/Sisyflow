import { Button } from "@/components/ui/button";
import { Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import type { AISuggestionsResponse } from "@/types";
import { analyzeAiSuggestionsSchema } from "@/lib/validation/ai.validation";
import { analyzeTicket } from "@/lib/api/aiSuggestionSession";
import { ApiError } from "@/lib/api";

interface AIAnalysisButtonProps {
  title: string;
  description?: string;
  onAnalyze: (suggestions: AISuggestionsResponse) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export function AIAnalysisButton({ title, description, onAnalyze, isLoading, setIsLoading }: AIAnalysisButtonProps) {
  const handleAnalyze = async () => {
    // Check if title and description are filled
    if (!title.trim() || !description?.trim()) {
      toast.warning("Fill title and description first");
      return;
    }

    setIsLoading(true);

    try {
      // Validate the request data using the schema
      const validationResult = analyzeAiSuggestionsSchema.safeParse({
        title: title.trim(),
        description: description.trim(),
      });

      if (!validationResult.success) {
        console.error("Validation failed:", validationResult.error);
        toast.error("Invalid data provided for AI analysis");
        return;
      }

      const suggestions = await analyzeTicket(validationResult.data);
      onAnalyze(suggestions);
    } catch (error) {
      console.error("AI analysis failed:", error);
      const message =
        error instanceof ApiError ? error.message : "AI analysis failed. Contact admin if this error persists.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      data-testid="ai-analysis-button"
      onClick={handleAnalyze}
      disabled={isLoading}
      variant="outline"
      className="w-full"
    >
      {isLoading && <Loader2 data-testid="ai-analysis-button-loading" className="mr-2 h-4 w-4 animate-spin" />}
      <Wand2 />
      <span data-testid="ai-analysis-button-text">Ask for AI suggestions</span>
    </Button>
  );
}
