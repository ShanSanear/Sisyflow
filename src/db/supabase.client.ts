import type { AstroCookies } from "astro";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import { getSecret } from "astro:env/server";
import type { Database } from "../db/database.types.ts";

export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: true,
  httpOnly: true,
  sameSite: "lax",
};

function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  return cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

export const createSupabaseServerInstance = (context: { headers: Headers; cookies: AstroCookies }) => {
  const supabaseUrl = getSecret("SUPABASE_URL");
  const supabaseKey = getSecret("SUPABASE_KEY");
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("SUPABASE_URL and SUPABASE_KEY must be defined");
  }
  const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookieOptions,
    cookies: {
      getAll() {
        return parseCookieHeader(context.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
      },
    },
  });

  return supabase;
};

/**
 * Tworzy instancję Supabase z service role key dla operacji administracyjnych
 * Używane tylko dla funkcji wymagających uprawnień administratora Supabase Auth
 */
export const createSupabaseAdminInstance = () => {
  const supabaseUrl = getSecret("SUPABASE_URL");
  const supabaseServiceRoleKey = getSecret("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined");
  }
  return createServerClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    cookies: {
      getAll() {
        return []; // Brak ciasteczek dla admin operacji
      },
      setAll() {
        // Brak ustawiania ciasteczek dla admin operacji
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
