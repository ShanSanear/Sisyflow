import React, { useState, useMemo, useEffect } from "react";
import { useAssigneeActions } from "@/lib/hooks/useAssigneeActions";
import { AssigneeViewMode } from "./ticket/assignee/AssigneeViewMode";
import { AssigneeEditMode } from "./ticket/assignee/AssigneeEditMode";
import type { Assignee, AssigneeSectionProps } from "@/types";

/**
 * Sekcja do przypisywania użytkownika do ticketa
 * Używa lokalnego stanu dla natychmiastowej odpowiedzi UI
 */
export const AssigneeSection: React.FC<AssigneeSectionProps> = ({
  assignee,
  currentUser,
  isAdmin,
  onAssign,
  mode,
  ticketId,
  reporterId,
}) => {
  const { updateAssignee, isUpdating } = useAssigneeActions({
    ticketId,
    onAssign,
  });

  // Use regular state for optimistic updates (useOptimistic can be added later)
  const [optimisticAssignee, setOptimisticAssignee] = useState<Assignee | null | undefined>(assignee);

  // Sync optimisticAssignee with assignee prop changes
  useEffect(() => {
    setOptimisticAssignee(assignee);
  }, [assignee]);

  // Check if current user can modify this assignment
  // Non-admin users can only assign unassigned tickets if they are not the reporter
  // (per RLS policy: tickets_assign_self_unassigned)
  const canModifyAssignment = useMemo(
    () =>
      isAdmin || ((!optimisticAssignee || optimisticAssignee.id === currentUser?.id) && reporterId !== currentUser?.id),
    [isAdmin, optimisticAssignee, currentUser?.id, reporterId]
  );

  const handleAssigneeUpdate = async (newAssignee: Assignee | null) => {
    const previousAssignee = optimisticAssignee;
    setOptimisticAssignee(newAssignee);

    try {
      await updateAssignee(newAssignee?.id || null);
    } catch (error) {
      // Rollback on error
      setOptimisticAssignee(previousAssignee);
      throw error;
    }
  };

  if (mode === "view") {
    return (
      <AssigneeViewMode
        assignee={optimisticAssignee}
        currentUser={currentUser}
        onAssign={handleAssigneeUpdate}
        canModifyAssignment={canModifyAssignment}
        isUpdating={isUpdating}
      />
    );
  }

  return (
    <AssigneeEditMode
      assignee={optimisticAssignee}
      currentUser={currentUser}
      isAdmin={isAdmin}
      onAssign={handleAssigneeUpdate}
      canModifyAssignment={canModifyAssignment}
      isUpdating={isUpdating}
    />
  );
};
