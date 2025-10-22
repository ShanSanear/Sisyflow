import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import type { UserViewModel } from "@/types";

interface UserActionsDropdownProps {
  user: UserViewModel;
  currentUserId: string;
  onDelete: (userId: string) => void;
}

export function UserActionsDropdown({ user, currentUserId, onDelete }: UserActionsDropdownProps) {
  const canDelete = user.id !== currentUserId;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Otwórz menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => onDelete(user.id)}
          disabled={!canDelete}
          className="text-destructive focus:text-destructive"
        >
          Usuń
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
