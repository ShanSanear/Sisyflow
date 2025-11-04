-- migration: add_rls_policies_for_ai_suggestion_sessions
-- purpose: enable row level security on ai_suggestion_sessions table and create policies for:
--   - authenticated users to insert new sessions (with user_id = auth.uid())
--   - authenticated users to update only their own sessions
--   - authenticated users to select all sessions
--   - admins to perform all operations (full access)
-- affected tables: ai_suggestion_sessions
-- special considerations: assumes is_admin() function exists and checks user role; policies are role-specific to authenticated users only; no anon access
-- prerequisites: table ai_suggestion_sessions exists with user_id column linking to profiles.id

-- enable row level security on the table if not already enabled
-- this restricts all access until policies are defined
alter table ai_suggestion_sessions
enable row level security;

-- policy for select: allow authenticated users to view all ai_suggestion_sessions
-- using (true) since all authenticated users can read all sessions
-- no with check needed for select
create policy "authenticated users can view all ai suggestion sessions"
on ai_suggestion_sessions
for select
to authenticated
using (true);

-- policy for insert: allow authenticated users to create new sessions
-- with check ensures user_id is set to the authenticated user's id
-- client must set user_id = auth.uid() in the insert statement
create policy "authenticated users can create ai suggestion sessions"
on ai_suggestion_sessions
for insert
to authenticated
with check (auth.uid() = user_id);

-- policy for update: allow users to update only their own sessions
-- using clause checks that the row's user_id matches the authenticated user
create policy "users can update their own ai suggestion sessions"
on ai_suggestion_sessions
for update
to authenticated
using (auth.uid() = user_id);

-- policy for update: allow admins to update any session
-- using is_admin() function which presumably returns true for admin users
-- this grants full update access to admins
create policy "admins can update any ai suggestion session"
on ai_suggestion_sessions
for update
to authenticated
using (is_admin());

-- policy for delete: allow only admins to delete any session
-- using is_admin() to restrict to admin users only
-- no delete access for regular users
create policy "admins can delete any ai suggestion session"
on ai_suggestion_sessions
for delete
to authenticated
using (is_admin());
