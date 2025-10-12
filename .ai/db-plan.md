# Schemat bazy danych - Sisyflow MVP

## 1. Typy wyliczeniowe (ENUM)

- **user_role**: 'ADMIN', 'USER'
- **ticket_type**: 'BUG', 'IMPROVEMENT', 'TASK'
- **ticket_status**: 'OPEN', 'IN_PROGRESS', 'CLOSED'

## 2. Tabele

### 2.1. users

Tabela zarządzana przez Supabase Auth (schemat `auth.users`).

- id: UUID PRIMARY KEY
- email: VARCHAR(255) NOT NULL UNIQUE
- encrypted_password: VARCHAR NOT NULL
- created_at: TIMESTAMPTZ NOT NULL DEFAULT now()
- confirmed_at: TIMESTAMPTZ

### 2.2. profiles

Tabela przechowująca dane użytkowników specyficzne dla aplikacji, rozszerzająca tabelę `auth.users`.

- id: UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
- username: TEXT NOT NULL UNIQUE CHECK (LENGTH(username) >= 3 AND LENGTH(username) <= 50)
- role: user_role NOT NULL DEFAULT 'USER'
- created_at: TIMESTAMPTZ NOT NULL DEFAULT NOW()
- updated_at: TIMESTAMPTZ NOT NULL DEFAULT NOW()

### 2.3. tickets

Centralna tabela systemu przechowująca zgłoszenia (tickety).

- id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- title: TEXT NOT NULL CHECK (LENGTH(title) >= 1 AND LENGTH(title) <= 200)
- description: TEXT CHECK (LENGTH(description) <= 10000)
- type: ticket_type NOT NULL
- status: ticket_status NOT NULL DEFAULT 'OPEN'
- reporter_id: UUID NULLABLE REFERENCES profiles(id) ON DELETE SET NULL
- assignee_id: UUID NULLABLE REFERENCES profiles(id) ON DELETE SET NULL
- ai_enhanced: BOOLEAN NOT NULL DEFAULT FALSE
- created_at: TIMESTAMPTZ NOT NULL DEFAULT NOW()
- updated_at: TIMESTAMPTZ NOT NULL DEFAULT NOW()

### 2.4. comments

Tabela przechowująca komentarze do ticketów.

- id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- ticket_id: UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE
- author_id: UUID NULLABLE REFERENCES profiles(id) ON DELETE SET NULL
- content: TEXT NOT NULL CHECK (LENGTH(content) >= 1 AND LENGTH(content) <= 10000)
- created_at: TIMESTAMPTZ NOT NULL DEFAULT NOW()
- updated_at: TIMESTAMPTZ NOT NULL DEFAULT NOW()

### 2.5. attachments

Tabela przechowująca załączniki do ticketów (pliki .txt i .md).

- id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- ticket_id: UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE
- filename: TEXT NOT NULL CHECK (filename ~\* '\.(txt|md)$')
- content: TEXT NOT NULL CHECK (LENGTH(content) <= 20480)
- created_at: TIMESTAMPTZ NOT NULL DEFAULT NOW()

### 2.6. ai_suggestion_sessions

Tabela przechowująca sugestie AI dla ticketów.

- id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- ticket_id: UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE
- user_id: UUID REFERENCES profiles(id) ON DELETE SET NULL
- suggestions: JSONB NOT NULL
- rating: INTEGER CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5))
- created_at: TIMESTAMPTZ NOT NULL DEFAULT NOW()

**Struktura JSONB dla suggestions:**

```json
[
  {
    "type": "INSERT",
    "content": "Jaką wersję przeglądarki używasz?",
    "applied": false
  },
  {
    "type": "QUESTION",
    "content": "Czy problem występuje na różnych urządzeniach?",
    "applied": false
  }
]
```

### 2.7. project_documentation

Tabela przechowująca dokumentację projektu używaną jako kontekst dla AI. Zawiera tylko jeden rekord.

- id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- content: TEXT NOT NULL CHECK (LENGTH(content) <= 20000)
- updated_at: TIMESTAMPTZ NOT NULL DEFAULT NOW()
- updated_by: UUID REFERENCES profiles(id) ON DELETE SET NULL

### 2.8. ai_errors

Tabela do logowania błędów komunikacji z AI.

- id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- ticket_id: UUID REFERENCES tickets(id) ON DELETE SET NULL
- user_id: UUID REFERENCES profiles(id) ON DELETE SET NULL
- error_message: TEXT NOT NULL
- error_details: JSONB
- created_at: TIMESTAMPTZ NOT NULL DEFAULT NOW()

## 3. Relacje między tabelami

### 3.1. profiles ↔ tickets

- **Jeden-do-wielu (reporter)**: Jeden profil może być zgłaszającym wielu ticketów
  - `tickets.reporter_id` → `profiles.id`
- **Jeden-do-wielu (assignee)**: Jeden profil może być przypisany do wielu ticketów
  - `tickets.assignee_id` → `profiles.id`

### 3.2. tickets ↔ comments

- **Jeden-do-wielu**: Jeden ticket może mieć wiele komentarzy
  - `comments.ticket_id` → `tickets.id`

