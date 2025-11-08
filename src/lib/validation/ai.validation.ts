// Re-export schemas from schemas folder for backward compatibility
export {
  aiSuggestionSchema as AiSuggestionSchema,
  aiResponseSchema as AiResponseSchema,
  analyzeAiSuggestionsSchema as AnalyzeAiSuggestionsSchema,
  createAiSuggestionSessionCommandSchema as CreateAiSuggestionSessionCommandSchema,
  type AiSuggestion,
  type AiResponse,
  type AnalyzeAiSuggestionsRequest,
  type CreateAiSuggestionSessionCommand,
} from "./schemas/ai";
