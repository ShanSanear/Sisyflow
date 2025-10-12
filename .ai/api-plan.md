# REST API Plan

## 1. Resources

Based on the database schema and PRD, the main resources are:

- `users` (managed by Supabase Auth, extended via `profiles`)
- `profiles` (user profiles with role management)
- `tickets` (main issue tracking entities)
- `comments` (comments on tickets)
- `attachments` (file attachments for tickets)
- `ai_suggestion_sessions` (AI-generated suggestions for tickets)
- `project_documentation` (single project documentation record)
- `ai_errors` (AI communication error logs)

## 2. Endpoints

### Users (Admin Management)

- **GET** `/users`
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

- **POST** `/users`
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

- **DELETE** `/users/:id`
- Deletes a user (ADMIN only, cannot delete self).
- Success: 204 No Content
- Errors: 403 Forbidden (not ADMIN or self), 404 Not Found

### Profiles

- **GET** `/profiles/me`
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

- **PUT** `/profiles/me`
- Updates current user's profile (username, cannot change role).
- Request: `{ "username": "string" }`
- Response: Same as GET
- Success: 200 OK
- Errors: 400 Bad Request (validation), 409 Conflict (username exists)

### Tickets

- **GET** `/tickets`
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

- **POST** `/tickets`
- Creates a new ticket (sets reporter_id to current user).
- Request:

```json
{
    "title": "string",
    "description": "string?",
    "type": "BUG|IMPROVEMENT|TASK",
    "attachments": [ { "filename": "string", "content": "string" } ]?
}
```

- Response: Full ticket object
- Success: 201 Created
- Errors: 400 Bad Request (validation)
- Validations:
  - Title of length between 1 and 200
  - Description of length less than 10000

- **GET** `/tickets/:id`
- Gets a single ticket with related data.
- Response: Full ticket + comments + attachments
- Success: 200 OK
- Errors: 404 Not Found

- **PUT** `/tickets/:id`
- Updates a ticket (reporter/assignee/ADMIN only).
- Request: Same as POST, but all fields optional
- Response: Updated ticket
- Success: 200 OK
- Errors: 403 Forbidden, 404 Not Found, 400 Bad Request

- **PATCH** `/tickets/:id/status`
- Updates ticket status (drag & drop, reporter/assignee/ADMIN only).
- Request: `{ "status": "OPEN|IN_PROGRESS|CLOSED" }`
- Response: Updated ticket
- Success: 200 OK
- Errors: 403 Forbidden, 404 Not Found

- **PATCH** `/tickets/:id/assignee`
- Assigns/unassigns user to ticket (self-assignment or ADMIN).
- Request: `{ "assignee_id": "uuid?" }` (null to unassign)
- Response: Updated ticket
- Success: 200 OK
- Errors: 403 Forbidden, 404 Not Found

- **DELETE** `/tickets/:id`
- Deletes a ticket (ADMIN only).
- Success: 204 No Content
- Errors: 403 Forbidden, 404 Not Found

### AI Suggestions

- **POST** `/ai-suggestion-sessions/analyze`
- Analyzes ticket title and description to generate AI suggestions (used during ticket creation/editing before saving).
- Request:

```json
{
  "title": "string",
  "description": "string?"
}
```

- Response:

```json
{
  "session_id": "uuid",
  "suggestions": [
    {
      "type": "INSERT|QUESTION",
      "content": "string",
      "applied": boolean
    }
  ]
}
```

- Success: 200 OK
- Errors: 500 Internal Server Error (AI failure)

- **PUT** `/ai-suggestion-sessions/:id/rating`
- Rates an AI suggestion session.
- Request: `{ "rating": 1-5 }`
- Success: 200 OK
- Errors: 400 Bad Request, 404 Not Found
- Validating:
  - rating between 1 and 5 or null

### Comments

- **GET** `/tickets/:id/comments`
- Lists comments for a ticket.
- Query params: `limit`, `offset`
- Response:

```json
{
  "comments": [
    {
      "id": "uuid",
      "content": "string",
      "author_id": "uuid",
      "created_at": "timestamp",
      "updated_at": "timestamp",
      "author": { "username": "string" }
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 100 }
}
```

- Success: 200 OK

- **POST** `/tickets/:id/comments`
- Adds a comment to a ticket.
- Request: `{ "content": "string" }`
- Response: Created comment
- Success: 201 Created
- Errors: 400 Bad Request
- Validations:
  - Comment content length between 1 and 10000

- **PUT** `/comments/:id`
- Edits a comment (author only).
- Request: `{ "content": "string" }`
- Response: Updated comment
- Success: 200 OK
- Errors: 403 Forbidden, 404 Not Found

- **DELETE** `/comments/:id`
- Deletes a comment (author or ADMIN).
- Success: 204 No Content
- Errors: 403 Forbidden, 404 Not Found

### Attachments

- **GET** `/tickets/:id/attachments`
- Lists attachments for a ticket.
- Response:

```json
{
  "attachments": [
    {
      "id": "uuid",
      "filename": "string",
      "created_at": "timestamp"
    }
  ]
}
```

- Success: 200 OK

- **POST** `/tickets/:id/attachments`
- Adds an attachment to a ticket.
- Request: `{ "filename": "string", "content": "string" }` (multipart/form-data for files)
- Response: Created attachment
- Success: 201 Created
- Errors: 400 Bad Request (invalid file type/size)
- Validations:
  - filename - only .md and .txt extensions
  - content - length of 20480 characters (~20 kB expected by database)

- **GET** `/attachments/:id/download`
- Downloads an attachment.
- Response: File content
- Success: 200 OK
- Errors: 404 Not Found

- **DELETE** `/attachments/:id`
- Deletes an attachment (ticket reporter or ADMIN).
- Success: 204 No Content
- Errors: 403 Forbidden, 404 Not Found

### Project Documentation

- **GET** `/project-documentation`
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

- **PUT** `/project-documentation`
- Updates project documentation (ADMIN only).
- Request: `{ "content": "string" }`
- Response: Updated documentation
- Success: 200 OK
- Errors: 403 Forbidden, 400 Bad Request
- Validation:
- content lenght < 20000 and > 0

### AI Errors (Admin Only)

- **GET** `/ai-errors`
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

## 3. Authentication and Authorization

- **Mechanism**: Supabase Auth with JWT tokens. All endpoints require Bearer token in Authorization header except `/auth/register` and `/auth/login`.
- **Implementation**:
- Use Supabase SDK for token verification.
- Role-based access: Check user role from profiles table via RLS policies.
- ADMIN role required for user management, project documentation, and AI errors.
- Ticket operations: Reporter, assignee, or ADMIN can modify.
- Comments/attachments: Author or ADMIN can delete.

## 4. Validation and Business Logic

- **Validation Conditions**:
- Username: 3-50 chars, unique.
- Title: 1-200 chars.
- Description: Max 10000 chars.
- Comment content: 1-10000 chars.
- Attachment: .txt/.md only, max 20480 chars.
- Documentation: Max 20000 chars.
- Rating: 1-5 or null.
- API validates all before DB operations.

- **Business Logic**:
- First user registration: If no profiles exist, set role to ADMIN.
- Ticket creation: Auto-set reporter_id.
- AI suggestions: Fetch project documentation, analyze title/description, send to Openrouter.ai, store in ai_suggestion_sessions.
- Kanban: Use status filtering for columns.
- Assignee logic: Allow self-assignment if unassigned.
- Triggers update updated_at automatically.
