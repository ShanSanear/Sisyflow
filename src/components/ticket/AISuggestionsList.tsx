import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg">AI Suggestions</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <li key={index} className="flex items-start gap-3 p-3 border rounded-lg">
              {suggestion.type === "INSERT" ? (
                <div className="flex-1">
                  <div className="text-sm font-medium text-green-700 mb-2">Suggested addition to description:</div>
                  <div className="text-sm bg-gray-50 p-2 rounded whitespace-pre-wrap">{suggestion.content}</div>
                  <Button
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
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
