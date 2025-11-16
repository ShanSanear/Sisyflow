# API Endpoint Implementation Plan: Update User Password

## 1. Przegląd endpointu

Ten endpoint umożliwia uwierzytelnionemu użytkownikowi bezpieczną zmianę hasła. Wymaga weryfikacji bieżącego hasła przed ustawieniem nowego, zapewniając, że tylko właściciel konta może dokonać tej zmiany.

## 2. Szczegóły żądania

- **Metoda HTTP:** `PATCH`
- **Struktura URL:** `/api/auth/password`
- **Request Body:**
  ```json
  {
    "currentPassword": "string",
    "newPassword": "string"
  }
  ```
- **Parametry:**
  - **Wymagane (w body):**
    - `currentPassword`: Aktualne hasło użytkownika.
    - `newPassword`: Nowe hasło, które musi spełniać określone wymagania bezpieczeństwa.
  - **Opcjonalne:** Brak.

## 3. Wykorzystywane typy

- **Command Model:**
  ```typescript:src/types.ts
  export interface UpdatePasswordCommand {
    currentPassword: string;
    newPassword: string;
  }
  ```
- **Model walidacji (Zod):**

  ```typescript
  import { z } from "zod";

  const passwordSchema = z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number");

  export const UpdatePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
  });
  ```

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (200 OK):**
  ```json
  {
    "message": "Password updated successfully"
  }
  ```
- **Odpowiedzi błędów:** Zobacz sekcję "Obsługa błędów".

## 5. Przepływ danych

1.  Użytkownik wysyła żądanie `PATCH` na `/api/auth/password` z `currentPassword` i `newPassword` w ciele żądania.
2.  Middleware Astro weryfikuje, czy użytkownik jest uwierzytelniony za pomocą sesji Supabase.
3.  Handler API w `src/pages/api/auth/password.ts` odbiera żądanie.
4.  Dane wejściowe są walidowane za pomocą schematu Zod `UpdatePasswordSchema`. W przypadku niepowodzenia walidacji, zwracany jest błąd 400.
5.  Pobierany jest adres e-mail użytkownika z aktywnej sesji (`context.locals.user.email`).
6.  W celu weryfikacji bieżącego hasła, tworzona jest tymczasowa, niepowiązana z sesją instancja klienta Supabase. Następnie wywoływana jest metoda `supabase.auth.signInWithPassword` z e-mailem użytkownika i `currentPassword`.
7.  Jeśli `signInWithPassword` zwróci błąd (nieprawidłowe hasło), zwracany jest błąd 401.
8.  Jeśli bieżące hasło jest poprawne, wywoływana jest metoda `context.locals.supabase.auth.updateUser({ password: newPassword })` w celu ustawienia nowego hasła dla zalogowanego użytkownika.
9.  Po pomyślnej aktualizacji, zwracany jest status 200 OK z komunikatem o powodzeniu.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie:** Endpoint musi być dostępny tylko dla uwierzytelnionych użytkowników. Dostęp będzie weryfikowany przez middleware Astro sprawdzający sesję Supabase.
- **Autoryzacja:** Użytkownicy mogą zmieniać tylko własne hasło. Jest to zapewnione przez użycie metody `updateUser` na instancji Supabase powiązanej z sesją (`context.locals.supabase`), która operuje w kontekście zalogowanego użytkownika.
- **Walidacja danych wejściowych:** Użycie Zod do walidacji `newPassword` zapewnia, że nowe hasła spełniają wymagania dotyczące złożoności, co utrudnia ataki siłowe.

## 7. Obsługa błędów

- **400 Bad Request:**
  - **Przyczyna:** Ciało żądania jest nieprawidłowe, brakuje wymaganych pól (`currentPassword`, `newPassword`) lub `newPassword` nie spełnia wymagań walidacji.
  - **Odpowiedź:** `{ "errors": { ... } }` (szczegóły błędów walidacji z Zod).
- **401 Unauthorized:**
  - **Przyczyna:** Podane `currentPassword` jest nieprawidłowe.
  - **Odpowiedź:** `{ "error": "Invalid current password" }`.
- **403 Forbidden:**
  - **Przyczyna:** Użytkownik nie jest uwierzytelniony (brak ważnej sesji).
  - **Odpowiedź:** `{ "error": "User is not authenticated" }`.
- **500 Internal Server Error:**
  - **Przyczyna:** Wystąpił nieoczekiwany błąd po stronie serwera, np. problem z komunikacją z usługą Supabase podczas aktualizacji hasła.
  - **Odpowiedź:** `{ "error": "An internal server error occurred" }`.

## 8. Etapy wdrożenia

1.  **Aktualizacja Typów:** Upewnij się, że interfejs `UpdatePasswordCommand` w `src/types.ts` jest zgodny ze specyfikacją (zrobione).
2.  **Utworzenie Schematu Walidacji:** Zdefiniuj schemat `UpdatePasswordSchema` przy użyciu Zod. Można go umieścić w nowym pliku `src/lib/schemas/auth.ts` lub bezpośrednio w pliku trasy API.
3.  **Implementacja Trasy API:**
    - Utwórz plik `src/pages/api/auth/password.ts`.
    - Zaimplementuj w nim handler dla metody `PATCH`.
4.  **Implementacja Handlera:**
    - W handlerze `PATCH`, uzyskaj dostęp do `context.locals` aby sprawdzić sesję użytkownika. Jeśli brak sesji, zwróć 403.
    - Pobierz i zwaliduj ciało żądania przy użyciu `UpdatePasswordSchema`. W przypadku błędu zwróć 400.
    - Pobierz email z `context.locals.user.email`.
    - Utwórz nową, tymczasową instancję klienta Supabase (`createSupabaseServerClient`) do weryfikacji `currentPassword`.
    - Wywołaj `signInWithPassword` z emailem i `currentPassword`. W przypadku błędu zwróć 401.
    - Wywołaj `context.locals.supabase.auth.updateUser({ password: newPassword })`. W przypadku błędu zwróć 500.
    - Jeśli wszystko się powiedzie, zwróć odpowiedź 200 OK z komunikatem sukcesu.
