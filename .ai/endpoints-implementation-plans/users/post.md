# API Endpoint Implementation Plan: POST /api/users

## 1. Przegląd punktu końcowego

Ten endpoint umożliwia tworzenie nowych użytkowników w systemie Sisyflow. Jest dostępny wyłącznie dla użytkowników z rolą ADMIN. Endpoint tworzy konto użytkownika w Supabase Auth oraz powiązany profil w tabeli `profiles`, zwracając kompletne informacje o utworzonym użytkowniku.

## 2. Szczegóły żądania

- **Metoda HTTP**: POST
- **Struktura URL**: `/api/users`
- **Parametry**:
  - Wymagane: brak (wszystkie dane w body)
  - Opcjonalne: brak
- **Request Body**:

  ```json
  {
    "email": "string",
    "password": "string",
    "username": "string",
    "role": "USER" | "ADMIN"
  }
  ```

## 3. Wykorzystywane typy

- **CreateUserCommand**: Typ dla danych wejściowych żądania
- **UserDTO**: Typ dla odpowiedzi zawierającej utworzonego użytkownika
- **Profile**: Typ bazy danych dla operacji na tabeli profiles

## 4. Szczegóły odpowiedzi

- **Success Response** (201 Created):

  ```json
  {
    "id": "uuid",
    "email": "string",
    "username": "string",
    "role": "USER",
    "created_at": "timestamp"
  }
  ```

- **Error Responses**:
  - 400 Bad Request: Nieprawidłowe dane wejściowe (walidacja)
  - 403 Forbidden: Brak uprawnień ADMIN
  - 409 Conflict: Email lub username już istnieje
  - 500 Internal Server Error: Błędy serwera/bazy danych

## 5. Przepływ danych

1. **Sprawdzenie autoryzacji**: Zweryfikuj czy użytkownik jest zalogowany i ma rolę ADMIN
2. **Parsowanie request body**: Odczytaj i sparsuj JSON z request body
3. **Walidacja danych**: Użyj Zod schema do walidacji danych wejściowych
4. **Sprawdzenie unikalności**: Zweryfikuj czy email i username są dostępne
5. **Utworzenie użytkownika w Auth**: Utwórz konto w Supabase Auth
6. **Utworzenie profilu**: Dodaj rekord do tabeli profiles
7. **Formatowanie odpowiedzi**: Przekształć dane do formatu UserDTO
8. **Zwróć odpowiedź**: HTTP 201 z danymi użytkownika

## 6. Względy bezpieczeństwa

- **Uwierzytelnienie**: Wymagane - użytkownik musi być zalogowany
- **Autoryzacja**: Wymagana rola ADMIN - sprawdź w tabeli profiles
- **Walidacja danych**:
  - Email: poprawny format, unikalny w auth.users
  - Username: 3-30 znaków, unikalny w profiles
  - Password: wymagany (hashowany przez Supabase)
  - Role: tylko dozwolone wartości enum
- **Zapobieganie enumeracji**: Nie ujawniaj czy email/username istnieje (409 dla obu przypadków)
- **XSS Prevention**: Sanitizacja danych tekstowych

## 7. Obsługa błędów

- **400 Bad Request**:
  - Email pusty lub nieprawidłowy format
  - Username pusty, za krótki (<3) lub za długi (>30)
  - Password pusty
  - Role nie jest prawidłową wartością enum
  - Nieprawidłowy format JSON w request body
- **403 Forbidden**:
  - Użytkownik nie ma roli ADMIN
  - Brak dostępu do tworzenia użytkowników
- **409 Conflict**:
  - Email już istnieje w systemie
  - Username już istnieje w systemie
- **500 Internal Server Error**:
  - Błąd połączenia z bazą danych
  - Błąd Supabase Auth API
  - Nieoczekiwany błąd serwera

## 8. Rozważania dotyczące wydajności

- Operacja dwuetapowa: najpierw Auth, potem profiles
- Sprawdzenie unikalności wymaga zapytań do bazy
- Transaction nie jest możliwa między Auth a profiles (różne systemy)
- Indeksy UNIQUE na email (auth.users) i username (profiles) zapewniają wydajność
- Minimalne zapytania: 2 SELECT (sprawdzenia) + 1 INSERT (profiles)

## 9. Etapy wdrożenia

### Krok 1: Przygotowanie struktury projektu

- Utworzyć katalog `src/lib/services/` jeśli nie istnieje
- Utworzyć katalog `src/pages/api/users/` jeśli nie istnieje
- Zaktualizować `src/types.ts` jeśli potrzebne nowe typy (CreateUserCommand już istnieje)

### Krok 2: Implementacja walidacji

- Utworzyć Zod schema dla `CreateUserCommand` w `src/lib/validation/schemas/user.ts`
- Zaimplementować walidację email (wymagany, format email)
- Zaimplementować walidację username (wymagany, 3-30 znaków)
- Zaimplementować walidację password (wymagany)
- Zaimplementować walidację role (enum values)

### Krok 3: Implementacja UserService

- Utworzyć `src/lib/services/user.service.ts`
- Zaimplementować metodę `createUser()`:
  - Akceptuje `CreateUserCommand` i `adminUserId`
  - Sprawdza unikalność email w auth.users
  - Sprawdza unikalność username w profiles
  - Tworzy użytkownika w Supabase Auth
  - Tworzy profil w tabeli profiles
  - Zwraca `UserDTO`

### Krok 4: Implementacja API endpoint

- Utworzyć `src/pages/api/users/index.ts`
- Ustawić `export const prerender = false`
- Zaimplementować POST handler:
  - Pobrać Supabase client z `context.locals.supabase`
  - Sprawdzić uwierzytelnienie i pobrać user ID
  - Sprawdzić rolę ADMIN w profiles
  - Sparsować i zwalidować request body
  - Wywołać `UserService.createUser()`
  - Zwrócić HTTP 201 z UserDTO
  - Obsłużyć błędy i zwrócić odpowiednie kody statusu

### Krok 5: Aktualizacja middleware (jeśli potrzebne)

- Rozważyć dodanie sprawdzenia roli do middleware
- Aktualnie middleware ma TODO dla roli - może wymagać implementacji

### Krok 6: Testowanie i dokumentacja

- Przetestować wszystkie scenariusze błędów
- Przetestować tworzenie użytkownika przez ADMIN
- Przetestować odmowę dostępu dla USER
- Zaktualizować API documentation
