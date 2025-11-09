# API Endpoint Implementation Plan: POST /tickets

## 1. Przegląd punktu końcowego

Ten endpoint umożliwia tworzenie nowego ticketu w systemie Sisyflow. Automatycznie przypisuje reporter_id do aktualnie uwierzytelnionego użytkownika. Endpoint zwraca pełny obiekt ticketu wraz z danymi reporter'a i assignee'a.

## 2. Szczegóły żądania

- **Metoda HTTP**: POST
- **Struktura URL**: `/tickets`
- **Parametry**:
  - Wymagane: brak (wszystkie dane w body)
  - Opcjonalne: brak
- **Request Body**:
  ```json
  {
    "title": "string",
    "description": "string?",
    "type": "BUG|IMPROVEMENT|TASK"
  }
  ```

## 3. Wykorzystywane typy

- **CreateTicketCommand**: Typ dla danych wejściowych żądania
- **FullTicketDTO**: Typ dla pełnego obiektu ticket w odpowiedzi
- **Profile**: Typ dla danych użytkownika (reporter/assignee)

## 4. Szczegóły odpowiedzi

- **Success Response** (201 Created):
  ```json
  {
    "id": "uuid",
    "title": "string",
    "description": "string?",
    "type": "BUG|IMPROVEMENT|TASK",
    "status": "OPEN",
    "reporter_id": "uuid",
    "assignee_id": "uuid?",
    "ai_enhanced": false,
    "created_at": "timestamp",
    "updated_at": "timestamp",
    "reporter": {
      "username": "string"
    },
    "assignee": {
      "username": "string"
    }?
  }
  ```
- **Error Responses**:
  - 400 Bad Request: Nieprawidłowe dane wejściowe
  - 401 Unauthorized: Brak uwierzytelnienia

## 5. Przepływ danych

1. **Walidacja uwierzytelnienia**: Sprawdź czy użytkownik jest zalogowany przez Supabase auth
2. **Parsowanie request body**: Odczytaj i sparsuj JSON z request body
3. **Walidacja danych**: Użyj Zod schema do walidacji danych wejściowych
4. **Utworzenie ticket**: Wstaw nowy rekord do tabeli `tickets` z reporter_id ustawionym na aktualnego użytkownika
5. **Pobranie pełnych danych**: Wykonaj JOIN query aby pobrać ticket z danymi reporter'a i assignee'a
6. **Formatowanie odpowiedzi**: Przekształć dane do formatu FullTicketDTO
7. **Zwróć odpowiedź**: HTTP 201 z pełnym obiektem ticket

## 6. Względy bezpieczeństwa

- **Uwierzytelnienie**: Wymagane - użytkownik musi być zalogowany
- **Autoryzacja**: Każdy uwierzytelniony użytkownik może tworzyć tickety
- **Walidacja danych**:
  - Title: 1-200 znaków, zapobieganie SQL injection
  - Description: max 10000 znaków
  - Type: tylko dozwolone wartości enum
- **XSS Prevention**: Sanitizacja danych tekstowych

## 7. Obsługa błędów

- **400 Bad Request**:
  - Title jest pusty lub dłuższy niż 200 znaków
  - Description dłuższa niż 10000 znaków
  - Type nie jest jedną z dozwolonych wartości
  - Nieprawidłowy format JSON w request body
- **401 Unauthorized**:
  - Brak tokenu uwierzytelnienia
  - Nieprawidłowy token
- **500 Internal Server Error**:
  - Błąd połączenia z bazą danych
  - Nieoczekiwany błąd serwera

## 8. Etapy wdrożenia

### Krok 1: Przygotowanie struktury projektu

- Utworzyć katalog `src/lib/services/` jeśli nie istnieje
- Utworzyć katalog `src/pages/api/` jeśli nie istnieje
- Zaktualizować `src/types.ts` jeśli potrzebne nowe typy

### Krok 2: Implementacja walidacji

- Utworzyć Zod schema dla `CreateTicketCommand` w `src/lib/validation/ticket.validation.ts`
- Zaimplementować walidację title (1-200 znaków)
- Zaimplementować walidację description (max 10000 znaków)
- Zaimplementować walidację type (enum values)

### Krok 3: Implementacja TicketService

- Utworzyć `src/lib/services/ticket.service.ts`
- Zaimplementować metodę `createTicket()`:
  - Akceptuje `CreateTicketCommand` i `user_id`
  - Wykonuje walidację danych
  - Tworzy ticket w bazie danych
  - Zwraca `FullTicketDTO`

### Krok 4: Implementacja API endpoint

- Utworzyć `src/pages/api/tickets.ts`
- Ustawić `export const prerender = false`
- Zaimplementować POST handler:
  - Pobrać Supabase client z `context.locals.supabase`
  - Sprawdzić uwierzytelnienie i pobrać user ID
  - Sparsować i zwalidować request body
  - Wywołać `TicketService.createTicket()`
  - Zwrócić HTTP 201 z pełnym ticket obiektem
  - Obsłużyć błędy i zwrócić odpowiednie kody statusu

### Krok 6: Dokumentacja i deployment

- Zaktualizować API documentation
