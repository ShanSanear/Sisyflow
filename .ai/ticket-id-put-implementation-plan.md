# Plan Wdrożenia Punktu Końcowego API: PUT /tickets/:id

## 1. Przegląd punktu końcowego

Endpoint PUT /tickets/:id umożliwia aktualizację istniejącego zgłoszenia (ticket) w systemie. Dostęp do tej funkcjonalności mają wyłącznie reporter zgłoszenia, przypisany użytkownik (assignee) lub administrator (ADMIN). Wszystkie pola w żądaniu są opcjonalne, co pozwala na częściowe aktualizacje. Punkt końcowy zwraca zaktualizowane zgłoszenie po pomyślnej operacji.

## 2. Szczegóły żądania

- **Metoda HTTP**: PUT
- **Struktura URL**: `/tickets/:id`
  - `:id`: UUID identyfikatora zgłoszenia (wymagany parametr ścieżki)
- **Parametry**:
  - **Wymagane**: `id` (UUID zgłoszenia w ścieżce URL)
  - **Opcjonalne**: Brak parametrów zapytania
- **Treść żądania (Request Body)**:
  - Typ zawartości: `application/json`
  - Struktura: Obiekt JSON z opcjonalnymi polami zgodnymi z `UpdateTicketCommand`

    ```json
    {
      "title": "string (opcjonalne, 1-200 znaków)",
      "description": "string (opcjonalne, max 10000 znaków)",
      "type": "ticket_type (opcjonalne)"
    }
    ```

## 3. Wykorzystywane typy

- **Command Model**: `UpdateTicketCommand` (już zdefiniowany w `src/types.ts` jako `Partial<CreateTicketCommand>`)
- **DTO Response**: `FullTicketDTO` dla odpowiedzi zawierającej pełne informacje o zaktualizowanym zgłoszeniu

## 4. Szczegóły odpowiedzi

- **Pomyślna odpowiedź (200 OK)**:
  - Typ zawartości: `application/json`
  - Struktura: Obiekt `FullTicketDTO` zawierający wszystkie szczegóły zaktualizowanego zgłoszenia

    ```json
    {
      "id": "uuid",
      "title": "string",
      "description": "string",
      "type": "ticket_type",
      "status": "ticket_status",
      "reporter_id": "uuid",
      "assignee_id": "uuid | null",
      "ai_enhanced": "boolean",
      "created_at": "timestamp",
      "updated_at": "timestamp",
      "reporter": {"username": "string"},
      "assignee": {"username": "string"} | null
    }
    ```

- **Kody błędów**:
  - `400 Bad Request`: Nieprawidłowe dane wejściowe (np. nieprawidłowy format UUID, naruszenie ograniczeń pola)
  - `403 Forbidden`: Brak uprawnień (użytkownik nie jest reporterem, assigneem ani ADMIN)
  - `404 Not Found`: Zgłoszenie o podanym ID nie istnieje

## 5. Przepływ danych

1. **Walidacja wejściowa**: Użycie schematu Zod do walidacji parametrów ścieżki i treści żądania zgodnie z `UpdateTicketCommand`; wymóg by co najmniej jedno pole zostało wysłane do zmiany
2. **Uwierzytelnianie**: Pobranie użytkownika z kontekstu Supabase (context.locals.supabase)
3. **Autoryzacja**: Sprawdzenie, czy użytkownik jest reporterem zgłoszenia, assigneem lub ma rolę ADMIN
4. **Pobranie danych**: Zapytanie do tabeli `tickets` w Supabase w celu pobrania istniejącego zgłoszenia
5. **Aktualizacja**: Częściowa aktualizacja pól w tabeli `tickets` tylko dla podanych pól (ignorowanie pól null/undefined)
6. **Rejestrowanie**: Aktualizacja pola `updated_at` na aktualny timestamp
7. **Odpowiedź**: Zwrócenie zaktualizowanego zgłoszenia w formacie `FullTicketDTO`

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Wymagane uwierzytelnienie użytkownika poprzez Supabase Auth
- **Autoryzacja**: Kontrola dostępu oparta na rolach:
  - Reporter zgłoszenia może aktualizować
  - Assignee zgłoszenia może aktualizować
  - Użytkownicy z rolą ADMIN mogą aktualizować dowolne zgłoszenia
- **Walidacja danych**:
  - UUID dla parametru :id
  - Ograniczenia długości pól zgodnie ze schematem bazy danych
  - Zabezpieczenie przed SQL injection poprzez użycie Supabase ORM
- **Bezpieczeństwo danych**: Wszystkie dane wrażliwe są obsługiwane przez Supabase z wbudowanymi mechanizmami bezpieczeństwa

## 7. Obsługa błędów

- **400 Bad Request**: Nieprawidłowe dane wejściowe
  - Niepoprawny format UUID dla :id
  - Naruszenie ograniczeń pól (np. title zbyt długi)
  - Nieprawidłowy typ zgłoszenia
- **403 Forbidden**: Brak uprawnień dostępu
- **404 Not Found**: Zgłoszenie nie istnieje
- **500 Internal Server Error**: Błędy serwera (np. problemy z bazą danych)
- **Logging**: Błędy serwera logować w standardowych logach aplikacji

## 8. Rozważania dotyczące wydajności

- **Optymalizacja zapytań**: Użycie pojedynczego zapytania UPDATE w Supabase dla aktualizacji
- **Indeksowanie**: Wykorzystanie istniejących indeksów na polu `id` w tabeli `tickets`
- **Ograniczenia**: Zapewnienie, że aktualizacje nie powodują blokad bazy danych poprzez krótkie transakcje

## 9. Etapy wdrożenia

1. **Przygotowanie środowiska**: Sprawdzenie istniejących typów i schematów Zod w `src/types.ts` oraz `src/validationticket.validation.ts`
2. **Implementacja walidacji**: Utworzenie lub rozszerzenie schematu Zod dla `UpdateTicketCommand` jeśli potrzebne
3. **Tworzenie/rozszerzenie pliku endpoint**: Utworzenie pliku `src/pages/api/tickets/[id].ts` jeśli nie istnieje, lub rozszerzenie istniejącego dla obsługi metody PUT
4. **Implementacja logiki**:
   - Dodanie obsługi PUT w funkcji endpoint
   - Wyodrębnienie logiki do `src/lib/services/ticketService.ts` (utworzenie jeśli nie istnieje)
   - Implementacja sprawdzeń autoryzacji
   - Implementacja aktualizacji w bazie danych
5. **Testowanie**:
   - Testy jednostkowe dla walidacji
   - Testy integracyjne dla pełnego przepływu
   - Testy bezpieczeństwa (autoryzacja)
6. **Dokumentacja**: Aktualizacja dokumentacji API jeśli potrzebne
7. **Wdrożenie**: Przeprowadzenie code review i wdrożenie na środowisku testowym
