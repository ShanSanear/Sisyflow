import React, { useState } from "react";
import { DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { KanbanColumn } from "./KanbanColumn";
import { announceToScreenReader } from "@/lib/utils";
import type { KanbanViewModel, TicketCardViewModel, TicketStatus } from "../views/KanbanBoardView.types";
import { KeyboardHelpTooltip } from "./KeyboardHelpTooltip";

interface BoardContainerProps {
  boardState: KanbanViewModel;
  handleDragEnd: (event: DragEndEvent) => void;
  savingTicketId: string | null;
  canMoveTicket: (ticket: TicketCardViewModel) => boolean;
  handleStatusChangeViaMenu: (ticketId: string, newStatus: TicketStatus) => void;
  handleTicketDelete: (ticketId: string) => Promise<void>;
  onTicketClick?: (ticketId: string) => void;
  onTicketEdit?: (ticketId: string) => void; // Handler for opening ticket in edit mode directly
}

export const BoardContainer: React.FC<BoardContainerProps> = ({
  boardState,
  handleDragEnd,
  savingTicketId,
  canMoveTicket,
  handleStatusChangeViaMenu,
  handleTicketDelete,
  onTicketClick,
  onTicketEdit,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedTicketId, setDraggedTicketId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: (event, args) => {
        const { currentCoordinates } = args;

        switch (event.code) {
          case "ArrowRight":
            return {
              ...currentCoordinates,
              x: currentCoordinates.x + 25,
            };
          case "ArrowLeft":
            return {
              ...currentCoordinates,
              x: currentCoordinates.x - 25,
            };
          case "ArrowDown":
            return {
              ...currentCoordinates,
              y: currentCoordinates.y + 25,
            };
          case "ArrowUp":
            return {
              ...currentCoordinates,
              y: currentCoordinates.y - 25,
            };
        }

        return currentCoordinates;
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const ticketId = event.active.id as string;
    setIsDragging(true);
    setDraggedTicketId(ticketId);

    // Find ticket info for announcement
    let ticketTitle = "";
    for (const column of Object.values(boardState)) {
      const ticket = column.tickets.find((t) => t.id === ticketId);
      if (ticket) {
        ticketTitle = ticket.title;
        break;
      }
    }

    announceToScreenReader(
      `Ticket "${ticketTitle}" grabbed. Use arrow keys to move, Space or D to drop, Escape to cancel.`
    );
  };

  const handleDragOver = () => {
    // Optional: Handle drag over events if needed
  };

  const handleDragEndWithReset = (event: DragEndEvent) => {
    setIsDragging(false);
    setDraggedTicketId(null);
    handleDragEnd(event);
  };

  const handleDragCancel = () => {
    if (isDragging && draggedTicketId) {
      // Find ticket info for announcement
      let ticketTitle = "";
      for (const column of Object.values(boardState)) {
        const ticket = column.tickets.find((t) => t.id === draggedTicketId);
        if (ticket) {
          ticketTitle = ticket.title;
          break;
        }
      }

      announceToScreenReader(`Drag cancelled. Ticket "${ticketTitle}" returned to original position.`);
    }
    setIsDragging(false);
    setDraggedTicketId(null);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEndWithReset}
      onDragCancel={handleDragCancel}
    >
      <div className="max-w-full mx-auto px-6">
        <div className="flex justify-end mb-4">
          <KeyboardHelpTooltip />
        </div>
        <div
          className="flex flex-col sm:flex-row gap-6 overflow-x-auto justify-start lg:justify-center"
          role="application"
          aria-label="Kanban board with drag and drop functionality"
        >
          {Object.entries(boardState).map(([status, columnData]) => (
            <KanbanColumn
              key={status}
              id={status as keyof KanbanViewModel}
              title={columnData.title}
              tickets={columnData.tickets}
              savingTicketId={savingTicketId}
              canMoveTicket={canMoveTicket}
              handleStatusChangeViaMenu={handleStatusChangeViaMenu}
              handleTicketDelete={handleTicketDelete}
              onTicketClick={onTicketClick}
              onTicketEdit={onTicketEdit}
              isDragging={isDragging}
              draggedTicketId={draggedTicketId}
            />
          ))}
        </div>
      </div>
      {/* Hidden instructions for screen readers */}
      <div id="drag-instructions" className="sr-only">
        Use Tab to navigate between cards, Space or G to grab a ticket, arrow keys to move between columns, Space or D
        to drop, Escape to cancel drag, or Ctrl+Enter to open ticket modal.
      </div>
    </DndContext>
  );
};
