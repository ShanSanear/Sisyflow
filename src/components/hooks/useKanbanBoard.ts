import { useState, useEffect, useCallback } from "react";
import type { KanbanViewModel, TicketCardViewModel } from "../views/KanbanBoardView.types";
import type { TicketDTO } from "../../types";

interface UseKanbanBoardResult {
  boardState: KanbanViewModel | null;
  isLoading: boolean;
  error: Error | null;
  savingTicketId: string | null;
  handleDragEnd: (event: unknown) => void;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for managing Kanban board state and operations
 * Handles data fetching, state management, and drag-and-drop logic
 */
export const useKanbanBoard = (): UseKanbanBoardResult => {
  const [boardState, setBoardState] = useState<KanbanViewModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [savingTicketId, _setSavingTicketId] = useState<string | null>(null); // Will be used for drag-and-drop saving state

  /**
   * Transform TicketDTO array to KanbanViewModel
   */
  const transformTicketsToKanbanView = useCallback((tickets: TicketDTO[]): KanbanViewModel => {
    const kanbanView: KanbanViewModel = {
      OPEN: {
        title: "Open",
        tickets: [],
      },
      IN_PROGRESS: {
        title: "In Progress",
        tickets: [],
      },
      CLOSED: {
        title: "Closed",
        tickets: [],
      },
    };

    tickets.forEach((ticket) => {
      const ticketCard: TicketCardViewModel = {
        id: ticket.id,
        title: ticket.title,
        assigneeName: ticket.assignee?.username,
        type: ticket.type,
        isAiEnhanced: ticket.ai_enhanced,
        reporterId: ticket.reporter_id || undefined, // Handle deleted reporter accounts
        assigneeId: ticket.assignee_id,
      };

      // Group tickets by status
      switch (ticket.status) {
        case "OPEN":
          kanbanView.OPEN.tickets.push(ticketCard);
          break;
        case "IN_PROGRESS":
          kanbanView.IN_PROGRESS.tickets.push(ticketCard);
          break;
        case "CLOSED":
          kanbanView.CLOSED.tickets.push(ticketCard);
          break;
        default:
          // Handle unknown status by placing in OPEN column
          console.warn(`Unknown ticket status: ${ticket.status}, placing in OPEN column`);
          kanbanView.OPEN.tickets.push(ticketCard);
      }
    });

    return kanbanView;
  }, []);

  /**
   * Fetch tickets from API
   */
  const fetchTickets = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/tickets?limit=100");

      if (!response.ok) {
        throw new Error(`Failed to fetch tickets: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // API returns { tickets: TicketDTO[], pagination: PaginationDTO }
      if (!data.tickets || !Array.isArray(data.tickets)) {
        throw new Error("Invalid API response: expected tickets array");
      }

      const kanbanView = transformTicketsToKanbanView(data.tickets);
      setBoardState(kanbanView);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error occurred");
      setError(error);
      console.error("Error fetching tickets:", error);
    } finally {
      setIsLoading(false);
    }
  }, [transformTicketsToKanbanView]);

  /**
   * Handle drag end event (placeholder for future implementation)
   */
  const handleDragEnd = useCallback((event: unknown) => {
    // TODO: Implement drag and drop logic
    console.log("Drag end event:", event);
  }, []);

  /**
   * Refetch data from API
   */
  const refetch = useCallback(async () => {
    await fetchTickets();
  }, [fetchTickets]);

  // Initial data fetch
  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return {
    boardState,
    isLoading,
    error,
    savingTicketId,
    handleDragEnd,
    refetch,
  };
};
