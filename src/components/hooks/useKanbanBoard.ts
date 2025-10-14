import { useState, useEffect, useCallback } from "react";
import type { DragEndEvent } from "@dnd-kit/core";
import type { KanbanViewModel, TicketCardViewModel, TicketStatus } from "../views/KanbanBoardView.types";
import type { TicketDTO } from "../../types";
import { useAuth } from "./useAuth";
import { useToast } from "./useToast";

interface UseKanbanBoardResult {
  boardState: KanbanViewModel | null;
  isLoading: boolean;
  error: Error | null;
  savingTicketId: string | null;
  handleDragEnd: (event: DragEndEvent) => void;
  handleStatusChangeViaMenu: (ticketId: string, newStatus: TicketStatus) => void;
  canMoveTicket: (ticket: TicketCardViewModel) => boolean;
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

  const [savingTicketId, _setSavingTicketId] = useState<string | null>(null); // Will be used for drag-and-drop saving state

  const { currentUser } = useAuth();
  const { showError, showSuccess } = useToast();

  /**
   * Check if current user can move a specific ticket
   */
  const canMoveTicket = useCallback(
    (ticket: TicketCardViewModel): boolean => {
      if (!currentUser) return false;

      // Admin can move all tickets
      if (currentUser.role === "ADMIN") return true;

      // User can move ticket if they are the reporter or assignee
      return currentUser.id === ticket.reporterId || currentUser.id === ticket.assigneeId;
    },
    [currentUser]
  );

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
   * Handle drag end event
   */
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over) {
        console.log("Drag ended without dropping over a valid target");
        return;
      }

      const ticketId = active.id as string;
      const newStatus = over.id as keyof KanbanViewModel;

      console.log(`Moving ticket ${ticketId} to status ${newStatus}`);

      // Find the ticket in current state
      if (!boardState) {
        console.error("Board state is not available");
        return;
      }

      let ticketToMove: TicketCardViewModel | undefined;
      let oldStatus: keyof KanbanViewModel | undefined;

      for (const [status, column] of Object.entries(boardState)) {
        const foundTicket = column.tickets.find((ticket) => ticket.id === ticketId);
        if (foundTicket) {
          ticketToMove = foundTicket;
          oldStatus = status as keyof KanbanViewModel;
          break;
        }
      }

      if (!ticketToMove || !oldStatus || oldStatus === newStatus) {
        console.log("Ticket not found or no status change needed");
        return;
      }

      // Check permissions before allowing the move
      if (!canMoveTicket(ticketToMove)) {
        console.warn(`User does not have permission to move ticket ${ticketId}`);
        // TODO: Show permission error notification
        showError("You don't have permission to move this ticket.");
        return;
      }

      // Optimistically update UI
      const newBoardState: KanbanViewModel = { ...boardState };
      newBoardState[oldStatus].tickets = newBoardState[oldStatus].tickets.filter((ticket) => ticket.id !== ticketId);
      newBoardState[newStatus].tickets.push({ ...ticketToMove });
      setBoardState(newBoardState);
      _setSavingTicketId(ticketId);

      try {
        // Call API to update ticket status
        const response = await fetch(`/api/tickets/${ticketId}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to update ticket status: ${response.status} ${response.statusText}`);
        }

        // Refresh data to ensure consistency
        await fetchTickets();
        showSuccess(
          `Ticket moved to ${newStatus === "OPEN" ? "Open" : newStatus === "IN_PROGRESS" ? "In Progress" : "Closed"}`
        );
        console.log(`Successfully moved ticket ${ticketId} to ${newStatus}`);
      } catch (error) {
        console.error("Error updating ticket status:", error);

        // Revert optimistic update on error
        const revertedBoardState: KanbanViewModel = { ...boardState };
        revertedBoardState[newStatus].tickets = revertedBoardState[newStatus].tickets.filter(
          (ticket) => ticket.id !== ticketId
        );
        revertedBoardState[oldStatus].tickets.push(ticketToMove);
        setBoardState(revertedBoardState);

        showError("Failed to move ticket. Please try again.");
      } finally {
        _setSavingTicketId(null);
      }
    },
    [boardState, fetchTickets, canMoveTicket, showError, showSuccess]
  );

  /**
   * Handle status change via context menu
   */
  const handleStatusChangeViaMenu = useCallback(
    async (ticketId: string, newStatus: TicketStatus) => {
      console.log(`Changing ticket ${ticketId} status to ${newStatus} via menu`);

      // Find the ticket in current state
      if (!boardState) {
        console.error("Board state is not available");
        return;
      }

      let ticketToMove: TicketCardViewModel | undefined;
      let oldStatus: keyof KanbanViewModel | undefined;

      for (const [status, column] of Object.entries(boardState)) {
        const foundTicket = column.tickets.find((ticket) => ticket.id === ticketId);
        if (foundTicket) {
          ticketToMove = foundTicket;
          oldStatus = status as keyof KanbanViewModel;
          break;
        }
      }

      if (!ticketToMove || !oldStatus || oldStatus === newStatus) {
        console.log("Ticket not found or no status change needed");
        return;
      }

      // Check permissions before allowing the move
      if (!canMoveTicket(ticketToMove)) {
        console.warn(`User does not have permission to move ticket ${ticketId}`);
        // TODO: Show permission error notification
        showError("You don't have permission to move this ticket.");
        return;
      }

      // Optimistically update UI
      const newBoardState: KanbanViewModel = { ...boardState };
      newBoardState[oldStatus].tickets = newBoardState[oldStatus].tickets.filter((ticket) => ticket.id !== ticketId);
      newBoardState[newStatus].tickets.push({ ...ticketToMove });
      setBoardState(newBoardState);
      _setSavingTicketId(ticketId);

      try {
        // Call API to update ticket status
        const response = await fetch(`/api/tickets/${ticketId}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to update ticket status: ${response.status} ${response.statusText}`);
        }

        // Refresh data to ensure consistency
        await fetchTickets();
        console.log(`Successfully changed ticket ${ticketId} status to ${newStatus}`);
      } catch (error) {
        console.error("Error updating ticket status:", error);

        // Revert optimistic update on error
        const revertedBoardState: KanbanViewModel = { ...boardState };
        revertedBoardState[newStatus].tickets = revertedBoardState[newStatus].tickets.filter(
          (ticket) => ticket.id !== ticketId
        );
        revertedBoardState[oldStatus].tickets.push(ticketToMove);
        setBoardState(revertedBoardState);

        showError("Failed to move ticket. Please try again.");
      } finally {
        _setSavingTicketId(null);
      }
    },
    [boardState, fetchTickets, canMoveTicket, showError, showSuccess]
  );

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
    handleStatusChangeViaMenu,
    canMoveTicket,
    refetch,
  };
};
