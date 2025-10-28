import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AssigneeUserActionsProps } from "@/types";

/**
 * Komponent z przyciskami akcji dla zwykłych użytkowników
 * Pozwala tylko na przypisanie/odpisanie własnego ticketu
 */
export const AssigneeUserActions: React.FC<AssigneeUserActionsProps> = ({
  assignee,
  currentUser,
  canModifyAssignment,
  onAssign,
  isUpdating,
}) => {
  const handleAssignMe = () => {
    if (!currentUser || !canModifyAssignment) return;
    const newAssigneeId = assignee ? null : currentUser.id;
    onAssign(newAssigneeId ? { id: newAssigneeId, username: currentUser.username } : null);
  };

  return (
    <div data-testid="assignee-section-user-actions" className="flex items-center gap-2">
      {assignee ? (
        <>
          <Badge data-testid="assignee-section-user-actions-badge" variant="secondary">
            {assignee.username}
          </Badge>
          {canModifyAssignment && (
            <Button
              data-testid="assignee-section-user-actions-unassign-button"
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAssignMe}
              disabled={isUpdating}
              aria-label={isUpdating ? "Unassigning ticket..." : "Unassign ticket from me"}
            >
              {isUpdating ? "Updating..." : "Unassign"}
            </Button>
          )}
        </>
      ) : (
        canModifyAssignment && (
          <Button
            data-testid="assignee-section-user-actions-assign-button"
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAssignMe}
            disabled={isUpdating}
            aria-label={isUpdating ? "Assigning ticket to you..." : "Assign ticket to me"}
          >
            {isUpdating ? "Assigning..." : "Assign to me"}
          </Button>
        )
      )}
    </div>
  );
};
