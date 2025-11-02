<architecture_analysis>
Na podstawie dostarczonych dokumentów (`prd.md` i `auth-spec.md`) oraz analizy obecnego kodu, opracowano architekturę interfejsu użytkownika dla modułu uwierzytelniania i autoryzacji.

### 1. Zidentyfikowane komponenty i strony

**Nowe Strony (Astro):**

- `src/pages/register.astro`: Strona do rejestracji pierwszego użytkownika (administratora). Dostępna tylko, gdy w systemie nie ma żadnego użytkownika.
- `src/pages/login.astro`: Strona logowania dla istniejących użytkowników.
- `src/pages/board.astro`: Główny widok aplikacji (tablica Kanban), dostępny po zalogowaniu. Zastąpi obecną stronę `index.astro`.
- `src/pages/index.astro`: Strona główna, która będzie działać jako router, przekierowując użytkowników do `/login` lub `/board` w zależności od stanu uwierzytelnienia.

**Nowe Layouty (Astro):**

- `src/layouts/AuthLayout.astro`: Minimalistyczny layout dla stron `login.astro` i `register.astro`, centrujący zawartość.
- `src/layouts/AuthenticatedLayout.astro`: Rozszerzony layout dla zalogowanych użytkowników, zawierający `NavigationBar.tsx`.

**Nowe Komponenty (React):**

- `src/components/auth/LoginForm.tsx`: Formularz logowania z walidacją (`zod`, `react-hook-form`) i komunikacją z API (`/api/auth/sign-in`).
- `src/components/auth/RegisterForm.tsx`: Formularz rejestracji z walidacją i komunikacją z API (`/api/auth/sign-up`).
- `src/components/layout/NavigationBar.tsx`: Pasek nawigacyjny dla zalogowanych użytkowników, wyświetlający dane użytkownika (z hooka `useUser`) i opcję wylogowania.

**Istniejące komponenty do aktualizacji:**

- Żadne istniejące komponenty nie wymagają bezpośredniej aktualizacji w ramach tego modułu, ponieważ jest on tworzony od podstaw. `AuthenticatedLayout.astro` będzie nową wersją głównego layoutu.

### 2. Główne strony i ich komponenty

- **Strona Logowania (`/login`):**
  - Layout: `AuthLayout.astro`
  - Komponent: `LoginForm.tsx`
- **Strona Rejestracji (`/register`):**
  - Layout: `AuthLayout.astro`
  - Komponent: `RegisterForm.tsx`
- **Tablica Kanban (`/board`):**
  - Layout: `AuthenticatedLayout.astro` (zawierający `NavigationBar.tsx`)
  - Komponenty: `KanbanBoardView.tsx` (istniejący)

### 3. Przepływ danych

1.  **Użytkownik niezalogowany** trafia na `index.astro`.
2.  Middleware (`src/middleware/index.ts`) przechwytuje żądanie, sprawdza brak sesji i przekierowuje na `/login` (lub `/register`, jeśli baza jest pusta).
3.  Użytkownik wchodzi na `/login`, gdzie `login.astro` renderuje `LoginForm.tsx` wewnątrz `AuthLayout.astro`.
4.  `LoginForm.tsx` po wypełnieniu wysyła dane do endpointu `/api/auth/sign-in`.
5.  Po pomyślnym zalogowaniu, API ustawia ciasteczka sesji, a strona klienta przekierowuje użytkownika na `index.astro`.
6.  Tym razem middleware (`src/middleware/index.ts`) wykrywa aktywną sesję i przekierowuje na `/board`.
7.  `board.astro` jest renderowane z użyciem `AuthenticatedLayout.astro`.
8.  `AuthenticatedLayout.astro` zawiera `NavigationBar.tsx`.
9.  `NavigationBar.tsx` używa hooka `useUser`, który odpytuje endpoint `/api/profiles/me`, aby pobrać dane zalogowanego użytkownika i je wyświetlić.

### 4. Opis funkcjonalności komponentów

