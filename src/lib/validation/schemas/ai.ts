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
  ticket_id: z.string().uuid("Invalid ticket ID format - must be a valid UUID").optional(),
  title: createTicketSchema.shape.title,
  description: createTicketSchema.shape.description,
});

/**
 * Schema for rating AI suggestion session
 */
export const rateAiSuggestionSchema = z.object({
  rating: z.number().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
});

/**
 * Schema for updating AI suggestion session ticket ID
 */
export const updateAISuggestionSessionTicketIdSchema = z.object({
  ticket_id: z.string().uuid("Invalid ticket ID format - must be a valid UUID"),
});

/**
 * Schema for creating AI suggestion session command (internal use)
 */
export const createAiSuggestionSessionCommandSchema = z.object({
  ticket_id: z.string().uuid("Invalid ticket ID format").optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});

/**
 * Types inferred from schemas
 */
export type AiSuggestion = z.infer<typeof aiSuggestionSchema>;
export type AiResponse = z.infer<typeof aiResponseSchema>;
export type AnalyzeAiSuggestionsRequest = z.infer<typeof analyzeAiSuggestionsSchema>;
export type RateAiSuggestionRequest = z.infer<typeof rateAiSuggestionSchema>;
export type CreateAiSuggestionSessionCommand = z.infer<typeof createAiSuggestionSessionCommandSchema>;
export type UpdateAISuggestionSessionTicketIdRequest = z.infer<typeof updateAISuggestionSessionTicketIdSchema>;
