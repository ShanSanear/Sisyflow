# API Endpoint Implementation Plan: PATCH /tickets/:id/status

## 1. Przegląd punktu końcowego

Punkt końcowy PATCH /tickets/:id/status umożliwia aktualizację statusu istniejącego ticketu w systemie. Jest przeznaczony głównie dla operacji drag & drop w interfejsie użytkownika, gdzie użytkownicy mogą zmieniać status ticketów między kolumnami Kanban. Dostęp do tej operacji mają wyłącznie: reporter ticketu, przypisany użytkownik (assignee) lub administrator systemu.

## 2. Szczegóły żądania

- **Metoda HTTP:** PATCH
- **Struktura URL:** `/tickets/:id/status`
- **Parametry:**
  - **Wymagane:**
    - `id` (string, URL parameter): UUID istniejącego ticketu
  - **Opcjonalne:** Brak
- **Request Body:**
  ```json
  {
    "status": "OPEN|IN_PROGRESS|CLOSED"
  }
  ```

## 3. Wykorzystywane typy

- **UpdateTicketStatusCommand**: Typ dla danych wejściowych żądania (już zdefiniowany w types.ts)
- **TicketDTO**: Typ dla zaktualizowanego ticketu w odpowiedzi (już zdefiniowany w types.ts)
- **Profile**: Typ dla danych użytkownika przy autoryzacji (już zdefiniowany w types.ts)

## 4. Szczegóły odpowiedzi

**Struktura odpowiedzi (200 OK):**

```json
{
  "id": "uuid",
  "title": "string",
  "description": "string",
  "type": "string",
  "status": "string",
  "reporter_id": "uuid",
  "assignee_id": "uuid",
  "ai_enhanced": boolean,
  "created_at": "timestamp",
  "updated_at": "timestamp",
  "reporter": {
    "username": "string"
  },
  "assignee": {
    "username": "string"
  }
}
```

**Kody statusu:**

- `200 OK`: Pomyślna aktualizacja statusu ticketu
- `400 Bad Request`: Nieprawidłowe dane wejściowe lub format JSON
- `401 Unauthorized`: Brak uwierzytelnienia użytkownika
- `403 Forbidden`: Użytkownik nie ma uprawnień do zmiany statusu tego ticketu
- `404 Not Found`: Ticket o podanym ID nie istnieje
- `500 Internal Server Error`: Błąd serwera lub bazy danych

## 5. Przepływ danych

1. **Walidacja uwierzytelnienia:** Weryfikacja JWT token przez Supabase Auth
2. **Parsowanie parametrów URL:** Ekstrakcja i walidacja UUID ticket ID
3. **Parsowanie request body:** Odczyt i sparsowanie JSON z request body
4. **Walidacja danych:** Użycie Zod schema do walidacji statusu
5. **Sprawdzenie istnienia ticketu:** Weryfikacja czy ticket istnieje w bazie danych
6. **Autoryzacja:** Sprawdzenie czy użytkownik ma uprawnienia (reporter/assignee/ADMIN)
7. **Aktualizacja statusu:** Wykonanie UPDATE query w tabeli tickets
8. **Pobranie zaktualizowanych danych:** JOIN query aby pobrać pełny ticket z danymi reporter'a i assignee'a
9. **Formatowanie odpowiedzi:** Przekształcenie danych do formatu TicketDTO
10. **Zwróć odpowiedź:** HTTP 200 z zaktualizowanym obiektem ticket

## 6. Względy bezpieczeństwa

- **Uwierzytelnienie:** Wymagany ważny JWT token Supabase Auth
- **Autoryzacja:** Tylko reporter ticketu, assignee lub użytkownik z rolą ADMIN może zmienić status
- **Walidacja danych:**
  - Status: tylko dozwolone wartości enum ("OPEN", "IN_PROGRESS", "CLOSED")
  - ID: prawidłowy UUID format
- **SQL Injection Protection:** Użycie Supabase ORM methods
- **XSS Prevention:** Brak bezpośredniego wprowadzania danych tekstowych od użytkownika

## 7. Obsługa błędów

- **400 Bad Request:**
  - Status nie jest jedną z dozwolonych wartości ("OPEN", "IN_PROGRESS", "CLOSED")
  - Nieprawidłowy format JSON w request body
  - Brak wymaganych pól w request body
- **401 Unauthorized:**
  - Brak tokenu uwierzytelnienia
  - Nieprawidłowy lub wygasły token
- **403 Forbidden:**
  - Użytkownik nie jest reporter'em ticketu
  - Użytkownik nie jest assignee'em ticketu
  - Użytkownik nie ma roli ADMIN
- **404 Not Found:**
  - Ticket o podanym ID nie istnieje w systemie
- **500 Internal Server Error:**
  - Błąd połączenia z bazą danych
  - Nieoczekiwany błąd podczas aktualizacji
  - Błąd podczas pobierania zaktualizowanych danych

Wszystkie błędy są logowane z odpowiednim kontekstem, a użytkownikom przekazywane są przyjazne komunikaty błędów.

## 8. Rozważania dotyczące wydajności

- **Optymalizacja zapytań:** Użycie pojedynczego UPDATE query zamiast SELECT + UPDATE - TODO

## 9. Etapy wdrożenia

### Krok 1: Przygotowanie walidacji

1. Dodać schemat Zod dla `UpdateTicketStatusCommand` w `src/lib/validation/ticket.validation.ts`
2. Zaimplementować walidację status enum ("OPEN", "IN_PROGRESS", "CLOSED")
3. Dodać schemat walidacji dla URL parameter :id (UUID)

### Krok 2: Rozszerzenie TicketService

1. Dodać metodę `updateTicketStatus()` do klasy `TicketService` w `src/lib/services/ticket.service.ts`
2. Zaimplementować logikę autoryzacji (sprawdzenie reporter_id, assignee_id, role ADMIN)
3. Dodać atomową operację: sprawdzenie uprawnień + aktualizacja statusu + pobranie wyniku
4. Obsłużyć błędy bazy danych i przekształcić na przyjazne komunikaty

### Krok 3: Implementacja API endpoint

1. Dodać obsługę metody PATCH w istniejącym pliku `src/pages/api/tickets.ts`
2. Utworzyć nowy route handler dla ścieżki `/tickets/:id/status`
3. Zaimplementować:
   - Ekstrakcja i walidacja parametru :id z URL
   - Parsowanie i walidacja request body
   - Wywołanie `TicketService.updateTicketStatus()`
   - Obsługa wszystkich kodów błędów (403, 404, etc.)
   - Zwrócenie HTTP 200 z zaktualizowanym ticket

### Krok 4: Testowanie i walidacja

1. Dodać testy jednostkowe dla nowej metody `updateTicketStatus()`
2. Przetestować scenariusze:
   - Pomyślna zmiana statusu przez reporter'a
   - Pomyślna zmiana statusu przez assignee'a
   - Pomyślna zmiana statusu przez ADMIN'a
   - Próba zmiany przez nieupoważnionego użytkownika (403)
   - Próba zmiany nieistniejącego ticketu (404)
   - Nieprawidłowe dane wejściowe (400)
3. Przetestować integrację z istniejącymi endpoint'ami

### Krok 5: Dokumentacja i deployment

1. Zaktualizować dokumentację API z nowym endpoint'em
2. Dodać przykłady użycia w dokumentacji
3. Wdrożyć na środowisko testowe i przeprowadzić testy akceptacyjne
