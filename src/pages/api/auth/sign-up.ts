import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client.ts";
import { registerSchema } from "../../../lib/validation/auth.validation.ts";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();

    // Validate input data
    const validationResult = registerSchema.safeParse(body);
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

    const { email, password } = validationResult.data;

    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Check if any users exist in the system
    const { count: userCount, error: countError } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error("Error checking user count:", countError);
      return new Response(JSON.stringify({ error: "Failed to check user registration status" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // If users already exist, registration is not allowed
    if (userCount && userCount > 0) {
      return new Response(
        JSON.stringify({ error: "Registration is not allowed. An administrator account already exists." }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Register the new user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // If this is the first user, create admin profile
    if (userCount === 0 && data.user) {
      // Generate a default username from email (before @)
      const defaultUsername = email.split("@")[0];

      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        username: defaultUsername,
        role: "ADMIN",
      });

      if (profileError) {
        // TODO logging system - add proper logging here, as this is quite critical problem that needs to be addressed
        console.error("Failed to create admin profile:", profileError);
        // Don't fail registration if profile creation fails, but log it
      }
    }

    // Return success response with information about email confirmation
    return new Response(
      JSON.stringify({
        user: data.user,
        message:
          "Registration successful. Please check your email and click the confirmation link to activate your account.",
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Sign-up error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
