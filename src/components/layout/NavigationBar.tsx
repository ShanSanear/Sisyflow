import React, { useState } from "react";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import { LogOut, User, Settings } from "lucide-react";

interface NavigationBarProps {
  user: {
    email: string;
    username?: string;
  };
  onLogout?: () => void;
}

export const NavigationBar: React.FC<NavigationBarProps> = ({ user, onLogout }) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    if (onLogout) {
      setIsLoggingOut(true);
      try {
        onLogout();
      } catch (error) {
        console.error("Logout error:", error);
      } finally {
        setIsLoggingOut(false);
      }
    } else {
      // Default behavior: redirect to logout endpoint
      window.location.href = "/logout";
    }
  };

  const displayName = user.username || user.email.split("@")[0];

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo/Brand */}
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-900">Sisyflow</h1>
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-6">
          <Button variant="ghost" className="text-gray-700 hover:text-gray-900">
            Dashboard
          </Button>
          <Button variant="ghost" className="text-gray-700 hover:text-gray-900">
            Projects
          </Button>
        </div>

        {/* User Menu */}
        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 p-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-sm">{displayName.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="hidden md:block text-sm font-medium text-gray-700">{displayName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-red-600 focus:text-red-600"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {isLoggingOut ? "Logging out..." : "Logout"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};
