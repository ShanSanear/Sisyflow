-- migration: create project_documentation table
-- purpose: store project documentation used as context for ai suggestions
-- affected: new table (project_documentation)
-- considerations: designed for single record (one project in mvp), admin-only management

-- create the project_documentation table
-- stores project context for ai to generate better suggestions
-- intended to contain only one record for mvp (single project)
create table public.project_documentation (
  id uuid primary key default gen_random_uuid(),
  content text not null check (length(content) <= 20000),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

-- enable row level security on project_documentation table
-- rls policies are defined in a separate migration file
alter table public.project_documentation enable row level security;

-- create trigger to automatically update updated_at timestamp
create trigger project_documentation_updated_at
  before update on public.project_documentation
  for each row
  execute function update_updated_at_column();

