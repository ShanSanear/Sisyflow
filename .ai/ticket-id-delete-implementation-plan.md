# Plan wdrożenia punktu końcowego API: DELETE /tickets/:id

## 1. Przegląd punktu końcowego

Punkt końcowy DELETE /tickets/:id umożliwia usunięcie zgłoszenia (ticket) z systemu. Operacja jest dostępna wyłącznie dla użytkowników z rolą ADMIN. Po pomyślnym usunięciu zwracany jest status 204 No Content, co oznacza brak treści w odpowiedzi.

## 2. Szczegóły żądania

- **Metoda HTTP:** DELETE
- **Struktura URL:** `/tickets/:id`
  - `:id` - identyfikator ticketu w formacie UUID
- **Parametry:**
  - **Wymagane:**
    - `id` (UUID) - identyfikator ticketu do usunięcia, przekazywany w ścieżce URL
  - **Opcjonalne:** Brak
- **Request Body:** Brak (DELETE request nie zawiera ciała żądania)
- **Nagłówki wymagane:** Authorization header z tokenem JWT dla uwierzytelnienia

## 3. Wykorzystywane typy

Endpoint DELETE /tickets/:id nie wymaga nowych typów DTO ani Command Modele, ponieważ:

- Nie pobiera danych wejściowych w ciele żądania
- Nie zwraca danych w odpowiedzi (204 No Content)
- Wykorzystuje istniejące typy z `src/types.ts`:
  - `Ticket` - typ tabeli bazy danych
  - `Profile` - typ tabeli profili użytkowników (do sprawdzenia roli ADMIN)

## 4. Szczegóły odpowiedzi

- **Sukces (204 No Content):**
  - Brak ciała odpowiedzi
  - Ticket został pomyślnie usunięty z bazy danych
- **Błędy:**
  - **403 Forbidden:** Użytkownik nie posiada roli ADMIN
  - **404 Not Found:** Ticket o podanym ID nie istnieje
  - **401 Unauthorized:** Brak prawidłowego tokenu autoryzacyjnego

## 5. Przepływ danych

1. **Walidacja żądania:** Sprawdzenie poprawności UUID w parametrze `id`
2. **Uwierzytelnienie:** Weryfikacja tokenu JWT i pobranie danych użytkownika z kontekstu
3. **Autoryzacja:** Sprawdzenie czy użytkownik posiada rolę ADMIN poprzez zapytanie do tabeli `profiles`
4. **Weryfikacja istnienia:** Sprawdzenie czy ticket o podanym ID istnieje w tabeli `tickets`
5. **Usunięcie:** Wykonanie operacji DELETE na tabeli `tickets`
6. **Odpowiedź:** Zwrócenie statusu 204 No Content

## 6. Względy bezpieczeństwa

- **Autoryzacja oparta na rolach:** Tylko użytkownicy z rolą ADMIN mogą wykonywać operację usunięcia
- **Walidacja UUID:** Parametr `id` musi być prawidłowym UUID aby zapobiec atakom typu SQL injection
- **Uwierzytelnienie JWT:** Wymagany prawidłowy token JWT w nagłówku Authorization
- **Sprawdzenie własności zasobu:** Przed usunięciem należy upewnić się, że zasób istnieje
- **Audytowanie:** Operacje usunięcia powinny być logowane dla celów bezpieczeństwa i audytu

## 7. Obsługa błędów

- **403 Forbidden:**
  - Przyczyna: Użytkownik nie posiada roli ADMIN
  - Obsługa: Zwrócić komunikat o braku uprawnień bez ujawniania szczegółów systemu
- **404 Not Found:**
  - Przyczyna: Ticket o podanym ID nie istnieje
  - Obsługa: Zwrócić komunikat, że zasób nie został znaleziony
- **401 Unauthorized:**
  - Przyczyna: Brak prawidłowego tokenu JWT lub token wygasł
  - Obsługa: Przekierowanie do ponownego uwierzytelnienia
- **500 Internal Server Error:**
  - Przyczyna: Błędy bazy danych, problemy z połączeniem
  - Obsługa: Zalogować błąd wewnętrznie, zwrócić generyczny komunikat o błędzie serwera

## 8. Rozważania dotyczące wydajności

- **Optymalizacja zapytań:** Wykorzystać pojedyncze zapytanie do sprawdzenia istnienia ticketu i jego usunięcia
- **Indeksy bazy danych:** Upewnić się, że kolumna `id` w tabeli `tickets` posiada indeks
- **Buforowanie:** Operacje usuwania nie wymagają unieważniania cache, ale należy rozważyć wpływ na inne cached dane
- **Limitowanie:** Nie stosować rate limiting dla operacji usuwania, ponieważ są to rzadkie operacje wykonywane przez administratorów

## 9. Etapy wdrożenia

### Etap 1: Przygotowanie struktury plików

1. Sprawdzić strukturę katalogów zgodnie z zasadami projektu
2. Upewnić się, że istnieje katalog `src/lib/services/` dla serwisów
3. Sprawdzić czy istnieje już `ticketService` w `src/lib/services/`

### Etap 2: Implementacja serwisu ticket (jeśli nie istnieje)

1. Utworzyć `src/lib/services/ticketService.ts`
2. Zaimplementować metodę `deleteTicket(id: string, userId: string)`:
   - Sprawdzenie roli użytkownika (ADMIN)
   - Weryfikacja istnienia ticketu
   - Wykonanie usunięcia
   - Obsługa błędów

### Etap 3: Implementacja punktu końcowego API

1. Utworzyć plik `src/pages/api/tickets/[id].ts`
2. Zaimplementować obsługę metody DELETE:
   - Pobranie parametru `id` z URL
   - Walidacja UUID
   - Uwierzytelnienie użytkownika z kontekstu
   - Wywołanie `ticketService.deleteTicket()`
   - Zwrócenie odpowiedniego statusu HTTP

### Etap 4: Dodanie walidacji i middleware

1. Dodać walidację UUID dla parametru `id`
2. Zaimplementować sprawdzanie roli ADMIN
3. Dodać obsługę błędów zgodnie z zasadami clean code
4. Zaimplementować logowanie błędów

### Etap 5: Testowanie i walidacja

1. Napisać testy jednostkowe dla `ticketService.deleteTicket()`
2. Napisać testy integracyjne dla endpointu API
3. Przetestować przypadki błędów (403, 404)
4. Zweryfikować bezpieczeństwo - próba usunięcia przez zwykłego użytkownika
5. Sprawdź logowanie błędów w tabeli `ai_errors` jeśli dotyczy

### Etap 6: Dokumentacja i recenzja kodu

1. Zaktualizować dokumentację API
2. Przeprowadzić code review zgodnie z zasadami clean code
3. Sprawdzić zgodność z zasadami ESLint i TypeScript
4. Zatwierdzić implementację przed wdrożeniem produkcyjnym
