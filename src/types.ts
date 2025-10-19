import type { Tables } from "./db/database.types";

// Export database table types for cleaner usage
export type Profile = Tables<"profiles">;
export type Ticket = Tables<"tickets">;
export type AISuggestionSession = Tables<"ai_suggestion_sessions">;
export type ProjectDocumentation = Tables<"project_documentation">;
export type AIError = Tables<"ai_errors">;

// Pagination DTO - shared across list endpoints
export interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
}

// User DTOs
// UserDTO: Used in GET /users (response), POST /users (response)
export type UserDTO = Pick<Profile, "id" | "username" | "role" | "created_at"> & {
  email: string; // Email from Supabase Auth, not in profiles table
};

// CreateUserCommand: Used in POST /users (request)
export interface CreateUserCommand {
  email: string;
  password: string;
  username: string;
  role: Profile["role"];
}

// Profile DTOs
// ProfileDTO: Used in GET /profiles/me (response), PUT /profiles/me (response)
export type ProfileDTO = Pick<Profile, "id" | "username" | "role" | "created_at" | "updated_at">;

// UpdateProfileCommand: Used in PUT /profiles/me (request)
export interface UpdateProfileCommand {
  username: string;
}

// Ticket DTOs
// TicketDTO: Used in GET /tickets (response)
export type TicketDTO = Pick<
  Ticket,
  | "id"
  | "title"
  | "description"
  | "type"
  | "status"
  | "reporter_id"
  | "assignee_id"
  | "ai_enhanced"
  | "created_at"
  | "updated_at"
> & {
  reporter: Pick<Profile, "username">;
  assignee?: Pick<Profile, "username">;
};

// CreateTicketCommand: Used in POST /tickets (request)
export interface CreateTicketCommand {
  title: string;
  description?: string;
  type: Ticket["type"];
}

// UpdateTicketCommand: Used in PUT /tickets/:id (request)
export type UpdateTicketCommand = Partial<CreateTicketCommand>;

// UpdateTicketStatusCommand: Used in PATCH /tickets/:id/status (request)
export interface UpdateTicketStatusCommand {
  status: Ticket["status"];
}

// UpdateTicketAssigneeCommand: Used in PATCH /tickets/:id/assignee (request)
export interface UpdateTicketAssigneeCommand {
  assignee_id: Ticket["assignee_id"];
}

// FullTicketDTO: Used in GET /tickets/:id (response)
export type FullTicketDTO = TicketDTO;

// AI Suggestion DTOs
// AnalyzeTicketCommand: Used in POST /ai-suggestion-sessions/analyze (request)
export interface AnalyzeTicketCommand {
  title: string;
  description?: string;
}

// AISuggestionSessionDTO: Used in POST /ai-suggestion-sessions/analyze (response)
export interface AISuggestionSessionDTO {
  session_id: string;
  suggestions: {
    type: "INSERT" | "QUESTION";
    content: string;
    applied: boolean;
  }[];
}

// RateAISuggestionCommand: Used in PUT /ai-suggestion-sessions/:id/rating (request)
export interface RateAISuggestionCommand {
  rating: number | null;
}

// Project Documentation DTOs
// ProjectDocumentationDTO: Used in GET /project-documentation (response)
export type ProjectDocumentationDTO = Pick<ProjectDocumentation, "id" | "content" | "updated_at" | "updated_by"> & {
  updated_by?: Pick<Profile, "username">;
};

// UpdateProjectDocumentationCommand: Used in PUT /project-documentation (request)
export interface UpdateProjectDocumentationCommand {
  content: string;
}

// Ticket Modal specific types
export type TicketModalMode = "create" | "edit" | "view";

// AI Error DTO
// AIErrorDTO: Used in GET /ai-errors (response)
export type AIErrorDTO = Pick<
  AIError,
  "id" | "ticket_id" | "user_id" | "error_message" | "error_details" | "created_at"
>;
