import React from "react";
import { Avatar, AvatarFallback } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import { LogOut, User } from "lucide-react";
import type { UserViewModel } from "./types";

/**
 * Props dla komponentu UserMenu
 */
interface UserMenuProps {
  user: UserViewModel;
}

/**
 * UserMenu - Komponent interaktywny wyświetlający awatar użytkownika.
 * Po kliknięciu rozwija menu z opcjami "Mój profil" i "Wyloguj".
 */
export const UserMenu: React.FC<UserMenuProps> = ({ user }) => {
  const handleProfileClick = () => {
    // Nawigacja na stronę profilu użytkownika
    window.location.href = "/profile/me";
  };

  const handleLogout = () => {
    // Wywołanie procedury wylogowania - przekierowanie na endpoint logout
    window.location.href = "/logout";
  };

  return (
    <div className="flex items-center space-x-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50 transition-colors">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-sm font-medium">{user.initials}</AvatarFallback>
            </Avatar>
            <span className="hidden md:block text-sm font-medium text-gray-700">{user.username}</span>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem className="cursor-pointer" onClick={handleProfileClick}>
            <User className="mr-2 h-4 w-4" />
            Mój profil
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Wyloguj
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
