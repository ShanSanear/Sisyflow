import React, { useRef, useEffect, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sparkles, MoreHorizontal } from "lucide-react";
import type { TicketCardViewModel, TicketStatus } from "../views/KanbanBoardView.types";

interface TicketCardProps {
  ticket: TicketCardViewModel;
  currentStatus: TicketStatus; // Current status of the ticket
  canMove: boolean; // Flaga określająca uprawnienia do przeciągania
  isSaving: boolean; // Flaga określająca stan zapisywania
  onStatusChange?: (ticketId: string, newStatus: TicketStatus) => void; // Handler for status change via context menu
  onClick?: (ticketId: string) => void; // Handler for clicking on ticket card
  onEdit?: (ticketId: string) => void; // Handler for opening ticket in edit mode directly
}

export const TicketCard: React.FC<TicketCardProps> = ({
  ticket,
  currentStatus,
  canMove,
  isSaving,
  onStatusChange,
  onClick,
  onEdit,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ticket.id,
    disabled: !canMove || isSaving,
  });

  const titleRef = useRef<HTMLParagraphElement>(null);
  const [isTitleTruncated, setIsTitleTruncated] = useState(false);

  useEffect(() => {
    const checkTruncation = () => {
      if (titleRef.current) {
        const element = titleRef.current;
        setIsTitleTruncated(element.scrollHeight > element.clientHeight);
      }
    };

    // Check immediately and after a short delay to ensure DOM is ready
    checkTruncation();
    const timeoutId = setTimeout(checkTruncation, 100);

    return () => clearTimeout(timeoutId);
  }, [ticket.title]);

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 1000,
        willChange: "transform",
      }
    : undefined;

  const getTypeBadgeVariant = (type: TicketCardViewModel["type"]) => {
    switch (type) {
      case "BUG":
        return "destructive";
      case "IMPROVEMENT":
        return "secondary";
      case "TASK":
        return "default";
      default:
        return "default";
    }
  };

  const getTypeLabel = (type: TicketCardViewModel["type"]) => {
    switch (type) {
      case "BUG":
        return "Bug";
      case "IMPROVEMENT":
        return "Improvement";
      case "TASK":
        return "Task";
      default:
        return type;
    }
  };

  const getStatusOptions = () => {
    const allStatuses: { status: TicketStatus; label: string }[] = [
      { status: "OPEN", label: "Move to Open" },
      { status: "IN_PROGRESS", label: "Move to In Progress" },
      { status: "CLOSED", label: "Move to Closed" },
    ];

    return allStatuses.filter((option) => option.status !== currentStatus);
  };

  const cardClassName = `
    bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700
    select-none touch-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
    ${isDragging ? "shadow-xl" : "hover:shadow-md transition-shadow duration-200"}
    ${canMove && !isSaving ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}
    ${!canMove ? "cursor-not-allowed opacity-60" : ""}
    ${isSaving ? "opacity-50 animate-pulse" : ""}
    ${isDragging ? "opacity-90" : ""}
  `;

  const TitleElement = (
    <p ref={titleRef} className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
      {ticket.title}
    </p>
  );

  const handleCardClick = () => {
    if (onClick && !isDragging) {
      onClick(ticket.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === " ") && onClick && !isDragging) {
      e.preventDefault();
      onClick(ticket.id);
    }
  };

  const CardContent = (
    <>
      <div className="flex items-start justify-between mb-2">
        <Badge variant={getTypeBadgeVariant(ticket.type)} className="text-xs">
          {getTypeLabel(ticket.type)}
        </Badge>
        <div className="flex items-center gap-1">
          {ticket.isAiEnhanced && <Sparkles className="h-4 w-4 text-purple-500 flex-shrink-0" />}
          {onStatusChange && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  data-testid="ticket-card-dropdown-trigger"
                  className="h-6 w-6 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-700 opacity-60 hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {onEdit && (
                  <DropdownMenuItem
                    data-testid="ticket-card-edit-button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onEdit(ticket.id);
                    }}
                    className="border-b border-gray-200 dark:border-gray-700 mb-1"
                  >
                    Edit ticket
                  </DropdownMenuItem>
                )}
                {canMove &&
                  getStatusOptions().map((option) => (
                    <DropdownMenuItem
                      key={option.status}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onStatusChange(ticket.id, option.status);
                      }}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {TitleElement}

      {ticket.assigneeName && <p className="text-xs text-gray-600 dark:text-gray-400">👤 {ticket.assigneeName}</p>}
    </>
  );

  return (
    <TooltipProvider>
      {isTitleTruncated ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              ref={setNodeRef}
              style={style}
              {...listeners}
              {...attributes}
              data-testid={`ticket-card-${ticket.id}`}
              className={cardClassName}
              role="button"
              tabIndex={canMove && !isSaving ? 0 : -1}
              aria-label={`${ticket.title} - ${ticket.type} ticket${ticket.assigneeName ? ` assigned to ${ticket.assigneeName}` : ""}${ticket.isAiEnhanced ? " (AI enhanced)" : ""}`}
              aria-describedby="drag-instructions"
              onClick={handleCardClick}
              onKeyDown={handleKeyDown}
            >
              {CardContent}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">{ticket.title}</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        <div
          ref={setNodeRef}
          style={style}
          {...listeners}
          {...attributes}
          data-testid={`ticket-card-${ticket.id}`}
          className={cardClassName}
          role="button"
          tabIndex={canMove && !isSaving ? 0 : -1}
          aria-label={`${ticket.title} - ${ticket.type} ticket${ticket.assigneeName ? ` assigned to ${ticket.assigneeName}` : ""}${ticket.isAiEnhanced ? " (AI enhanced)" : ""}`}
          aria-describedby="drag-instructions"
          onClick={handleCardClick}
          onKeyDown={handleKeyDown}
        >
          {CardContent}
        </div>
      )}
    </TooltipProvider>
  );
};