- **`LoginForm.tsx`**: Renderuje pola identyfikatora (email lub nazwa użytkownika) i hasło, waliduje je po stronie klienta i obsługuje komunikację z serwerem w celu uwierzytelnienia użytkownika. Wyświetla błędy walidacji i błędy z API.
- **`RegisterForm.tsx`**: Podobnie jak `LoginForm.tsx`, ale dla procesu rejestracji. Waliduje dodatkowo siłę hasła.
- **`NavigationBar.tsx`**: Komponent UI wyświetlający nawigację, nazwę użytkownika i przycisk wylogowania. Dane pobiera asynchronicznie, aby uniezależnić się od serwerowego renderowania strony.
- **`AuthLayout.astro`**: Zapewnia spójny, minimalistyczny wygląd dla formularzy uwierzytelniania, bez zbędnych elementów interfejsu.
- **`AuthenticatedLayout.astro`**: Główny "szkielet" aplikacji dla zalogowanego użytkownika, zawierający wspólne elementy jak nawigacja.

</architecture_analysis>

```mermaid
flowchart TD
    classDef newComponent fill:#cce5ff,stroke:#333,stroke-width:2px;
    classDef modifiedComponent fill:#fff2cc,stroke:#333,stroke-width:2px;
    classDef astroPage fill:#d5f5e3,stroke:#27ae60,stroke-width:2px;
    classDef reactComponent fill:#fdebd0,stroke:#f39c12,stroke-width:2px;
    classDef layout fill:#eaeded,stroke:#95a5a6,stroke-width:2px;
    classDef api fill:#fadbd8,stroke:#c0392b,stroke-width:2px;

    subgraph "Nawigacja i Routing (Astro)"
        U[Użytkownik] --> IDX["/index.astro"]:::astroPage
        IDX -- "Brak sesji" --> LOGIN_PAGE["/login.astro"]:::astroPage
        IDX -- "Brak użytkowników" --> REGISTER_PAGE["/register.astro"]:::astroPage
        IDX -- "Aktywna sesja" --> BOARD_PAGE["/board.astro"]:::astroPage
    end

    subgraph "Widoki Uwierzytelniania (Strony Astro)"
        LOGIN_PAGE -- "Renderuje" --> AUTH_LAYOUT
        REGISTER_PAGE -- "Renderuje" --> AUTH_LAYOUT

        AUTH_LAYOUT[("AuthLayout.astro")]:::layout
        AUTH_LAYOUT -- "Osadza" --> LOGIN_FORM_COMPONENT
        AUTH_LAYOUT -- "Osadza" --> REGISTER_FORM_COMPONENT
    end

    subgraph "Komponenty Interaktywne (React)"
        LOGIN_FORM_COMPONENT["LoginForm.tsx"]:::reactComponent
        REGISTER_FORM_COMPONENT["RegisterForm.tsx"]:::reactComponent

        LOGIN_FORM_COMPONENT -- "POST /api/auth/sign-in" --> API_SIGN_IN
        REGISTER_FORM_COMPONENT -- "POST /api/auth/sign-up" --> API_SIGN_UP
    end

    subgraph "Widok Aplikacji (Strony Astro)"
        BOARD_PAGE -- "Renderuje" --> AUTHENTICATED_LAYOUT[("AuthenticatedLayout.astro")]:::layout
        AUTHENTICATED_LAYOUT -- "Osadza" --> NAVBAR["NavigationBar.tsx"]:::reactComponent
        AUTHENTICATED_LAYOUT -- "Osadza" --> KANBAN_VIEW["KanbanBoardView.tsx (istniejący)"]:::reactComponent
    end

    subgraph "Komponenty Współdzielone (React)"
        NAVBAR -- "GET /api/profiles/me" --> API_ME
        NAVBAR -- "POST /api/auth/sign-out" --> API_SIGN_OUT
    end

    subgraph "Warstwa API (Backend)"
        API_SIGN_IN["/api/auth/sign-in"]:::api
        API_SIGN_UP["/api/auth/sign-up"]:::api
        API_SIGN_OUT["/api/auth/sign-out"]:::api
        API_ME["/api/profiles/me"]:::api
    end

    %% Definicja stylów dla nowych elementów
    class LOGIN_PAGE,REGISTER_PAGE,BOARD_PAGE,IDX newComponent;
    class AUTH_LAYOUT,AUTHENTICATED_LAYOUT newComponent;
    class LOGIN_FORM_COMPONENT,REGISTER_FORM_COMPONENT,NAVBAR newComponent;
```
