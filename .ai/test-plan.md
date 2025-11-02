# Combined Test Plan for Sisyflow - System Zarządzania Zadaniami

## 1. Wprowadzenie i cele testowania

### 1.1 Cel dokumentu

Niniejszy plan testów definiuje kompleksową strategię testowania aplikacji Sisyflow – systemu zarządzania zadaniami opartego na tablicy Kanban. Łączy analizę strategiczną (z Planu 1) z operacyjną szczegółowością (z Planu 2), zapewniając wysoką jakość, bezpieczeństwo i stabilność. Plan uwzględnia specyfikę stosu technologicznego (Astro, React, TypeScript, Supabase) i ryzyka, takie jak rozproszona logika uprawnień czy synchronizacja stanu.

### 1.2 Cele testowania

Główne cele to:

- Weryfikacja funkcjonalności (zgodność z wymaganiami, integralność CRUD).
- Zapewnienie bezpieczeństwa (autentykacja, RLS, ochrona przed atakami).
- Walidacja UX (responsywność, a11y WCAG 2.1 AA, drag-and-drop z dnd-kit).
- Testowanie integralności z Supabase i OpenRouter.ai (mocki dla izolacji).
- Identyfikacja błędów krytycznych, z fokusem na edge cases i optymistyczne aktualizacje.
- Osiągnięcie coverage >85% i 100% pass rate dla critical path.

### 1.3 Zakres produktu i analiza kluczowych komponentów

Sisyflow obejmuje: autentykację (Supabase Auth), tablicę Kanban (drag-and-drop), zarządzanie ticketami (CRUD, przypisywanie), panel admina (użytkownicy), role (USER/ADMIN), integrację AI.

**Kluczowe komponenty (z analizy kodu):**

- **Frontend:** LoginForm/RegisterForm, TicketModal/TicketForm (tryby create/edit/view), KanbanBoardView/BoardContainer/KanbanColumn/TicketCard, NavigationBar/NavLinks, UserContext/TicketModalContext.
- **Backend:** API (/api/auth/, /api/tickets/, /api/users/), serwisy (TicketService, UserService, ProfileService), middleware (src/middleware/index.ts – ochrona tras).
- **Warstwa danych:** Supabase client (src/db/supabase.client.ts), typy (src/types.ts, src/db/database.types.ts), walidacja (Zod w src/lib/validation/).
- **Hooki i utils:** useAuth/useUser/useKanbanBoard/useToast, src/lib/utils.ts, src/lib/constants.ts.

**Specyfika stosu i strategia testowania:**

- **Astro Islands:** Testy E2E dla hydratacji i interakcji React (client:load).
- **React/TS:** Izolowane testy komponentów (Vitest/RTL), mock props.
- **Supabase:** Mocki dla unit/integration; dedykowana baza testowa dla E2E.
- **Zod/dnd-kit:** Unit tests schematów; E2E dla drag-and-drop (Playwright symulacja).
- **Tailwind:** Testy oparte na ARIA/role, nie CSS; opcjonalnie visual regression (Percy).

### 1.4 Priorytety testowe (P0-P2)

- **P0 (Krytyczna ścieżka użytkownika):** Rejestracja/logowanie, CRUD ticketów, drag-and-drop statusu.
- **P1 (Administracyjne i API):** Panel admina, tworzenie/usuwanie użytkowników, walidacja uprawnień, paginacja/filtrowanie ticketów.
- **P2 (UI i błędy):** Komponenty React, walidacja formularzy, responsywność, obsługa błędów sieciowych.

### 1.5 Potencjalne ryzyka

- **Uprawnienia:** Rozproszona logika (frontend/backend) – macierz testów dla ról (Admin/Reporter/Assignee/Inny).
- **Synchronizacja stanu:** Optymistyczne UI vs. API failures – testy rollback i toast errors.
- **Supabase zależności:** Błędy sieciowe, RLS – testy z mockami i testową bazą.
- **Walidacja spójność:** Zod w formularzach vs. API vs. DB constraints.
- **Middleware:** Single point failure – testy przekierowań i ciasteczek.

## 2. Zakres testów

### 2.1 Zakres wewnętrzny

#### 2.1.1 Komponenty frontend

- Autentykacja: LoginForm, RegisterForm.
- Admin: AddUserDialog, UsersTable, UserActionsDropdown.
- Kanban: BoardContainer, KanbanColumn, TicketCard.
- Tickety: TicketModal, TicketForm (TitleInput, DescriptionEditor, TypeSelect, AssigneeSection).
- Layout: NavigationBar, UserMenu, NavLinks, UserContext.
- UI: Shadcn/ui komponenty.

#### 2.1.2 Logika biznesowa i serwisy

