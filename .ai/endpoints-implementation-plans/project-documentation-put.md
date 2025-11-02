# API Endpoint Implementation Plan: PUT /api/project-documentation

## 1. Przegląd punktu końcowego

Ten endpoint pozwala administratorom na aktualizację dokumentacji projektu używanej jako kontekst dla AI. Endpoint obsługuje tylko jeden rekord dokumentacji projektu, co upraszcza logikę MVP. Dostęp jest ograniczony wyłącznie do użytkowników z rolą ADMIN.

## 2. Szczegóły żądania

- **Metoda HTTP**: PUT
- **Struktura URL**: `/api/project-documentation`
- **Parametry**:
  - Wymagane: Brak parametrów URL ani query
  - Opcjonalne: Brak
- **Request Body**:

  ```json
  {
    "content": "string"
  }
  ```

  - `content`: Wymagany string zawierający nową treść dokumentacji projektu
  - Walidacja: Długość content musi wynosić od 1 do 20000 znaków

## 3. Wykorzystywane typy

- **Request DTO**: `UpdateProjectDocumentationCommand` (z `src/types.ts`)
  ```typescript
  interface UpdateProjectDocumentationCommand {
    content: string;
  }
  ```
- **Response DTO**: `ProjectDocumentationDTO` (z `src/types.ts`)
  ```typescript
  type ProjectDocumentationDTO = Pick<ProjectDocumentation, "id" | "content" | "updated_at" | "updated_by"> & {
    updated_by?: Pick<Profile, "username">;
  };
  ```
- **Database Types**: Korzystanie z typów z `src/db/database.types.ts` dla tabeli `project_documentation`

## 4. Szczegóły odpowiedzi

- **Success Response** (200 OK):
  ```json
  {
    "id": "uuid",
    "content": "zaktualizowana treść dokumentacji",
    "updated_at": "2025-11-02T12:00:00Z",
    "updated_by": "nazwa_użytkownika_administratora"
  }
  ```
- **Error Responses**:
  - 400 Bad Request: Nieprawidłowe dane wejściowe (np. pusty content, za długi content, nieprawidłowy typ)
  - 403 Forbidden: Użytkownik nie ma roli ADMIN
  - 401 Unauthorized: Brak uwierzytelnienia
  - 500 Internal Server Error: Błędy po stronie serwera (baza danych, itp.)

## 5. Przepływ danych

1. **Uwierzytelnienie**: Sprawdzenie tokenu Supabase w middleware Astro
2. **Autoryzacja**: Weryfikacja roli użytkownika jako ADMIN poprzez funkcję `is_admin()` w Supabase
3. **Walidacja**: Parsowanie i walidacja request body przy użyciu Zod schema
4. **Logika biznesowa**: Wywołanie service do aktualizacji rekordu w tabeli `project_documentation`
5. **Baza danych**: Aktualizacja pojedynczego rekordu (upsert, ponieważ tabela zawiera tylko jeden rekord)
6. **Odpowiedź**: Zwrócenie zaktualizowanych danych wraz z informacjami o użytkowniku, który wykonał aktualizację

## 6. Względy bezpieczeństwa

- **Uwierzytelnienie**: Wymagane przez Supabase Auth - endpoint dostępny tylko dla zalogowanych użytkowników
- **Autoryzacja**: Sprawdzenie roli ADMIN przed wykonaniem operacji - używanie funkcji `is_admin()` z Supabase
- **Walidacja danych**: Ścisła walidacja długości content (1-20000 znaków) zapobiega atakom typu DoS
- **SQL Injection**: Chronione przez Supabase SDK i typowane zapytania
- **Audit Logging**: Każda aktualizacja zapisuje `updated_by` i `updated_at` dla śledzenia zmian poprzez istniejące triggery

## 7. Obsługa błędów

- **400 Bad Request**:
  - Content nie jest stringiem
  - Content jest pusty lub dłuższy niż 20000 znaków
  - Nieprawidłowa struktura JSON
- **403 Forbidden**:
  - Użytkownik nie ma roli ADMIN
- **401 Unauthorized**:
  - Brak ważnego tokenu uwierzytelnienia
- **500 Internal Server Error**:
  - Błędy połączenia z bazą danych
  - Nieoczekiwane błędy w logice aplikacji
- **Strategia obsługi**: Wszystkie błędy są logowane, zwracane są user-friendly komunikaty błędów w języku angielskim bez szczegółów technicznych

## 8. Rozważania dotyczące wydajności

- **Operacja bazodanowa**: Prosta aktualizacja pojedynczego rekordu - niska złożoność
- **Walidacja**: Szybka walidacja Zod po stronie serwera
- **Caching**: Brak potrzeby cache'owania dla operacji zapisu
- **Optymalizacja**: Ponieważ tabela zawiera tylko jeden rekord, można rozważyć używanie stałego ID zamiast wyszukiwania

## 9. Etapy wdrożenia

1. **Przygotowanie środowiska**:
   - Upewnić się, że katalogi `src/lib/services` i `src/pages/api` istnieją
   - Sprawdzić dostępność typów w `src/types.ts` i `src/db/database.types.ts`

2. **Utworzenie walidacji**:
   - Dodać schema Zod w `src/lib/validation/projectDocumentation.validation.ts`
   - Schemat powinien walidować `content` jako string o długości 1-20000

3. **Implementacja service**:
   - Utworzyć `src/lib/services/projectDocumentation.service.ts`
   - Zaimplementować funkcję `updateProjectDocumentation` z walidacją roli i aktualizacją bazy danych
   - Użyć `supabase` z `context.locals` zgodnie z zasadami backend

4. **Implementacja endpointu API**:
   - Utworzyć `src/pages/api/project-documentation.ts` (bez rozszerzenia dla Astro)
   - Użyć `export const prerender = false`
   - Zaimplementować handler PUT z wywołaniem service
   - Dodać odpowiednie nagłówki CORS i content-type

5. **Dodanie middleware**:
   - Upewnić się, że middleware w `src/middleware/index.ts` obsługuje uwierzytelnienie
   - Dodać sprawdzenie roli w service lub middleware

6. **Dokumentacja i recenzja**:
   - Zaktualizować dokumentację API
   - Przeprowadzić code review zgodnie z zasadami linting i formatowania
   - Uruchomić `npm run lint:fix` i `npm run format`
