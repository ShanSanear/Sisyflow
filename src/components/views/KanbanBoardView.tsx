import React, { useEffect } from "react";
import { BoardContainer } from "../kanban/BoardContainer";
import { EmptyState } from "../ui/empty-state";
import { Skeleton } from "../ui/skeleton";
import { TicketModal } from "../ticket/TicketModal";
import { useKanbanBoard } from "../hooks/useKanbanBoard";
import { addTicketModalEventListener } from "@/lib/events";

export const KanbanBoardView: React.FC = () => {
  const {
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
  } = useKanbanBoard();

  useEffect(() => {
    const removeListener = addTicketModalEventListener((event) => {
      if (event.detail.type === "create") {
        void openModalToCreate();
        return;
      }

      if (event.detail.type === "edit") {
        void openModalToEdit(event.detail.ticketId);
      }
    });

    return () => {
      removeListener();
    };
  }, [openModalToCreate, openModalToEdit]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 pt-20 pb-6">
        <div className="max-w-full mx-auto px-6">
          <div className="flex gap-6 overflow-x-auto justify-start lg:justify-center">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex flex-col w-80 min-h-[600px] bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
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
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 pt-20 pb-6">
        <div className="max-w-full mx-auto px-6">
          <div className="flex justify-center">
            <EmptyState
              title="Loading Error"
              description="Failed to load tickets. Please refresh the page."
              action={{
                label: "Try Again",
                onClick: () => void refetch(),
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (!boardState) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 pt-20 pb-6">
        <div className="max-w-full mx-auto px-6">
          <div className="flex justify-center">
            <EmptyState title="No Data" description="No tickets found." />
          </div>
        </div>
      </div>
    );
  }

  const hasTickets = Object.values(boardState).some((column) => column.tickets.length > 0);

  return (
    <div className="relative">
      <BoardContainer
        boardState={boardState}
        handleDragEnd={handleDragEnd}
        savingTicketId={savingTicketId}
        canMoveTicket={canMoveTicket}
        handleStatusChangeViaMenu={handleStatusChangeViaMenu}
        onTicketSelect={(ticket) => {
          void openModalToEdit(ticket.id);
        }}
      />

      {!hasTickets ? (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <EmptyState title="No Tickets" description="No tickets found. Create a new one to get started!" />
        </div>
      ) : null}

      <TicketModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        mode={modalState.mode}
        initialTicket={modalState.selectedTicket}
        onSave={async () => {
          await refetch();
        }}
        users={modalState.users}
      />
    </div>
  );
};
