import React from "react";
import { DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent, DragOverEvent, DragStartEvent } from "@dnd-kit/core";
import { KanbanColumn } from "./KanbanColumn";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Keyboard } from "lucide-react";
import type { KanbanViewModel, TicketCardViewModel, TicketStatus } from "../views/KanbanBoardView.types";

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
          <div className="flex justify-end mb-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Keyboard className="h-4 w-4" />
                    Keyboard Help
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <div className="space-y-2">
                    <p className="font-medium">Keyboard Navigation:</p>
                    <ul className="text-sm space-y-1">
                      <li>
                        <kbd className="px-1 py-0.5 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 rounded text-xs font-mono">
                          Tab
                        </kbd>{" "}
                        - Navigate between cards
                      </li>
                      <li>
                        <kbd className="px-1 py-0.5 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 rounded text-xs font-mono">
                          Space/Enter
                        </kbd>{" "}
                        - Start/End drag
                      </li>
                      <li>
                        <kbd className="px-1 py-0.5 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 rounded text-xs font-mono">
                          Arrow Keys
                        </kbd>{" "}
                        - Move card
                      </li>
                      <li>
                        <kbd className="px-1 py-0.5 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 rounded text-xs font-mono">
                          Escape
                        </kbd>{" "}
                        - Cancel drag
                      </li>
                    </ul>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
              />
            ))}
          </div>
        </div>
        {/* Hidden instructions for screen readers */}
        <div id="drag-instructions" className="sr-only">
          Use Tab to navigate between cards, Space or Enter to start dragging, arrow keys to move, and Space or Enter to
          drop. Press Escape to cancel.
        </div>
      </div>
    </DndContext>
  );
};
