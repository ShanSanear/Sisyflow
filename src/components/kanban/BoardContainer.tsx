import React from "react";
import { DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent, DragOverEvent, DragStartEvent } from "@dnd-kit/core";
import { KanbanColumn } from "./KanbanColumn";
import type { KanbanViewModel, TicketCardViewModel, TicketStatus } from "../views/KanbanBoardView.types";

interface BoardContainerProps {
  boardState: KanbanViewModel;
  handleDragEnd: (event: DragEndEvent) => void;
  savingTicketId: string | null;
  canMoveTicket: (ticket: TicketCardViewModel) => boolean;
  handleStatusChangeViaMenu: (ticketId: string, newStatus: TicketStatus) => void;
}

export const BoardContainer: React.FC<BoardContainerProps> = ({
  boardState,
  handleDragEnd,
  savingTicketId,
  canMoveTicket,
  handleStatusChangeViaMenu,
}) => {
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
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 pt-20 pb-6">
        <div className="max-w-full mx-auto px-6">
          <div className="flex gap-6 overflow-x-auto justify-start lg:justify-center">
            {Object.entries(boardState).map(([status, columnData]) => (
              <KanbanColumn
                key={status}
                id={status as keyof KanbanViewModel}
                title={columnData.title}
                tickets={columnData.tickets}
                savingTicketId={savingTicketId}
                canMoveTicket={canMoveTicket}
                handleStatusChangeViaMenu={handleStatusChangeViaMenu}
              />
            ))}
          </div>
        </div>
      </div>
    </DndContext>
  );
};
