import {
  apiPost,
  apiPut,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  type ApiError,
} from "./base";
import type { AnalyzeTicketCommand, AISuggestionSessionDTO, RateAISuggestionCommand } from "@/types";

/**
 * AI Suggestion Sessions API endpoints
 */

/**
 * AI suggestion sessions-specific error classes
 */

export class AISuggestionSessionsForbiddenError extends ForbiddenError {
  constructor(
    message = "Access denied. You don't have permission to access AI suggestion sessions.",
    code?: string,
    details?: string[]
  ) {
    super(message, code, details);
    this.name = "AISuggestionSessionsForbiddenError";
  }
}

export class AISuggestionSessionsNotFoundError extends NotFoundError {
  constructor(message = "AI suggestion session not found") {
    super(message);
    this.name = "AISuggestionSessionsNotFoundError";
  }
}

export class AISuggestionSessionsValidationError extends BadRequestError {
  constructor(message = "AI suggestion session data is invalid", code?: string, details?: string[]) {
    super(message, code, details);
    this.name = "AISuggestionSessionsValidationError";
  }
}

// Legacy interface for backward compatibility (will be removed)
export interface AISuggestionSessionsApiError extends Error {
  status: number;
  code?: string;
  details?: string[];
}

/**
 * Transforms API errors to domain-specific AI suggestion sessions errors
 * @param error - The original API error
 * @returns Domain-specific error
 */
function transformAISuggestionSessionsApiError(error: ApiError): never {
  if (error instanceof BadRequestError) {
    const message = error.message && error.message !== "Bad Request" ? error.message : undefined;
    throw new AISuggestionSessionsValidationError(message, error.code, error.details);
  }
  if (error instanceof UnauthorizedError) {
    throw error; // Pass through unauthorized errors as-is
  }
  if (error instanceof ForbiddenError) {
    const message = error.message && error.message !== "Forbidden" ? error.message : undefined;
    throw new AISuggestionSessionsForbiddenError(message, error.code, error.details);
  }
  if (error instanceof NotFoundError) {
    const message = error.message && error.message !== "Not Found" ? error.message : undefined;
    throw new AISuggestionSessionsNotFoundError(message);
  }
  throw error;
}

/**
 * Analyzes a ticket and generates AI-powered suggestions
 * @param command - Ticket analysis command containing title and optional description
 * @returns Promise with AI suggestion session data
 * @throws AISuggestionSessionsValidationError if command data is invalid
 * @throws AISuggestionSessionsForbiddenError if user doesn't have permission
 * @throws UnauthorizedError if user is not authenticated
 */
export async function analyzeTicket(command: AnalyzeTicketCommand): Promise<AISuggestionSessionDTO> {
  try {
    const response = await apiPost<AISuggestionSessionDTO>("/api/ai-suggestion-sessions/analyze", command);
    return response.data;
  } catch (error) {
    transformAISuggestionSessionsApiError(error as ApiError);
  }
}

/**
 * Rates an AI suggestion session
 * @param sessionId - ID of the AI suggestion session to rate
 * @param command - Rating command containing the rating value (1-5)
 * @returns Promise with updated AI suggestion session data
 * @throws AISuggestionSessionsValidationError if command data is invalid
 * @throws AISuggestionSessionsNotFoundError if session doesn't exist
 * @throws AISuggestionSessionsForbiddenError if user doesn't have permission
 * @throws UnauthorizedError if user is not authenticated
 */
export async function rateAISuggestionSession(
  sessionId: string,
  command: RateAISuggestionCommand
): Promise<AISuggestionSessionDTO> {
  try {
    const response = await apiPut<AISuggestionSessionDTO>(`/api/ai-suggestion-sessions/${sessionId}/rating`, command);
    return response.data;
  } catch (error) {
    transformAISuggestionSessionsApiError(error as ApiError);
  }
}
