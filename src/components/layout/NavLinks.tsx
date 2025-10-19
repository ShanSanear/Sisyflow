import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { UserViewModel } from "./types";

const baseLinkClasses =
  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

interface NavLinksProps {
  user: UserViewModel | null;
}

export const NavLinks: React.FC<NavLinksProps> = ({ user }) => {
  const [pathname, setPathname] = useState<string>(() => {
    if (typeof window === "undefined") {
      return "/";
    }
    return window.location.pathname;
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handlePopState = () => {
      setPathname(window.location.pathname);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return (
    <nav aria-label="Primary navigation" className="hidden items-center gap-2 lg:flex">
      <a
        href="/"
        className={cn(baseLinkClasses, pathname === "/" && "text-foreground")}
        aria-current={pathname === "/" ? "page" : undefined}
      >
        Kanban Board
      </a>

      {user?.role === "ADMIN" && (
        <a
          href="/admin"
          className={cn(baseLinkClasses, pathname.startsWith("/admin") && "text-foreground")}
          aria-current={pathname.startsWith("/admin") ? "page" : undefined}
        >
          Admin Panel
        </a>
      )}
    </nav>
  );
};
