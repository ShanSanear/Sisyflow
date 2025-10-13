-- migration: create row level security policies
-- purpose: define access control policies for all tables
-- affected: rls policies for all tables (profiles, tickets, ai_suggestion_sessions, project_documentation, ai_errors)
-- considerations: policies must be created after helper functions and all tables are created

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

-- rls policy: allow admins to update any profile
-- rationale: admins need full control to manage user roles and data
create policy "profiles_update_admin"
  on public.profiles
  for update
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

-- rls policy: allow admins to delete other users' profiles (but not their own)
-- rationale: admins can remove users, but cannot accidentally delete themselves
-- note: prevents admin self-deletion to maintain at least one admin in system
create policy "profiles_delete_admin"
  on public.profiles
  for delete
  to authenticated
  using (is_admin() and auth.uid() != id);

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

-- rls policy: allow all authenticated users to create tickets
-- rationale: any user should be able to report bugs or create tasks
create policy "tickets_insert_authenticated"
  on public.tickets
  for insert
  to authenticated
  with check (true);

-- rls policy: allow admins to update any ticket
-- rationale: admins need full control over all tickets for management purposes
create policy "tickets_update_admin"
  on public.tickets
  for update
  to authenticated
  using (is_admin())
  with check (is_admin());

-- rls policy: allow reporters to update their own tickets
-- rationale: ticket creators should be able to modify their submissions
create policy "tickets_update_reporter"
  on public.tickets
  for update
  to authenticated
  using (auth.uid() = reporter_id)
  with check (auth.uid() = reporter_id);

-- rls policy: allow assignees to update tickets assigned to them
-- rationale: assigned users need to update status and details of their work
create policy "tickets_update_assignee"
  on public.tickets
  for update
  to authenticated
  using (auth.uid() = assignee_id)
  with check (auth.uid() = assignee_id);

-- rls policy: allow only admins to delete tickets
-- rationale: ticket deletion is a critical operation that should be restricted
-- note: cascades to related comments and attachments
create policy "tickets_delete_admin"
  on public.tickets
  for delete
  to authenticated
  using (is_admin());



-- ====================
-- ai_suggestion_sessions table policies
-- ====================

-- rls policy: allow all authenticated users to view suggestion sessions
-- rationale: ai suggestions are part of ticket context and useful for all team members
create policy "ai_suggestion_sessions_select_authenticated"
  on public.ai_suggestion_sessions
  for select
  to authenticated
  using (true);

-- rls policy: allow all authenticated users to create suggestion sessions
-- rationale: any user should be able to request ai assistance for tickets
create policy "ai_suggestion_sessions_insert_authenticated"
  on public.ai_suggestion_sessions
  for insert
  to authenticated
  with check (true);

-- rls policy: allow session creators to update their sessions
-- rationale: users need to update ratings and mark suggestions as applied
create policy "ai_suggestion_sessions_update_own"
  on public.ai_suggestion_sessions
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- rls policy: allow only admins to delete suggestion sessions
-- rationale: suggestion history is valuable data that should be preserved
create policy "ai_suggestion_sessions_delete_admin"
  on public.ai_suggestion_sessions
  for delete
  to authenticated
  using (is_admin());

-- ====================
-- project_documentation table policies
-- ====================

-- rls policy: allow all authenticated users to view project documentation
-- rationale: documentation provides context that all team members should access
create policy "project_documentation_select_authenticated"
  on public.project_documentation
  for select
  to authenticated
  using (true);

-- rls policy: allow only admins to create project documentation
-- rationale: documentation management is a critical admin-only operation
create policy "project_documentation_insert_admin"
  on public.project_documentation
  for insert
  to authenticated
  with check (is_admin());

-- rls policy: allow only admins to update project documentation
-- rationale: documentation changes affect ai behavior and should be controlled
create policy "project_documentation_update_admin"
  on public.project_documentation
  for update
  to authenticated
  using (is_admin())
  with check (is_admin());

-- rls policy: allow only admins to delete project documentation
-- rationale: documentation deletion is a critical operation
-- note: consider constraint to prevent deletion of last record in production
create policy "project_documentation_delete_admin"
  on public.project_documentation
  for delete
  to authenticated
  using (is_admin());

-- ====================
-- ai_errors table policies
-- ====================

-- rls policy: allow only admins to view error logs
-- rationale: error logs may contain sensitive debugging information
create policy "ai_errors_select_admin"
  on public.ai_errors
  for select
  to authenticated
  using (is_admin());

-- rls policy: allow all authenticated users to create error logs
-- rationale: any user interaction with ai may generate errors that need logging
create policy "ai_errors_insert_authenticated"
  on public.ai_errors
  for insert
  to authenticated
  with check (true);

-- note: no update policy - error logs are immutable once created
-- rationale: logs should not be modified to maintain audit trail integrity

-- rls policy: allow only admins to delete error logs
-- rationale: log cleanup is an admin maintenance task
-- note: consider implementing retention policy via scheduled job
create policy "ai_errors_delete_admin"
  on public.ai_errors
  for delete
  to authenticated
  using (is_admin());

