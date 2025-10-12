-- migration: create comments table
-- purpose: store user comments on tickets for collaboration
-- affected: new table (comments)
-- considerations: comments cascade delete with tickets but preserve history when users are deleted

-- create the comments table
-- stores discussion and updates on tickets
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  content text not null check (length(content) >= 1 and length(content) <= 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- enable row level security on comments table
-- rls policies are defined in a separate migration file
alter table public.comments enable row level security;

-- create trigger to automatically update updated_at timestamp
create trigger comments_updated_at
  before update on public.comments
  for each row
  execute function update_updated_at_column();

