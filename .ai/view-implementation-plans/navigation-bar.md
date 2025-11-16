# Plan implementacji widoku - Pasek Nawigacyjny (Navigation Bar)

## 1. Przegląd

Pasek nawigacyjny (Top Bar) jest stałym elementem interfejsu, widocznym dla każdego zalogowanego użytkownika. Jego celem jest zapewnienie szybkiego dostępu do kluczowych sekcji aplikacji, takich jak tablica Kanban, panel administratora (dla administratora), oraz umożliwienie tworzenia nowych ticketów (poprzez przycisk do tego przeznaczony) i zarządzania sesją użytkownika (profil, wylogowanie).

## 2. Routing widoku

Komponent paska nawigacyjnego nie posiada własnej ścieżki. Będzie on częścią głównego layoutu `AuthenticatedLayout.astro`, który będzie owijał wszystkie strony wymagające uwierzytelnienia. Użytkownik zobaczy ten pasek po zalogowaniu się na dowolnej chronionej trasie (np. `/`, `/dashboard`, `/admin/*`).

## 3. Struktura komponentów

Hierarchia komponentów React będzie zorganizowana w celu zapewnienia reużywalności i czytelności kodu. Głównym kontenerem będzie `NavigationBar`, który zarządza stanem i danymi.

```
/src/layouts/AuthenticatedLayout.astro
└── /src/components/layout/NavigationBar.tsx
    ├── /src/components/layout/Logo.tsx
    ├── /src/components/layout/NavLinks.tsx
    ├── /src/components/ui/Button.tsx (z Shadcn/ui)
    └── /src/components/layout/UserMenu.tsx
        ├── /src/components/ui/Avatar.tsx (z Shadcn/ui)
        └── /src/components/ui/DropdownMenu.tsx (z Shadcn/ui)
```

## 4. Szczegóły komponentów

### `NavigationBar.tsx`

- **Opis komponentu:** Główny komponent-kontener, który odpowiada za pobranie danych o zalogowanym użytkowniku, zarządzanie stanem ładowania/błędu i renderowanie podkomponentów z odpowiednimi danymi.
- **Główne elementy:** `header` (HTML), `Logo`, `NavLinks`, `Button` ("Utwórz Ticket"), `UserMenu`.
- **Obsługiwane interakcje:** Brak bezpośrednich interakcji. Deleguje obsługę do komponentów podrzędnych.
- **Obsługiwana walidacja:** Sprawdza stan ładowania i błędu z hooka `useUser`, aby wyświetlić stan ładowania (np. skeleton) lub komunikat o błędzie.
- **Typy:** `UserViewModel`.
- **Propsy:** Brak.

### `NavLinks.tsx`

- **Opis komponentu:** Komponent prezentacyjny, który renderuje listę linków nawigacyjnych. Warunkowo wyświetla link "Panel Administratora" na podstawie roli użytkownika.
- **Główne elementy:** `nav` (HTML), `a` (HTML) lub komponent `Link` z biblioteki routingowej.
- **Obsługiwane interakcje:** Kliknięcie na linki, co powoduje nawigację do odpowiednich stron.
- **Obsługiwana walidacja:** Sprawdzenie, czy `props.role === 'ADMIN'`.
- **Typy:** Brak.
- **Propsy:**
  ```typescript
  interface NavLinksProps {
    role: "ADMIN" | "USER";
  }
  ```

### `UserMenu.tsx`

- **Opis komponentu:** Komponent interaktywny, który wyświetla awatar użytkownika. Po kliknięciu rozwija menu z opcjami "Mój profil" i "Wyloguj".
- **Główne elementy:** `Avatar`, `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem` (komponenty z Shadcn/ui).
- **Obsługiwane interakcje:**
  - Kliknięcie w awatar: otwiera/zamyka dropdown.
  - Kliknięcie "Mój profil": nawigacja do strony profilu.
  - Kliknięcie "Wyloguj": uruchomienie procedury wylogowania.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `UserViewModel`.
- **Propsy:**
  ```typescript
  interface UserMenuProps {
    user: UserViewModel;
  }
  ```

## 5. Typy

Do implementacji widoku potrzebny będzie jeden nowy typ `ViewModel` oraz wykorzystanie istniejącego `ProfileDTO`.

- **`ProfileDTO` (Data Transfer Object):** Typ danych bezpośrednio otrzymywany z API.

  ```typescript
  // src/types.ts
  export type ProfileDTO = {
    id: string;
    username: string;
    role: "ADMIN" | "USER";
    created_at: string;
    updated_at: string;
  };
  ```

- **`UserViewModel` (ViewModel):** Uproszczony model na potrzeby komponentów UI. Zawiera tylko niezbędne dane oraz pole pochodne (`initials`).
  ```typescript
  // src/components/layout/types.ts
  export type UserViewModel = {
    username: string;
    role: "ADMIN" | "USER";
    initials: string; // Wyliczane z `displayName` lub `username`, np. "Jan Kowalski" -> "JK"
  };
  ```

## 6. Zarządzanie stanem

Stan zalogowanego użytkownika jest globalny dla całej aplikacji. Do zarządzania nim zostanie stworzony niestandardowy hook `useUser`, który będzie komunikował się z API i dostarczał dane poprzez React Context.

