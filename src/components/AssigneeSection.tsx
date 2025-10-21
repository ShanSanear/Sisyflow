import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { TicketModalMode, UserDTO } from "@/types";

// Dummy data for users (to be replaced with real API)
const DUMMY_USERS: UserDTO[] = [
  { id: "1", username: "john.doe", email: "john@example.com", role: "USER", created_at: new Date().toISOString() },
  { id: "2", username: "jane.smith", email: "jane@example.com", role: "USER", created_at: new Date().toISOString() },
  {
    id: "8ed86b00-fe7e-4339-88d1-9ec658025b8e",
    username: "medan1993",
    email: "medan1993@gmail.com",
    role: "ADMIN",
    created_at: new Date().toISOString(),
  },
];

interface AssigneeSectionProps {
  assignee?: { id: string; username: string };
  currentUser: UserDTO | null;
  isAdmin: boolean;
  onAssign: (assigneeId: string | null) => void;
  mode: TicketModalMode;
  ticketId?: string;
}

/**
 * Sekcja do przypisywania użytkownika do ticketa
 */
export const AssigneeSection: React.FC<AssigneeSectionProps> = ({
  assignee,
  currentUser,
  isAdmin,
  onAssign,
  mode,
  ticketId,
}) => {
  const [assigning, setAssigning] = useState(false);

  const handleAssigneeUpdate = async (assigneeId: string | null) => {
    if (!ticketId) return;

    setAssigning(true);
    try {
      const response = await fetch(`/api/tickets/${ticketId}/assignee`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ assignee_id: assigneeId }),
      });

      if (!response.ok) {
        throw new Error("Failed to update assignee");
      }

      const updatedTicket = await response.json();
      onAssign(updatedTicket.assignee_id);
    } catch (error) {
      console.error("Error updating assignee:", error);
      // TODO: Show toast error
    } finally {
      setAssigning(false);
    }
  };

  const handleAssignMe = () => {
    if (!currentUser) return;
    const newAssigneeId = assignee ? null : currentUser.id;
    handleAssigneeUpdate(newAssigneeId);
  };

  const handleAdminAssign = (assigneeId: string | null) => {
    handleAssigneeUpdate(assigneeId);
  };

  if (mode === "view") {
    return (
      <div className="space-y-2">
        <Label>Assignee</Label>
        <div>
          {assignee ? (
            <Badge variant="secondary">{assignee.username}</Badge>
          ) : (
            <span className="text-sm text-muted-foreground">Unassigned</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>Assignee</Label>

      {isAdmin ? (
        <Select
          value={assignee?.id || " "}
          onValueChange={(value) => handleAdminAssign(value || null)}
          disabled={assigning}
        >
          <SelectTrigger aria-label="Select ticket assignee">
            <SelectValue placeholder="Select user..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value=" ">Unassigned</SelectItem>
            {DUMMY_USERS.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.username}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <div className="flex items-center gap-2">
          {assignee ? (
            <>
              <Badge variant="secondary">{assignee.username}</Badge>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAssignMe}
                disabled={assigning}
                aria-label={assigning ? "Unassigning ticket..." : "Unassign ticket from me"}
              >
                {assigning ? "Updating..." : "Unassign"}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAssignMe}
              disabled={assigning}
              aria-label={assigning ? "Assigning ticket to you..." : "Assign ticket to me"}
            >
              {assigning ? "Assigning..." : "Assign to me"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
