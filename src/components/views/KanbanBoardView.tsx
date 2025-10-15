import React from "react";
import { BoardContainer } from "../kanban/BoardContainer";
import { EmptyState } from "../ui/empty-state";
import { Skeleton } from "../ui/skeleton";
import { useKanbanBoard } from "../hooks/useKanbanBoard";

export const KanbanBoardView: React.FC = () => {
  const { boardState, isLoading, error, savingTicketId, handleDragEnd, handleStatusChangeViaMenu, canMoveTicket } =
    useKanbanBoard();

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
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 pt-20 pb-6">
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
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 pt-20 pb-6">
        <div className="max-w-full mx-auto px-6">
          <div className="flex justify-center">
            <EmptyState title="No Tickets" description="No tickets found. Create a new one to get started!" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <BoardContainer
      boardState={boardState}
      handleDragEnd={handleDragEnd}
      savingTicketId={savingTicketId}
      canMoveTicket={canMoveTicket}
      handleStatusChangeViaMenu={handleStatusChangeViaMenu}
    />
  );
};
