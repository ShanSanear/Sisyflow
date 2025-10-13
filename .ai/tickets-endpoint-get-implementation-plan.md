# Plan Wdrożenia Punktu Końcowego API: GET /tickets

## 1. Przegląd punktu końcowego

Punkt końcowy GET /tickets umożliwia pobieranie listy zgłoszeń (ticketów) z obsługą paginacji, filtrowania i sortowania. Jest to kluczowy endpoint dla systemu zarządzania zgłoszeniami, pozwalający użytkownikom przeglądać tickety z różnymi kryteriami wyszukiwania.

## 2. Szczegóły żądania

- **Metoda HTTP:** GET
- **Struktura URL:** `/tickets`
- **Parametry:**
  - **Wymagane:** Brak
  - **Opcjonalne:**
    - `limit` (number): Liczba wyników na stronę (domyślnie: 10, maksymalnie: 100)
    - `offset` (number): Przesunięcie wyników dla paginacji (domyślnie: 0)
    - `status` (string): Filtr statusu ticketa (OPEN|IN_PROGRESS|CLOSED)
    - `type` (string): Filtr typu ticketa (BUG|IMPROVEMENT|TASK)
    - `assignee_id` (string): UUID przypisanego użytkownika
    - `reporter_id` (string): UUID zgłaszającego użytkownika
    - `sort` (string): Sortowanie wg pola (domyślnie: "created_at desc")

- **Request Body:** Brak

## 3. Wykorzystywane typy

- `TicketDTO`: Reprezentuje pojedynczy ticket w odpowiedzi (zdefiniowany w types.ts)
- `PaginationDTO`: Metadane paginacji (zdefiniowane w types.ts)
- `TicketFilters`: Interfejs dla parametrów filtrowania (do utworzenia)
- `TicketSortOptions`: Typ dla opcji sortowania (do utworzenia)

## 4. Szczegóły odpowiedzi

**Struktura odpowiedzi (200 OK):**

```json
{
  "tickets": [
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
      "reporter": { "username": "string" },
      "assignee": { "username": "string" }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100
  }
}
```

**Kody statusu:**

- `200 OK`: Pomyślne pobranie listy ticketów (nawet pustej)

## 5. Przepływ danych

1. **Walidacja parametrów:** Zod schema waliduje query parameters
2. **Autoryzacja:** Weryfikacja JWT token przez Supabase Auth
3. **Service Layer:** TicketsService.getTickets() wykonuje:
   - Budowanie zapytania Supabase z filtrami
   - JOIN z tabelą profiles dla reporter/assignee
   - Zastosowanie sortowania i paginacji
   - Wykonanie zapytania

4. **Mapowanie danych:** Konwersja wyników bazy na TicketDTO[]
5. **Odpowiedź:** Formatowanie odpowiedzi z paginacją

## 6. Względy bezpieczeństwa

- **Autoryzacja:** Wymagany ważny JWT token Supabase Auth
- **Walidacja wejścia:**
  - UUID format validation dla assignee_id i reporter_id
  - Enum validation dla status i type
  - Range validation dla limit i offset

- **SQL Injection Protection:** Użycie Supabase ORM methods
- **Dostęp do danych:** Użytkownicy mogą przeglądać wszystkie tickety (brak RLS filtrów)

## 7. Obsługa błędów

- **400 Bad Request:** Nieprawidłowe parametry (źle sformatowane UUID, nieprawidłowe enum wartości)
- **401 Unauthorized:** Brak lub nieprawidłowy JWT token
- **500 Internal Server Error:** Błędy bazy danych, niespodziewane wyjątki
- **Logowanie błędów:** Użycie custom error types z odpowiednim kontekstem
- **User-friendly messages:** Przekazywanie zrozumiałych komunikatów błędów

## 8. Rozważania dotyczące wydajności

- **Indeksy bazy danych:** Wykorzystanie indeksów na polach filtrowanych (status, type, reporter_id, assignee_id, created_at)
- **Paginacja:** Cursor-based pagination dla dużych zbiorów danych
- **Limit wyników:** Maksymalny limit 100 wyników na zapytanie

## 9. Etapy wdrożenia

1. **Utworzyć schematy walidacji Zod** dla query parameters w `src/lib/validation/`
2. **Rozszerzyć TicketsService** w `src/lib/services/tickets.service.ts` o metodę `getTickets()`
3. **Utworzyć endpoint API** w `src/pages/api/tickets/index.ts` z Astro Server Endpoint
4. **Dodać middleware autoryzacji** jeśli nie istnieje
5. **Zaimplementować obsługę błędów** z custom error types
6. **Dodać testy jednostkowe** dla service i endpoint
7. **Przetestować integrację** z bazą danych i autoryzacją
8. **Dodać dokumentację API** w formacie OpenAPI/Swagger
