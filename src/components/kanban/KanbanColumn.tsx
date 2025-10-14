import React from "react";
import { TicketCard } from "./TicketCard";
import type { TicketCardViewModel, TicketStatus } from "../views/KanbanBoardView.types";

interface KanbanColumnProps {
  id: TicketStatus; // "OPEN" | "IN_PROGRESS" | "CLOSED"
  title: string;
  tickets: TicketCardViewModel[];
  savingTicketId: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const KanbanColumn: React.FC<KanbanColumnProps> = ({ id: _id, title, tickets, savingTicketId }) => {
  return (
    <div className="flex flex-col w-80 min-h-[600px] bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
        <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium px-2 py-1 rounded-full">
          {tickets.length}
        </span>
      </div>

      <div className="flex-1 space-y-3">
        {tickets.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            canMove={true} // Na razie zawsze true, później będzie logika uprawnień
            isSaving={savingTicketId === ticket.id}
          />
        ))}
        {tickets.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">No tickets in this column</div>
        )}
      </div>
    </div>
  );
};
