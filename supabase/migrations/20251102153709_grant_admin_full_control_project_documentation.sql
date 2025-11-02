-- migration: grant administrators full control over project_documentation table
-- purpose: ensure admins have complete access (select, insert, update, delete) to project documentation
-- affected: project_documentation table rls policies
-- considerations: consolidates and clarifies admin access control for all operations

-- ====================
-- project_documentation table policies - admin full access
-- ====================

-- drop any existing policies for project_documentation to ensure clean slate
-- rationale: replacing with comprehensive admin-only policies for all operations
drop policy if exists "project_documentation_select_authenticated" on public.project_documentation;
drop policy if exists "project_documentation_select_admin" on public.project_documentation;
drop policy if exists "project_documentation_insert_admin" on public.project_documentation;
drop policy if exists "project_documentation_update_admin" on public.project_documentation;
drop policy if exists "project_documentation_delete_admin" on public.project_documentation;

-- rls policy: allow only admins to view project documentation
-- rationale: documentation contains sensitive project context that should be admin-controlled
-- note: restricts read access to administrators to maintain security
create policy "project_documentation_select_admin"
  on public.project_documentation
  for select
  to authenticated
  using (is_admin());

-- rls policy: allow only admins to create project documentation
-- rationale: documentation creation affects ai behavior and should be restricted to admins
create policy "project_documentation_insert_admin"
  on public.project_documentation
  for insert
  to authenticated
  with check (is_admin());

-- rls policy: allow only admins to update project documentation
-- rationale: documentation modifications impact ai suggestions and require admin oversight
create policy "project_documentation_update_admin"
  on public.project_documentation
  for update
  to authenticated
  using (is_admin())
  with check (is_admin());

-- rls policy: allow only admins to delete project documentation
-- rationale: documentation deletion is a critical operation that could affect system functionality
-- note: consider implementing constraints to prevent deletion of required documentation
create policy "project_documentation_delete_admin"
  on public.project_documentation
  for delete
  to authenticated
  using (is_admin());
