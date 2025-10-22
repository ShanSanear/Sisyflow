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
          <AlertDialogTitle>Usuń użytkownika</AlertDialogTitle>
          <AlertDialogDescription>
            Czy na pewno chcesz usunąć użytkownika <strong>{userToDelete?.username}</strong>? Tej akcji nie można
            cofnąć.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Anuluj</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => userToDelete && onConfirm(userToDelete.id)}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Usuń
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
