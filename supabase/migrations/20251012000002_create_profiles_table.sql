-- migration: create profiles table
-- purpose: store application-specific user data extending auth.users
-- affected: new table (profiles)
-- considerations: profiles.id references auth.users(id) for authentication integration

-- create the profiles table
-- extends supabase auth.users with application-specific fields
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (length(username) >= 3 and length(username) <= 50),
  role user_role not null default 'USER',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- enable row level security on profiles table
-- rls policies are defined in a separate migration file
alter table public.profiles enable row level security;

-- create trigger to automatically update updated_at timestamp
create trigger profiles_updated_at
  before update on public.profiles
  for each row
  execute function update_updated_at_column();

