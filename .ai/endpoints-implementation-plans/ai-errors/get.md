# API Endpoint Implementation Plan: GET /api/ai-errors

## 1. Przegląd punktu końcowego

Endpoint GET /api/ai-errors udostępnia administratorom paginowaną listę błędów komunikacji z AI. Punkt końcowy pozwala na filtrowanie błędów po identyfikatorze ticketu oraz obsługuje standardową paginację. Dostęp do tego endpointu jest ograniczony wyłącznie do użytkowników z rolą administratora (ADMIN), co zapewnia bezpieczeństwo wrażliwych danych diagnostycznych systemu AI.

## 2. Szczegóły żądania

- **Metoda HTTP:** GET
- **Struktura URL:** `/api/ai-errors`
- **Parametry:**
  - **Wymagane:** Brak
  - **Opcjonalne:**
    - `limit`: liczba błędów na stronę (domyślnie 50, zakres 1-100)
    - `offset`: przesunięcie w wynikach (domyślnie 0, minimum 0)
    - `ticket_id`: UUID ticketu do filtrowania błędów (opcjonalne)
- **Request Body:** Brak

## 3. Wykorzystywane typy

- **AIErrorDTO** (już istnieje w `src/types.ts`): Reprezentuje pojedynczy błąd AI w odpowiedzi
- **PaginationDTO** (już istnieje w `src/types.ts`): Zawiera metadane paginacji
- **GetAIErrorsQueryInput** (do utworzenia): Typ walidacji parametrów query
- **AIErrorsService** (do utworzenia): Serwis biznesowy do obsługi logiki błędów AI

## 4. Szczegóły odpowiedzi

**Sukces (200 OK):**

```json
{
  "errors": [
    {
      "id": "uuid",
      "ticket_id": "uuid",
      "user_id": "uuid",
      "error_message": "string",
      "error_details": {},
      "created_at": "timestamp"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100
  }
}
```

**Błędy:**

- 401 Unauthorized: Brak uwierzytelnienia
- 403 Forbidden: Brak uprawnień administratora
- 400 Bad Request: Nieprawidłowe parametry query
- 500 Internal Server Error: Błąd serwera

## 5. Przepływ danych

1. **Uwierzytelnienie:** Middleware Astro sprawdza token JWT i ustawia `locals.user`
2. **Autoryzacja:** Sprawdzana jest rola użytkownika w tabeli `profiles` (wymagane ADMIN)
3. **Walidacja parametrów:** Parametry query są walidowane przy użyciu schematu Zod
4. **Pobieranie danych:** AIErrorsService wykonuje zapytanie do tabeli `ai_errors` z paginacją
5. **Filtrowanie:** Opcjonalne filtrowanie po `ticket_id` jeśli podane
6. **Formatowanie odpowiedzi:** Dane są mapowane na AIErrorDTO i zwracane z metadanymi paginacji

## 6. Względy bezpieczeństwa

- **Autoryzacja oparta na rolach:** Dostęp ograniczony wyłącznie do użytkowników z rolą ADMIN
- **Walidacja wejścia:** Wszystkie parametry query są rygorystycznie walidowane przy użyciu Zod
- **Zabezpieczenie przed injection:** UUID walidacja dla `ticket_id` zapobiega SQL injection
- **Ochrona wrażliwych danych:** Endpoint nie ujawnia wrażliwych danych uwierzytelniających
- **Rate limiting:** Rekomendowane zastosowanie rate limiting dla endpointów administracyjnych
- **Logowanie dostępu:** Wszystkie próby dostępu są logowane dla celów audytu

## 7. Obsługa błędów

- **401 Unauthorized:** Użytkownik nie jest uwierzytelniony
- **403 Forbidden:** Użytkownik nie ma roli administratora lub profil nie istnieje
- **400 Bad Request:** Nieprawidłowe parametry query (limit/offset poza zakresem, nieprawidłowy UUID ticket_id)
- **500 Internal Server Error:** Błędy połączenia z bazą danych lub nieoczekiwane błędy serwera

Wszystkie błędy są logowane w konsoli serwera z odpowiednim kontekstem dla debugowania.

## 8. Rozważania dotyczące wydajności

- **Indeksy bazy danych:** Wykorzystanie istniejących indeksów `idx_ai_errors_ticket_id` i `idx_ai_errors_user_id`
- **Paginacja:** Efektywne pobieranie danych z LIMIT/OFFSET
- **Filtrowanie:** Opcjonalne filtrowanie po ticket_id dla lepszej wydajności
- **Sortowanie:** Wyniki sortowane malejąco po `created_at` dla najnowszych błędów
- **Optymalizacja zapytań:** JOIN tylko z niezbędnymi tabelami (tickets, profiles jeśli potrzebne)

## 9. Etapy wdrożenia

1. **Utworzenie schematu walidacji** (`src/lib/validation/schemas/ai-errors.ts`):
   - Schemat dla parametrów query (limit, offset, ticket_id)
   - Walidacja zakresów wartości i formatów UUID

2. **Implementacja serwisu AI Errors** (`src/lib/services/ai-errors.service.ts`):
   - Klasa AIErrorsService z metodą `getAIErrorsPaginated`
   - Obsługa paginacji i filtrowania
   - Klasy błędów specyficznych dla tego serwisu

3. **Utworzenie endpointu API** (`src/pages/api/ai-errors/index.ts`):
   - Implementacja GET handler z autoryzacją administratora
   - Walidacja parametrów query
   - Obsługa błędów i formatowanie odpowiedzi
   - Ustawienie `export const prerender = false`

4. **Testowanie endpointu**:
   - Testy funkcjonalne z różnymi parametrami
   - Testy autoryzacji i bezpieczeństwa
   - Testy przypadków błędnych
   - Weryfikacja struktury odpowiedzi

5. **Optymalizacja i dokumentacja**:
   - Dodanie komentarzy JSDoc
   - Aktualizacja dokumentacji API jeśli istnieje
   - Optymalizacja zapytań jeśli potrzebne
