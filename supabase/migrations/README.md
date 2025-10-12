# Sisyflow Database Migrations

This directory contains all Supabase migrations for the Sisyflow MVP project.

## Migration Order

The migrations are executed in chronological order based on their timestamps:

1. **20251012000001_create_enum_types.sql**
   - Creates custom ENUM types: `user_role`, `ticket_type`, `ticket_status`
   - Foundation for type-safe data in subsequent tables
   - `update_updated_at_column()`: Trigger function for auto-updating timestamps

2. **20251012000002_create_profiles_table.sql**
   - Creates `profiles` table extending `auth.users`
   - Stores username and role for each user
   - Enables RLS (policies defined in migration 11)
   - Trigger: auto-update `updated_at`

3. **20251012000003_create_helper_functions.sql**
   - Creates helper functions used by RLS policies and triggers
   - `get_user_role()`: Returns the role of the authenticated user
   - `is_admin()`: Checks if the authenticated user is an admin
   - Note: Created after profiles table as these functions reference it

4. **20251012000004_create_tickets_table.sql**
   - Creates central `tickets` table
   - Supports reporter and assignee relationships
   - Enables RLS (policies defined in migration 11)
   - Trigger: auto-update `updated_at`

5. **20251012000005_create_comments_table.sql**
   - Creates `comments` table for ticket discussions
   - Enables RLS (policies defined in migration 11)
   - Trigger: auto-update `updated_at`

6. **20251012000006_create_attachments_table.sql**
   - Creates `attachments` table for text files (.txt, .md up to 20KB)
   - Enables RLS (policies defined in migration 11)
   - Note: Attachments are immutable (no update policy)

7. **20251012000007_create_ai_suggestion_sessions_table.sql**
   - Creates `ai_suggestion_sessions` table for AI-generated suggestions
   - Uses JSONB to store flexible suggestion structures
   - Enables RLS (policies defined in migration 11)

8. **20251012000008_create_project_documentation_table.sql**
   - Creates `project_documentation` table (single record for MVP)
   - Stores project context used by AI for better suggestions
   - Enables RLS (policies defined in migration 11)
   - Trigger: auto-update `updated_at`

9. **20251012000009_create_ai_errors_table.sql**
   - Creates `ai_errors` table for logging AI service errors
   - Uses JSONB for flexible error details storage
   - Enables RLS (policies defined in migration 11)
   - Note: Error logs are immutable (no update policy)

10. **20251012000010_create_indexes.sql**
    - Creates performance indexes on all tables
    - Foreign key indexes for JOIN optimization
    - Filter indexes for status, type columns
    - Composite index for status + created_at (Kanban board optimization)
    - Chronological indexes for time-based sorting

11. **20251012000011_create_rls_policies.sql**
    - Creates all Row-Level Security (RLS) policies for all tables
    - Consolidated in one file for easier review and maintenance
    - Policies for: profiles, tickets, comments, attachments, ai_suggestion_sessions, project_documentation, ai_errors
    - Must be executed last after all tables and helper functions are created

12. **20251012000012_disable_selected_rls_policies.sql**
    - Drops RLS policies for: tickets, ai_suggestion_sessions, project_documentation, ai_errors
    - RLS remains enabled on these tables (restricts client-side access)
    - These tables will be managed by backend services using service role
    - Active policies remain for: profiles, comments, attachments

## Running Migrations

### Local Development

```bash
# Start Supabase locally
supabase start

# Apply all migrations
supabase db reset

# Or apply new migrations only
supabase migration up
```

### Production

```bash
# Link to your Supabase project
supabase link --project-ref your-project-ref

# Push migrations to production
supabase db push
```

## Security Features

All tables have Row-Level Security (RLS) enabled:

### Tables with Active RLS Policies (Client-Side Access):

- **profiles**: View all, update own/admin, delete others (admin only)
- **comments**: View all, create any, update own, delete own/admin
- **attachments**: View all, create any, delete reporter/admin

### Tables with RLS Enabled but No Policies (Backend-Only Access):

- **tickets**: Managed via backend API using service role
- **ai_suggestion_sessions**: Managed via backend API using service role
- **project_documentation**: Managed via backend API using service role
- **ai_errors**: Managed via backend API using service role

**Note:** Tables without policies effectively block all client-side access. Backend services using the service role can still perform all operations.

## Key Design Decisions

1. **UUID Primary Keys**: Global uniqueness, better security, Supabase Auth compatibility
2. **ON DELETE CASCADE**: For ticket → comments/attachments relationships
3. **ON DELETE SET NULL**: For user references to preserve history after user deletion
4. **JSONB for Flexibility**: AI suggestions and error details use JSONB for schema flexibility
5. **Text Storage for Files**: Small text files stored directly in database for MVP simplicity
6. **Immutable Logs**: Attachments and error logs cannot be updated once created
7. **Auto-updating Timestamps**: `updated_at` fields automatically maintained by triggers

## Next Steps

After running migrations:

1. Create a seed file for initial data (first admin user, sample tickets)
2. Test RLS policies with different user roles
3. Verify index performance with EXPLAIN ANALYZE
4. Set up backup and monitoring for production

## Maintenance

- Keep migrations immutable once deployed
- Create new migrations for schema changes
- Document breaking changes in migration comments
- Test migrations on staging before production deployment
