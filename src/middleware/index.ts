import { createSupabaseServerInstance } from "../db/supabase.client.ts";
import { defineMiddleware } from "astro:middleware";

// Public paths - Auth API endpoints & Server-Rendered Astro Pages
const PUBLIC_PATHS = [
  // Server-Rendered Astro Pages
  "/login",
  "/register",
  // Auth API endpoints
  "/api/auth/sign-in",
  "/api/auth/sign-out",
  "/api/auth/sign-up",
];

// Admin paths - Require ADMIN role
const ADMIN_PATHS = ["/admin"];

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  // Skip auth check for public paths
  if (PUBLIC_PATHS.includes(url.pathname)) {
    return next();
  }

  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // IMPORTANT: Always get user session first before any other operations
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Get user role from profiles table
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

    locals.user = {
      email: user.email || "",
      id: user.id,
      role: profile?.role || "USER", // Default to USER if profile not found
    };

    // Check admin paths
    if (ADMIN_PATHS.some((path) => url.pathname.startsWith(path))) {
      if (locals.user.role !== "ADMIN") {
        return redirect("/");
      }
    }
  } else if (!PUBLIC_PATHS.includes(url.pathname)) {
    // Redirect to login for protected routes
    return redirect("/login");
  }

  return next();
});
