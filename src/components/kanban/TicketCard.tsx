import React from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sparkles } from "lucide-react";
import type { TicketCardViewModel } from "../views/KanbanBoardView.types";

interface TicketCardProps {
  ticket: TicketCardViewModel;
  canMove: boolean; // Flaga określająca uprawnienia do przeciągania
  isSaving: boolean; // Flaga określająca stan zapisywania
}

export const TicketCard: React.FC<TicketCardProps> = ({ ticket, canMove, isSaving }) => {
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

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`
              bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700
              hover:shadow-md transition-all duration-200 cursor-pointer
              ${!canMove ? "cursor-not-allowed opacity-60" : ""}
              ${isSaving ? "opacity-50 animate-pulse" : ""}
            `}
            onPointerDown={(e) => {
              if (!canMove) {
                e.preventDefault();
                return;
              }
              // Handle drag initiation
            }}
          >
            <div className="flex items-start justify-between mb-2">
              <Badge variant={getTypeBadgeVariant(ticket.type)} className="text-xs">
                {getTypeLabel(ticket.type)}
              </Badge>
              {ticket.isAiEnhanced && <Sparkles className="h-4 w-4 text-purple-500 ml-2 flex-shrink-0" />}
            </div>

            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">{ticket.title}</p>

            {ticket.assigneeName && (
              <p className="text-xs text-gray-600 dark:text-gray-400">👤 {ticket.assigneeName}</p>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{ticket.title}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
