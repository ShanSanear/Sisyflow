import { z } from "zod";
import { createTicketSchema } from "../ticket.validation";

/**
 * Schema for individual AI suggestion
 */
export const aiSuggestionSchema = z.object({
  type: z.enum(["INSERT", "QUESTION"]).describe("Suggestion type: INSERT to insert text, QUESTION for a question."),
  content: z.string().min(10).describe("Content of the suggestion or question."),
  applied: z.boolean().default(false).describe("Whether the suggestion has been applied"),
});

/**
 * Schema for AI response with list of suggestions
 */
export const aiResponseSchema = z.object({
  suggestions: z.array(aiSuggestionSchema).max(6).describe("List of 1 to 6 suggestions for user."),
});

/**
 * Schema for analyzing AI suggestions request
 */
export const analyzeAiSuggestionsSchema = z.object({
  title: createTicketSchema.shape.title,
  description: createTicketSchema.shape.description,
});

/**
 * Schema for saving AI suggestion session (internal use)
 * Used when persisting existing AI suggestion sessions to the database
 */
export const saveAiSuggestionSessionSchema = z.object({
  ticket_id: z.string().uuid("Invalid ticket ID format"),
  suggestions: z.array(aiSuggestionSchema).min(1, "At least one suggestion is required"),
  rating: z.number().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5").optional(),
});

/**
 * Types inferred from schemas
 */
export type AISuggestion = z.infer<typeof aiSuggestionSchema>;
export type AIResponse = z.infer<typeof aiResponseSchema>;
export type AnalyzeAiSuggestionsRequest = z.infer<typeof analyzeAiSuggestionsSchema>;
export type SaveAiSuggestionSessionCommand = z.infer<typeof saveAiSuggestionSessionSchema>;
