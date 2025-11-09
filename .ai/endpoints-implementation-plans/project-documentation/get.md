# API Endpoint Implementation Plan: GET /api/project-documentation

## 1. Przegląd punktu końcowego

Endpoint GET `/api/project-documentation` służy do pobierania dokumentacji projektu używanej jako kontekst dla funkcji AI. Zgodnie ze specyfikacją bazy danych, tabela `project_documentation` zawiera tylko jeden rekord, co upraszcza implementację. Endpoint zwraca informacje o dokumentacji wraz z danymi użytkownika, który ostatnio ją zaktualizował.

## 2. Szczegóły żądania

- **Metoda HTTP**: GET
- **Struktura URL**: `/api/project-documentation`
- **Parametry**:
  - **Wymagane**: Brak
  - **Opcjonalne**: Brak
- **Request Body**: Brak (endpoint GET bez ciała żądania)

## 3. Szczegóły odpowiedzi

**Format odpowiedzi dla statusu 200 OK:**

```json
{
  "id": "uuid",
  "content": "string",
  "updated_at": "timestamp",
  "updated_by": {
    "username": "string"
  }
}
```

**Typy danych wyjściowe:**

- Wykorzystuje istniejący typ `ProjectDocumentationDTO` zdefiniowany w `src/types.ts`
- Wszystkie pola są wymagane w odpowiedzi
- Pole `updated_by` zawiera obiekt z polem `username` typu string

## 4. Przepływ danych

1. **Uwierzytelnienie**: Middleware sprawdza obecność tokenu JWT w nagłówku Authorization
2. **Autoryzacja**: Tylko administrator ma dostęp do tego endpointu (RLS Policies)
3. **Pobieranie danych**: Service wykonuje zapytanie do tabeli `project_documentation` z JOIN do `profiles`
4. **Formatowanie**: Dane są mapowane na `ProjectDocumentationDTO`
5. **Odpowiedź**: Zwrócenie sformatowanych danych z kodem 200

## 5. Względy bezpieczeństwa

- **Uwierzytelnienie**: Wymagane - endpoint dostępny tylko dla zalogowanych użytkowników
- **Autoryzacja**: Tylko administrator może czytać ten endpoint
- **RLS**: Polityki Row-Level Security zapewniają bezpieczeństwo na poziomie bazy danych
- **Injection Protection**: Brak parametrów wejściowych zmniejsza ryzyko ataków injection

## 6. Obsługa błędów

**Potencjalne scenariusze błędów:**

- **401 Unauthorized**: Brak prawidłowego tokenu uwierzytelniania
  ```json
  {
    "error": "Unauthorized",
    "message": "Authentication required"
  }
  ```
- **403 Forbidden**: Użytkownik nie jest administratorem

  ```json
  {
    "error": "Forbidden",
    "message": "User is not an admin"
  }
  ```

- **500 Internal Server Error**: Błąd połączenia z bazą danych lub niespodziewany błąd
  ```json
  {
    "error": "Internal Server Error",
    "message": "Failed to fetch project documentation"
  }
  ```

**Strategia obsługi błędów:**

- Używa istniejących funkcji pomocniczych z `src/lib/utils.ts`
- Loguje błędy do konsoli dla celów debugowania
- Zwraca przyjazne komunikaty błędów w języku angielskim bez ujawniania szczegółów implementacji

## 7. Rozważania dotyczące wydajności

- **Optymalizacja zapytań**: Wykorzystuje pojedyncze zapytanie z JOIN zamiast wielu zapytań
- **Indeksy**: Korzysta z istniejących indeksów na kluczach obcych (`updated_by`)

## 8. Etapy wdrożenia

### Krok 1: Utworzenie ProjectDocumentationService

- Utworzyć plik `src/lib/services/projectDocumentation.service.ts`
- Zaimplementować klasę `ProjectDocumentationService` z metodą `getProjectDocumentation()`
- Dodać odpowiednie error handling zgodnie ze wzorcem `TicketService`
- Użyć `createSupabaseServerInstance` do tworzenia klienta Supabase

### Krok 2: Utworzenie API Route

- Utworzyć plik `src/pages/api/project-documentation.ts`
- Zaimplementować handler `GET` zgodnie ze wzorcem z `tickets.ts`
- Dodać sprawdzenie uwierzytelnienia przez `locals.user`
- Użyć `ProjectDocumentationService` do pobrania danych
- Zwrócić odpowiedź z kodem 200 i danymi w formacie JSON

### Krok 3: Dodanie funkcji fabrycznej

- Dodać funkcję `createProjectDocumentationService` na końcu pliku service
- Zapewnić spójność z wzorcem innych serwisów w aplikacji

### Krok 4: Testowanie implementacji

- Uruchomić `npm run lint:fix` i `npm run format` dla sprawdzenia jakości kodu
- Przetestować endpoint z różnymi scenariuszami uwierzytelnienia
- Zweryfikować format odpowiedzi zgodny ze specyfikacją API
- Sprawdzić obsługę błędów dla przypadków bez uwierzytelnienia
