import React, { useTransition } from "react";
import { Avatar, AvatarFallback } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { LogOut, User } from "lucide-react";
import type { UserViewModel } from "./types";

interface UserMenuProps {
  user: UserViewModel | null;
  isLoading: boolean;
  onLogout: () => Promise<void>;
}

export const UserMenu: React.FC<UserMenuProps> = ({ user, isLoading, onLogout }) => {
  const [isPending, startTransition] = useTransition();

  const handleProfileClick = () => {
    window.location.href = "/profile";
  };

  const handleLogout = () => {
    if (isPending) {
      return;
    }

    startTransition(async () => {
      await onLogout();
    });
  };

  if (isLoading) {
    return <Skeleton className="h-10 w-32" aria-hidden="true" />;
  }

  if (!user) {
    return null;
  }

  return (
    <DropdownMenu data-testid="user-menu">
      <DropdownMenuTrigger asChild>
        <Button
          data-testid="user-menu-trigger"
          variant="ghost"
          className="flex items-center gap-2 px-2 py-1.5 text-sm"
          aria-haspopup="menu"
          aria-label="User menu"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-sm font-medium">{user.initials}</AvatarFallback>
          </Avatar>
          <span className="hidden md:block text-sm font-medium text-muted-foreground">{user.username}</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        data-testid="user-menu-content"
        align="end"
        className="w-48"
        role="menu"
        aria-label="User options"
      >
        <DropdownMenuItem
          className="cursor-pointer"
          data-testid="profile-button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleProfileClick();
          }}
          role="menuitem"
        >
          <User className="mr-2 h-4 w-4" />
          My profile
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive"
          data-testid="logout-button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleLogout();
          }}
          role="menuitem"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {isPending ? "Signing out..." : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
