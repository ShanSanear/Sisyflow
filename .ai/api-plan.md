# REST API Plan

## 1. Resources

Based on the database schema and PRD, the main resources are:

- `users` (managed by Supabase Auth, extended via `profiles`)
- `profiles` (user profiles with role management)
- `tickets` (main issue tracking entities)
- `ai_suggestion_sessions` (AI-generated suggestions for tickets)
- `project_documentation` (single project documentation record)
- `ai_errors` (AI communication error logs)

## 2. Endpoints

### Users (Admin Management)

- **GET** `/api/users`
- Lists all users (ADMIN only).
- Query params: `limit`, `offset` (pagination)
- Response:

```json
{ "users":
    [
        { "id": "uuid", "email": "string", "username": "string", "role": "ADMIN|USER", "created_at": "timestamp" } ...
    ],
    "pagination" : {"page": 1, "limit" : 10, "total" : 100}
}
```

- Success: 200 OK
- Errors: 403 Forbidden (not ADMIN)

- **POST** `/api/users`
- Creates a new user (ADMIN only).
- Request: `{ "email": "string", "password": "string", "username": "string", "role": "USER" }`
- Response:

```json
{
  "id": "uuid",
  "email": "string",
  "username": "string",
  "role": "USER",
  "created_at": "timestamp"
}
```

- Success: 201 Created
- Errors: 400 Bad Request (validation), 409 Conflict (email/username exists), 403 Forbidden (not ADMIN)
- Validations:
  - email not empty, email format
  - username not empty, at least 3 characters, but no more than 30

- **DELETE** `/api/users/:id`
- Deletes a user (ADMIN only, cannot delete self).
- Success: 204 No Content
- Errors: 403 Forbidden (not ADMIN or self), 404 Not Found

### Profiles

- **GET** `/api/profiles/me`
- Gets current user's profile.
- Response:

