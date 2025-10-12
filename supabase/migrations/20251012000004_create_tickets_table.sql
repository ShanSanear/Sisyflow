-- migration: create tickets table
-- purpose: central table for storing all ticket/issue data
-- affected: new table (tickets)
-- considerations: supports both reporter and assignee relationships to profiles

-- create the tickets table
-- central entity for tracking bugs, improvements, and tasks
create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) >= 1 and length(title) <= 200),
  description text check (description is null or length(description) <= 10000),
  type ticket_type not null,
  status ticket_status not null default 'OPEN',
  reporter_id uuid references public.profiles(id) on delete set null,
  assignee_id uuid references public.profiles(id) on delete set null,
  ai_enhanced boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- enable row level security on tickets table
-- rls policies are defined in a separate migration file
alter table public.tickets enable row level security;

-- create trigger to automatically update updated_at timestamp
create trigger tickets_updated_at
  before update on public.tickets
  for each row
  execute function update_updated_at_column();

