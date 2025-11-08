import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { AISuggestionSessionDTO } from "@/types";
import { AnalyzeAiSuggestionsSchema } from "@/lib/validation/ai.validation";

interface AIAnalysisButtonProps {
  title: string;
  description?: string;
  onAnalyze: (suggestions: AISuggestionSessionDTO) => void;
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
      const validationResult = AnalyzeAiSuggestionsSchema.safeParse({
        title: title.trim(),
        description: description.trim(),
      });

      if (!validationResult.success) {
        console.error("Validation failed:", validationResult.error);
        toast.error("Invalid data provided for AI analysis");
        return;
      }

      const requestBody = validationResult.data;

      const response = await fetch("/api/ai-suggestion-sessions/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const suggestions: AISuggestionSessionDTO = await response.json();
      onAnalyze(suggestions);
    } catch (error) {
      console.error("AI analysis failed:", error);
      toast.error("AI analysis failed. Contact admin if this error persists.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleAnalyze} disabled={isLoading} variant="outline" className="w-full">
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Ask for AI suggestions
    </Button>
  );
}
