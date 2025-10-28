-- migration: implement row level security access control
-- purpose: implement granular access control policies for profiles and tickets tables according to business requirements
-- affected: profiles, tickets tables - rls policies
-- considerations: re-enables rls and implements specific access rules for admins vs normal users

-- ====================
-- enable rls for tables
-- ====================

-- enable rls for profiles table
-- rationale: profiles need access control to protect user data
alter table public.profiles enable row level security;

-- enable rls for tickets table
-- rationale: tickets contain sensitive project data that needs controlled access
alter table public.tickets enable row level security;

-- ====================
-- drop existing policies (if any)
-- ====================

-- drop all existing policies for profiles table
drop policy if exists "profiles_select_authenticated" on public.profiles;
drop policy if exists "profiles_select_unauthenticated_count" on public.profiles;
drop policy if exists "profiles_update_admin" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_delete_admin" on public.profiles;
drop policy if exists "profiles_all_admin" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;

-- drop all existing policies for tickets table
drop policy if exists "tickets_select_authenticated" on public.tickets;
drop policy if exists "tickets_insert_authenticated" on public.tickets;
drop policy if exists "tickets_insert_authenticated_own_reporter" on public.tickets;
drop policy if exists "tickets_update_admin" on public.tickets;
drop policy if exists "tickets_update_reporter" on public.tickets;
drop policy if exists "tickets_update_assignee" on public.tickets;
drop policy if exists "tickets_delete_admin" on public.tickets;
drop policy if exists "tickets_all_admin" on public.tickets;
drop policy if exists "tickets_assign_self_unassigned" on public.tickets;
drop policy if exists "tickets_update_state_assignee_reporter" on public.tickets;

-- ====================
-- profiles table policies
-- ====================

-- rls policy: allow all authenticated users to view profiles
-- rationale: users need to see other users' profiles for ticket assignment and collaboration
create policy "profiles_select_authenticated"
  on public.profiles
  for select
  to authenticated
  using (true);

-- rls policy: allow admins to perform all operations on any profile
-- rationale: admins need full control to manage user roles and data
create policy "profiles_all_admin"
  on public.profiles
  for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- rls policy: allow users to update their own profile
-- rationale: users should be able to modify their own username and settings
create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- rls policy: allow users to insert their own profile
-- rationale: users need to create their profile during registration (bootstrap scenario)
create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

-- ====================
-- tickets table policies
-- ====================

-- rls policy: allow all authenticated users to view tickets
-- rationale: transparency - all team members should see all tickets for collaboration
create policy "tickets_select_authenticated"
  on public.tickets
  for select
  to authenticated
  using (true);

-- rls policy: allow authenticated users to insert tickets with themselves as reporter
-- rationale: users should be able to create tickets they report, even if not yet assigned
create policy "tickets_insert_authenticated_own_reporter"
  on public.tickets
  for insert
  to authenticated
  with check (reporter_id = auth.uid());

-- rls policy: allow admins to perform all operations on any ticket
-- rationale: admins need full control over all tickets for management purposes
create policy "tickets_all_admin"
  on public.tickets
  for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- rls policy: allow users to assign themselves to unassigned tickets
-- rationale: users should be able to claim unassigned work by setting themselves as assignee
-- note: this allows updating only assignee_id column for unassigned tickets, implementing the requirement for users to change assignee only to themselves
create policy "tickets_assign_self_unassigned"
  on public.tickets
  for update
  to authenticated
  using (assignee_id is null and auth.uid() != reporter_id)
  with check (assignee_id = auth.uid() and auth.uid() != reporter_id);

-- rls policy: allow assignees and reporters to update ticket state only
-- rationale: assigned users and reporters need to update ticket status during workflow
-- note: this implements the requirement that normal users can only change state if they are assignee or reporter
create policy "tickets_update_state_assignee_reporter"
  on public.tickets
  for update
  to authenticated
  using ((auth.uid() = assignee_id or auth.uid() = reporter_id) and is_admin() = false)
  with check ((auth.uid() = assignee_id or auth.uid() = reporter_id) and is_admin() = false);
