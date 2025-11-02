import { z } from "zod";
import { createTicketSchema } from "./ticket.validation";

// Schemat pojedynczej sugestii
export const AiSuggestionSchema = z.object({
  type: z.enum(["INSERT", "QUESTION"]).describe("Suggestion type: INSERT to insert text, QUESTION for a question."),
  content: z.string().min(10).describe("Content of the suggestion or question."),
});

// Schemat całej odpowiedzi z listą sugestii
export const AiResponseSchema = z.object({
  suggestions: z.array(AiSuggestionSchema).max(3).describe("List of 1 to 3 suggestions for user."),
});

// Schemat walidacji ciała żądania dla analizy AI
export const AnalyzeAiSuggestionsSchema = createTicketSchema.pick({ title: true, description: true });
