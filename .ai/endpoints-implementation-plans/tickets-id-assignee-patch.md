# Plan Wdrożenia Punktu Końcowego API: PATCH `/tickets/:id/assignee`

## 1. Przegląd punktu końcowego

Punkt końcowy `PATCH /tickets/:id/assignee` umożliwia przypisywanie lub odprzypisywanie użytkownika do zgłoszenia (ticketu). Operacja ta może być wykonana przez samego użytkownika (self-assignment) lub przez administratora systemu. Głównym celem jest zarządzanie odpowiedzialnością za tickety w systemie zarządzania zgłoszeniami.

## 2. Szczegóły żądania

- **Metoda HTTP**: PATCH
- **Struktura URL**: `/api/tickets/:id/assignee`
  - `id`: UUID identyfikatora ticketu (wymagany)
- **Parametry**:
  - **Wymagane**: `id` (UUID ticketu w ścieżce URL)
  - **Opcjonalne**: brak (parametry query nie są używane)
- **Request Body**: `UpdateTicketAssigneeCommand`

  ```json
  {
    "assignee_id": "uuid | null"
  }
  ```

  - `assignee_id`: UUID nowego przypisanego użytkownika lub `null` dla odprzypisania

## 3. Wykorzystywane typy

- **Request**: `UpdateTicketAssigneeCommand`

  ```typescript
  export interface UpdateTicketAssigneeCommand {
    assignee_id: Ticket["assignee_id"]; // UUID | null
  }
  ```

- **Response**: `TicketDTO` (zaktualizowany ticket)
  ```typescript
  export type TicketDTO = Pick<
    Ticket,
    | "id"
    | "title"
    | "description"
    | "type"
    | "status"
    | "reporter_id"
    | "assignee_id"
    | "ai_enhanced"
    | "created_at"
    | "updated_at"
  > & {
    reporter: Pick<Profile, "username">;
    assignee?: Pick<Profile, "username">;
  };
  ```

## 4. Szczegóły odpowiedzi

- **Status Code**: 200 OK
- **Content-Type**: application/json
- **Response Body**: Pełny obiekt `TicketDTO` ze zaktualizowanymi danymi przypisania

**Przykładowa odpowiedź sukcesu**:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Fix login bug",
  "description": "Users cannot log in after password reset",
  "type": "BUG",
  "status": "OPEN",
  "reporter_id": "550e8400-e29b-41d4-a716-446655440001",
  "assignee_id": "550e8400-e29b-41d4-a716-446655440002",
  "ai_enhanced": false,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T11:00:00Z",
  "reporter": {
    "username": "john_doe"
  },
  "assignee": {
    "username": "jane_smith"
  }
}
```

## 5. Przepływ danych

1. **Walidacja parametrów URL**: Sprawdzenie formatu UUID dla `id` ticketu
2. **Autentykacja**: Pobranie ID aktualnego użytkownika (w fazie developmentu - stała wartość)
3. **Parsowanie request body**: Deserializacja JSON do `UpdateTicketAssigneeCommand`
4. **Walidacja biznesowa**: Sprawdzenie uprawnień i istnienia zasobów
5. **Aktualizacja bazy danych**: Wykonanie UPDATE na tabeli `tickets`
6. **Pobranie pełnych danych**: JOIN z tabelami `profiles` dla reporter'a i assignee'a
7. **Formatowanie odpowiedzi**: Mapowanie na strukturę `TicketDTO`

## 6. Względy bezpieczeństwa

- **Autentykacja**: Użytkownik musi być zalogowany (w fazie developmentu używany jest stały identyfikator)
- **Autoryzacja**: Operacja dozwolona tylko dla:
  - Administratorów systemu (rola `ADMIN`)
  - Użytkownika dokonującego self-assignment (`assignee_id` równa się ID aktualnego użytkownika)
- **Walidacja danych wejściowych**:
  - UUID format dla wszystkich identyfikatorów
  - Sprawdzenie istnienia ticketu
  - Sprawdzenie istnienia nowego assignee'a (jeśli nie jest `null`)
- **Ochrona przed SQL injection**: Użycie przygotowanych zapytań Supabase z parametrami
- **Walidacja uprawnień**: Sprawdzenie roli użytkownika w tabeli `profiles`

## 7. Obsługa błędów

- **400 Bad Request**: Nieprawidłowy format danych wejściowych
  - Nieprawidłowy JSON w request body
  - Nieprawidłowy format UUID dla `id` lub `assignee_id`
  - `assignee_id` wskazuje na nieistniejącego użytkownika

- **401 Unauthorized**: Brak autentykacji
  - Użytkownik nie jest zalogowany (gdy autentykacja będzie zaimplementowana)
  - Brak profilu użytkownika w systemie

- **403 Forbidden**: Brak uprawnień do wykonania operacji
  - Użytkownik nie jest administratorem ani nie dokonuje self-assignment
  - Próba zmiany przypisania ticketu bez odpowiednich uprawnień

- **404 Not Found**: Zasób nie został znaleziony
  - Ticket o podanym `id` nie istnieje
  - Użytkownik wskazany w `assignee_id` nie istnieje w systemie

- **500 Internal Server Error**: Błędy po stronie serwera
  - Błędy połączenia z bazą danych
  - Nieoczekiwane błędy podczas przetwarzania

## 8. Rozważania dotyczące wydajności

- **Optymalizacja zapytań**: Użycie pojedynczego UPDATE dla zmiany `assignee_id`
- **Minimalne JOIN**: Pobranie pełnych danych ticketu tylko po pomyślnej aktualizacji
- **Indeksy bazy danych**: Wykorzystanie istniejących indeksów na kolumnach `id` w tabelach `tickets` i `profiles`

## 9. Etapy wdrożenia

### Etap 1: Dodanie schematu walidacji

- Dodać `updateTicketAssigneeSchema` w `src/lib/validation/ticket.validation.ts`
- Schemat powinien walidować format UUID dla `assignee_id` (opcjonalnie null)

### Etap 2: Rozszerzenie TicketService

- Dodać metodę `updateTicketAssignee` w `src/lib/services/ticket.service.ts`
- Zaimplementować logikę sprawdzania uprawnień (ADMIN lub self-assignment)
- Dodać walidację istnienia ticketu i potencjalnego assignee'a
- Zaimplementować atomową aktualizację w bazie danych

### Etap 3: Utworzenie punktu końcowego API

- Utworzyć plik `src/pages/api/tickets/[id]/assignee.ts`
- Zaimplementować handler PATCH zgodnie ze wzorcem z istniejącego `status.ts`
- Dodać odpowiednie nagłówki i obsługę błędów
- Użyć `export const prerender = false`

### Etap 4: Testowanie

- Przetestować wszystkie scenariusze sukcesu i błędów
- Zweryfikować poprawność walidacji danych wejściowych
- Sprawdzić obsługę różnych ról użytkowników (user, admin)
- Walidacja odpowiedzi API zgodnie ze specyfikacją `TicketDTO`

### Etap 5: Dokumentacja

- Zaktualizować dokumentację API endpointu
- Dodać przykłady użycia i odpowiedzi błędów
- Udokumentować wymagania autoryzacyjne
