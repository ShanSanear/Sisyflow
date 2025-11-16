# Plan implementacji widoku: Profil Użytkownika

## 1. Przegląd

Celem tego dokumentu jest szczegółowe zaplanowanie wdrożenia widoku profilu użytkownika. Widok ten umożliwi zalogowanym użytkownikom przeglądanie podstawowych informacji o swoim koncie (nazwa użytkownika, rola) oraz ich modyfikację (zmiana nazwy użytkownika, zmiana hasła).

## 2. Routing widoku

Widok będzie dostępny pod ścieżką `/profile` i będzie chroniony, co oznacza, że dostęp do niego będą mieli wyłącznie uwierzytelnieni użytkownicy. Strona powinna korzystać z `AuthenticatedLayout.astro`.

## 3. Struktura komponentów

Komponenty zostaną zaimplementowane w React i osadzone na stronie Astro. Poniżej znajduje się drzewo komponentów dla tego widoku.

```
/src/pages/profile.astro
└── /src/layouts/AuthenticatedLayout.astro
    └── /src/components/views/UserProfileView.tsx
        ├── Card (shadcn/ui)
        │   ├── CardHeader, CardTitle, CardDescription
        │   ├── CardContent
        │   │   └── /src/components/profile/ProfileForm.tsx
        │   │       ├── Input (username)
        │   │       ├── Input (role - readonly)
        │   │       ├── Input (password)
        │   │       ├── Input (confirmPassword)
        │   │       └── Button (submit)
        └── Toaster (shadcn/ui)
```

## 4. Szczegóły komponentów

### `UserProfileView.tsx`

- **Opis komponentu:** Główny komponent-kontener dla widoku profilu. Odpowiedzialny za pobieranie danych profilu użytkownika, zarządzanie stanem (ładowanie, zapisywanie, błędy) oraz komunikację z API.
- **Główne elementy:** `Card` z `shadcn/ui` jako główny kontener. Renderuje `ProfileForm`.
- **Obsługiwane interakcje:** Obsługuje zdarzenie `onProfileSubmit` z komponentu `ProfileForm` w celu zainicjowania procesu zapisu zmian.
- **Obsługiwana walidacja:** Brak - deleguje walidację do `ProfileForm`.
- **Typy:** `ProfileDTO`, `UserProfileViewModel`.
- **Propsy:** Brak.

### `ProfileForm.tsx`

- **Opis komponentu:** Formularz umożliwiający edycję danych użytkownika. Zawiera pola do zmiany nazwy użytkownika, hasła oraz pole tylko do odczytu z rolą użytkownika.
- **Główne elementy:** `form` zawierający komponenty `Input` i `Label` z `shadcn/ui` dla nazwy użytkownika, roli, hasła i potwierdzenia hasła, oraz `Button` do zapisu zmian.
- **Obsługiwane interakcje:**
  - `onChange` na polach formularza w celu aktualizacji stanu.
  - `onSubmit` na formularzu, które emituje zdarzenie `onProfileSubmit` z danymi z `UserProfileViewModel`.
- **Obsługiwana walidacja:**
  - `username`: Wymagane, długość od 3 do 50 znaków.
  - `password`: Opcjonalne. Jeśli podane, musi mieć min. 8 znaków, jedną dużą literę, jedną małą literę i jedną cyfrę.
  - `confirmPassword`: Musi być identyczne z polem `password`.
- **Typy:** `UserProfileViewModel`.
- **Propsy:**
  - `initialData: UserProfileViewModel` - początkowe dane formularza.
  - `isSaving: boolean` - informuje, czy trwa proces zapisu, w celu zablokowania przycisku.
  - `onProfileSubmit: (data: UserProfileViewModel) => void` - funkcja zwrotna wywoływana po zatwierdzeniu formularza.
  - `validationErrors: Record<string, string>` - obiekt z błędami walidacji z serwera.

## 5. Typy

Do implementacji widoku, oprócz istniejących typów `ProfileDTO` i `UpdateProfileCommand`, potrzebne będą następujące nowe typy.

```typescript
// Nowy typ dla ViewModelu formularza
export interface UserProfileViewModel {
  username: string;
  role: "ADMIN" | "USER";
  password?: string;
  confirmPassword?: string;
}

// Nowy typ dla Command zmiany hasła
// Zakłada istnienie dedykowanego endpointu
export interface UpdatePasswordCommand {
  password: string;
  confirmPassword: string;
}
```

## 6. Zarządzanie stanem

Zaleca się stworzenie dedykowanego hooka `useUserProfile`, który będzie hermetyzował całą logikę związaną z zarządzaniem stanem widoku.

- **`useUserProfile` Hook:**
  - **Cel:** Zarządzanie stanem ładowania danych, formularza, procesu zapisu oraz obsługi błędów.
  - **Zarządzane stany:**
    - `profile: ProfileDTO | null` - dane użytkownika pobrane z API.
    - `formState: UserProfileViewModel` - aktualny stan danych w formularzu.
    - `isLoading: boolean` - status ładowania początkowych danych.
    - `isSaving: boolean` - status zapisu zmian.
    - `error: string | null` - ogólny błąd API.
    - `validationErrors: Record<keyof UserProfileViewModel, string>` - błędy walidacji dla konkretnych pól.
  - **Udostępniane funkcje:**
    - `updateProfile(data: UserProfileViewModel)` - funkcja do wywołania zapisu, która wewnętrznie zdecyduje, czy aktualizować nazwę użytkownika, hasło, czy oba.

## 7. Integracja API

Integracja z API będzie obejmować dwa główne punkty końcowe.

