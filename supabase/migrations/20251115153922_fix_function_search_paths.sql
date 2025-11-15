-- migration: fix function search_path security warnings
-- purpose: set immutable search_path for all functions to prevent search_path injection attacks
-- affected: functions (update_updated_at_column, get_user_role, is_admin, get_user_id_by_username, count_profiles)
-- considerations: setting search_path to empty string requires all schema references to be fully qualified

-- fix update_updated_at_column function
-- sets search_path to empty string to prevent search_path injection
-- note: uses trigger special variables (new) and built-in function (now()) which work without schema qualification
create or replace function update_updated_at_column()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- fix get_user_role function
-- sets search_path to empty string and ensures all schema references are fully qualified
-- uses public.profiles and auth.uid() which are already schema-qualified
create or replace function get_user_role()
returns public.user_role
language plpgsql
security definer
stable
set search_path = ''
as $$
begin
  return (
    select role
    from public.profiles
    where id = auth.uid()
  );
end;
$$;

-- fix is_admin function
-- sets search_path to empty string and ensures all schema references are fully qualified
-- uses public.profiles and auth.uid() which are already schema-qualified
create or replace function is_admin()
returns boolean
language plpgsql
security definer
stable
set search_path = ''
as $$
begin
  return (
    select role = 'ADMIN'
    from public.profiles
    where id = auth.uid()
  );
end;
$$;

-- fix get_user_id_by_username function
-- sets search_path to empty string and ensures all schema references are fully qualified
-- uses public.profiles which is already schema-qualified
create or replace function get_user_id_by_username(p_username text)
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
begin
  select id
  into v_user_id
  from public.profiles
  where username = p_username;

  return v_user_id;
end;
$$;

-- fix count_profiles function
-- sets search_path to empty string and ensures all schema references are fully qualified
-- uses public.profiles which is already schema-qualified
create or replace function count_profiles()
returns integer
language plpgsql
security definer
stable
set search_path = ''
as $$
begin
  return (
    select count(*)::integer
    from public.profiles
  );
end;
$$;
