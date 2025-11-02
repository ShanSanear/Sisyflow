# Specyfikacja Techniczna: Moduł Uwierzytelniania i Autoryzacji

## 1. Architektura Interfejsu Użytkownika

### 1.1. Strony i Layouty (Astro)

W celu odseparowania widoków dla użytkowników zalogowanych i niezalogowanych, wprowadzimy następujące zmiany w strukturze stron i layoutów.

#### 1.1.1. Nowe Strony

- **`src/pages/register.astro`**: Strona rejestracji pierwszego użytkownika. Będzie renderować komponent `RegisterForm.tsx`. Strona będzie dostępna tylko, gdy w systemie nie ma żadnego użytkownika. Logika sprawdzająca istnienie użytkowników znajdzie się w części serwerowej strony i w razie potrzeby przekieruje na stronę logowania.
- **`src/pages/login.astro`**: Strona logowania. Będzie renderować komponent `LoginForm.tsx`. Dostępna tylko dla niezalogowanych użytkowników. Jest to domyślna strona na którą jest przekierowywany użytkownik jeśli nie jest zalogowany i administrator jest już utworzony.
- **`src/pages/board.astro`**: Główny widok aplikacji (tablica Kanban). Przeniesiemy tu zawartość z `src/pages/index.astro`. Strona będzie chroniona i dostępna tylko dla zalogowanych użytkowników.
- **`src/pages/api/auth/[...slug].ts`**: Endpointy API do obsługi logiki autentykacji (szczegóły w sekcji 2.1).

#### 1.1.2. Modyfikacja Stron

- **`src/pages/index.astro`**: Ta strona będzie teraz pełniła funkcję routera. W części serwerowej sprawdzi, czy użytkownik jest zalogowany. Jeśli tak, przekieruje go na `/board`. Jeśli nie, przekieruje na `/login`.

#### 1.1.3. Layouty

- **`src/layouts/AuthenticatedLayout.astro`**: Główny layout aplikacji dla zalogowanych użytkowników. Zostanie rozszerzony o komponent `NavigationBar.tsx`.
- **`src/layouts/AuthLayout.astro`**: Nowy, minimalistyczny layout dla stron `login.astro` i `register.astro`. Będzie centrował zawartość na środku ekranu, bez elementów nawigacyjnych aplikacji.

### 1.2. Komponenty (React)

Interaktywne elementy formularzy zostaną zaimplementowane jako komponenty React.

- **`src/components/auth/LoginForm.tsx`**:
  - Odpowiedzialność: Zarządzanie stanem formularza logowania (identyfikator - email lub username, hasło), walidacja po stronie klienta i komunikacja z endpointem API `/api/auth/sign-in`.
  - Walidacja: Użyjemy biblioteki `zod` do zdefiniowania schematu (poprawny format e-mail lub nazwa użytkownika 3-30 znaków, niepuste hasło) i `react-hook-form` do integracji z formularzem.
  - Komunikaty o błędach: Komponent będzie wyświetlał błędy walidacji pod odpowiednimi polami oraz ogólne komunikaty o błędach (np. "Nieprawidłowy identyfikator lub hasło") otrzymane z API.
- **`src/components/auth/RegisterForm.tsx`**:
  - Odpowiedzialność: Zarządzanie stanem formularza rejestracji, walidacja i komunikacja z endpointem `/api/auth/sign-up`.
  - Walidacja: Analogicznie do `LoginForm.tsx`, z dodatkowymi regułami dla siły hasła.
- **`src/components/layout/NavigationBar.tsx`**:
  - Odpowiedzialność: Wyświetlanie nazwy zalogowanego użytkownika, linków nawigacyjnych (w tym warunkowo linku do panelu admina) oraz menu użytkownika z opcjami profilu i wylogowania. Dane o użytkowniku będą pobierane po stronie klienta za pomocą dedykowanego hooka `useUser`, który komunikuje się z endpointem `/api/profiles/me`. Przycisk "Logout" będzie wywoływał endpoint `/api/auth/sign-out`.
  - Stan: Zarządzany wewnętrznie przez hook `useUser` i React Context.

### 1.3. Scenariusze Użytkownika

- **Logowanie**: Użytkownik wchodzi na `/login`, wprowadza dane, klika "Zaloguj". Po pomyślnej weryfikacji zostaje przekierowany na `/board`. W przypadku błędu widzi komunikat.
- **Rejestracja Admina**: Jeśli baza jest pusta, wejście na `/register` pokazuje formularz. Po wypełnieniu danych i wysłaniu, tworzone jest konto Admina, użytkownik jest logowany i przekierowywany na `/board`.
- **Dostęp do chronionych zasobów**: Próba wejścia na `/board` lub inny chroniony endpoint bez aktywnej sesji skutkuje natychmiastowym przekierowaniem na `/login`.

## 2. Logika Backendowa

### 2.1. Endpointy API

Zgodnie z konwencją Astro, endpointy API będą zlokalizowane w `src/pages/api`. Dla lepszej organizacji, endpointy autentyfikacji są zaimplementowane jako oddzielne pliki.