- **Hook `useUser` (`src/hooks/useUser.ts`):**
  - **Cel:** Abstrakcja logiki pobierania i cachowania danych użytkownika.
  - **Stany:** Będzie zarządzał trzema stanami: `user` (dane użytkownika lub `null`), `isLoading` (`boolean`), `error` (`Error` lub `null`).
  - **Implementacja:** Hook będzie wykorzystywał `fetch` do zapytania API, a `useState` i `useEffect` do zarządzania cyklem życia zapytania. Dane będą udostępniane globalnie za pomocą `UserContext.Provider` umieszczonego w `AuthenticatedLayout.astro`.

## 7. Integracja API

Komponent będzie integrował się z jednym endpointem w celu pobrania danych o bieżącym użytkowniku.

- **Endpoint:** `GET /api/profiles/me`
- **Proces:**
  1. Hook `useUser` wysyła żądanie `GET` do `/api/profiles/me` po załadowaniu layoutu.
  2. Oczekiwana jest odpowiedź w formacie JSON, zgodna z typem `ProfileDTO`.
  3. Po pomyślnym otrzymaniu danych, są one mapowane na `UserViewModel` i zapisywane w stanie.
  4. W przypadku błędu (np. status 401, 404, 500), informacja o błędzie jest zapisywana w stanie, co pozwala na odpowiednią reakcję UI.

## 8. Interakcje użytkownika

- **Kliknięcie w logo lub link "Tablica Kanban":** Przekierowanie na główną stronę tablicy (`/`).
- **Kliknięcie w link "Panel Administratora" (tylko Admin):** Przekierowanie do panelu administracyjnego (`/admin`).
- **Kliknięcie w przycisk "Utwórz Ticket":** Otwarcie modala tworzenia nowego zadania.
- **Kliknięcie w awatar:** Otwarcie menu podręcznego (`DropdownMenu`).
- **Kliknięcie "Mój profil":** Przekierowanie na stronę profilu użytkownika (np. `/profile`).
- **Kliknięcie "Wyloguj":** Wywołanie funkcji `logout`, która uderza do endpointu API wylogowującego, czyści stan lokalny i przekierowuje na stronę logowania (`/login`).

## 9. Warunki i walidacja

- **Widoczność "Panelu Administratora":** Komponent `NavLinks` będzie renderował link do panelu tylko wtedy, gdy `user.role` z `UserViewModel` ma wartość `'ADMIN'`.
- **Wyświetlanie paska nawigacyjnego:** Cały komponent `NavigationBar` będzie renderowany tylko wewnątrz layoutu dla uwierzytelnionych użytkowników. Strony takie jak `/login` czy `/register` nie będą go zawierać.
- **Stan ładowania:** Podczas gdy `useUser` pobiera dane (`isLoading === true`), komponent `NavigationBar` wyświetli szkielet (skeleton), aby uniknąć migotania i pokazywania niepoprawnych danych. Szkielet pokazywany jest jako pojedynczy pasek o dopasowanym wymiarze.

## 10. Obsługa błędów

- **Błąd 401 (Unauthorized) / 404 (Not Found):** Jeśli API zwróci jeden z tych statusów, oznacza to nieważną sesję. Hook `useUser` zinterpretuje to jako błąd autoryzacji i wywoła przekierowanie na stronę logowania (`/login`).
- **Błąd 500 (Internal Server Error) lub błąd sieci:** W przypadku problemów z serwerem lub siecią, `NavigationBar` może wyświetlić dyskretny komunikat o błędzie (np. za pomocą komponentu `Toast`), informując użytkownika, że nie udało się załadować jego danych. Funkcjonalność zależna od danych użytkownika (np. link do panelu admina) nie będzie dostępna.

## 11. Kroki implementacji

1.  **Stworzenie typów:** Zdefiniowanie typu `UserViewModel` w pliku `src/components/layout/types.ts`.
2.  **Implementacja hooka `useUser`:** Stworzenie pliku `src/hooks/useUser.ts` z logiką do pobierania danych użytkownika, zarządzania stanem ładowania i błędów.
3.  **Implementacja `UserContext`:** Stworzenie prostego kontekstu React do przechowywania i udostępniania stanu z hooka `useUser`.
4.  **Budowa komponentów prezentacyjnych:** Stworzenie komponentów `Logo.tsx`, `NavLinks.tsx` i `UserMenu.tsx` z wykorzystaniem komponentów z biblioteki Shadcn/ui (`Avatar`, `DropdownMenu`, `Button`). Komponenty te będą odbierać dane przez propsy.
5.  **Budowa komponentu `NavigationBar.tsx`:** Złożenie widoku z mniejszych komponentów. Implementacja logiki warunkowego renderowania w oparciu o stany `isLoading` i `error` z hooka `useUser`. Mapowanie `ProfileDTO` na `UserViewModel`.
6.  **Integracja z layoutem Astro:** Stworzenie (lub modyfikacja) layoutu `src/layouts/AuthenticatedLayout.astro`. Wewnątrz tego pliku, umieszczenie komponentu `NavigationBar.tsx` (z `client:load`) i owinięcie `<slot />` w `UserContext.Provider`, aby udostępnić stan wszystkim podstronom.
7.  **Testowanie:** Weryfikacja wszystkich interakcji, warunkowego renderowania linku dla admina oraz poprawnej obsługi stanów ładowania i błędów.
