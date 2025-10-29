import React from "react";
import { Label } from "@/components/ui/label";
import { AssigneeAdminSelect } from "./AssigneeAdminSelect";
import { AssigneeUserActions } from "./AssigneeUserActions";
import type { AssigneeEditModeProps } from "@/types";

/**
 * Komponent wyświetlający sekcję assignee w trybie edycji
 * Wyświetla odpowiednie kontrolki w zależności od uprawnień użytkownika
 */
export const AssigneeEditMode: React.FC<AssigneeEditModeProps> = ({
  assignee,
  currentUser,
  isAdmin,
  onAssign,
  canModifyAssignment,
  isUpdating,
  mode,
  onFormChange,
}) => {
  return (
    <div data-testid="assignee-section-edit" className="space-y-2">
      <Label>Assignee</Label>

      {isAdmin ? (
        <AssigneeAdminSelect
          assignee={assignee}
          onAssign={onAssign}
          isUpdating={isUpdating}
          mode={mode}
          onFormChange={onFormChange}
        />
      ) : (
        <AssigneeUserActions
          assignee={assignee}
          currentUser={currentUser}
          canModifyAssignment={canModifyAssignment}
          onAssign={onAssign}
          isUpdating={isUpdating}
        />
      )}
    </div>
  );
};
