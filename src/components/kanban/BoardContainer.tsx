import React from "react";
import { KanbanColumn } from "./KanbanColumn";
import type { KanbanViewModel } from "../views/KanbanBoardView.types";

interface BoardContainerProps {
  boardState: KanbanViewModel;
  handleDragEnd: (event: unknown) => void; // TODO: Define proper DragEndEvent type
  savingTicketId: string | null;
}

export const BoardContainer: React.FC<BoardContainerProps> = ({
  boardState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleDragEnd: _handleDragEnd,
  savingTicketId,
}) => {
  return (
    <div className="flex gap-6 overflow-x-auto p-6 min-h-screen bg-gray-100 dark:bg-gray-950">
      {Object.entries(boardState).map(([status, columnData]) => (
        <KanbanColumn
          key={status}
          id={status as keyof KanbanViewModel}
          title={columnData.title}
          tickets={columnData.tickets}
          savingTicketId={savingTicketId}
        />
      ))}
    </div>
  );
};
