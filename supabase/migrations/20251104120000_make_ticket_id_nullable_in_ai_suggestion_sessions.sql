-- migration: make ticket_id nullable in ai_suggestion_sessions
-- purpose: allow ai suggestions to be created before tickets are saved, enabling suggestions on draft tickets
-- affected: ai_suggestion_sessions table (ticket_id column constraint)
-- considerations: this is a non-destructive change that makes the foreign key relationship optional

-- remove not null constraint from ticket_id column
-- allows ai suggestion sessions to exist without an associated ticket
-- useful for generating suggestions before ticket creation/saving
alter table public.ai_suggestion_sessions
alter column ticket_id drop not null;
