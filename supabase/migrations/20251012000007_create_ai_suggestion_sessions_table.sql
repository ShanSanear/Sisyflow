-- migration: create ai_suggestion_sessions table
-- purpose: store ai-generated suggestions for tickets with user ratings
-- affected: new table (ai_suggestion_sessions)
-- considerations: uses jsonb for flexible suggestion structure, supports user feedback via ratings

-- create the ai_suggestion_sessions table
-- stores ai-generated suggestions for improving ticket quality
-- suggestions stored as jsonb array: [{"type": "INSERT|QUESTION", "content": "...", "applied": false}]
create table public.ai_suggestion_sessions (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  suggestions jsonb not null,
  rating integer check (rating is null or (rating >= 1 and rating <= 5)),
  created_at timestamptz not null default now()
);

-- enable row level security on ai_suggestion_sessions table
-- rls policies are defined in a separate migration file
alter table public.ai_suggestion_sessions enable row level security;