- **`src/pages/api/auth/sign-in.ts` (`POST`)**:
  - Pobiera `identifier` (email lub username) i `password` z ciała żądania.
  - Waliduje dane wejściowe za pomocą `zod` - identyfikator może być prawidłowym adresem email lub nazwą użytkownika (3-30 znaków, litery, cyfry, podkreślenie lub myślnik).
  - Jeśli identyfikator zawiera `@`, traktuje go jako email i używa bezpośrednio do logowania.
  - Jeśli identyfikator nie zawiera `@`, traktuje go jako nazwę użytkownika:
    - Wyszukuje użytkownika w tabeli `profiles` po nazwie użytkownika.
    - Używa admin klienta Supabase do pobrania adresu email z tabeli `auth.users`.
  - Wywołuje `supabase.auth.signInWithPassword()` z prawidłowym adresem email.
  - W przypadku sukcesu, Supabase SSR SDK automatycznie ustawi odpowiednie ciasteczka sesji. Zwraca status 200.
  - W przypadku błędu (nieprawidłowy identyfikator/hasło), zwraca status 401 z komunikatem o błędzie.
- **`src/pages/api/auth/sign-up.ts` (`POST`)**:
  - Sprawdza, czy w bazie danych istnieją jacykolwiek użytkownicy. Jeśli tak, zwraca błąd 403 (Forbidden).
  - Waliduje `email` i `password`.
  - Wywołuje `supabase.auth.signUp()`.
  - Po utworzeniu użytkownika w `auth.users`, trigger w bazie danych (patrz sekcja 3.2) przypisze mu rolę "Administrator" poprzez odpowiedni wpis w tabeli `profiles`
  - Zwraca status 201.
- **`src/pages/api/profiles/me.ts` (`GET`)**:
  - Endpoint chroniony przez middleware, dostępny tylko dla zalogowanych użytkowników.
  - Odpowiedzialny za pobieranie danych profilu aktualnie zalogowanego użytkownika.
  - Odczytuje dane użytkownika z `context.locals.user`, które zostały tam umieszczone przez middleware.
  - Zwraca obiekt DTO z danymi profilu (np. `id`, `username`, `role`).
  - W przypadku braku sesji (teoretycznie middleware powinien to zablokować), zwraca status 401.
- **`src/pages/api/auth/sign-out.ts` (`POST`)**:
  - Wywołuje `supabase.auth.signOut()`.
  - Supabase SSR SDK usuwa ciasteczka sesji.
  - Zwraca status 200.
- **`src/pages/api/auth/callback.ts` (`GET`)**:
  - Endpoint wymagany przez Supabase do obsługi przepływów OAuth i magic linków.
  - Wywołuje `supabase.auth.exchangeCodeForSession()`.
  - Przekierowuje użytkownika na `/board`.

### 2.2. Middleware

Plik `src/middleware/index.ts` będzie centralnym punktem zarządzania sesją i ochroną tras.

- **Inicjalizacja Supabase**: Klient Supabase będzie tworzony z użyciem `@supabase/ssr`, co pozwoli mu na zarządzanie ciasteczkami w kontekście żądania.
- **Pobieranie Sesji**: Dla każdego żądania middleware będzie próbował odczytać sesję użytkownika z ciasteczek. Informacje o użytkowniku (`session`, `user`) będą dostępne w `context.locals`.
- **Ochrona Tras**:
  - Middleware będzie zawierał listę chronionych ścieżek (np. `/board`).
  - Jeśli użytkownik próbuje uzyskać dostęp do chronionej ścieżki bez aktywnej sesji, zostanie przekierowany na `/login`.
  - Jeśli zalogowany użytkownik próbuje uzyskać dostęp do `/login` lub `/register`, zostanie przekierowany na `/board`.
- **Renderowanie Server-Side**: Wszystkie strony wymagające informacji o sesji użytkownika (np. `AuthenticatedLayout.astro`, `board.astro`) będą renderowane dynamicznie po stronie serwera. W `astro.config.mjs` ustawimy `output: 'server'`.

## 3. System Autentykacji (Supabase)

### 3.1. Konfiguracja Klienta Supabase

- Użyjemy pakietu `@supabase/ssr` do stworzenia klienta Supabase, który potrafi zarządzać sesją w środowisku serwerowym Astro.
- Klient będzie skonfigurowany w `src/db/supabase.client.ts` i wykorzystywany w middleware oraz endpointach API.

### 3.2. Struktura Bazy Danych i Role

- **Rozszerzenie tabeli `profiles`**
- **Trigger `on_user_created`**:
  - Stworzymy funkcję w PostgreSQL, która po utworzeniu nowego użytkownika w `auth.users` automatycznie tworzy dla niego wpis w tabeli `profiles`.
- **Trigger `assign_admin_on_first_user`**:
  - Stworzymy funkcję i trigger, który uruchomi się _przed_ wstawieniem nowego rekordu do `profiles`.
  - Funkcja sprawdzi, czy tabela `profiles` jest pusta. Jeśli tak, ustawi pole `role` nowego rekordu na 'Administrator'. W przeciwnym razie pozostawi domyślną wartość 'Użytkownik'.

### 3.3. Zarządzanie Sesją

- Sesja będzie w pełni zarządzana przez Supabase Auth i pakiet `@supabase/ssr`.
- Ciasteczka `sb-access-token` i `sb-refresh-token` będą automatycznie ustawiane i odświeżane po stronie serwera.
- Dzięki temu podejściu, komponenty klienckie (React) nie będą musiały bezpośrednio zarządzać tokenami, a jedynie wywoływać odpowiednie endpointy API w naszej aplikacji Astro.
