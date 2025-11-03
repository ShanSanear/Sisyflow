import {
  apiGet,
  apiPost,
  apiPut,
  apiPatch,
  type QueryParams,
  NotFoundError,
  ForbiddenError,
  BadRequestError,
  type ApiError,
} from "./base";
import type { TicketDTO, FullTicketDTO, CreateTicketCommand, UpdateTicketCommand } from "@/types";

/**
 * Tickets API endpoints
 */

/**
 * Ticket-specific error classes
 */
export class TicketNotFoundError extends NotFoundError {
  constructor(ticketId?: string, code?: string, details?: string[]) {
    super(ticketId ? `Ticket with ID '${ticketId}' not found` : "Ticket not found", code, details);
    this.name = "TicketNotFoundError";
  }
}

export class TicketForbiddenError extends ForbiddenError {
  constructor(
    message = "You don't have permission to perform this action on the ticket",
    code?: string,
    details?: string[]
  ) {
    super(message, code, details);
    this.name = "TicketForbiddenError";
  }
}

export class TicketValidationError extends BadRequestError {
  constructor(message = "Ticket data is invalid", code?: string, details?: string[]) {
    super(message, code, details);
    this.name = "TicketValidationError";
  }
}

// Legacy interface for backward compatibility (will be removed)
export interface TicketApiError extends Error {
  status: number;
  code?: string;
  details?: string[];
}

/**
 * Transforms API errors to domain-specific ticket errors
 * @param error - The original API error
 * @param ticketId - Optional ticket ID for NotFoundError messages
 * @returns Domain-specific error
 */
function transformTicketApiError(error: ApiError, ticketId?: string): never {
  if (error instanceof NotFoundError) {
    const message = ticketId ? `Ticket with ID '${ticketId}' not found` : undefined;
    throw new TicketNotFoundError(message, error.code, error.details);
  }
  if (error instanceof BadRequestError) {
    const message = error.message && error.message !== "Bad Request" ? error.message : undefined;
    throw new TicketValidationError(message, error.code, error.details);
  }
  if (error instanceof ForbiddenError) {
    const message = error.message && error.message !== "Forbidden" ? error.message : undefined;
    throw new TicketForbiddenError(message, error.code, error.details);
  }
  throw error;
}

// Request types
export interface GetTicketsParams extends QueryParams {
  limit?: number;
  page?: number;
  status?: string;
  assignee_id?: string;
  reporter_id?: string;
}

export interface UpdateTicketAssigneeRequest {
  assignee_id: string | null;
}

export interface UpdateTicketStatusRequest {
  status: string;
}

// Response types
export interface GetTicketsResponse {
  tickets: TicketDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

/**
 * Gets a paginated list of tickets
 * @param params - Query parameters for filtering and pagination
 * @returns Promise with paginated tickets data
 */
export async function getTickets(params: GetTicketsParams = {}): Promise<GetTicketsResponse> {
  const response = await apiGet<GetTicketsResponse>("/api/tickets", params);
  return response.data;
}

/**
 * Gets a single ticket by ID
 * @param ticketId - ID of the ticket to retrieve
 * @returns Promise with ticket data
 * @throws TicketNotFoundError if ticket doesn't exist
 */
export async function getTicket(ticketId: string): Promise<FullTicketDTO> {
  try {
    const response = await apiGet<FullTicketDTO>(`/api/tickets/${ticketId}`);
    return response.data;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw new TicketNotFoundError(ticketId, error.code, error.details);
    }
    throw error;
  }
}

/**
 * Creates a new ticket
 * @param ticketData - Ticket creation data
 * @returns Promise with created ticket data
 * @throws TicketValidationError if ticket data is invalid
 * @throws TicketForbiddenError if user doesn't have permission to create tickets
 */
export async function createTicket(ticketData: CreateTicketCommand): Promise<FullTicketDTO> {
  try {
    // Transform the assignee object to assignee_id for the API
    const apiData = {
      ...ticketData,
      assignee_id: ticketData.assignee?.id || null,
      assignee: undefined, // Remove the assignee object
    };

    const response = await apiPost<FullTicketDTO>("/api/tickets", apiData);
    return response.data;
  } catch (error) {
    transformTicketApiError(error as ApiError);
  }
}

/**
 * Updates an existing ticket
 * @param ticketId - ID of the ticket to update
 * @param ticketData - Updated ticket data
 * @returns Promise with updated ticket data
 * @throws TicketNotFoundError if ticket doesn't exist
 * @throws TicketValidationError if ticket data is invalid
 * @throws TicketForbiddenError if user doesn't have permission to update the ticket
 */
export async function updateTicket(ticketId: string, ticketData: UpdateTicketCommand): Promise<FullTicketDTO> {
  try {
    const response = await apiPut<FullTicketDTO>(`/api/tickets/${ticketId}`, ticketData);
    return response.data;
  } catch (error) {
    transformTicketApiError(error as ApiError, ticketId);
  }
}

/**
 * Updates a ticket's status
 * @param ticketId - ID of the ticket to update
 * @param statusData - Status update data
 * @returns Promise with updated ticket data
 * @throws TicketNotFoundError if ticket doesn't exist
 * @throws TicketValidationError if status data is invalid
 * @throws TicketForbiddenError if user doesn't have permission to update the ticket status
 */
export async function updateTicketStatus(
  ticketId: string,
  statusData: UpdateTicketStatusRequest
): Promise<FullTicketDTO> {
  try {
    const response = await apiPatch<FullTicketDTO>(`/api/tickets/${ticketId}/status`, statusData);
    return response.data;
  } catch (error) {
    transformTicketApiError(error as ApiError, ticketId);
  }
}

/**
 * Updates a ticket's assignee
 * @param ticketId - ID of the ticket to update
 * @param assigneeData - Assignee update data
 * @returns Promise with updated ticket data
 * @throws TicketNotFoundError if ticket doesn't exist
 * @throws TicketValidationError if assignee data is invalid
 * @throws TicketForbiddenError if user doesn't have permission to update the ticket assignee
 */
export async function updateTicketAssignee(
  ticketId: string,
  assigneeData: UpdateTicketAssigneeRequest
): Promise<FullTicketDTO> {
  try {
    const response = await apiPatch<FullTicketDTO>(`/api/tickets/${ticketId}/assignee`, assigneeData);
    return response.data;
  } catch (error) {
    transformTicketApiError(error as ApiError, ticketId);
  }
}
