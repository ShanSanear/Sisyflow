import type { APIRoute } from "astro";
import { UpdatePasswordSchema } from "../../../lib/validation/schemas/user";
import { createSupabaseAdminInstance, createSupabaseServerInstance } from "../../../db/supabase.client";

export const prerender = false;

export const PATCH: APIRoute = async ({ request, locals, cookies }) => {
  const { user } = locals;

  if (!user || !user.email) {
    return new Response(JSON.stringify({ error: "User is not authenticated" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const formData = await request.json();
  const validationResult = UpdatePasswordSchema.safeParse(formData);

  if (!validationResult.success) {
    return new Response(JSON.stringify({ errors: validationResult.error.flatten() }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { currentPassword, newPassword } = validationResult.data;

  // Use admin client for password verification, as it doesn't rely on user session
  const tempSupabaseClient = createSupabaseAdminInstance();
  const { error: signInError } = await tempSupabaseClient.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (signInError) {
    return new Response(JSON.stringify({ error: "Invalid current password" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Use the server client authenticated with the user's session to update the password
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    return new Response(JSON.stringify({ error: "An internal server error occurred" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ message: "Password updated successfully" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
