-- migration: add row level security policies for ai_errors table
-- purpose: implement access control for ai error logging based on user roles
-- affected: ai_errors table rls policies
-- considerations: policies follow the security model where admins have full access and authenticated users can create logs

-- ====================
-- ai_errors table policies
-- ====================

-- rls policy: allow only admins to view error logs
-- rationale: error logs may contain sensitive debugging information that should only be accessible to administrators
-- note: restricts select access to authenticated users with admin role
create policy "ai_errors_select_admin"
  on public.ai_errors
  for select
  to authenticated
  using (is_admin());

-- rls policy: allow all authenticated users to create error logs
-- rationale: any user interaction with ai services may generate errors that need to be logged for debugging
-- note: enables error logging from client-side applications without requiring admin privileges
create policy "ai_errors_insert_authenticated"
  on public.ai_errors
  for insert
  to authenticated
  with check (true);

-- note: no update policy for ai_errors table
-- rationale: error logs are immutable once created to maintain audit trail integrity
-- consideration: updates would compromise the reliability of error tracking and debugging

-- rls policy: allow only admins to delete error logs
-- rationale: log cleanup and maintenance is an administrative task
-- note: prevents accidental or unauthorized deletion of error logs by regular users
create policy "ai_errors_delete_admin"
  on public.ai_errors
  for delete
  to authenticated
  using (is_admin());
