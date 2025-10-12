-- migration: disable selected rls policies
-- purpose: remove rls policies from tickets, ai_suggestion_sessions, project_documentation, and ai_errors tables
-- affected: tickets, ai_suggestion_sessions, project_documentation, ai_errors tables
-- considerations: tables will still have rls enabled but no policies, effectively restricting all access except via service role
-- rationale: these tables will be managed by backend logic with service role access instead of client-side rls policies

-- ====================
-- drop tickets table policies
-- ====================

-- drop all policies for tickets table
drop policy if exists "tickets_select_authenticated" on public.tickets;
drop policy if exists "tickets_insert_authenticated" on public.tickets;
drop policy if exists "tickets_update_admin" on public.tickets;
drop policy if exists "tickets_update_reporter" on public.tickets;
drop policy if exists "tickets_update_assignee" on public.tickets;
drop policy if exists "tickets_delete_admin" on public.tickets;

-- ====================
-- drop ai_suggestion_sessions table policies
-- ====================

-- drop all policies for ai_suggestion_sessions table
drop policy if exists "ai_suggestion_sessions_select_authenticated" on public.ai_suggestion_sessions;
drop policy if exists "ai_suggestion_sessions_insert_authenticated" on public.ai_suggestion_sessions;
drop policy if exists "ai_suggestion_sessions_update_own" on public.ai_suggestion_sessions;
drop policy if exists "ai_suggestion_sessions_delete_admin" on public.ai_suggestion_sessions;

-- ====================
-- drop project_documentation table policies
-- ====================

-- drop all policies for project_documentation table
drop policy if exists "project_documentation_select_authenticated" on public.project_documentation;
drop policy if exists "project_documentation_insert_admin" on public.project_documentation;
drop policy if exists "project_documentation_update_admin" on public.project_documentation;
drop policy if exists "project_documentation_delete_admin" on public.project_documentation;

-- ====================
-- drop ai_errors table policies
-- ====================

-- drop all policies for ai_errors table
drop policy if exists "ai_errors_select_admin" on public.ai_errors;
drop policy if exists "ai_errors_insert_authenticated" on public.ai_errors;
drop policy if exists "ai_errors_delete_admin" on public.ai_errors;

-- note: rls remains enabled on these tables
-- this means no client-side access is allowed
-- backend services using the service role can still perform all operations

