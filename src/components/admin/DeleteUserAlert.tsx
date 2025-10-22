import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { UserViewModel } from "@/types";

interface DeleteUserAlertProps {
  userToDelete: UserViewModel | null;
  onConfirm: (userId: string) => void;
  onCancel: () => void;
}

export function DeleteUserAlert({ userToDelete, onConfirm, onCancel }: DeleteUserAlertProps) {
  return (
    <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete user</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete user <strong>{userToDelete?.username}</strong>? This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => userToDelete && onConfirm(userToDelete.id)}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
