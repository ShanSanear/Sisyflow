-- migration: create enum types
-- purpose: define custom enum types for user roles, ticket types, and ticket statuses
-- affected: new enum types (user_role, ticket_type, ticket_status)
-- considerations: these types are foundational and used across multiple tables

-- create enum type for user roles
-- defines two roles: ADMIN (full access) and USER (limited access)
create type user_role as enum ('ADMIN', 'USER');

-- create enum type for ticket types
-- categorizes tickets into: BUG (defects), IMPROVEMENT (enhancements), TASK (general work items)
create type ticket_type as enum ('BUG', 'IMPROVEMENT', 'TASK');

-- create enum type for ticket statuses
-- tracks ticket lifecycle: OPEN (new), IN_PROGRESS (being worked on), CLOSED (completed)
create type ticket_status as enum ('OPEN', 'IN_PROGRESS', 'CLOSED');

-- function to automatically update the updated_at timestamp
-- used by before update triggers to maintain accurate modification times
-- returns: the modified row with updated_at set to current timestamp
create or replace function update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;