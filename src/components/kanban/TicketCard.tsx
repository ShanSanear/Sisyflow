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
  currentStatus: TicketStatus;
  canMove: boolean;
  isSaving: boolean;
  onStatusChange?: (ticketId: string, newStatus: TicketStatus) => void;
  onSelect?: (ticket: TicketCardViewModel) => void;
}

export const TicketCard: React.FC<TicketCardProps> = ({
  ticket,
  currentStatus,
  canMove,
  isSaving,
  onStatusChange,
  onSelect,
}) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
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

  // const cardClassName = `
  //   bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700
  //   select-none touch-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
  //   ${isDragging ? "shadow-xl" : "hover:shadow-md transition-shadow duration-200"}
  //   ${canMove && !isSaving ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}
  //   ${!canMove ? "cursor-not-allowed opacity-60" : ""}
  //   ${isSaving ? "opacity-50 animate-pulse" : ""}
  //   ${isDragging ? "opacity-90" : ""}
  // `;

  const handleSelect = () => {
    if (onSelect && !isSaving) {
      onSelect(ticket);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!onSelect || isSaving) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(ticket);
    }
  };

  const TitleElement = (
    <p ref={titleRef} className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
      {ticket.title}
    </p>
  );

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
                  className="h-6 w-6 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-700 opacity-60 hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {getStatusOptions().map((option) => (
                  <DropdownMenuItem
                    key={option.status}
                    onClick={() => onStatusChange(ticket.id, option.status)}
                    disabled={!canMove}
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

  const interactive = Boolean(onSelect);

  const cardProps: React.HTMLAttributes<HTMLDivElement> = {
    ref: setNodeRef,
    style,
    role: interactive ? "button" : undefined,
    tabIndex: interactive ? 0 : canMove && !isSaving ? 0 : -1,
    "aria-label": `${ticket.title} - ${ticket.type} ticket${ticket.assigneeName ? ` assigned to ${ticket.assigneeName}` : ""}${ticket.isAiEnhanced ? " (AI enhanced)" : ""}`,
    "aria-describedby": canMove && !isSaving ? "drag-instructions" : undefined,
    onClick: interactive ? handleSelect : undefined,
    onKeyDown: interactive ? handleKeyDown : undefined,
    ...listeners,
    ...attributes,
  };

  return (
    <TooltipProvider>
      {isTitleTruncated ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <div {...cardProps}>{CardContent}</div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">{ticket.title}</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        <div {...cardProps}>{CardContent}</div>
      )}
    </TooltipProvider>
  );
};
