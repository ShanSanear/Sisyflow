import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
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
  onAssign: (assignee: { id: string; username: string } | null) => void;
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

    // Check if online
    if (!navigator.onLine) {
      toast.error("No internet connection", {
        description: "Please check your connection and try again",
      });
      return;
    }

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
      onAssign(updatedTicket.assignee || null);
    } catch (error) {
      console.error("Error updating assignee:", error);
      toast.error("Failed to update assignee", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setAssigning(false);
    }
  };

  const handleAssignMe = () => {
    if (!currentUser || !canModifyAssignment) return;
    const newAssigneeId = assignee ? null : currentUser.id;
    handleAssigneeUpdate(newAssigneeId);
  };

  // Check if current user can modify this assignment
  const canModifyAssignment = !assignee || assignee.id === currentUser?.id;

  const handleAdminAssign = (assigneeId: string | null) => {
    handleAssigneeUpdate(assigneeId);
  };

  if (mode === "view") {
    return (
      <div data-testid="ticket-modal-assignee-section-view" className="space-y-2">
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
    <div data-testid="ticket-modal-assignee-section-edit" className="space-y-2">
      <Label>Assignee</Label>

      {isAdmin ? (
        <Select
          data-testid="ticket-modal-assignee-section-edit-select"
          value={assignee?.id || " "}
          onValueChange={(value) => handleAdminAssign(value || null)}
          disabled={assigning}
        >
          <SelectTrigger
            data-testid="ticket-modal-assignee-section-edit-select-trigger"
            aria-label="Select ticket assignee"
          >
            <SelectValue placeholder="Select user..." />
          </SelectTrigger>
          <SelectContent data-testid="ticket-modal-assignee-section-edit-select-content">
            <SelectItem value=" ">Unassigned</SelectItem>
            {DUMMY_USERS.map((user) => (
              <SelectItem data-testid="ticket-modal-assignee-section-edit-select-item" key={user.id} value={user.id}>
                {user.username}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <div data-testid="ticket-modal-assignee-section-edit-buttons" className="flex items-center gap-2">
          {assignee ? (
            <>
              <Badge data-testid="ticket-modal-assignee-section-edit-buttons-badge" variant="secondary">
                {assignee.username}
              </Badge>
              {canModifyAssignment && (
                <Button
                  data-testid="ticket-modal-assignee-section-edit-buttons-button"
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAssignMe}
                  disabled={assigning}
                  aria-label={assigning ? "Unassigning ticket..." : "Unassign ticket from me"}
                >
                  {assigning ? "Updating..." : "Unassign"}
                </Button>
              )}
            </>
          ) : (
            canModifyAssignment && (
              <Button
                data-testid="ticket-modal-assignee-section-edit-buttons-button"
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAssignMe}
                disabled={assigning}
                aria-label={assigning ? "Assigning ticket to you..." : "Assign ticket to me"}
              >
                {assigning ? "Assigning..." : "Assign to me"}
              </Button>
            )
          )}
        </div>
      )}
    </div>
  );
};
