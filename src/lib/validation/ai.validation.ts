// Re-export schemas from schemas folder for backward compatibility
export {
  aiSuggestionSchema,
  aiResponseSchema,
  analyzeAiSuggestionsSchema,
  createAiSuggestionSessionCommandSchema,
  rateAiSuggestionSchema,
  type AISuggestion,
  type AIResponse,
  type AnalyzeAiSuggestionsRequest,
  type CreateAiSuggestionSessionCommand,
} from "./schemas/ai";
