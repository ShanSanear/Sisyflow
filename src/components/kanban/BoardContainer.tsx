import React from "react";
import { DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent, DragOverEvent, DragStartEvent } from "@dnd-kit/core";
import { KanbanColumn } from "./KanbanColumn";
import type { KanbanViewModel } from "../views/KanbanBoardView.types";

interface BoardContainerProps {
  boardState: KanbanViewModel;
  handleDragEnd: (event: DragEndEvent) => void;
  savingTicketId: string | null;
}

export const BoardContainer: React.FC<BoardContainerProps> = ({ boardState, handleDragEnd, savingTicketId }) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before drag starts
      },
    })
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDragStart = (event: DragStartEvent) => {
    // Optional: Add visual feedback when dragging starts
    // console.log("Drag started:", event.active.id);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDragOver = (event: DragOverEvent) => {
    // Optional: Handle drag over events if needed
    // console.log("Drag over:", event.over?.id);
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
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
    </DndContext>
  );
};
