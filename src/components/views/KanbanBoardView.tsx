import React, { useState, useEffect } from "react";
import { BoardContainer } from "../kanban/BoardContainer";
import { EmptyState } from "../ui/empty-state";
import { Skeleton } from "../ui/skeleton";
import type { KanbanViewModel, TicketCardViewModel } from "./KanbanBoardView.types";

// Mock data for development
const mockTickets: TicketCardViewModel[] = [
  {
    id: "1",
    title: "Fix login button not responding on mobile devices",
    assigneeName: "Jan Kowalski",
    type: "BUG",
    isAiEnhanced: true,
    reporterId: "user-1",
    assigneeId: "user-2",
  },
  {
    id: "2",
    title: "Add dark mode toggle to user settings",
    assigneeName: "Anna Nowak",
    type: "IMPROVEMENT",
    isAiEnhanced: false,
    reporterId: "user-1",
    assigneeId: "user-3",
  },
  {
    id: "3",
    title: "Create user onboarding flow for new registrations",
    assigneeName: "Piotr Wiśniewski",
    type: "TASK",
    isAiEnhanced: true,
    reporterId: "user-2",
    assigneeId: "user-4",
  },
  {
    id: "4",
    title: "Database connection timeout issues in production",
    assigneeName: "Maria Zielińska",
    type: "BUG",
    isAiEnhanced: false,
    reporterId: "user-3",
    assigneeId: "user-5",
  },
  {
    id: "5",
    title: "Implement search functionality for ticket list",
    assigneeName: undefined,
    type: "TASK",
    isAiEnhanced: true,
    reporterId: "user-1",
    assigneeId: null,
  },
];

const mockBoardState: KanbanViewModel = {
  OPEN: {
    title: "Open",
    tickets: mockTickets.slice(0, 2),
  },
  IN_PROGRESS: {
    title: "In Progress",
    tickets: mockTickets.slice(2, 4),
  },
  CLOSED: {
    title: "Closed",
    tickets: mockTickets.slice(4),
  },
};

export const KanbanBoardView: React.FC = () => {
  const [boardState, setBoardState] = useState<KanbanViewModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [savingTicketId, _setSavingTicketId] = useState<string | null>(null); // eslint-disable-line @typescript-eslint/no-unused-vars

  // Simulate data loading
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setBoardState(mockBoardState);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to load tickets"));
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleDragEnd = (event: unknown) => {
    // TODO: Implement drag and drop logic
    console.log("Drag end event:", event);
  };

  if (isLoading) {
    return (
      <div className="flex gap-6 overflow-x-auto p-6 min-h-screen bg-gray-100 dark:bg-gray-950">
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
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Loading Error"
        description="Failed to load tickets. Please refresh the page."
        action={{
          label: "Try Again",
          onClick: () => window.location.reload(),
        }}
      />
    );
  }

  if (!boardState) {
    return <EmptyState title="No Data" description="No tickets found." />;
  }

  // Check if all columns are empty
  const hasTickets = Object.values(boardState).some((column) => column.tickets.length > 0);

  if (!hasTickets) {
    return <EmptyState title="No Tickets" description="No tickets found. Create a new one to get started!" />;
  }

  return <BoardContainer boardState={boardState} handleDragEnd={handleDragEnd} savingTicketId={savingTicketId} />;
};
