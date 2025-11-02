-- migration: restrict project documentation access to admins only
-- purpose: modify rls policies to prevent non-admin users from reading project documentation
-- affected: project_documentation table rls policies
-- considerations: changes read access from all authenticated users to admin-only

-- ====================
-- project_documentation table policies - update access control
-- ====================

-- drop the existing policy that allows all authenticated users to read project documentation
-- rationale: changing from public read access to admin-only access for security
drop policy if exists "project_documentation_select_authenticated" on public.project_documentation;

-- create new policy: allow only admins to view project documentation
-- rationale: project documentation contains sensitive context that should be admin-controlled
-- note: this ensures only administrators can access documentation that affects ai behavior
create policy "project_documentation_select_admin"
  on public.project_documentation
  for select
  to authenticated
  using (is_admin());

-- note: update policy already exists and correctly restricts updates to admins only
-- note: insert and delete policies already exist and correctly restrict to admins only