- ProfileService, TicketService (CRUD, status/assignee), UserService.
- Hooki: useAuth, useKanbanBoard, useAdminUsers, useTicketModal.
- Contexty: TicketModalContext, UserContext.

#### 2.1.3 API Endpoints

- Auth: /api/auth/sign-in/up/out.
- Profiles: /api/profiles/me.
- Tickets: /api/tickets, /[id], /[id]/status/assignee.
- Users: /api/users, /[id].

#### 2.1.4 Walidacja

- Zod: ticketSchema, createUserSchema, loginSchema.
- Formularze: react-hook-form + Zod.

### 2.2 Zakres zewnętrzny

- Wykluczone: Migracje Supabase (manual), pełne testy OpenRouter.ai (mocki + manual).
- Ograniczenia: Screenshot tests wybiórczo; performance Supabase poza zakresem.

## 3. Typy testów do przeprowadzenia

Wielopoziomowe podejście (piramida testów):

### 3.1 Testy jednostkowe (Unit Tests)

- **Cel:** Izolowane fragmenty (utils, Zod, serwisy, hooki).
- **Zakres:** lib/utils.ts, schematy walidacji, transformTicketsToKanbanView.
- **Narzędzia:** Vitest, RTL.
- **Pokrycie:** >85% dla logiki biznesowej.

### 3.2 Testy komponentów/Integracyjne

- **Cel:** Komponenty React + hooki/context, API z serwisami.
- **Zakres:** TicketForm z useKanbanBoard, middleware, integracja Supabase.
- **Narzędzia:** Vitest, RTL, MSW; Playwright dla API.
- **Priorytetowe:** Autentykacja flow, ticket CRUD + assign/status.

### 3.3 Testy E2E

- **Cel:** Pełne user journeys.
- **Zakres:** Logowanie → ticket create → drag → admin user add; cross-browser/responsywność.
- **Narzędzia:** Playwright (Chrome/Firefox/Safari, mobile emulation).
- **Scenariusze:** Nowy user register, admin manage, Kanban work, session management.

### 3.4 Testy API

- **Zakres:** Endpoints walidacja (request/response, HTTP codes 400-500), rate limiting.
- **Narzędzia:** Vitest + Supertest/Postman.

### 3.5 Testy bezpieczeństwa

- **Zakres:** RLS, autoryzacja (403 dla nieuprawnionych), XSS/CSRF/SQL Injection, JWT/session.
- **Podejście:** Manual + auto (OWASP ZAP).

### 3.6 Testy dostępności

- **Zakres:** WCAG AA, keyboard nav, ARIA, kontrast.
- **Narzędzia:** axe-core/Lighthouse/WAVE.

### 3.7 Testy wydajnościowe

- **Zakres:** Ładowanie (<3s FCP/LCP), 100+ ticketów, TTI.
- **Narzędzia:** Lighthouse, k6/Artillery.

### 3.8 Testy regresyjne

- Auto w CI dla unit/integration/E2E critical path.

## 4. Scenariusze testowe dla kluczowych funkcjonalności

Szczegółowe TC oparte na Planu 2, wzbogacone o ryzyka z Planu 1 (np. macierz ról, sync errors). Priorytet: P0-P2.

### 4.1 Moduł Autentykacji (P0)

#### TC-AUTH-001: Rejestracja nowego użytkownika (P0, E2E)

**Warunki wstępne:** Brak użytkowników, niezalogowany.  
**Kroki:** 1. /register, email: testuser@example.com, password: Test123!. 2. "Create account".  
**Oczekiwany:** Redirect /login?success, toast "Registration successful", nowy user w auth.users/profiles.  
**Dane:** `{"email":"testuser@example.com","password":"Test123!"}`  
**Ryzyko (Plan 1):** Jeśli user istnieje – blokada rejestracji (test 409 Conflict).

#### TC-AUTH-002: Logowanie (P0, E2E)

**Kroki:** /login, poprawne dane (email + hasło), "Sign in".  
**Oczekiwany:** Redirect /board, session cookie, toast success.

#### TC-AUTH-003: Błędne logowanie (P1, Integracyjny)

**Kroki:** Nieprawidłowe hasło.  
**Oczekiwany:** Stay on /login, error "Invalid credentials", 401.

#### TC-AUTH-004: Wylogowanie (P0, E2E)

**Kroki:** Avatar → "Sign out".  
**Oczekiwany:** Redirect /login, cookie clear, 200 POST /sign-out.

#### TC-AUTH-005: Middleware ochrona (P0, Integracyjny)

**Kroki:** Niezalogowany → /board.  
**Oczekiwany:** Redirect /login, 302.  
**Ryzyko (Plan 1):** Test PUBLIC_PATHS (np. /login dostępny bez auth).

