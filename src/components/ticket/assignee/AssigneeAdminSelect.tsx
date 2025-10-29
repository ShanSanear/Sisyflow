import React, { useState, useEffect, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminUsers } from "@/lib/hooks/useAdminUsers";
import type { AssigneeAdminSelectProps } from "@/types";

/**
 * Komponent select dla administratorów do przypisywania użytkowników do ticketów
 * Pozwala na wybór dowolnego użytkownika lub ustawienie "Unassigned"
 */
export const AssigneeAdminSelect: React.FC<AssigneeAdminSelectProps> = ({
  assignee,
  onAssign,
  isUpdating,
  mode = "immediate",
  onFormChange,
}) => {
  // Stabilize selectedValue with useMemo to prevent flips
  const selectedValue = useMemo(() => assignee?.id || "unassigned", [assignee?.id]);
  const { users, isLoading, error } = useAdminUsers();

  // Sync local state only for immediate mode; form mode uses prop directly
  const [localValue, setLocalValue] = useState(selectedValue);

  useEffect(() => {
    setLocalValue(selectedValue);
  }, [selectedValue]);

  const handleValueChange = (value: string) => {
    const assigneeId = value === "unassigned" ? null : value;
    const newAssignee = assigneeId
      ? { id: assigneeId, username: users.find((u) => u.id === assigneeId)?.username || "" }
      : null;

    // Always update localValue for immediate UI feedback
    setLocalValue(value);

    if (mode === "form" && onFormChange) {
      onFormChange(newAssignee);
    } else {
      onAssign(newAssignee);
    }
  };

  if (isLoading) {
    return (
      <Select disabled value="loading">
        <SelectTrigger data-testid="assignee-section-admin-select-trigger" aria-label="Select ticket assignee">
          <SelectValue placeholder="Loading users..." />
        </SelectTrigger>
      </Select>
    );
  }

  if (error) {
    return (
      <Select disabled value="error">
        <SelectTrigger data-testid="assignee-section-admin-select-trigger" aria-label="Select ticket assignee">
          <SelectValue placeholder="Error loading users" />
        </SelectTrigger>
      </Select>
    );
  }

  // Always use localValue for the Select, as it's synced with props via useEffect
  const selectValue = localValue;

  return (
    <Select
      key={selectValue}
      data-testid="assignee-section-admin-select"
      value={selectValue}
      onValueChange={handleValueChange}
      disabled={isUpdating}
    >
      <SelectTrigger data-testid="assignee-section-admin-select-trigger" aria-label="Select ticket assignee">
        <SelectValue placeholder="Select user..." />
      </SelectTrigger>
      <SelectContent data-testid="assignee-section-admin-select-content">
        <SelectItem value="unassigned">Unassigned</SelectItem>
        {users.map((user) => (
          <SelectItem data-testid="assignee-section-admin-select-item" key={user.id} value={user.id}>
            {user.username}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
