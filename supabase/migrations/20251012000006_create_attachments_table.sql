-- migration: create attachments table
-- purpose: store text file attachments (.txt, .md) directly in database
-- affected: new table (attachments)
-- considerations: files stored as text (max 20kb) for mvp simplicity, cascade deletes with tickets

-- create the attachments table
-- stores small text files attached to tickets (up to 20kb)
create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  filename text not null check (filename ~* '\.(txt|md)$'),
  content text not null check (length(content) <= 20480),
  created_at timestamptz not null default now()
);

-- enable row level security on attachments table
-- rls policies are defined in a separate migration file
-- note: attachments are immutable once created (no update policy)
alter table public.attachments enable row level security;