```json
{
  "id": "uuid",
  "username": "string",
  "role": "ADMIN|USER",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

- Success: 200 OK

- **PUT** `/api/profiles/me`
- Updates current user's profile (username, cannot change role).
- Request: `{ "username": "string" }`
- Response: Same as GET
- Success: 200 OK
- Errors: 400 Bad Request (validation), 409 Conflict (username exists)

### Tickets

- **GET** `/api/tickets`
- Lists tickets with pagination, filtering, sorting.
- Query params: `limit`, `offset`, `status` (OPEN|IN_PROGRESS|CLOSED), `type` (BUG|IMPROVEMENT|TASK), `assignee_id`, `reporter_id`, `sort` (created_at desc)
- Response:

```json
{
  "tickets": [
    {
      "id": "uuid",
      "title": "string",
      "description": "string",
      "type": "string",
      "status": "string",
      "reporter_id": "uuid?",
      "assignee_id": "uuid?",
      "ai_enhanced": boolean,
      "created_at": "timestamp",
      "updated_at": "timestamp",
      "reporter": { "username": "string" },
      "assignee": { "username": "string" }?
    }
  ],
   "pagination" : {"page": 1, "limit" : 10, "total" : 100}
}
```

- Success: 200 OK

- **POST** `/api/tickets`
- Creates a new ticket (sets reporter_id to current user).
- Request:

```json
{
  "title": "string",
  "description": "string?",
  "type": "BUG|IMPROVEMENT|TASK",
  "ai_enhanced?": boolean
}
```

- Response: Full ticket object
- Success: 201 Created
- Errors: 400 Bad Request (validation)
- Validations:
  - Title of length between 1 and 200
  - Description: optional, max 10000 chars (Zod oraz Supabase check)

- **GET** `/api/tickets/:id`
- Gets a single ticket with related data.
- Response: Full ticket object
- Success: 200 OK
- Errors: 404 Not Found

- **PUT** `/api/tickets/:id`
- Updates a ticket (reporter/assignee/ADMIN only).
- Request: Same as POST, but all fields optional
- Response: Updated ticket
- Success: 200 OK
- Errors: 403 Forbidden, 404 Not Found, 400 Bad Request

- **PATCH** `/api/tickets/:id/status`
- Updates ticket status (drag & drop, reporter/assignee/ADMIN only).
- Request: `{ "status": "OPEN|IN_PROGRESS|CLOSED" }`
- Response: Updated ticket
- Success: 200 OK
- Errors: 403 Forbidden, 404 Not Found

- **PATCH** `/api/tickets/:id/assignee`
- Assigns/unassigns user to ticket (self-assignment or ADMIN).
- Request: `{ "assignee_id": "uuid?" }` (null to unassign)
- Response: Updated ticket
- Success: 200 OK
- Errors: 403 Forbidden, 404 Not Found

- **DELETE** `/api/tickets/:id`
- Deletes a ticket (ADMIN only).
- Success: 204 No Content
- Errors: 403 Forbidden, 404 Not Found

### AI Suggestions (Future MVP Endpoints)

- **POST** `/api/ai-suggestion-sessions/analyze` (Future)
- Analyzes ticket title and description to generate AI suggestions (used during ticket creation/editing before saving, via Openrouter.ai in backend API route).
- Request: `{ "title": "string", "description": "string?" }` + fetch project docs.
- Response: `{ "session_id": "uuid", "suggestions": [ { "type": "INSERT|QUESTION", "content": "string", "applied": boolean } ] }`
- Success: 200 OK
- Errors: 500 (log to ai_errors via Supabase insert, user gets generic error info)

- **PUT** `/api/ai-suggestion-sessions/:id/rating` (Future)
- Rates an AI suggestion session.
- Request: `{ "rating": 1-5 }`
- Success: 200 OK
- Errors: 400, 404
- Validation: rating 1-5 or null; store in Supabase ai_suggestion_sessions.

Implementacja po basic tickets CRUD; użyj Supabase dla tables (ai_suggestion_sessions, ai_errors), backend call do Openrouter.ai.

### Project Documentation (Future for AI)

- **GET** `/api/project-documentation` (Future, dla AI context)
- Gets the project documentation.
- Response:

```json
{
  "id": "uuid",
  "content": "string",
  "updated_at": "timestamp",
  "updated_by": { "username": "string" }
}
```

- Success: 200 OK

- **PUT** `/api/project-documentation` (ADMIN only, Future)
- Updates project documentation (ADMIN only).
- Request: `{ "content": "string" }`
- Response: Updated documentation
- Success: 200 OK
- Errors: 403 Forbidden, 400 Bad Request
- Validation:
- content lenght < 20000 and > 0

### AI Errors (Admin Only)

- **GET** `/api/ai-errors`
- Lists AI errors (ADMIN only).
- Query params: `limit`, `offset`, `ticket_id`
- Response:

```json
{
  "errors": [
    {
      "id": "uuid",
      "ticket_id": "uuid?",
      "user_id": "uuid?",
      "error_message": "string",
      "error_details": {},
      "created_at": "timestamp"
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 100 }
}
```

- Success: 200 OK
- Errors: 403 Forbidden

Wszystkie endpoints pod /api/ (Astro API routes, np. src/pages/api/tickets.ts). Fetch z frontendu: relative '/api/tickets' z auth Bearer z Supabase session z middleware'a.

## 3. Authentication and Authorization

- **Mechanism**: Supabase Auth with JWT tokens. All endpoints require Bearer token in Authorization header except `/api/auth/register` and `/api/auth/login`.
- **Implementation**:
  - Frontend: In Astro API routes (src/pages/api/...): Use supabase from context.locals.supabase (injected via middleware in src/middleware/index.ts, which handles auth from cookies/headers – token auto-set from locals.get('supabaseAccessToken') or similar). For fetch from frontend: relative paths like '/api/tickets' – middleware auto-adds auth headers (Bearer with session token from cookies). Check roles via supabase.from('profiles').select('role').eq('id', user.id).single() in backend; frontend relies on /api/profiles/me response.
  - Use Supabase SDK for token verification.
  - Role-based access: Check user role from profiles table via RLS policies.
  - ADMIN role required for user management, project documentation, and AI errors.
  - Ticket operations: Reporter, assignee, or ADMIN can modify.
  - All required information is handled by endpoint `/api/profiles/me` - username, role.

## 4. Validation and Business Logic

- **Validation Conditions**:
- Username: 3-50 chars, unique.
- Title: 1-200 chars.
- Description: Max 10000 chars.
- Documentation: Max 20000 chars.
- Rating: 1-5 or null.
- API validates all before DB operations.

- **Business Logic**:
  - First user registration: If no profiles exist, set role to ADMIN (Supabase trigger).
  - Ticket creation: Auto-set reporter_id.
  - (Future) AI suggestions: Fetch project documentation (Supabase), analyze title/description via Openrouter.ai (backend), store session in Supabase; set ai_enhanced=true if applied.
  - Kanban: Use status filtering for columns (Supabase query).
  - Assignee logic: Allow self-assignment if unassigned (RLS policy).
  - Triggers update updated_at automatically (Supabase).
  - AI Errors: On 500, insert to ai_errors table (Supabase).