#### TC-AUTH-006: Uprawnienia NavLinks (P1, Komponentowy)

**Oczekiwany:** Non-admin: no "Admin Panel" link; attempt /admin → 403/redirect.

#### TC-AUTH-007: Logowanie (P1, E2E)

**Kroki:** /login, poprawne dane (username + hasło), "Sign in".  
**Oczekiwany:** Redirect /board, session cookie, toast success.

### 4.2 Moduł Zarządzania Ticketami i Kanban (P0)

#### TC-TICKET-001: Tworzenie ticketa (P0, E2E)

**Kroki:** /board → "Create ticket", title/desc/type, "Save".  
**Oczekiwany:** Modal close, ticket in "Open", 201 POST /tickets, reporter_id = user.id, status=OPEN.  
**Dane:** `{"title":"Bug fix","description":"Issue","type":"BUG"}`  
**Ryzyko (Plan 1):** Walidacja spójność – pusty title → client error przed API.

#### TC-TICKET-002: Edycja przez reportera (P0, Integracyjny)

**Kroki:** Click ticket → "Edit" → change title → "Save".  
**Oczekiwany:** Update UI/DB, 200 PUT /tickets/[id].  
**Status:** ✅ Zaimplementowany w `tests-e2e/edit-ticket.spec.ts`  
**Pokrycie:** Główny scenariusz + alternatywny przez dropdown menu

#### TC-TICKET-003: Edycja nieuprawniona (P0, Security)

**Kroki:** Non-reporter/assignee click "Edit".  
**Oczekiwany:** View mode only, toast "No permission", 403 PUT.  
**Ryzyko (Plan 1):** Macierz ról – test dla Admin (allow), Other User (deny).

#### TC-TICKET-004: Drag & drop (P0, E2E)

**Kroki:** Drag from "Open" to "In Progress".  
**Oczekiwany:** Optimistic UI move, toast success, 200 PATCH /status, DB update.  
**Ryzyko (Plan 1):** API fail → rollback UI, toast error, test network mock.

#### TC-TICKET-005: Drag nieuprawniony (P0, Security)

**Kroki:** Other user drag.  
**Oczekiwany:** Not draggable (cursor not-allowed), 403 PATCH.

#### TC-TICKET-006: Assign to me (P1, Integracyjny)

**Kroki:** Edit → "Assign to me".  
**Oczekiwany:** Badge show, 200 PATCH /assignee.

#### TC-TICKET-007: Admin assign (P1, Integracyjny)

**Kroki:** Admin select user from dropdown.  
**Oczekiwany:** Update assignee_id.

#### TC-TICKET-008: Walidacja formularza (P1, Unit)

**Kroki:** Empty title → "Save".  
**Oczekiwany:** Error "Title required", no submit.  
**Ryzyko (Plan 1):** Title >255 chars → "Max length" error.

#### TC-TICKET-009: Usuwanie przez admin (P1, Integracyjny)

**Kroki:** DELETE /tickets/[id].  
**Oczekiwany:** 204, ticket gone, cascade null reporter_id.

#### TC-TICKET-010: Sync error handling (P0, Integracyjny – z Plan 1)

**Kroki:** Drag with mocked API fail.  
**Oczekiwany:** Rollback to original column, toast "Failed to move", log error.

### 4.3 Moduł Admin (P1)

#### TC-ADMIN-001: Create user (P1, E2E)

**Kroki:** /admin → "Add user", data → "Add".  
**Oczekiwany:** New row, 201 POST /users, new auth.user/profile (role=USER).  
**Dane:** `{"username":"newuser","email":"new@example.com","password":"Pass123!","role":"USER"}`

#### TC-ADMIN-002: Duplicate email (P1, Integracyjny)

**Oczekiwany:** 409, toast "Exists", no create.

#### TC-ADMIN-003: Delete user (P1, E2E)

**Kroki:** ... → "Delete" → confirm.  
**Oczekiwany:** Gone, 204 DELETE, delete auth/profile, null reporter_ids.

#### TC-ADMIN-004: Self-delete block (P1, Security)

**Oczekiwany:** Disabled button, 403 "Cannot delete own".

#### TC-ADMIN-005: Non-admin access (P1, Security)

**Kroki:** User → /admin.  
**Oczekiwany:** Redirect/403, no link in Nav.  
**Ryzyko (Plan 1):** Test API /users direct call → 403.

### 4.4 UI, Integracje, Performance (P2)

#### TC-UI-001: Keyboard nav Kanban (P2, Manual/E2E)

