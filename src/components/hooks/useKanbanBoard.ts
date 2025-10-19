import { useState, useEffect, useCallback } from "react";
import type { DragEndEvent } from "@dnd-kit/core";
import type { KanbanViewModel, TicketCardViewModel, TicketStatus } from "../views/KanbanBoardView.types";
import type { TicketDTO, FullTicketDTO, TicketModalMode, UserDTO } from "../../types";
import { useAuth } from "./useAuth";
import { useToast } from "./useToast";

interface TicketModalViewState {
  isOpen: boolean;
  mode: TicketModalMode;
  selectedTicket?: FullTicketDTO;
  users: UserDTO[];
  isLoadingTicket: boolean;
}

interface UseKanbanBoardResult {
  boardState: KanbanViewModel | null;
  isLoading: boolean;
  error: Error | null;
  savingTicketId: string | null;
  handleDragEnd: (event: DragEndEvent) => void;
  handleStatusChangeViaMenu: (ticketId: string, newStatus: TicketStatus) => void;
  canMoveTicket: (ticket: TicketCardViewModel) => boolean;
  refetch: () => Promise<void>;
  modalState: TicketModalViewState;
  openModalToCreate: () => void;
  openModalToEdit: (ticketId: string) => Promise<void>;
  closeModal: () => void;
}

export const useKanbanBoard = (): UseKanbanBoardResult => {
  const [boardState, setBoardState] = useState<KanbanViewModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const [savingTicketId, _setSavingTicketId] = useState<string | null>(null);

  const [modalState, setModalState] = useState<TicketModalViewState>({
    isOpen: false,
    mode: "create",
    selectedTicket: undefined,
    users: [],
    isLoadingTicket: false,
  });

  const { currentUser } = useAuth();
  const { showError, showSuccess } = useToast();

  const canMoveTicket = useCallback(
    (ticket: TicketCardViewModel): boolean => {
      if (!currentUser) return false;

      if (currentUser.role === "ADMIN") return true;

      return currentUser.id === ticket.reporterId || currentUser.id === ticket.assigneeId;
    },
    [currentUser]
  );

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
        reporterId: ticket.reporter_id || undefined,
        assigneeId: ticket.assignee_id,
      };

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
          console.warn(`Unknown ticket status: ${ticket.status}, placing in OPEN column`);
          kanbanView.OPEN.tickets.push(ticketCard);
      }
    });

    return kanbanView;
  }, []);

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

  const fetchTicketDetails = useCallback(async (ticketId: string): Promise<FullTicketDTO> => {
    const response = await fetch(`/api/tickets/${ticketId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch ticket details: ${response.status}`);
    }

    const ticket = (await response.json()) as FullTicketDTO;
    return ticket;
  }, []);

  const fetchUsers = useCallback(async (): Promise<UserDTO[]> => {
    return [
      {
        username: "John Doe",
        role: "USER",
        id: "123",
        email: "john.doe@example.com",
      },
      {
        username: "Jane Doe",
        role: "USER",
        id: "456",
        email: "jane.doe@example.com",
      },
    ] as UserDTO[];
    // TODO: Requires /api/profiles endpoint being implemented
    const response = await fetch("/api/users?limit=100");

    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.status}`);
    }

    const data = await response.json();

    if (!data.users || !Array.isArray(data.users)) {
      throw new Error("Invalid API response: expected users array");
    }

    return data.users as UserDTO[];
  }, []);

  const openModalWithState = useCallback((nextState: Partial<TicketModalViewState>) => {
    setModalState((prev) => ({
      isOpen: true,
      mode: nextState.mode ?? prev.mode,
      selectedTicket: nextState.selectedTicket,
      users: nextState.users ?? prev.users,
      isLoadingTicket: nextState.isLoadingTicket ?? false,
    }));
  }, []);

  const openModalToCreate = useCallback(async () => {
    try {
      openModalWithState({ isLoadingTicket: true, mode: "create" });
      const users = await fetchUsers();
      setModalState({
        isOpen: true,
        mode: "create",
        selectedTicket: undefined,
        users,
        isLoadingTicket: false,
      });
    } catch (error) {
      console.error(error);
      showError("Unable to load data for ticket creation.");
      setModalState({
        isOpen: false,
        mode: "create",
        selectedTicket: undefined,
        users: [],
        isLoadingTicket: false,
      });
    }
  }, [fetchUsers, openModalWithState, showError]);

  const openModalToEdit = useCallback(
    async (ticketId: string) => {
      try {
        openModalWithState({ isLoadingTicket: true, mode: "edit" });
        const [ticket, users] = await Promise.all([fetchTicketDetails(ticketId), fetchUsers()]);
        setModalState({
          isOpen: true,
          mode: "edit",
          selectedTicket: ticket,
          users,
          isLoadingTicket: false,
        });
      } catch (error) {
        console.error(error);
        showError("Unable to load ticket details. Please try again.");
        setModalState({
          isOpen: false,
          mode: "edit",
          selectedTicket: undefined,
          users: [],
          isLoadingTicket: false,
        });
      }
    },
    [fetchTicketDetails, fetchUsers, openModalWithState, showError]
  );

  const closeModal = useCallback(() => {
    setModalState({ isOpen: false, mode: "create", selectedTicket: undefined, users: [], isLoadingTicket: false });
  }, []);

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
        showError("You don't have permission to move this ticket.");
        return;
      }

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
    [boardState, canMoveTicket, fetchTickets, showError, showSuccess]
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
        showSuccess(
          `Ticket moved to ${newStatus === "OPEN" ? "Open" : newStatus === "IN_PROGRESS" ? "In Progress" : "Closed"}`
        );
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
    [boardState, canMoveTicket, fetchTickets, showError, showSuccess]
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
    modalState,
    openModalToCreate,
    openModalToEdit,
    closeModal,
  };
};
