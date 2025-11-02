import type { Tables } from "./db/database.types";

// Export database table types for cleaner usage
export type Profile = Tables<"profiles">;
export type Ticket = Tables<"tickets">;
export type AISuggestionSession = Tables<"ai_suggestion_sessions">;
export type ProjectDocumentation = Tables<"project_documentation">;
export type AIError = Tables<"ai_errors">;

// Ticket Modal types
export type TicketModalMode = "create" | "edit" | "view";

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

// Paginated Users Response DTO
export interface PaginatedUsersResponseDTO {
  users: UserDTO[];
  pagination: PaginationDTO;
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
  assignee: {
    id: string;
    username: string;
  } | null;
}

// UpdateTicketCommand: Used in PUT /tickets/:id (request)
export type UpdateTicketCommand = Partial<CreateTicketCommand>;

// UpdateTicketStatusCommand: Used in PATCH /tickets/:id/status (request)
export interface UpdateTicketStatusCommand {
  status: Ticket["status"];
}

// UpdateTicketAssigneeCommand: Used in PATCH /tickets/:id/assignee (request)
export interface UpdateTicketAssigneeCommand {
  assignee: {
    id: string;
    username: string;
  } | null;
}

// Assignee Component Types
// Assignee: Used for assignee objects in components (same as FullTicketDTO assignee)
export type Assignee = Pick<Profile, "id" | "username">;

export interface AssigneeSectionProps {
  assignee?: Assignee | null;
  currentUser: UserDTO | null;
  isAdmin: boolean;
  onAssign: (assignee: Assignee | null) => void;
  mode: TicketModalMode;
  ticketId?: string;
  reporterId?: string;
  onFormChange?: (assignee: Assignee | null) => void;
}

export interface AssigneeViewModeProps {
  assignee?: Assignee | null;
  currentUser: UserDTO | null;
  onAssign: (assignee: Assignee | null) => void;
  canModifyAssignment: boolean;
  isUpdating: boolean;
}

export interface AssigneeEditModeProps {
  assignee?: Assignee | null;
  currentUser: UserDTO | null;
  isAdmin: boolean;
  onAssign: (assignee: Assignee | null) => void;
  canModifyAssignment: boolean;
  isUpdating: boolean;
  mode?: "immediate" | "form";
  onFormChange?: (assignee: Assignee | null) => void;
}

export interface AssigneeAdminSelectProps {
  assignee?: Assignee | null;
  onAssign: (assignee: Assignee | null) => void;
  isUpdating: boolean;
  mode?: "immediate" | "form";
  onFormChange?: (assignee: Assignee | null) => void;
}

export interface AssigneeUserActionsProps {
  assignee?: Assignee | null;
  currentUser: UserDTO | null;
  canModifyAssignment: boolean;
  onAssign: (assignee: Assignee | null) => void;
  isUpdating: boolean;
}

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
export type ProjectDocumentationDTO = Omit<ProjectDocumentation, "updated_by"> & {
  updated_by?: Pick<Profile, "username">;
};

// UpdateProjectDocumentationCommand: Used in PUT /project-documentation (request)
export interface UpdateProjectDocumentationCommand {
  content: string;
}

// AI Error DTO
// AIErrorDTO: Used in GET /ai-errors (response)
export type AIErrorDTO = Pick<
  AIError,
  "id" | "ticket_id" | "user_id" | "error_message" | "error_details" | "created_at"
>;

// User ViewModel for Admin Panel
export type UserViewModel = UserDTO & {
  isDeleting?: boolean; // true, gdy żądanie usunięcia tego użytkownika jest w toku
};

// Ticket Modal State
export interface TicketModalState {
  mode: TicketModalMode;
  ticket?: FullTicketDTO;
  formData: Partial<CreateTicketCommand>;
  loading: boolean;
  errors: Record<string, string>;
  users: UserDTO[];
}

// FullTicketDTO: Extended TicketDTO for modal operations with full reporter/assignee info
export type FullTicketDTO = Omit<TicketDTO, "reporter" | "assignee"> & {
  reporter: Pick<Profile, "id" | "username">;
  assignee?: Pick<Profile, "id" | "username">;
};