### 3.3. profiles ↔ comments

- **Jeden-do-wielu**: Jeden profil może być autorem wielu komentarzy
  - `comments.author_id` → `profiles.id`

### 3.4. tickets ↔ attachments

- **Jeden-do-wielu**: Jeden ticket może mieć wiele załączników
  - `attachments.ticket_id` → `tickets.id`

### 3.5. tickets ↔ ai_suggestion_sessions

- **Jeden-do-wielu**: Jeden ticket może mieć wiele sesji sugestii AI
  - `ai_suggestion_sessions.ticket_id` → `tickets.id`

### 3.6. profiles ↔ ai_suggestion_sessions

- **Jeden-do-wielu**: Jeden profil może zainicjować wiele sesji sugestii AI
  - `ai_suggestion_sessions.user_id` → `profiles.id`

### 3.7. profiles ↔ project_documentation

- **Jeden-do-wielu**: Jeden profil (administrator) może zaktualizować dokumentację wielokrotnie
  - `project_documentation.updated_by` → `profiles.id`

### 3.8. tickets ↔ ai_errors

- **Jeden-do-wielu**: Jeden ticket może mieć powiązane wiele błędów AI
  - `ai_errors.ticket_id` → `tickets.id`

### 3.9. profiles ↔ ai_errors

- **Jeden-do-wielu**: Jeden profil może mieć powiązane wiele błędów AI
  - `ai_errors.user_id` → `profiles.id`

## 4. Indeksy

Indeksy zapewniające wydajność zapytań:

**Indeksy na kluczach obcych (dla operacji JOIN):**

- idx_tickets_reporter_id: tickets(reporter_id)
- idx_tickets_assignee_id: tickets(assignee_id)
- idx_comments_ticket_id: comments(ticket_id)
- idx_comments_author_id: comments(author_id)
- idx_attachments_ticket_id: attachments(ticket_id)
- idx_ai_suggestion_sessions_ticket_id: ai_suggestion_sessions(ticket_id)
- idx_ai_suggestion_sessions_user_id: ai_suggestion_sessions(user_id)
- idx_ai_errors_ticket_id: ai_errors(ticket_id)
- idx_ai_errors_user_id: ai_errors(user_id)

**Indeksy na kolumnach używanych do filtrowania:**

- idx_tickets_status: tickets(status)
- idx_tickets_type: tickets(type)

**Indeksy kompozytowe:**

- idx_tickets_status_created_at: tickets(status, created_at DESC)

**Indeksy dla sortowania chronologicznego:**

- idx_comments_created_at: comments(created_at DESC)

## 5. Funkcje pomocnicze SQL

Funkcje pomocnicze dla polityk RLS:

- **get_user_role()**: Zwraca rolę zalogowanego użytkownika (pobiera wartość z `profiles.role` dla `auth.uid()`)
- **is_admin()**: Sprawdza czy zalogowany użytkownik ma rolę ADMIN

## 6. Row-Level Security (RLS)

RLS (Row-Level Security) jest włączone na wszystkich tabelach: `profiles`, `tickets`, `comments`, `attachments`, `ai_suggestion_sessions`, `project_documentation`, `ai_errors`.

### 6.1. Polityki RLS dla tabeli `profiles`

**SELECT**: Wszyscy zalogowani użytkownicy mogą wyświetlać profile

**INSERT**: Brak polityki - profile są tworzone automatycznie przez trigger/skrypt

**UPDATE**: Administratorzy mogą aktualizować wszystkie profile, użytkownicy tylko swoje

**DELETE**: Tylko administratorzy mogą usuwać profile innych użytkowników (nie własne)

### 6.2. Polityki RLS dla tabeli `tickets`

**SELECT**: Wszyscy zalogowani użytkownicy mogą wyświetlać tickety

**INSERT**: Wszyscy zalogowani użytkownicy mogą tworzyć tickety

**UPDATE**: Administratorzy mogą aktualizować wszystkie tickety. Zgłaszający i przypisane osoby mogą aktualizować swoje tickety

**DELETE**: Tylko administratorzy mogą usuwać tickety

### 6.3. Polityki RLS dla tabeli `comments`

**SELECT**: Wszyscy zalogowani użytkownicy mogą wyświetlać komentarze

**INSERT**: Wszyscy zalogowani użytkownicy mogą dodawać komentarze

**UPDATE**: Tylko autor może edytować swoje komentarze

**DELETE**: Administratorzy mogą usuwać wszystkie komentarze, autorzy mogą usuwać swoje własne

### 6.4. Polityki RLS dla tabeli `attachments`

**SELECT**: Wszyscy zalogowani użytkownicy mogą wyświetlać załączniki

**INSERT**: Wszyscy zalogowani użytkownicy mogą dodawać załączniki

**UPDATE**: Brak polityki - załączniki nie są edytowalne

**DELETE**: Administratorzy mogą usuwać wszystkie załączniki. Zgłaszający ticketa mogą usuwać załączniki ze swoich ticketów

### 6.5. Polityki RLS dla tabeli `ai_suggestion_sessions`

