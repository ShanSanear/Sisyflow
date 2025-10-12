-- migration: disable rls for tickets and profiles tables during development
-- purpose: disable row level security for tickets and profiles tables to allow backend operations
-- affected: tickets, profiles tables
-- considerations: this should only be used during development, rls should be re-enabled for production

-- disable rls for tickets table
alter table public.tickets disable row level security;

-- disable rls for profiles table (needed for reporter/assignee joins)
alter table public.profiles disable row level security;

-- note: this allows all operations on tickets and profiles tables without rls restrictions
-- for production, rls should be re-enabled and proper policies created
