import React, { useRef, useEffect, useState } from "react";
import { useDraggable, useDndContext } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Sparkles, MoreHorizontal, Trash2 } from "lucide-react";
import { useUserContext } from "@/components/layout/useUserContext";
import { announceToScreenReader } from "@/lib/utils";
import type { TicketCardViewModel, TicketStatus } from "../views/KanbanBoardView.types";

interface TicketCardProps {
  ticket: TicketCardViewModel;
  currentStatus: TicketStatus; // Current status of the ticket
  canMove: boolean; // Flaga określająca uprawnienia do przeciągania
  isSaving: boolean; // Flaga określająca stan zapisywania
  onStatusChange?: (ticketId: string, newStatus: TicketStatus) => void; // Handler for status change via context menu
  onDelete?: (ticketId: string) => Promise<void>; // Handler for deleting ticket
  onClick?: (ticketId: string) => void; // Handler for clicking on ticket card
  onEdit?: (ticketId: string) => void; // Handler for opening ticket in edit mode directly
  isDragging?: boolean; // Whether any ticket is currently being dragged
  draggedTicketId?: string | null; // ID of the ticket being dragged
}

export const TicketCard: React.FC<TicketCardProps> = ({
  ticket,
  currentStatus,
  canMove,
  isSaving,
  onStatusChange,
  onDelete,
  onClick,
  onEdit,
  isDragging: isAnyDragging = false,
  draggedTicketId = null,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ticket.id,
    disabled: isSaving,
  });
  const { active, cancel } = useDndContext();

  // Don't apply drag listeners when user can't move the ticket
  const dragListeners = canMove ? listeners : {};
  const dragAttributes = canMove ? attributes : {};

  // Check if this ticket is the one being dragged
  const isThisTicketDragging = isDragging || (isAnyDragging && draggedTicketId === ticket.id);
  
  // Disable Tab navigation when any ticket is being dragged (except the one being dragged)
  const shouldDisableTab = isAnyDragging && !isThisTicketDragging;

  const titleRef = useRef<HTMLParagraphElement>(null);
  const [isTitleTruncated, setIsTitleTruncated] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { currentUser } = useUserContext();

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
    ${!canMove ? "cursor-not-allowed" : ""}
    ${isSaving ? "opacity-50 animate-pulse" : ""}
    ${isDragging ? "opacity-90" : ""}
  `;

  const TitleElement = (
    <p ref={titleRef} className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
      {ticket.title}
    </p>
  );

  const handleCardClick = () => {
    // Only open modal if not dragging
    if (onClick && !isThisTicketDragging) {
      onClick(ticket.id);
    }
  };

  // Merge our custom keyboard handler with dnd-kit's drag listeners
  const mergedKeyDownHandler = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      const isEnter = e.key === "Enter";
      const isSpace = e.key === " ";
      const isG = e.key === "g" || e.key === "G";
      const isD = e.key === "d" || e.key === "D";

      // Ctrl+Enter: Open modal (only when not dragging)
      if (isCtrlOrCmd && isEnter && onClick && !isThisTicketDragging) {
        e.preventDefault();
        e.stopPropagation();
        onClick(ticket.id);
        announceToScreenReader(`Opening ticket "${ticket.title}" in modal.`);
        return;
      }

      // If dragging is active and this isn't the dragged ticket, prevent all keyboard interactions
      if (isAnyDragging && !isThisTicketDragging) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // G key: Simulate Space to start drag
      if (isG && canMove && !isSaving && !isThisTicketDragging && !isAnyDragging) {
        e.preventDefault();
        e.stopPropagation();
        // Call dnd-kit's handler directly with a Space-like event
        if (dragListeners.onKeyDown) {
          // Create a new event object that looks like Space was pressed
          const spaceLikeEvent = {
            ...e,
            key: " ",
            code: "Space",
            keyCode: 32,
            which: 32,
            keyIdentifier: "U+0020",
            charCode: 32,
            nativeEvent: {
              ...e.nativeEvent,
              key: " ",
              code: "Space",
              keyCode: 32,
              which: 32,
            },
          } as React.KeyboardEvent<HTMLDivElement>;
          dragListeners.onKeyDown(spaceLikeEvent);
        }
        return;
      }

      // D key: Simulate Space to end drag
      if (isD && isThisTicketDragging && active?.id === ticket.id) {
        e.preventDefault();
        e.stopPropagation();
        // Call dnd-kit's handler directly with a Space-like event for drop
        if (dragListeners.onKeyDown) {
          const spaceLikeEvent = {
            ...e,
            key: " ",
            code: "Space",
            keyCode: 32,
            which: 32,
            keyIdentifier: "U+0020",
            charCode: 32,
            nativeEvent: {
              ...e.nativeEvent,
              key: " ",
              code: "Space",
              keyCode: 32,
              which: 32,
            },
          } as React.KeyboardEvent<HTMLDivElement>;
          dragListeners.onKeyDown(spaceLikeEvent);
        }
        return;
      }

      // Enter/Space: Open modal (only when not dragging and ticket cannot be moved)
      if ((isEnter || isSpace) && onClick && !isThisTicketDragging && !isAnyDragging && !canMove) {
        e.preventDefault();
        onClick(ticket.id);
        return;
      }

      // For Space/Enter when can move: Call dnd-kit's handler to handle drag start/end
      if (dragListeners.onKeyDown && canMove && (isSpace || isEnter)) {
        dragListeners.onKeyDown(e);
        return;
      }
    },
    [
      canMove,
      isSaving,
      isThisTicketDragging,
      isAnyDragging,
      onClick,
      ticket.id,
      ticket.title,
      dragListeners,
      active?.id,
    ]
  );

  // Merge drag listeners with our custom onKeyDown handler
  const mergedDragListeners = React.useMemo(() => {
    if (!canMove) return {};
    return {
      ...dragListeners,
      onKeyDown: mergedKeyDownHandler,
    };
  }, [canMove, dragListeners, mergedKeyDownHandler]);

  const handleDeleteTicket = async () => {
    if (!onDelete) return;

    setIsDeleting(true);
    setShowDeleteDialog(false);

    try {
      await onDelete(ticket.id);
    } catch (error) {
      // Error handling is done in the parent component (useKanbanBoard hook)
      console.error("Error deleting ticket:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const CardContent = (
    <>
      <div className="flex items-start justify-between mb-2">
        <Badge variant={getTypeBadgeVariant(ticket.type)} className="text-xs">
          {getTypeLabel(ticket.type)}
        </Badge>
        <div className="flex items-center gap-1">
          {ticket.isAiEnhanced && <Sparkles className="h-4 w-4 text-purple-500 shrink-0" />}
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
                {currentUser?.role === "ADMIN" && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowDeleteDialog(true);
                    }}
                    className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                    disabled={isDeleting}
                    data-testid="ticket-card-delete-button"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isDeleting ? "Deleting..." : "Delete ticket"}
                  </DropdownMenuItem>
                )}
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
              {...mergedDragListeners}
              {...dragAttributes}
              data-testid={`ticket-card-${ticket.id}`}
              className={cardClassName}
              role="button"
              tabIndex={shouldDisableTab || isSaving ? -1 : 0}
              aria-label={`${ticket.title} - ${ticket.type} ticket${ticket.assigneeName ? ` assigned to ${ticket.assigneeName}` : ""}${ticket.isAiEnhanced ? " (AI enhanced)" : ""}`}
              aria-describedby="drag-instructions"
              aria-grabbed={isThisTicketDragging}
              aria-disabled={isSaving || !canMove}
              onClick={handleCardClick}
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
          {...mergedDragListeners}
          {...dragAttributes}
          data-testid={`ticket-card-${ticket.id}`}
          className={cardClassName}
          role="button"
          tabIndex={shouldDisableTab || isSaving ? -1 : 0}
          aria-label={`${ticket.title} - ${ticket.type} ticket${ticket.assigneeName ? ` assigned to ${ticket.assigneeName}` : ""}${ticket.isAiEnhanced ? " (AI enhanced)" : ""}`}
          aria-describedby="drag-instructions"
          aria-grabbed={isThisTicketDragging}
          aria-disabled={isSaving || !canMove}
          onClick={handleCardClick}
        >
          {CardContent}
        </div>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent data-testid="delete-ticket-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ticket</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this ticket? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="delete-ticket-cancel" disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-testid="delete-ticket-confirm"
              onClick={handleDeleteTicket}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
};
