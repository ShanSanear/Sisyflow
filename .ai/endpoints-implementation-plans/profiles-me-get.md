# API Endpoint Implementation Plan: GET /profiles/me

## 1. Przegląd punktu końcowego

Ten endpoint jest odpowiedzialny za pobieranie i zwracanie danych profilu aktualnie uwierzytelnionego użytkownika. Umożliwia on frontendowi wyświetlanie spersonalizowanych informacji, takich jak nazwa użytkownika i jego rola.

## 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/profiles/me`
- **Parametry**:
  - **Wymagane**: Brak
  - **Opcjonalne**: Brak
- **Request Body**: Brak

## 3. Wykorzystywane typy

Do implementacji tego punktu końcowego zostanie wykorzystany istniejący typ `ProfileDTO`.

- **`ProfileDTO`** (Odpowiedź)
  ```typescript
  // src/types.ts
  export type ProfileDTO = Pick<Profile, "id" | "username" | "role" | "created_at" | "updated_at">;
  ```

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (`200 OK`)**: Zwraca obiekt `ProfileDTO` z danymi profilu użytkownika.
  ```json
  {
    "id": "c3e4a5f6-7b8c-9d0e-1f2a-3b4c5d6e7f8a",
    "username": "jankowalski",
    "role": "USER",
    "created_at": "2023-10-26T10:00:00Z",
    "updated_at": "2023-10-26T10:00:00Z"
  }
  ```
- **Odpowiedzi błędów**:
  - `401 Unauthorized`: Gdy użytkownik nie jest zalogowany.
  - `404 Not Found`: Gdy profil zalogowanego użytkownika nie istnieje w bazie danych.
  - `500 Internal Server Error`: Gdy wystąpi nieoczekiwany błąd serwera.

## 5. Przepływ danych

1. Klient wysyła żądanie `GET` na adres `/api/profiles/me`.
2. Middleware Astro weryfikuje token autoryzacyjny Supabase (przechowywany w cookies).
3. Wywoływany jest handler `GET` w pliku `src/pages/api/profiles/me.ts`.
4. Handler sprawdza, czy w `Astro.locals.session` istnieje aktywna sesja użytkownika. Jeśli nie, zwraca odpowiedź `401 Unauthorized`.
5. Handler wywołuje funkcję `getCurrentUserProfile` z serwisu `ProfileService`, przekazując do niej klienta Supabase (`Astro.locals.supabase`).
6. Funkcja `getCurrentUserProfile` pobiera ID użytkownika z sesji (`session.user.id`).
7. Wykonuje zapytanie do tabeli `profiles` w celu znalezienia profilu o pasującym ID: `supabase.from('profiles').select(...).eq('id', userId).single()`.
8. Jeśli zapytanie nie zwróci rekordu, serwis rzuca błąd "Not Found".
9. Jeśli rekord zostanie znaleziony, serwis mapuje go na `ProfileDTO` i zwraca do handlera.
10. Handler `GET` przechwytuje ewentualne błędy z serwisu i zwraca odpowiednie kody statusu (`404` lub `500`).
11. W przypadku powodzenia, handler zwraca odpowiedź `200 OK` z `ProfileDTO` w ciele odpowiedzi.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Dostęp do endpointu jest chroniony przez mechanizmy autentykacji Supabase. Handler musi bezwzględnie weryfikować istnienie aktywnej sesji przed przetworzeniem żądania.
- **Autoryzacja**: Polityki Row-Level Security (RLS) w bazie danych PostgreSQL zapewniają, że zapytanie wykonane w kontekście zalogowanego użytkownika zwróci tylko jego własny profil.
- **Walidacja danych**: Nie dotyczy, ponieważ punkt końcowy nie przyjmuje żadnych danych wejściowych od użytkownika.

## 7. Rozważania dotyczące wydajności

- Zapytanie do bazy danych opiera się na kluczu głównym (`profiles.id`), co gwarantuje bardzo wysoką wydajność.
- Zwracany obiekt (`payload`) jest niewielki, co minimalizuje czas transferu danych.
- Nie przewiduje się żadnych wąskich gardeł wydajnościowych.

## 8. Etapy wdrożenia

1. **Utworzenie serwisu**: Utwórz plik `src/lib/services/profile.service.ts`, jeśli jeszcze nie istnieje.
2. **Implementacja logiki w serwisie**:
   - Dodaj funkcję asynchroniczną `getCurrentUserProfile(supabase: SupabaseClient): Promise<ProfileDTO>`.
   - Wewnątrz funkcji pobierz sesję użytkownika.
   - Wykonaj zapytanie do Supabase, aby pobrać profil na podstawie `session.user.id`.
   - Zaimplementuj obsługę przypadku, gdy profil nie zostanie znaleziony (rzuć błąd `Error('Not Found')`).
   - Zamapuj wynik z bazy danych na typ `ProfileDTO` i zwróć go.
3. **Utworzenie pliku endpointu**: Utwórz plik `src/pages/api/profiles/me.ts`.
4. **Implementacja handlera `GET`**:
   - Dodaj `export const prerender = false;` na początku pliku.
   - W funkcji handlera `GET` uzyskaj dostęp do `Astro.locals.session` i `Astro.locals.supabase`.
   - Sprawdź, czy sesja istnieje. Jeśli nie, zwróć `new Response(null, { status: 401 })`.
   - Zaimplementuj blok `try...catch`.
   - W bloku `try` wywołaj `profileService.getCurrentUserProfile` i w przypadku sukcesu zwróć `new Response(JSON.stringify(profile), { status: 200 })`.
   - W bloku `catch` sprawdzaj typ błędu. Jeśli to błąd "Not Found", zwróć `404`. W przeciwnym razie zwróć `500`, logując błąd na serwerze.