1.  **Pobieranie danych profilu:**
    - **Endpoint:** `GET /api/profiles/me`
    - **Odpowiedź:** `ProfileDTO`
    - **Akcja:** Wywoływane przy pierwszym renderowaniu komponentu `UserProfileView` w celu wypełnienia formularza.

2.  **Aktualizacja danych profilu:**
    - **Endpoint (nazwa użytkownika):** `PUT /api/profiles/me`
    - **Żądanie:** `UpdateProfileCommand` (`{ username: string }`)
    - **Odpowiedź:** `ProfileDTO`
    - **Akcja:** Wywoływane, gdy użytkownik zmienił swoją nazwę użytkownika i zapisał formularz.

3.  **Zmiana hasła (założenie):**
    - **Uwaga:** Wymagane jest stworzenie nowego endpointu, ponieważ obecny go nie obsługuje. Poniżej założono jego kontrakt.
    - **Endpoint:** `PATCH /api/auth/password`
    - **Żądanie:** `UpdatePasswordCommand` (`{ password: string, confirmPassword: string }`)
    - **Odpowiedź:** `200 OK` (bez ciała) lub `204 No Content`.
    - **Akcja:** Wywoływane, gdy użytkownik wypełnił pola hasła i zapisał formularz.

## 8. Interakcje użytkownika

- **Wejście na stronę:** Użytkownik wchodzi na `/profile`. Aplikacja wyświetla loader, pobiera dane i wypełnia nimi formularz.
- **Edycja pól:** Użytkownik może swobodnie edytować pole nazwy użytkownika oraz pola haseł. Przycisk zapisu staje się aktywny, jeśli wprowadzone zostały zmiany.
- **Zapis zmian:**
  - Po kliknięciu "Zapisz zmiany", przycisk jest blokowany, a w tle wykonywane są odpowiednie zapytania do API.
  - Po pomyślnym zapisie wyświetlany jest toast z komunikatem "Zmiany zostały zapisane.", a pola haseł są czyszczone.
  - W przypadku błędu walidacji (np. zajęta nazwa użytkownika), błąd jest wyświetlany pod odpowiednim polem.
  - W przypadku błędu serwera, wyświetlany jest ogólny toast z informacją o błędzie.

## 9. Warunki i walidacja

Walidacja po stronie klienta będzie realizowana w komponencie `ProfileForm` przed wysłaniem formularza.

- **Przycisk "Zapisz zmiany":** Powinien być nieaktywny, jeśli:
  - Nie dokonano żadnych zmian w formularzu w stosunku do danych początkowych.
  - Formularz zawiera błędy walidacji.
- **Pole `username`:**
  - **Warunek:** Musi zawierać od 3 do 50 znaków.
  - **Komunikat:** "Nazwa użytkownika musi mieć od 3 do 50 znaków."
- **Pole `password`:**
  - **Warunek:** Jeśli nie jest puste, musi spełniać politykę bezpieczeństwa (min. 8 znaków, wielka/mała litera, cyfra).
  - **Komunikat:** "Hasło musi mieć co najmniej 8 znaków, jedną dużą literę, jedną małą literę i jedną cyfrę."
- **Pole `confirmPassword`:**
  - **Warunek:** Musi być identyczne z polem `password`.
  - **Komunikat:** "Hasła nie są zgodne."

## 10. Obsługa błędów

- **Błąd pobierania danych:** Jeśli `GET /api/profiles/me` zawiedzie, widok powinien wyświetlić komunikat o błędzie na całą stronę z opcją ponowienia próby (np. przycisk "Odśwież").
- **Nazwa użytkownika zajęta (`409 Conflict`):** Po otrzymaniu tego błędu z API, hook `useUserProfile` powinien ustawić błąd walidacji dla pola `username`, co spowoduje wyświetlenie komunikatu "Ta nazwa użytkownika jest już zajęta." pod polem `Input`.
- **Błąd walidacji (`400 Bad Request`):** Wyświetlenie toastu z ogólnym komunikatem "Wprowadzono nieprawidłowe dane.".
- **Błąd serwera (`500 Internal Server Error`):** Wyświetlenie toastu z komunikatem "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.".
- **Brak autoryzacji (`401 Unauthorized`):** Ten błąd powinien być obsłużony globalnie przez `AuthenticatedLayout`, który przekieruje użytkownika na stronę logowania.

## 11. Kroki implementacji

1.  **Stworzenie pliku strony:** Utwórz plik `src/pages/profile.astro`, który będzie używał `AuthenticatedLayout` i renderował komponent `UserProfileView`.
2.  **Zdefiniowanie typów:** W pliku `src/types.ts` dodaj nowe typy: `UserProfileViewModel` i `UpdatePasswordCommand`.
3.  **Implementacja hooka `useUserProfile`:** Stwórz plik `src/hooks/useUserProfile.ts`. Zaimplementuj w nim logikę pobierania danych, zarządzania stanem formularza oraz funkcje do komunikacji z API (`PUT /api/profiles/me` i zakładany `PATCH /api/auth/password`).
4.  **Implementacja komponentów UI:**
    - Stwórz komponent `UserProfileView.tsx`, który użyje hooka `useUserProfile` i złoży cały widok.
    - Stwórz komponent `ProfileForm.tsx`, implementując logikę formularza i jego walidację po stronie klienta.
5.  **Integracja i testowanie:** Połącz wszystkie komponenty, upewnij się, że przepływ danych działa poprawnie. Przetestuj ręcznie wszystkie interakcje użytkownika, walidację oraz scenariusze błędów.
6.  **Stworzenie endpointu zmiany hasła:** Poinformuj zespół backendowy o konieczności stworzenia endpointu `PATCH /api/auth/password` zgodnie ze zdefiniowanym kontraktem.
