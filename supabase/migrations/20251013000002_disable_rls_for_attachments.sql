-- migration: disable rls for attachments table
-- purpose: disable row level security for attachments table to allow backend operations
-- affected: attachments table
-- considerations: this allows all operations on attachments table without rls restrictions
-- rationale: attachments will be managed by backend logic with service role access

-- disable rls for attachments table
alter table public.attachments disable row level security;

-- note: this allows all operations on attachments table without rls restrictions
-- for production, rls should be re-enabled and proper policies created if needed
