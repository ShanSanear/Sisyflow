// Typy statusu i typu ticketa
export type TicketStatus = "OPEN" | "IN_PROGRESS" | "CLOSED";
export type TicketType = "BUG" | "IMPROVEMENT" | "TASK";

// ViewModel dla pojedynczej karty na tablicy
export interface TicketCardViewModel {
  id: string;
  title: string;
  assigneeName?: string;
  type: TicketType;
  isAiEnhanced: boolean;
  reporterId?: string; // Can be undefined if reporter account was deleted
  assigneeId?: string | null;
}

// ViewModel dla całej tablicy Kanban
export type KanbanViewModel = Record<
  TicketStatus,
  {
    title: string; // np. "Otwarty"
    tickets: TicketCardViewModel[];
  }
>;

// Dane użytkownika potrzebne do weryfikacji uprawnień
export interface CurrentUser {
  id: string;
  role: "USER" | "ADMIN";
}

export interface TicketModalViewState {
  isOpen: boolean;
  mode: TicketModalMode;
  selectedTicket?: FullTicketDTO;
  users: UserDTO[];
}
