// Re-export schemas from schemas folder for backward compatibility
export {
  aiSuggestionSchema,
  aiResponseSchema,
  analyzeAiSuggestionsSchema,
  saveAiSuggestionSessionSchema,
  type AISuggestion,
  type AIResponse,
  type AnalyzeAiSuggestionsRequest,
  type SaveAiSuggestionSessionCommand,
} from "./schemas/ai";
