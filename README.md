# Sisyflow

## Table of contents

- [Sisyflow](#sisyflow)
  - [Table of contents](#table-of-contents)
  - [Project description](#project-description)
  - [Tech stack](#tech-stack)
  - [Getting started locally](#getting-started-locally)
    - [Prerequisites](#prerequisites)
    - [Setup](#setup)
    - [Build and preview](#build-and-preview)
    - [Code quality](#code-quality)
  - [Available scripts](#available-scripts)
  - [Project scope](#project-scope)
  - [Project status](#project-status)
  - [License](#license)

## Project description

Sisyflow is an MVP issue tracker focused on improving the completeness and clarity of tickets. It integrates AI assistance to analyze ticket titles and descriptions in the context of project documentation, proactively suggesting missing details and follow-up questions to reduce back-and-forth between reporters and assignees.

- Purpose: Help teams create complete tickets at the time of authoring, improving delivery speed and quality.
- Additional documentation: see `./.ai/prd.md` (Product Requirements) and `./.ai/tech-stack.md` (Tech stack rationale).

## Tech stack

- **Frontend**: Astro 5, React 19, TypeScript 5, Tailwind CSS 4, Shadcn/ui
- **Backend (planned)**: Supabase (PostgreSQL, auth, SDK, self-hostable)
- **AI (planned)**: OpenRouter.ai (access to multiple model providers, budget controls)
- **CI/CD & Hosting (planned)**: GitHub Actions; Cloudflare Pages as Astro application
- **Dev & quality**: ESLint (with React, Astro, TS rules), Prettier (with Astro plugin), Husky + lint-staged, Vitest & React Testing Library (unit/component tests), Playwright (E2E tests)

## Getting started locally

### Prerequisites

- Node.js: 22.14.0 (see `.nvmrc`). Recommended: use `nvm`.
- npm (repo includes `package-lock.json`).

### Setup

1. Clone the repository and enter the directory.
2. Use the project Node version:

```bash
nvm use
```

3. Install dependencies:

```bash
npm install
```

4. Start the dev server:

```bash
npm run dev
```

5. Open the app at `http://localhost:3000` unless your terminal shows a different port.

### Build and preview

```bash
npm run build   # production build
npm run preview # preview the built site locally
npm run dev     # run dev server with file watch
```

### Code quality

```bash
npm run lint      # run ESLint
npm run lint:fix  # fix lint issues
npm run format    # format with Prettier
```

## Available scripts

- **dev**: start Astro dev server
- **build**: build for production
- **preview**: preview the production build
- **astro**: run the Astro CLI directly
- **lint**: run ESLint across the project
- **lint:fix**: run ESLint with auto-fixes
- **format**: format the codebase via Prettier
- **prepare**: Husky installation hook (enables pre-commit via lint-staged)

## Project scope

High-level MVP capabilities, derived from the PRD:

- **Users and roles**:
  - Two roles: Administrator, User
  - First registered user becomes Administrator
  - Admin adds/removes users and sets initial passwords; unique email/username enforced

- **Ticket management (CRUD)**:
  - Types: `Bug`, `Improvement`, `Task`
  - Fields: title (required), description (Markdown), type (required), reporter (auto), assignee
  - Statuses: `Open`, `In Progress`, `Closed`
  - Kanban board is the primary UI, with drag-and-drop to change status (with permission checks)

- **AI assistance**:
  - Button in ticket form triggers AI analysis using project documentation context
  - Returns two suggestion types: insertable text with “Add” and open questions with an “Applied” checkbox
  - Tickets using AI get a “magic wand” icon; users can rate suggestion quality (1–5 stars)

- **Admin panel**:
  - Manage users
  - Manage single project documentation field (used as AI context, up to 20,000 chars)

Out of scope for MVP:

- Multiple AI runs per edit session
- Multi-project support
- Multiple Administrators
- External integrations (e.g., Git, other trackers)
- Desktop/mobile apps (web only)
- Attachments beyond `.md`/`.txt`
- Notification system (email/in-app)
- Advanced search/filtering on Kanban

## Project status

- Current version: 0.0.1
- Development stage: Early MVP. Core architecture uses Astro + React + TypeScript + Tailwind. Supabase and OpenRouter integrations are planned per PRD/tech stack and may not yet be wired up.
- CI/CD & hosting: Planned (GitHub Actions, Cloudflare Pages) per tech stack notes.

## License

MIT
