-- migration: allow reporters and assignees to self-manage ticket assignments
-- purpose: fix RLS policies to allow non-admin users (reporters) to assign themselves to their own tickets
-- affected: tickets table - rls policies for assignment management
-- date: 2025-10-28

-- drop the old restrictive policy that prevented reporters from assigning themselves
drop policy if exists "tickets_assign_self_unassigned" on public.tickets;

-- create new policy: allow users to assign themselves to any unassigned ticket
-- rationale: any user should be able to claim unassigned work
create policy "tickets_assign_self_to_unassigned"
  on public.tickets
  for update
  to authenticated
  using (assignee_id is null)
  with check (assignee_id = auth.uid());

-- create new policy: allow reporters and current assignees to modify assignment on their own tickets
-- rationale: reporters should be able to assign/unassign themselves to/from their own tickets
-- and current assignees should be able to unassign themselves or reassign
create policy "tickets_manage_own_assignment"
  on public.tickets
  for update
  to authenticated
  using (
    (auth.uid() = reporter_id or auth.uid() = assignee_id)
    and is_admin() = false
  )
  with check (
    -- allow setting assignee_id to current user or null (unassign)
    (assignee_id = auth.uid() or assignee_id is null)
    and is_admin() = false
  );
