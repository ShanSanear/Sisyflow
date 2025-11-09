# API Endpoint Implementation Plan: GET /tickets/:id

## 1. Przegląd punktu końcowego

Endpoint GET /tickets/:id umożliwia pobranie pojedynczego zgłoszenia (ticketu) wraz z kompletnymi informacjami, włączając dane reportera i przypisanego użytkownika. Jest to operacja tylko do odczytu, która zwraca pełny obiekt ticketu w formacie JSON.

## 2. Szczegóły żądania

- **Metoda HTTP**: GET
- **Struktura URL**: `/tickets/:id`
- **Parametry**:
  - **Wymagane**:
    - `id` (string, UUID) - identyfikator ticketu w ścieżce URL
  - **Opcjonalne**: brak
- **Request Body**: nie dotyczy (żądanie bez ciała)
- **Nagłówki**:
  - `Authorization` (wymagany dla autoryzacji)
  - `Content-Type`: `application/json` (standardowe dla API)

## 3. Wykorzystywane typy

- **FullTicketDTO**: Główny typ odpowiedzi zawierający wszystkie pola ticketu oraz dane reportera i assignee'a
- **Profile**: Typ zawierający dane użytkownika (username) z tabeli profiles
- **Ticket**: Bazowy typ ticketu z tabeli tickets

## 4. Szczegóły odpowiedzi

- **Sukces (200 OK)**:
  - **Content-Type**: `application/json`
  - **Body**: Obiekt `FullTicketDTO` zawierający:
    - `id`, `title`, `description`, `type`, `status`
    - `reporter_id`, `assignee_id`, `ai_enhanced`
    - `created_at`, `updated_at`
    - `reporter`: `{ username }` - dane reportera (opcjonalne, reporter może być pusty jeśli został usunięty)
    - `assignee`: `{ username }` - dane przypisanego użytkownika (opcjonalne)

- **Błędy**:
  - **404 Not Found**: Ticket o podanym ID nie istnieje
  - **400 Bad Request**: Nieprawidłowy format UUID
  - **401 Unauthorized**: Brak autoryzacji dostępu do ticketu
  - **500 Internal Server Error**: Błąd serwera/bazy danych

## 5. Przepływ danych

1. **Walidacja parametru**: Sprawdzenie formatu UUID parametru `:id`
2. **Autoryzacja**: Weryfikacja uprawnień użytkownika do dostępu
3. **Pobranie danych**: Wykonanie zapytania do bazy Supabase z JOIN do tabeli profiles
4. **Transformacja**: Mapowanie wyników na strukturę `FullTicketDTO`
5. **Odpowiedź**: Zwrócenie danych lub odpowiedniego błędu

## 6. Względy bezpieczeństwa

- **Autoryzacja**: Wymagane uwierzytelnienie użytkownika przed dostępem
- **IDOR Protection**: Weryfikacja czy użytkownik ma prawo dostępu do konkretnego ticketu (każdy zalogowany użytkownik ma dostęp do odczytu każdego ticketa)
- **UUID Validation**: Zapobieganie injection poprzez ścisłą walidację formatu ID
- **Rate Limiting**: Rozważenie implementacji limitów zapytań dla endpointu
- **Data Sanitization**: Zapewnienie że wrażliwe dane nie są ujawniane w odpowiedzi

## 7. Obsługa błędów

- **404 Not Found**: Gdy ticket nie istnieje - przyjazny komunikat bez ujawniania szczegółów
- **400 Bad Request**: Dla nieprawidłowego UUID - komunikat "Invalid ticket ID format"
- **401 Unauthorized**: Dla braku dostępu - komunikat "Access denied"
- **500 Internal Server Error**: Dla błędów systemu - ogólny komunikat błędu z logowaniem szczegółów
- **Logging**: Błędy serwera logować w standardowych logach aplikacji

## 8. Rozważania dotyczące wydajności

- **Database Query Optimization**: Użycie pojedynczego zapytania z JOIN zamiast wielu zapytań
- **Response Size**: Minimalizacja danych w odpowiedzi poprzez selektywne pola

## 9. Etapy wdrożenia

1. **Przygotowanie service**: Rozszerzenie `ticketService` o metodę `getTicketById()`
2. **Utworzenie Zod schema**: Schema walidacji dla parametru ID
3. **Implementacja endpointu**: Utworzenie pliku `/src/pages/api/tickets/[id].ts` jeśli nie istnieje
4. **Dodanie autoryzacji**: Implementacja sprawdzenia dostępu w middleware
5. **Obsługa błędów**: Implementacja odpowiednich odpowiedzi błędów
6. **Testowanie**: Testy jednostkowe i integracyjne endpointu
7. **Optymalizacja**: Dodanie indeksów bazodanowych jeśli potrzebne
8. **Dokumentacja**: Aktualizacja dokumentacji API
