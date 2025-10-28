-- migration: add count_profiles function for bootstrap purposes
-- purpose: provide a secure way for unauthenticated users to check if any profiles exist
-- affected: new function (count_profiles)
-- considerations: function has security definer to bypass rls, only returns count value

-- function to count the number of profiles in the system
-- security definer: allows unauthenticated users to check if users exist
-- returns: integer count of profiles
create or replace function count_profiles()
returns integer
language plpgsql
security definer
stable
as $$
begin
  return (
    select count(*)::integer
    from public.profiles
  );
end;
$$;

-- grant execute permission to anon users
grant execute on function count_profiles() to anon;
grant execute on function count_profiles() to authenticated;
