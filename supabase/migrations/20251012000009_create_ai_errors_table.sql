-- migration: create ai_errors table
-- purpose: log errors from ai service interactions for debugging and monitoring
-- affected: new table (ai_errors)
-- considerations: admin-only visibility, immutable logs, captures error context in jsonb

-- create the ai_errors table
-- stores error logs from ai service interactions
-- error_details jsonb can contain: provider, model, status_code, request_id, etc.
create table public.ai_errors (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references public.tickets(id) on delete set null,
  user_id uuid references public.profiles(id) on delete set null,
  error_message text not null,
  error_details jsonb,
  created_at timestamptz not null default now()
);

-- enable row level security on ai_errors table
-- rls policies are defined in a separate migration file
-- note: error logs are immutable once created (no update policy)
alter table public.ai_errors enable row level security;

