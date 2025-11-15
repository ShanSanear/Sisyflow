import type { APIRoute } from "astro";
import { createSupabaseServerInstance, createSupabaseAdminInstance } from "../../../db/supabase.client.ts";
import { loginSchema } from "../../../lib/validation/auth.validation.ts";
import { isDatabaseConnectionError, createDatabaseConnectionErrorResponse } from "../../../lib/utils.ts";
import { AuthApiError } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

export const prerender = false;

function isAuthApiError(error: unknown) {
  return error instanceof AuthApiError;
}

class SignInError extends Error {
  constructor(
    message: string,
    public operation: string
  ) {
    super(message);
    this.name = "SignInError";
  }
}

class DatabaseConnectionSignInError extends SignInError {
  constructor(operation: string) {
    super(`Database connection error during ${operation}`, operation);
    this.name = "DatabaseConnectionSignInError";
  }
}

class InvalidCredentialsError extends SignInError {
  constructor() {
    super("Invalid username or password", "credentials_validation");
    this.name = "InvalidCredentialsError";
  }
}

async function getEmailForSignIn(
  identifier: string,
  supabase: SupabaseClient,
  supabaseAdmin: SupabaseClient
): Promise<string> {
  // Check if identifier is already an email
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
  if (isEmail) {
    return identifier;
  }

  // Identifier is a username, look up the corresponding email via RPC
  const { data: userId, error: rpcError } = await supabase.rpc("get_user_id_by_username", {
    p_username: identifier,
  });
  if (rpcError) {
    if (isDatabaseConnectionError(rpcError)) {
      throw new DatabaseConnectionSignInError("user lookup");
    }
    throw rpcError;
  }

  if (!userId) {
    throw new InvalidCredentialsError();
  }

  // Get the user's email from auth.users using the admin client
  try {
    const { data, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    console.log("userError", userError);
    if (userError) {
      if (isDatabaseConnectionError(userError)) {
        throw new DatabaseConnectionSignInError("user lookup");
      }
      throw userError;
    }

    if (!data?.user?.email) {
      throw new InvalidCredentialsError();
    }

    return data.user.email;
  } catch (adminErr) {
    console.error("Error getting user data:", adminErr);
    if (isDatabaseConnectionError(adminErr)) {
      throw new DatabaseConnectionSignInError("user lookup");
    }
    throw adminErr;
  }
}

async function performSignIn(email: string, password: string, supabase: SupabaseClient) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
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

    const supabaseAdmin = createSupabaseAdminInstance();

    let emailToUse: string;
    try {
      emailToUse = await getEmailForSignIn(identifier, supabase, supabaseAdmin);
    } catch (err: unknown) {
      if (err instanceof DatabaseConnectionSignInError) {
        return createDatabaseConnectionErrorResponse(err.operation);
      }
      if (err instanceof InvalidCredentialsError) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw err;
    }

    // Perform the actual sign-in
    const signInData = await performSignIn(emailToUse, password, supabase);

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
