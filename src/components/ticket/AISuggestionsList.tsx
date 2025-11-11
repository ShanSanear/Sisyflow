import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { AISuggestionSessionDTO } from "@/types";

interface AISuggestionsListProps {
  suggestions: AISuggestionSessionDTO["suggestions"];
  onApplyInsert: (content: string, index: number) => void;
  onApplyQuestion: (index: number) => void;
}

export function AISuggestionsList({ suggestions, onApplyInsert, onApplyQuestion }: AISuggestionsListProps) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div data-testid="ai-suggestions-list" className="mt-4 max-h-96">
      <div className="text-lg">AI Suggestions</div>
      <div className="overflow-y-auto">
        <div className="space-y-4">
          <ul className="space-y-4">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="p-2 border rounded-md bg-card">
                <div className="flex items-start gap-2">
                  {suggestion.type === "INSERT" ? (
                    <div className="flex-1">
                      <div className="text-sm font-medium text-green-700 mb-2">Suggested addition to description:</div>
                      <div className="text-sm bg-gray-50 p-2 rounded whitespace-pre-wrap">{suggestion.content}</div>
                      <Button
                        data-testid={`ai-suggestion-insert-button-${index}`}
                        size="sm"
                        onClick={() => onApplyInsert(suggestion.content, index)}
                        disabled={suggestion.applied}
                        className="mt-2"
                      >
                        {suggestion.applied ? "Added" : "Add"}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex-1">
                      <div className="text-sm font-medium text-blue-700 mb-2">Question to consider:</div>
                      <div className="text-sm">{suggestion.content}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <Checkbox
                          data-testid={`ai-suggestion-question-checkbox-${index}`}
                          id={`question-${index}`}
                          checked={suggestion.applied}
                          onCheckedChange={() => onApplyQuestion(index)}
                        />
                        <label htmlFor={`question-${index}`} className="text-sm text-gray-600 cursor-pointer">
                          Applied
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
