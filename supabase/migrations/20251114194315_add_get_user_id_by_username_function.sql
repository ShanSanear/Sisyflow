--
-- migration_description: Create a PostgreSQL function to securely fetch a user's ID by username.
--
-- This migration introduces a plpgsql function named `get_user_id_by_username`.
-- This function is designed to be called from the API, specifically for the sign-in process
-- where a user can log in with a username instead of an email.
--
-- The function takes a username as input and returns the corresponding user's UUID from the `profiles` table.
--
-- It is defined with `security definer` to bypass Row Level Security (RLS) for this specific query.
-- This is a secure way to allow the sign-in endpoint to resolve a username to a user ID without
-- exposing the `profiles` table to broader anonymous access, which could otherwise lead to
-- enumeration of all system usernames.
--
-- The function is also marked as `stable` as it does not modify the database and its result is
-- consistent for the same input within a transaction.
--

create or replace function get_user_id_by_username(p_username text)
returns uuid as $$
declare
  v_user_id uuid;
begin
  select id
  into v_user_id
  from public.profiles
  where username = p_username;

  return v_user_id;
end;
$$ language plpgsql stable security definer;
