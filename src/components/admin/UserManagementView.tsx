import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UsersTable } from "./UsersTable";
import { AddUserDialog } from "./AddUserDialog";
import { DeleteUserAlert } from "./DeleteUserAlert";
import { useAdminUsers } from "@/lib/hooks/useAdminUsers";
import type { UserViewModel, CreateUserCommand } from "@/types";

export default function UserManagementView() {
  const { users, isLoading, error, addUser, deleteUser, currentUser, refetchUsers } = useAdminUsers();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserViewModel | null>(null);

  const handleAddUser = async (command: CreateUserCommand) => {
    try {
      await addUser(command);
      setIsAddDialogOpen(false);
    } catch {
      // Error is handled in the hook
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId);
      setUserToDelete(null);
    } catch {
      // Error is handled in the hook
    }
  };

  if (error) {
    console.error("Error loading users:", error);
    return (
      <div className="text-center py-8">
        <p className="text-destructive mb-4">An error occurred while loading users.</p>
        <Button onClick={refetchUsers}>Try again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Users</h2>
        <Button onClick={() => setIsAddDialogOpen(true)}>Add user</Button>
      </div>

      <UsersTable
        users={users}
        currentUserId={currentUser?.id || ""}
        onDelete={(user) => setUserToDelete(user)}
        isLoading={isLoading}
      />

      <AddUserDialog isOpen={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onAddUser={handleAddUser} />

      <DeleteUserAlert
        userToDelete={userToDelete}
        onConfirm={handleDeleteUser}
        onCancel={() => setUserToDelete(null)}
      />
    </div>
  );
}
