# API Endpoint Implementation Plan: GET /api/users

## 1. Przegląd punktu końcowego

Endpoint GET /api/users zwraca paginowaną listę wszystkich użytkowników systemu. Jest dostępny wyłącznie dla użytkowników z rolą ADMIN. Endpoint łączy dane z tabeli `profiles` z informacjami o email z Supabase Auth, implementuje paginację z parametrami limit/offset oraz domyślne sortowanie po dacie utworzenia (created_at DESC).

## 2. Szczegóły żądania

- **Metoda HTTP**: GET
- **Struktura URL**: `/api/users`
- **Parametry**:
  - **Wymagane**: Brak
  - **Opcjonalne**:
    - `limit`: number (domyślnie 50, maksymalnie 100) - liczba użytkowników na stronę
    - `offset`: number (domyślnie 0, minimum 0) - przesunięcie w wynikach
- **Request Body**: Brak (GET request)

## 3. Szczegóły odpowiedzi

- **Success Response** (200 OK):

```json
{
  "users": [
    {
      "id": "uuid",
      "email": "string",
      "username": "string",
      "role": "ADMIN|USER",
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

- **Error Responses**:
  - 403 Forbidden: Brak uprawnień administratora
  - 400 Bad Request: Nieprawidłowe parametry zapytania
  - 500 Internal Server Error: Błędy serwera/bazy danych

## 4. Przepływ danych

1. **Walidacja parametrów**: Parsowanie i walidacja parametrów limit/offset z query string
2. **Autoryzacja**: Sprawdzenie roli użytkownika w middleware/auth
3. **Pobranie danych**: Zapytanie do bazy danych Supabase
   - JOIN między `profiles` i `auth.users` dla uzyskania email
   - Filtrowanie i sortowanie (created_at DESC)
   - Paginacja z LIMIT/OFFSET
4. **Przetwarzanie**: Mapowanie wyników na UserDTO
5. **Obliczenie paginacji**: Wyliczenie page = Math.floor(offset/limit) + 1
6. **Odpowiedź**: Zwrócenie sformatowanej odpowiedzi JSON

## 5. Względy bezpieczeństwa

- **Autoryzacja**: Sprawdzanie roli ADMIN przed dostępem do danych
- **Walidacja wejścia**: Ścisła walidacja parametrów query (typy, zakresy wartości)
- **Dostęp do wrażliwych danych**: Endpoint ujawnia adresy email - dostęp wyłącznie dla ADMIN
- **SQL Injection**: Użycie parametryzowanych zapytań Supabase (bezpieczne domyślnie)
- **Rate Limiting**: Rozważyć implementację rate limiting dla zapobiegania nadużyciom

## 6. Obsługa błędów

- **403 Forbidden**: Użytkownik nie posiada roli ADMIN
  - Logowanie próby dostępu nieupoważnionego użytkownika
  - Zwrócenie standardowej wiadomości o braku uprawnień
- **400 Bad Request**: Nieprawidłowe parametry
  - limit/offset nie są liczbami całkowitymi
  - limit > 100 lub < 1
  - offset < 0
  - Zwrócenie szczegółowych informacji o błędnych parametrach
- **500 Internal Server Error**: Błędy bazy danych/połączenia
  - Logowanie błędów z Supabase
  - Zwrócenie ogólnej wiadomości o błędzie serwera
  - Unikanie ujawniania szczegółów technicznych

## 7. Wydajność

- **Optymalizacja zapytań**: Użycie odpowiednich indeksów na kolumnach `created_at` i `role`
- **Paginacja**: LIMIT/OFFSET zapewnia efektywne pobieranie danych

## 8. Kroki implementacji

### Krok 1: Przygotowanie walidacji i typów

- Utworzyć schemat Zod dla parametrów query w `src/lib/validation/users.ts`
- Dodać helper do obliczania paginacji w `src/lib/utils.ts`
- Zweryfikować dostępność UserDTO w `src/types.ts`

### Krok 2: Implementacja UserService

- Utworzyć `src/lib/services/user.service.ts` (jeśli nie istnieje)
- Zaimplementować metodę `getUsersPaginated(limit: number, offset: number): Promise<{users: UserDTO[], total: number}>`
- Dodać odpowiednie zapytanie Supabase z JOIN między profiles i auth.users

### Krok 3: Implementacja endpointu API

- Utworzyć `src/pages/api/users.ts` zgodnie z konwencjami Astro
- Dodać `export const prerender = false`
- Zaimplementować funkcję GET zgodnie ze specyfikacją
- Dodać walidację parametrów i obsługę błędów

### Krok 4: Implementacja autoryzacji

- Zapewnić sprawdzenie roli ADMIN w middleware lub bezpośrednio w endpoint
- Użyć istniejących mechanizmów autoryzacji Supabase

### Krok 5: Testowanie i walidacja

- Dodać testy jednostkowe dla walidacji parametrów
- Dodać testy integracyjne dla endpointu
- Zweryfikować obsługę błędów i paginację
- Przetestować wydajność z większymi zbiorami danych

### Krok 6: Dokumentacja i deployment

- Zaktualizować dokumentację API
- Dodać logowanie dla celów monitoringu
- Wdrożyć endpoint zgodnie z procesem CI/CD
