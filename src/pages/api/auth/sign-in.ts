import type { APIRoute } from "astro";
import { createSupabaseServerInstance, createSupabaseAdminInstance } from "../../../db/supabase.client.ts";
import { loginSchema } from "../../../lib/validation/auth.validation.ts";
import { isDatabaseConnectionError, createDatabaseConnectionErrorResponse } from "../../../lib/utils.ts";
import { AuthApiError } from "@supabase/supabase-js";

export const prerender = false;

function isAuthApiError(error: unknown) {
  return error instanceof AuthApiError;
}

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
    let emailToUse: string | null = identifier;

    if (!isEmail) {
      // Identifier is a username, look up the corresponding email via RPC
      const { data: userId, error: rpcError } = await supabase.rpc("get_user_id_by_username", {
        p_username: identifier,
      });
      if (rpcError) {
        if (isDatabaseConnectionError(rpcError)) {
          return createDatabaseConnectionErrorResponse("user lookup");
        }
        throw rpcError;
      }

      if (!userId) {
        return new Response(JSON.stringify({ error: "Invalid username or password" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Get the user's email from auth.users using the admin client
      try {
        const supabaseAdmin = createSupabaseAdminInstance();
        const { data, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
        console.log("userError", userError);
        if (userError) {
          if (isDatabaseConnectionError(userError)) {
            return createDatabaseConnectionErrorResponse("user lookup");
          }
          throw userError;
        }

        if (!data?.user?.email) {
          return new Response(JSON.stringify({ error: "Invalid username or password" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        } else {
          emailToUse = data.user.email;
        }
      } catch (adminErr) {
        console.error("Error getting user data:", adminErr);
        if (isDatabaseConnectionError(adminErr)) {
          return createDatabaseConnectionErrorResponse("user lookup");
        }
        throw adminErr;
      }
    }

    // Attempt sign-in with proper error handling
    let signInData: { user: { id: string; email?: string | undefined } } | null = null;
    // try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailToUse,
      password,
    });

    if (error) {
      throw error;
    }
    signInData = data;

    return new Response(JSON.stringify({ user: signInData.user }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    if (isDatabaseConnectionError(err)) {
      return createDatabaseConnectionErrorResponse("sign-in");
    }
    if (isAuthApiError(err)) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: err.status,
        headers: { "Content-Type": "application/json" },
      });
    }
    // For other errors, return a generic internal server error
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
