# API Endpoint Implementation Plan: DELETE /api/users/:id

## 1. Przegląd punktu końcowego

Endpoint DELETE `/api/users/:id` umożliwia administratorom usunięcie użytkownika z systemu. Operacja jest nieodwracalna i obejmuje usunięcie rekordu zarówno z tabeli `auth.users` (zarządzanej przez Supabase Auth), jak i powiązanej tabeli `profiles` (przez cascade delete). Endpoint zapewnia bezpieczeństwo poprzez sprawdzenie roli administratora oraz zabronienie użytkownikowi usunięcia samego siebie. Jeśli usunięty użytkownik był reporterem lub assignee w ticketach, odpowiednie pola zostaną automatycznie ustawione na `null`.

## 2. Szczegóły żądania

- **Metoda HTTP**: DELETE
- **Struktura URL**: `/api/users/:id`
- **Parametry**:
  - **Wymagane**: `id` (UUID) - identyfikator użytkownika do usunięcia, przekazany w ścieżce URL
  - **Opcjonalne**: brak
- **Request Body**: Brak (DELETE request nie zawiera ciała żądania)

## 3. Szczegóły odpowiedzi

- **Sukces**: 204 No Content - użytkownik został pomyślnie usunięty
- **Błędy**:
  - 400 Bad Request - nieprawidłowy format UUID w parametrze `id`
  - 401 Unauthorized - brak aktywnej sesji użytkownika
  - 403 Forbidden - użytkownik nie ma roli administratora lub próbuje usunąć samego siebie
  - 404 Not Found - użytkownik o podanym ID nie istnieje
  - 500 Internal Server Error - błąd serwera lub bazy danych

## 4. Przepływ danych

1. **Walidacja parametrów**: Sprawdzenie formatu UUID dla parametru `id` przy użyciu schematu Zod
2. **Autoryzacja**: Weryfikacja aktywnej sesji użytkownika przez middleware
3. **Pobranie roli**: Pobieranie roli użytkownika z tabeli `profiles` w bazie danych
4. **Sprawdzenie uprawnień**: Weryfikacja czy użytkownik ma rolę `ADMIN` oraz czy nie próbuje usunąć samego siebie
5. **Sprawdzenie istnienia**: Weryfikacja czy użytkownik o podanym ID istnieje
6. **Usunięcie użytkownika**: Wywołanie metody `admin.deleteUser()` z Supabase Auth SDK, co automatycznie usuwa rekord z `auth.users` i powiązaną tabelę `profiles` przez cascade delete
7. **Aktualizacja ticketów**: Automatyczna aktualizacja ticketów gdzie usunięty użytkownik był reporterem lub assignee (pola `reporter_id` i `assignee_id` ustawiane na `null`)

## 5. Względy bezpieczeństwa

- **Autoryzacja**: Wymagana aktywna sesja użytkownika, weryfikowana przez middleware
- **Autoryzacja**: Sprawdzenie roli `ADMIN` przed wykonaniem operacji
- **Ochrona przed self-delete**: Zabrania użytkownikowi usunięcia własnego konta
- **Walidacja wejścia**: Sprawdzanie formatu UUID dla parametru `id` przy użyciu schematu Zod
- **Ochrona przed SQL injection**: Użycie parametrów przygotowanych w Supabase SDK
- **Audyt**: Logowanie wszystkich prób usunięcia użytkowników dla celów bezpieczeństwa

## 6. Obsługa błędów

- **400 Bad Request**: Nieprawidłowy format UUID - obsługiwane przez schemat Zod z odpowiednim komunikatem błędu
- **401 Unauthorized**: Brak sesji - obsługiwane przez middleware, przekierowanie do strony logowania
- **403 Forbidden**: Brak roli ADMIN lub próba self-delete - szczegółowy komunikat wyjaśniający przyczynę odmowy
- **404 Not Found**: Użytkownik nie istnieje - sprawdzane przed próbą usunięcia
- **500 Internal Server Error**: Błędy bazy danych lub nieoczekiwane wyjątki - logowanie błędów do konsoli, ogólny komunikat dla użytkownika
- Wszystkie błędy zwracane są w formacie JSON z polami `error` i `message`

## 7. Rozważania dotyczące wydajności

- **Operacja bazodanowa**: Pojedyncze wywołanie `admin.deleteUser()` Supabase, które obsługuje cascade delete
- **Transakcyjność**: Operacja jest atomowa - albo się powiedzie całkowicie, albo zostanie cofnięta
- **Optymalizacja**: Brak dodatkowych zapytań optymalizacyjnych potrzebnych dla tej operacji
- **Odpowiedź**: Lekka odpowiedź 204 No Content bez treści dla szybkiego przetwarzania

## 8. Etapy wdrożenia

1. **Napraw middleware autoryzacji** - zaktualizuj `src/middleware/index.ts` aby pobierać rolę użytkownika z tabeli `profiles` zamiast hardcoded wartości jeśli ten problem dalej występuje
2. **Utwórz schemat walidacji** - dodaj schemat Zod dla parametrów zawierających user ID w `src/lib/validation/user.validation.ts`
3. **Stwórz UserService** - utwórz nowy serwis `src/lib/services/user.service.ts` (jeśli nie istnieje) a następnie utwórz metodę `deleteUser()` implementującą logikę biznesową
4. **Zaimplementuj endpoint** - utwórz plik `src/pages/api/users/[id].ts` (jeśli nie istnieje) a następnie dodaj obsługę DELETE zgodnie z wzorcem innych endpointów
5. **Przetestuj implementację** - zweryfikuj wszystkie scenariusze błędów i sukcesu, włącznie z przypadkiem cascade delete dla ticketów
