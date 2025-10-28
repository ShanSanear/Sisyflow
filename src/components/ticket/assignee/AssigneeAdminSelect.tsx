import React, { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AssigneeAdminSelectProps } from "@/types";
import type { UserDTO } from "@/types";

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

/**
 * Komponent select dla administratorów do przypisywania użytkowników do ticketów
 * Pozwala na wybór dowolnego użytkownika lub ustawienie "Unassigned"
 */
export const AssigneeAdminSelect: React.FC<AssigneeAdminSelectProps> = ({ assignee, onAssign, isUpdating }) => {
  const [selectedValue, setSelectedValue] = useState<string>(assignee?.id || " ");

  // Sync selected value when assignee changes
  useEffect(() => {
    setSelectedValue(assignee?.id || " ");
  }, [assignee]);

  const handleValueChange = (value: string) => {
    setSelectedValue(value);
    const assigneeId = value === " " ? null : value;
    onAssign(
      assigneeId ? { id: assigneeId, username: DUMMY_USERS.find((u) => u.id === assigneeId)?.username || "" } : null
    );
  };

  return (
    <Select
      data-testid="assignee-section-admin-select"
      value={selectedValue}
      onValueChange={handleValueChange}
      disabled={isUpdating}
    >
      <SelectTrigger data-testid="assignee-section-admin-select-trigger" aria-label="Select ticket assignee">
        <SelectValue placeholder="Select user..." />
      </SelectTrigger>
      <SelectContent data-testid="assignee-section-admin-select-content">
        <SelectItem value=" ">Unassigned</SelectItem>
        {DUMMY_USERS.map((user) => (
          <SelectItem data-testid="assignee-section-admin-select-item" key={user.id} value={user.id}>
            {user.username}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
