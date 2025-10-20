import React, { useCallback, useEffect, useRef } from "react";
import { Logo } from "./Logo";
import { NavLinks } from "./NavLinks";
import { UserMenu } from "./UserMenu";
import { UserProvider, useUserContext } from "./UserContext";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { PlusCircleIcon } from "lucide-react";
import { toast } from "../ui/sonner";

const NavigationBarContent: React.FC = () => {
  const { user, isLoading, error, refetch } = useUserContext();
  const lastErrorMessageRef = useRef<string | null>(null);

  const handleCreateTicket = () => {
    //TODO proper handling of modal opening;
  };

  const handleRefetch = useCallback(() => {
    toast.info("Retrying user data fetch");
    void refetch();
  }, [refetch]);

  const handleLogout = useCallback(async () => {
    const response = await fetch("/api/auth/sign-out", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error ?? `Sign-out failed: ${response.statusText}`);
    }

    toast.success("Signed out successfully");
    setTimeout(() => {
      window.location.href = "/login";
    }, 150);
  }, []);

  useEffect(() => {
    if (!error) {
      lastErrorMessageRef.current = null;
      return;
    }

    const message = error.message ?? "Failed to load user data";

    if (lastErrorMessageRef.current === message) {
      return;
    }

    lastErrorMessageRef.current = message;
    console.error("NavigationBar error:", error);
    toast.error("Failed to load user data", {
      description: message,
    });
  }, [error]);

  if (isLoading) {
    return (
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-9 w-24" aria-hidden="true" />
          <Skeleton className="hidden h-9 w-48 lg:block" aria-hidden="true" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-40" aria-hidden="true" />
            <Skeleton className="h-10 w-32" aria-hidden="true" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-1 items-center gap-6">
          <Logo />
          <NavLinks user={user} />
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleCreateTicket} className="gap-2" aria-label="Create a new ticket">
            <PlusCircleIcon className="h-4 w-4" />
            Create ticket
          </Button>

          <UserMenu user={user} isLoading={false} onLogout={handleLogout} />
        </div>
      </div>

      {error && (
        <div className="border-t border-destructive/20 bg-destructive/10">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 text-sm text-destructive sm:px-6 lg:px-8">
            <span>Failed to load user data.</span>
            <Button variant="outline" size="sm" onClick={handleRefetch}>
              Try again
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

export const NavigationBar: React.FC = () => {
  return (
    <UserProvider>
      <NavigationBarContent />
    </UserProvider>
  );
};
