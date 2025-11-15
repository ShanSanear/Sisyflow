import React, { useEffect } from "react";
import { BoardContainer } from "../kanban/BoardContainer";
import { EmptyState } from "../ui/empty-state";
import { Skeleton } from "../ui/skeleton";
import { useKanbanBoard } from "../../lib/hooks/useKanbanBoard";
import { useTicketModal } from "../../lib/contexts/TicketModalContext";
import { announceToScreenReader } from "../../lib/utils";

/**
 * Checks if the user is currently typing in an input field, textarea, or contenteditable element
 */
const isTypingInInput = (): boolean => {
  const activeElement = document.activeElement;
  if (!activeElement) return false;

  const tagName = activeElement.tagName.toLowerCase();
  const isInput =
    tagName === "input" &&
    (activeElement as HTMLInputElement).type !== "button" &&
    (activeElement as HTMLInputElement).type !== "submit";
  const isTextarea = tagName === "textarea";
  const isContentEditable = activeElement.getAttribute("contenteditable") === "true";

  return isInput || isTextarea || isContentEditable;
};

/**
 * Checks if text is currently selected
 */
const hasTextSelection = (): boolean => {
  const selection = window.getSelection();
  return selection !== null && selection.toString().length > 0;
};

export const KanbanBoardView: React.FC = () => {
  const {
    boardState,
    isLoading,
    error,
    savingTicketId,
    handleDragEnd,
    handleStatusChangeViaMenu,
    handleTicketDelete,
    canMoveTicket,
    refetch,
  } = useKanbanBoard();
  const { setOpen, isOpen } = useTicketModal();

  const handleTicketClick = (ticketId: string) => {
    setOpen({ mode: "view", ticketId });
  };

  const handleTicketEdit = (ticketId: string) => {
    setOpen({ mode: "edit", ticketId });
  };

  // Handle query params for opening modal with specific ticket
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ticketId = urlParams.get("ticketId");
    const ticketMode = urlParams.get("mode");

    if (ticketId) {
      setOpen({
        mode: ticketMode === "view" ? "view" : "edit",
        ticketId,
      });
    }
  }, [setOpen]);

  // Handle ticket save events
  useEffect(() => {
    const handleTicketSaved = () => {
      // Refetch board data to show updated ticket
      refetch();
    };

    window.addEventListener("ticket:saved", handleTicketSaved);
    return () => window.removeEventListener("ticket:saved", handleTicketSaved);
  }, [refetch]);

  // Handle "C" key to open ticket creation modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only trigger if:
      // 1. Key is "c" or "C" (case-insensitive)
      // 2. Modal is not already open
      // 3. User is not typing in an input field
      // 4. No text is selected
      // 5. Not holding Ctrl/Cmd (to avoid conflicts with Ctrl+C)
      if (
        (event.key === "c" || event.key === "C") &&
        !isOpen &&
        !isTypingInInput() &&
        !hasTextSelection() &&
        !event.ctrlKey &&
        !event.metaKey
      ) {
        event.preventDefault();
        setOpen({ mode: "create" });

        announceToScreenReader("Ticket creation modal opened. Press Ctrl+Enter to save.");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, setOpen]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 pt-20 pb-6" data-testid="board-loading-state">
        <div className="max-w-full mx-auto px-6">
          <div className="flex flex-col sm:flex-row gap-6 overflow-x-auto justify-start lg:justify-center">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="flex flex-col w-full sm:w-80 min-h-[600px] bg-gray-50 dark:bg-gray-900 rounded-lg p-4"
              >
                <Skeleton className="h-6 w-24 mb-4" />
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, cardIndex) => (
                    <Skeleton key={cardIndex} className="h-24 w-full rounded-lg" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    console.error(error);
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 pt-20 pb-6" data-testid="board-error-state">
        <div className="max-w-full mx-auto px-6">
          <div className="flex justify-center">
            <EmptyState
              title="Loading Error"
              description="Failed to load tickets. Please refresh the page."
              action={{
                label: "Try Again",
                onClick: () => window.location.reload(),
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (!boardState) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 pt-20 pb-6" data-testid="board-empty-state">
        <div className="max-w-full mx-auto px-6">
          <div className="flex justify-center">
            <EmptyState title="No Data" description="No tickets found." />
          </div>
        </div>
      </div>
    );
  }

  // Check if all columns are empty
  const hasTickets = Object.values(boardState).some((column) => column.tickets.length > 0);

  if (!hasTickets) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 pt-20 pb-6" data-testid="board-no-tickets-state">
        <div className="max-w-full mx-auto px-6">
          <div className="flex justify-center">
            <EmptyState title="No Tickets" description="No tickets found. Create a new one to get started!" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="kanban-board-container">
      <BoardContainer
        boardState={boardState}
        handleDragEnd={handleDragEnd}
        savingTicketId={savingTicketId}
        canMoveTicket={canMoveTicket}
        handleStatusChangeViaMenu={handleStatusChangeViaMenu}
        handleTicketDelete={handleTicketDelete}
        onTicketClick={handleTicketClick}
        onTicketEdit={handleTicketEdit}
      />
    </div>
  );
};
