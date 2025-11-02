import type { APIRoute } from "astro";
import { createSupabaseServerInstance, createSupabaseAdminInstance } from "../../../db/supabase.client.ts";
import { loginSchema } from "../../../lib/validation/auth.validation.ts";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();

    // Validate input data
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: validationResult.error.issues,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { identifier, password } = validationResult.data;

    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Determine if identifier is email or username
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
    let emailToUse = identifier;

    if (!isEmail) {
      // Identifier is a username, look up the corresponding email
      // Use regular client for profiles query (assuming RLS allows it)
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", identifier)
        .single();

      if (profileError || !profile) {
        return new Response(JSON.stringify({ error: "Invalid username or password" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Get the user's email from auth.users using the admin client
      const supabaseAdmin = createSupabaseAdminInstance();
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(profile.id);

      if (userError || !userData.user?.email) {
        return new Response(JSON.stringify({ error: "Invalid username or password" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      emailToUse = userData.user.email;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailToUse,
      password,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ user: data.user }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Sign-in error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