**SELECT**: Wszyscy zalogowani użytkownicy mogą wyświetlać sesje sugestii

**INSERT**: Wszyscy zalogowani użytkownicy mogą tworzyć sesje sugestii

**UPDATE**: Tylko autor sesji może ją aktualizować (np. zmiana oceny lub statusu sugestii)

**DELETE**: Tylko administratorzy mogą usuwać sesje sugestii

### 6.6. Polityki RLS dla tabeli `project_documentation`

**SELECT**: Wszyscy zalogowani użytkownicy mogą wyświetlać dokumentację

**INSERT**: Tylko administratorzy mogą tworzyć dokumentację

**UPDATE**: Tylko administratorzy mogą aktualizować dokumentację

**DELETE**: Tylko administratorzy mogą usuwać dokumentację

### 6.7. Polityki RLS dla tabeli `ai_errors`

**SELECT**: Tylko administratorzy mogą wyświetlać logi błędów

**INSERT**: Wszyscy zalogowani użytkownicy mogą tworzyć wpisy błędów

**UPDATE**: Brak polityki - logi błędów nie są edytowalne

**DELETE**: Tylko administratorzy mogą usuwać logi błędów

## 7. Triggery

**Automatyczna aktualizacja pola `updated_at`:**

Triggery typu `BEFORE UPDATE` automatycznie ustawiają pole `updated_at` na bieżący czas dla następujących tabel:

- profiles
- tickets
- comments
- project_documentation

Wszystkie triggery korzystają z funkcji pomocniczej `update_updated_at_column()`, która ustawia `NEW.updated_at = NOW()`.

## 8. Uwagi dotyczące decyzji projektowych

### 8.1. Wybór UUID jako klucza głównego

Użycie UUID zamiast sekwencyjnych liczb całkowitych zapewnia:

- Unikalność globalną (nie tylko w ramach tabeli)
- Lepszą skalowalność w systemach rozproszonych
- Utrudnienie przewidywania ID przez potencjalnych atakujących
- Zgodność z domyślnym zachowaniem Supabase Auth (`auth.users.id`)

### 8.2. ON DELETE SET NULL vs ON DELETE CASCADE

- **SET NULL**: Stosowane dla `reporter_id` i `assignee_id` w tabeli `tickets` oraz `author_id` w `comments`. Zachowuje historię ticketów i komentarzy nawet po usunięciu użytkownika.
- **CASCADE**: Stosowane dla relacji ticket → comments, ticket → attachments. Usunięcie ticketa powoduje usunięcie powiązanych komentarzy i załączników, co jest zgodne z oczekiwaniami użytkowników.

### 8.3. Przechowywanie załączników w bazie danych

Dla MVP, pliki tekstowe (do 20 KB) są przechowywane bezpośrednio w kolumnie `TEXT`. To podejście:

- Upraszcza architekturę (brak potrzeby konfiguracji storage)
- Jest akceptowalne dla małych plików tekstowych
- Ułatwia backup i replikację danych
- Dla przyszłej skalowalności, można rozważyć migrację do Supabase Storage

### 8.4. Format JSONB dla sugestii AI

Przechowywanie sugestii jako JSONB zamiast osobnej tabeli:

- Upraszcza schemat bazy danych
- Umożliwia elastyczną strukturę sugestii
- Zapewnia wydajne zapytania dzięki indeksowaniu JSONB
- Redukuje liczbę JOIN operations

### 8.5. Pojedynczy rekord dokumentacji projektu

Tabela `project_documentation` jest zaprojektowana tak, aby zawierać tylko jeden rekord. To podejście:

- Jest wystarczające dla MVP (jeden projekt)
- Upraszcza logikę aplikacji
- Dla przyszłej rozbudowy o wiele projektów, można dodać kolumnę `project_id`

### 8.6. Strategia indeksowania

Indeksy zostały dodane na:

- Wszystkich kluczach obcych (optymalizacja JOIN)
- Kolumnach używanych do filtrowania (`status`, `type`)
- Kolumnach używanych do sortowania (`created_at`)
- Indeks kompozytowy `status + created_at` dla głównego widoku Kanban

### 8.7. Row-Level Security (RLS)

Wszystkie tabele są chronione przez RLS, co zapewnia:

- Bezpieczeństwo na poziomie bazy danych (nie tylko aplikacji)
- Separację uprawnień między rolami (ADMIN vs USER)
- Ochronę przed nieautoryzowanym dostępem, nawet przy kompromitacji klucza API

### 8.8. Funkcje pomocnicze SQL

Funkcje `get_user_role()` i `is_admin()` z atrybutem `SECURITY DEFINER`:

- Centralizują logikę sprawdzania uprawnień
- Upraszczają definicje polityk RLS
- Zapewniają spójność w całym schemacie

### 8.9. Inicjalizacja pierwszego administratora

Zgodnie z decyzją z sesji planowania, pierwszy administrator będzie tworzony przez skrypt seed, a nie przez trigger w bazie danych. Zapewnia to:

- Większą kontrolę nad procesem inicjalizacji
- Łatwiejsze testowanie i debugowanie
- Czystsze oddzielenie logiki biznesowej od schematu bazy danych
