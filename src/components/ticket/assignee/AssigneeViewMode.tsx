import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import type { AssigneeViewModeProps } from "@/types";

/**
 * Komponent wyświetlający sekcję assignee w trybie podglądu
 * Obsługuje wyświetlanie aktualnego przypisania oraz przyciski akcji dla użytkowników
 */
export const AssigneeViewMode: React.FC<AssigneeViewModeProps> = ({
  assignee,
  currentUser,
  onAssign,
  canModifyAssignment,
  isUpdating,
}) => {
  const handleUnassign = () => {
    if (!canModifyAssignment) return;
    onAssign(null);
  };

  const handleAssignMe = () => {
    if (!canModifyAssignment || !currentUser) return;
    onAssign({ id: currentUser.id, username: currentUser.username });
  };

  return (
    <div data-testid="assignee-section-view" className="space-y-2">
      <Label>Assignee</Label>
      <div className="flex items-center gap-2">
        {assignee ? (
          <>
            <Badge data-testid="assignee-section-view-badge" variant="secondary">
              {assignee.username}
            </Badge>
            {assignee.id === currentUser?.id && canModifyAssignment && (
              <Button
                data-testid="assignee-section-view-unassign-button"
                type="button"
                variant="outline"
                size="sm"
                onClick={handleUnassign}
                disabled={isUpdating}
                aria-label={isUpdating ? "Unassigning ticket..." : "Unassign ticket from me"}
              >
                {isUpdating ? "Updating..." : "Unassign"}
              </Button>
            )}
          </>
        ) : (
          <>
            <span className="text-sm text-muted-foreground">Unassigned</span>
            {canModifyAssignment && currentUser && (
              <Button
                data-testid="assignee-section-view-assign-button"
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAssignMe}
                disabled={isUpdating}
                aria-label={isUpdating ? "Assigning ticket to you..." : "Assign ticket to me"}
              >
                {isUpdating ? "Assigning..." : "Assign to me"}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