**Kroki:** Tab/Enter/arrow na tickets.  
**Oczekiwany:** Focus visible, drag possible, ARIA announce.

#### TC-UI-002: Mobile responsive (P2, E2E)

**Kroki:** Emulate iPhone, full flow.  
**Oczekiwany:** Adapt layout, touch-friendly.

#### TC-UI-003: Contrast WCAG (P2, Auto)

**Oczekiwany:** >4.5:1, no violations.

#### TC-INT-001: Supabase network error (P2, Integracyjny)

**Kroki:** Load tickets with mock fail.  
**Oczekiwany:** 503, "Try again" UI, console log.

#### TC-INT-002: AI error (P2, Mock)

**Oczekiwany:** Graceful fail, toast, log in ai_errors.

#### TC-PERF-001: Page load (P2, Lighthouse)

**Oczekiwany:** FCP <1.8s, LCP <2.5s, score >90.

#### TC-PERF-002: 100 tickets (P2, Manual)

**Oczekiwany:** Render <2s, smooth drag (60 FPS).

## 5. Środowisko testowe

### 5.1 Środowiska

- **DEV:** http://localhost:3000, Supabase DEV, seed + test data, no CI.
- **STG:** https://staging.sisyflow.com, Supabase STG (anon data), CI from develop.
- **PROD:** https://sisyflow.com, Supabase PROD, CI from main.

### 5.2 Konfiguracja

#### 5.2.1 .env.test

```env

SUPABASE_URL=https://test.supabase.com

SUPABASE_KEY=eyJhbG...

SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

OPENROUTER_API_KEY=mock_key

NODE_ENV=test

```

#### 5.2.2 Baza testowa

- Izolowana Supabase, auto seed/clean, RLS jak PROD.

#### 5.2.3 Seed data

```sql
-- Users
INSERT INTO auth.users (id, email) VALUES ('admin-001', 'admin@test.com'), ('user-001', 'user1@test.com');
INSERT INTO profiles (id, username, role) VALUES ('admin-001', 'admin', 'ADMIN'), ('user-001', 'user1', 'USER');

-- Tickets
INSERT INTO tickets (id, title, type, status, reporter_id) VALUES ('ticket-001', 'Test Bug', 'BUG', 'OPEN', 'user-001');
```

## 6. Narzędzia do testowania

### 6.1 Framework

| Narzędzie  | Wersja  | Zastosowanie           |
| ---------- | ------- | ---------------------- |
| Vitest     | ^1.0.0  | Unit/integration       |
| RTL        | ^14.0.0 | React components       |
| Playwright | ^1.40.0 | E2E/API, cross-browser |
| Supertest  | ^6.3.0  | API                    |
| MSW        | ^2.0.0  | Mocks                  |

### 6.2 Pomocnicze

| Narzędzie                 | Zastosowanie |
| ------------------------- | ------------ |
| @testing-library/jest-dom | Matchers     |
| axe-core                  | A11y         |
| Lighthouse CI             | Performance  |
| Faker.js                  | Test data    |

### 6.3 CI/CD

- GitHub Actions, Docker.

### 6.4 Config Vitest (vitest.config.ts)

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "c8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "**/*.d.ts"],
      lines: 85,
      functions: 85,
      branches: 80,
      statements: 85,
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

### 6.5 Config Playwright (playwright.config.ts)

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [["html"], ["junit", { outputFile: "test-results/junit.xml" }]],
  use: {
    baseURL: "http://localhost:4321",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "Mobile Chrome", use: { ...devices["Pixel 5"] } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:4321",
    reuseExistingServer: !process.env.CI,
  },
});
```

## 7. Kryteria akceptacji testów

### 7.1 Entry Criteria

- Code built, lint/format pass.
- Test env ready, seed loaded.

### 7.2 Exit Criteria

- All planned tests run.
- Critical 100%, overall ≥95% pass.
- Coverage ≥85%.
- No blockers/critical bugs.
- ≤3 high bugs (PO ok).
- Perf/A11y/Security meet standards.
- QA report approved.

### 7.3 Per Type

- Unit: 100% pass, >85% coverage, <30s exec.
- Integration: 100% pass, <5min.
- E2E: ≥95% (retries), <30min, 100% critical.
- API: 100% pass, <500ms 95%.
- Perf: Lighthouse >90, LCP <2.5s.
- A11y: 0 critical axe, WCAG AA.
- Security: 0 critical/high vulns.

### 7.4 DoD

- Code reviewed, tests written/passing (>85% new code).
- No lint errors, docs updated.
- Manual QA, PO demo/accept.
- Merged to develop.

### 8. Tools

- Sisyflow itself (custom fields, workflows, integrations).
- Labels: bug, frontend, security, needs-repro.
