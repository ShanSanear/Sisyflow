# API Endpoint Implementation Plan: PUT /profiles/me

## 1. Przegląd punktu końcowego

Ten punkt końcowy umożliwia zalogowanemu użytkownikowi aktualizację swojego profilu. Obecnie jedynym polem, które można zaktualizować, jest `username`. Endpoint zapewnia, że nowa nazwa użytkownika jest unikalna w systemie.

## 2. Szczegóły żądania

- **Metoda HTTP:** `PUT`
- **Struktura URL:** `/api/profiles/me`
- **Request Body:**
  ```json
  {
    "username": "string"
  }
  ```
- **Parametry:**
  - **Wymagane:**
    - `username` (string): Nowa nazwa użytkownika. Musi mieć długość od 3 do 50 znaków.
  - **Opcjonalne:** Brak.

## 3. Wykorzystywane typy

- **Command Model (Request):** `UpdateProfileCommand`
  ```typescript
  // src/types.ts
  export interface UpdateProfileCommand {
    username: string;
  }
  ```
- **DTO (Response):** `ProfileDTO`
  ```typescript
  // src/types.ts
  export type ProfileDTO = Pick<Profile, "id" | "username" | "role" | "created_at" | "updated_at">;
  ```

## 4. Szczegóły odpowiedzi

- **Sukces (200 OK):** Zwraca zaktualizowany obiekt profilu użytkownika w formacie `ProfileDTO`.
  ```json
  {
    "id": "c3a4b5e6-f7g8-9h0i-j1k2-l3m4n5o6p7q8",
    "username": "new_username",
    "role": "USER",
    "created_at": "2023-10-26T10:00:00Z",
    "updated_at": "2023-10-26T12:30:00Z"
  }
  ```
- **Błędy:** Zobacz sekcję "Obsługa błędów".

## 5. Przepływ danych

1. Klient wysyła żądanie `PUT` na adres `/api/profiles/me` z nową nazwą użytkownika w ciele żądania.
2. Handler API w Astro (`src/pages/api/profiles/me.ts`) odbiera żądanie.
3. Middleware lub handler sprawdza, czy użytkownik jest uwierzytelniony, korzystając z `context.locals.supabase`.
4. Ciało żądania jest walidowane przy użyciu schematu `zod` pod kątem poprawności typu i długości pola `username`.
5. Handler wywołuje metodę `updateProfile` z `ProfileService`, przekazując ID uwierzytelnionego użytkownika i dane z żądania.
6. `ProfileService` najpierw sprawdza w bazie danych, czy nowa nazwa użytkownika nie jest już zajęta przez innego użytkownika.
7. Jeśli nazwa jest unikalna, serwis wykonuje operację `UPDATE` na tabeli `profiles`, aktualizując `username` dla danego `id` użytkownika.
8. Baza danych (dzięki triggerowi) automatycznie aktualizuje pole `updated_at`.
9. `ProfileService` zwraca zaktualizowane dane profilu do handlera.
10. Handler formatuje odpowiedź jako `ProfileDTO` i wysyła ją do klienta ze statusem `200 OK`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie:** Endpoint musi być chroniony i dostępny tylko dla zalogowanych użytkowników. Każde żądanie musi zawierać ważny token sesji, który zostanie zweryfikowany po stronie serwera za pomocą Supabase Auth.
- **Autoryzacja:** Użytkownik może modyfikować wyłącznie swój własny profil. Logika biznesowa musi używać ID użytkownika z jego sesji (`auth.uid()`) do identyfikacji rekordu do aktualizacji, a nie ID przekazanego w żądaniu.
- **Walidacja danych wejściowych:** Ciało żądania musi być rygorystycznie walidowane przy użyciu `zod`, aby zapobiec nieprawidłowym danym, takim jak zbyt długa nazwa użytkownika, co jest zgodne z ograniczeniami bazy danych (`CHECK (LENGTH(username) >= 3 AND LENGTH(username) <= 50)`).

## 7. Obsługa błędów

- **400 Bad Request:** Zwracany, gdy walidacja `zod` nie powiedzie się (np. brak pola `username`, nieprawidłowy typ, nieprawidłowa długość).
  ```json
  { "error": "Validation failed", "details": "[...]" }
  ```
- **401 Unauthorized:** Zwracany, gdy użytkownik nie jest uwierzytelniony.
  ```json
  { "error": "User is not authenticated" }
  ```
- **404 Not Found:** Zwracany, gdy profil dla uwierzytelnionego użytkownika nie zostanie znaleziony w bazie danych.
  ```json
  { "error": "Profile not found" }
  ```
- **409 Conflict:** Zwracany, gdy podana nazwa `username` jest już zajęta przez innego użytkownika.
  ```json
  { "error": "Username is already taken" }
  ```
- **500 Internal Server Error:** Zwracany w przypadku nieoczekiwanych błędów serwera, np. problemów z połączeniem z bazą danych.
  ```json
  { "error": "Internal Server Error" }
  ```

## 8. Rozważania dotyczące wydajności

- Aby zapewnić szybkie sprawdzanie unikalności nazwy użytkownika, na kolumnie `username` w tabeli `profiles` musi istnieć indeks `UNIQUE`. Jest to już zapewnione przez `UNIQUE` constraint w schemacie (`db-plan.md`).
- Operacja `UPDATE` na pojedynczym rekordzie jest wysoce wydajna.

## 9. Etapy wdrożenia

1.  **Stworzenie pliku endpointu:** Utwórz plik `src/pages/api/profiles/me.ts`.
2.  **Zdefiniowanie schematu walidacji:** W pliku endpointu zdefiniuj schemat `zod` dla `UpdateProfileCommand`, który waliduje pole `username` (string, min 3, max 50 znaków).
3.  **Implementacja handlera `PUT`:**
    - Wyeksportuj funkcję `PUT({ request, context })`.
    - Użyj `export const prerender = false;`
    - Pobierz klienta Supabase z `context.locals.supabase`.
    - Sprawdź sesję użytkownika. Jeśli brak, zwróć `401 Unauthorized`.
    - Sparsuj i zwaliduj ciało żądania za pomocą zdefiniowanego schematu `zod`. W razie błędu zwróć `400 Bad Request`.
4.  **Stworzenie serwisu `ProfileService`:**
    - Utwórz plik `src/lib/services/profile.service.ts`.
    - Zaimplementuj funkcję `updateProfile(supabase: SupabaseClient, userId: string, command: UpdateProfileCommand)`.
5.  **Implementacja logiki w serwisie:**
    - W `updateProfile`, wykonaj zapytanie do bazy, aby sprawdzić, czy `username` z `command` już istnieje dla innego użytkownika. Jeśli tak, rzuć błąd (lub zwróć wynik), który zostanie zmapowany na `409 Conflict`.
    - Jeśli nazwa jest dostępna, wykonaj zapytanie `update` na tabeli `profiles`, ustawiając nową nazwę `username` dla `userId`.
    - Zwróć zaktualizowany profil.
6.  **Integracja serwisu z handlerem:**
    - W handlerze `PUT`, wywołaj `ProfileService.updateProfile` z klientem Supabase, ID użytkownika z sesji i zwalidowanymi danymi.
    - Obsłuż ewentualne błędy zwrócone przez serwis i zmapuj je na odpowiednie kody statusu HTTP (`404`, `409`, `500`).
7.  **Zwrócenie odpowiedzi:**
    - Jeśli aktualizacja się powiedzie, przekształć wynik z serwisu na `ProfileDTO` (jeśli to konieczne) i zwróć go z kodem `200 OK`.
