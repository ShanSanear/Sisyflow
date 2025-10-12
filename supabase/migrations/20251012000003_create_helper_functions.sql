-- migration: create helper functions
-- purpose: provide reusable functions for rls policies and triggers
-- affected: new functions (get_user_role, is_admin, update_updated_at_column)
-- considerations: functions with security definer run with elevated privileges to access profiles table

-- function to get the role of the currently authenticated user
-- returns: user_role enum value or null if user not found
-- security definer: allows function to read profiles table even when called from rls context
create or replace function get_user_role()
returns user_role
language plpgsql
security definer
stable
as $$
begin
  return (
    select role
    from public.profiles
    where id = auth.uid()
  );
end;
$$;

-- function to check if the currently authenticated user is an admin
-- returns: true if user has admin role, false otherwise
-- security definer: allows function to read profiles table even when called from rls context
create or replace function is_admin()
returns boolean
language plpgsql
security definer
stable
as $$
begin
  return (
    select role = 'ADMIN'
    from public.profiles
    where id = auth.uid()
  );
end;
$$;

