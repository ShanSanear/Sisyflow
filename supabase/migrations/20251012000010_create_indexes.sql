-- migration: create database indexes
-- purpose: optimize query performance for common access patterns
-- affected: new indexes on multiple tables
-- considerations: indexes improve read performance but add overhead to writes

-- indexes on profiles table
-- username is already indexed via unique constraint

-- indexes on tickets table

-- index on reporter_id for filtering tickets by reporter
-- optimizes: queries finding all tickets created by a user
create index idx_tickets_reporter_id on public.tickets(reporter_id);

-- index on assignee_id for filtering tickets by assignee
-- optimizes: queries finding all tickets assigned to a user
create index idx_tickets_assignee_id on public.tickets(assignee_id);

-- index on status for filtering by ticket state
-- optimizes: kanban board views filtering by status (open, in_progress, closed)
create index idx_tickets_status on public.tickets(status);

-- index on type for filtering by ticket category
-- optimizes: queries filtering by bug/improvement/task type
create index idx_tickets_type on public.tickets(type);

-- composite index on status and created_at for sorted filtered queries
-- optimizes: main kanban view showing tickets by status, ordered by creation date
-- most specific column first (status) then sort column (created_at desc)
create index idx_tickets_status_created_at on public.tickets(status, created_at desc);


-- indexes on ai_suggestion_sessions table

-- index on ticket_id for fetching suggestion sessions for a ticket
-- optimizes: loading ai suggestions when viewing ticket details
create index idx_ai_suggestion_sessions_ticket_id on public.ai_suggestion_sessions(ticket_id);

-- index on user_id for filtering sessions by user
-- optimizes: tracking which users request ai assistance
create index idx_ai_suggestion_sessions_user_id on public.ai_suggestion_sessions(user_id);

-- indexes on ai_errors table

-- index on ticket_id for finding errors related to a specific ticket
-- optimizes: admin debugging of ticket-specific ai issues
create index idx_ai_errors_ticket_id on public.ai_errors(ticket_id);

-- index on user_id for finding errors for a specific user
-- optimizes: admin debugging of user-specific ai issues
create index idx_ai_errors_user_id on public.ai_errors(user_id);

-- index on created_at for chronological analysis
-- optimizes: admin dashboard showing recent errors
create index idx_ai_errors_created_at on public.ai_errors(created_at desc);

