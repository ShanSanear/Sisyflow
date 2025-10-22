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
      // Błąd jest obsługiwany w hooku
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId);
      setUserToDelete(null);
    } catch {
      // Błąd jest obsługiwany w hooku
    }
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive mb-4">Wystąpił błąd podczas ładowania użytkowników.</p>
        <Button onClick={refetchUsers}>Spróbuj ponownie</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Użytkownicy</h2>
        <Button onClick={() => setIsAddDialogOpen(true)}>Dodaj użytkownika</Button>
      </div>

      <UsersTable
        users={users}
        currentUserId={currentUser?.id || ""}
        onDelete={setUserToDelete}
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
