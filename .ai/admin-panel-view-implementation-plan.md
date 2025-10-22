# Plan implementacji widoku Panelu Administratora

## 1. Przegląd

Panel Administratora to dedykowany widok w aplikacji, dostępny wyłącznie dla użytkowników z rolą "ADMIN". Jego głównym celem jest zapewnienie centralnego miejsca do zarządzania kluczowymi aspektami systemu. W pierwszej wersji widok ten umożliwi zarządzanie cyklem życia użytkowników (dodawanie i usuwanie) w ramach pod-widoku "Zarządzanie Użytkownikami".

## 2. Routing widoku

Widok będzie dostępny pod główną ścieżką `/admin`. Domyślnie, po wejściu na tę ścieżkę, zostanie wyświetlony pod-widok "Zarządzanie Użytkownikami".

- **Główny panel:** `/admin`
- **Zarządzanie użytkownikami:** `/admin` (jako domyślna zakładka)

Dostęp do całej ścieżki `/admin` oraz jej pod-ścieżek musi być chroniony przez middleware, które weryfikuje, czy zalogowany użytkownik posiada rolę `admin`.

## 3. Struktura komponentów

Hierarchia komponentów zostanie zaimplementowana w technologii React i osadzona na stronie Astro (`/src/pages/admin/index.astro`).

```plain
AdminPage.astro
└── AdminLayout.astro
    └── Header (React)
    └── AdminPanelView (React)
        ├── Tabs
        │   └── TabsContent (value="users")
        │       └── UserManagementView (React)
        │           ├── AddUserDialog (React)
        │           │   └── Form (Input, Button)
        │           ├── DeleteUserAlert (React)
        │           └── UsersTable (React)
        │               ├── TableHeader
        │               └── TableBody
        │                   └── TableRow (dla każdego użytkownika)
        │                       └── UserActionsDropdown (React)
        │                           └── DropdownMenu (akcja "Usuń")
        └── TabsContent (value="documentation" - przyszłość)
```

## 4. Szczegóły komponentów

### `AdminPanelView`

- **Opis komponentu:** Główny kontener dla panelu admina. Renderuje nawigację w formie zakładek (`Tabs`) i zarządza wyświetlaniem aktywnego pod-widoku.
- **Główne elementy:** `Tabs`, `TabsList`, `TabsTrigger` z Shadcn/ui.
- **Obsługiwane interakcje:** Przełączanie się między zakładkami.
- **Obsługiwana walidacja:** Brak.
- **Typy:** Brak.
- **Propsy:** Brak.

### `UserManagementView`

- **Opis komponentu:** Sercem tej sekcji, orkiestruje stan i logikę związaną z zarządzaniem użytkownikami. Wykorzystuje customowy hook `useAdminUsers` do obsługi operacji API i zarządzania stanem.
- **Główne elementy:** `Button` ("Dodaj użytkownika"), `UsersTable`, `AddUserDialog`, `DeleteUserAlert`.
- **Obsługiwane interakcje:** Inicjowanie dodawania użytkownika, obsługa żądania usunięcia użytkownika.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `UserViewModel`.
- **Propsy:** Brak.

### `UsersTable`

- **Opis komponentu:** Wyświetla listę użytkowników w formie tabeli. Każdy wiersz zawiera dane użytkownika (nazwa użytkownika, mail, rola) i menu akcji.
- **Główne elementy:** `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell` z Shadcn/ui, oraz komponent `UserActionsDropdown`.
- **Obsługiwane interakcje:** Przekazuje żądanie usunięcia użytkownika do komponentu nadrzędnego.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `UserViewModel[]`.
- **Propsy:**
  - `users: UserViewModel[]`: Lista użytkowników do wyświetlenia.
  - `currentUserId: string`: ID aktualnie zalogowanego administratora.
  - `onDelete: (userId: string) => void`: Funkcja zwrotna wywoływana po zainicjowaniu usunięcia.

### `UserActionsDropdown`

- **Opis komponentu:** Menu kontekstowe dla każdego wiersza w tabeli użytkowników. Umożliwia wykonanie akcji, np. usunięcie.
- **Główne elementy:** `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem` z Shadcn/ui.
- **Obsługiwane interakcje:** Kliknięcie opcji "Usuń".
- **Obsługiwana walidacja:** Opcja "Usuń" jest wyłączona (`disabled`), jeśli `user.id` jest takie samo jak `currentUserId`, aby uniemożliwić administratorowi usunięcie samego siebie.
- **Typy:** `UserViewModel`.
- **Propsy:**
  - `user: UserViewModel`: Obiekt użytkownika, którego dotyczy menu.
  - `currentUserId: string`: ID zalogowanego administratora.
  - `onDelete: (userId: string) => void`: Funkcja zwrotna.

### `AddUserDialog`

- **Opis komponentu:** Okno dialogowe z formularzem do tworzenia nowego użytkownika. Zarządza stanem formularza i walidacją po stronie klienta.
- **Główne elementy:** `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter`, `Form`, `Input`, `Button` z Shadcn/ui.
- **Obsługiwane interakcje:** Wprowadzanie danych, przesyłanie formularza.
- **Obsługiwana walidacja:**
  - `username`: pole wymagane, minimum 3 znaki.
  - `email`: pole wymagane, poprawny format adresu e-mail.
  - `password`: pole wymagane, minimum 8 znaków, minimum 1 duża litera, 1 mała litera i 1 cyfra
  - Walidacja zgodna z endpointem `POST /api/users`
- **Typy:** `CreateUserCommand`.
- **Propsy:**
  - `isOpen: boolean`: Kontroluje widoczność okna.
  - `onOpenChange: (isOpen: boolean) => void`: Funkcja zwrotna przy zmianie stanu okna.
  - `onAddUser: (command: CreateUserCommand) => Promise<void>`: Asynchroniczna funkcja do obsługi przesłania formularza.

### `DeleteUserAlert`

- **Opis komponentu:** Okno dialogowe typu `AlertDialog` do potwierdzenia operacji usunięcia użytkownika.
- **Główne elementy:** `AlertDialog`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogCancel`, `AlertDialogAction` z Shadcn/ui.
- **Obsługiwane interakcje:** Potwierdzenie lub anulowanie usunięcia.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `UserViewModel | null`.
- **Propsy:**
  - `userToDelete: UserViewModel | null`: Obiekt użytkownika do usunięcia (lub `null`, jeśli okno ma być ukryte).
  - `onConfirm: (userId: string) => void`: Funkcja zwrotna po potwierdzeniu.
  - `onCancel: () => void`: Funkcja zwrotna po anulowaniu.

## 5. Typy

Do implementacji widoku, oprócz istniejących typów `UserDTO` i `CreateUserCommand`, potrzebny będzie nowy ViewModel.

- **`UserViewModel` (nowy):** Rozszerzenie typu `UserDTO` o pola potrzebne do zarządzania stanem interfejsu użytkownika na poziomie pojedynczego wiersza tabeli.
  - **Cel:** Śledzenie stanu operacji asynchronicznych (np. usuwania) dla konkretnego użytkownika, co pozwala na wyświetlanie indywidualnych wskaźników ładowania bez blokowania całego interfejsu.
  - **Definicja:**

    ```typescript
    import type { UserDTO } from "@/types";

    export type UserViewModel = UserDTO & {
      isDeleting?: boolean; // true, gdy żądanie usunięcia tego użytkownika jest w toku
    };
    ```

## 6. Zarządzanie stanem

Logika biznesowa oraz stan widoku `UserManagementView` zostaną wyizolowane w dedykowanym customowym hooku `useAdminUsers`.

- **Nazwa hooka:** `useAdminUsers`
- **Cel:** Abstrakcja logiki pobierania, dodawania i usuwania użytkowników, a także zarządzanie stanami ładowania i błędów.
- **Zarządzany stan:**
  - `users: UserViewModel[]`: Lista użytkowników.
  - `isLoading: boolean`: Stan ładowania początkowej listy użytkowników.
  - `error: Error | null`: Obiekt błędu, jeśli wystąpił problem z API.
  - `currentUser: User | null`: Dane zalogowanego użytkownika (pobrane z `useUser` hooka), potrzebne do walidacji (np. uniemożliwienie samousunięcia).
- **Udostępniane funkcje:**
  - `addUser(command: CreateUserCommand): Promise<void>`: Wysyła żądanie `POST` do API, a po sukcesie dodaje nowego użytkownika do lokalnego stanu.
  - `deleteUser(userId: string): Promise<void>`: Ustawia flagę `isDeleting` na `true` dla danego użytkownika, wysyła żądanie `DELETE`, a po sukcesie usuwa użytkownika z lokalnego stanu.

## 7. Integracja API

Integracja z API będzie realizowana wewnątrz hooka `useAdminUsers` przy użyciu `fetch` API.

- **Pobieranie użytkowników:**
  - **Endpoint:** `GET /api/users`
  - **Akcja:** Wywoływane w `useEffect` przy pierwszym renderowaniu komponentu `UserManagementView`.
  - **Typ odpowiedzi:** `{ users: UserDTO[], pagionation: {page: number, limit: number, total: number} }`
- **Dodawanie użytkownika:**
  - **Endpoint:** `POST /api/users`
  - **Akcja:** Wywoływane przez funkcję `addUser` po pomyślnej walidacji formularza.
  - **Typ żądania (body):** `CreateUserCommand`
  - **Typ odpowiedzi:** `UserDTO` (nowo utworzony użytkownik)
- **Usuwanie użytkownika:**
  - **Endpoint:** `DELETE /api/users/{id}`
  - **Akcja:** Wywoływane przez funkcję `deleteUser` po potwierdzeniu w `DeleteUserAlert`.
  - **Typ odpowiedzi:** `204 No Content`

## 8. Interakcje użytkownika

- **Wyświetlanie listy:** Po wejściu na `/admin`, użytkownik widzi tabelę z listą użytkowników. W trakcie ładowania danych wyświetlany jest szkielet (`skeleton`) tabeli.
- **Dodawanie użytkownika:**
  1.  Administrator klika przycisk "Dodaj użytkownika".
  2.  Otwiera się okno `AddUserDialog`.
  3.  Administrator wypełnia formularz i klika "Zapisz".
  4.  Po pomyślnym utworzeniu użytkownika, okno dialogowe zamyka się, wyświetla się powiadomienie "toast" o sukcesie, a nowy użytkownik pojawia się w tabeli.
- **Usuwanie użytkownika:**
  1.  Administrator klika menu akcji w wierszu użytkownika, którego chce usunąć, i wybiera "Usuń".
  2.  Otwiera się okno `DeleteUserAlert` z prośbą o potwierdzenie.
  3.  Administrator klika "Usuń".
  4.  Wiersz danego użytkownika w tabeli może pokazać wskaźnik ładowania, a po pomyślnym usunięciu znika z tabeli. Wyświetla się powiadomienie "toast" o sukcesie.

## 9. Warunki i walidacja

- **Ochrona ścieżki:** Middleware na serwerze (Astro) musi przekierować niezalogowanych użytkowników lub użytkowników bez roli `ADMIN` próbujących uzyskać dostęp do `/admin` na główną stronę aplikacji: `/`.
- **Formularz dodawania użytkownika:** Walidacja po stronie klienta (w `AddUserDialog`) musi sprawdzać obecność i format danych (`username`, `email`, `password`) przed wysłaniem żądania do API.
- **Uniemożliwienie samousunięcia:** W komponencie `UserActionsDropdown` przycisk "Usuń" musi być nieaktywny (`disabled`) dla wiersza należącego do zalogowanego administratora. Warunek: `user.id === currentUserId`.

## 10. Obsługa błędów

- **Błąd pobierania listy użytkowników:** Jeśli `GET /api/users` zwróci błąd, zamiast tabeli należy wyświetlić komunikat o błędzie z przyciskiem "Spróbuj ponownie".
- **Błąd dodawania użytkownika:**
  - **Duplikat (409 Conflict):** API zwraca błąd, jeśli email lub nazwa użytkownika już istnieją. Należy wyświetlić "toast" z komunikatem "Użytkownik o tej nazwie lub adresie e-mail już istnieje." Formularz nie powinien być czyszczony.
  - **Inne błędy (500, etc.):** Wyświetlić generyczny "toast" z komunikatem "Wystąpił błąd podczas dodawania użytkownika."
- **Błąd usuwania użytkownika:** Jeśli `DELETE /api/users/{id}` zwróci błąd, należy zresetować stan `isDeleting` dla danego użytkownika i wyświetlić "toast" z komunikatem "Nie udało się usunąć użytkownika."

## 11. Kroki implementacji

1.  **Utworzenie plików:**
    - Strona Astro: `/src/pages/admin/index.astro`.
    - Główny komponent widoku: `/src/components/views/AdminPanelView.tsx`.
    - Komponenty podrzędne w `/src/components/admin/`: `UserManagementView.tsx`, `UsersTable.tsx`, `AddUserDialog.tsx`, `DeleteUserAlert.tsx`.
2.  **Middleware:** Upewnienie się, że middleware w `/src/middleware/index.ts` poprawnie zabezpiecza ścieżkę `/admin`.
3.  **Struktura widoku:** Zaimplementowanie komponentu `AdminPanelView` z nawigacją w formie zakładek.
4.  **Zarządzanie stanem:** Stworzenie customowego hooka `useAdminUsers` (`/src/lib/hooks/useAdminUsers.ts`), który będzie zawierał logikę pobierania danych i początkową strukturę funkcji `addUser` i `deleteUser`.
5.  **Wyświetlanie danych:** Zaimplementowanie komponentów `UserManagementView` i `UsersTable` do wyświetlania listy użytkowników pobranej za pomocą hooka `useAdminUsers`.
6.  **Implementacja dodawania użytkownika:** Zbudowanie komponentu `AddUserDialog` wraz z formularzem, walidacją po stronie klienta (z użyciem `zod` i `react-hook-form`) i integracją z funkcją `addUser` z hooka.
7.  **Implementacja usuwania użytkownika:** Zbudowanie komponentu `DeleteUserAlert` oraz `UserActionsDropdown`. Połączenie ich z funkcją `deleteUser` z hooka, w tym obsługa stanu `isDeleting`.
8.  **Obsługa błędów i stanów ładowania:** Uzupełnienie implementacji o obsługę wszystkich przypadków brzegowych: stany ładowania (skeletons), błędy API (toasty, komunikaty) i walidacja UI (np. wyłączanie przycisku usuwania).
9.  **Stylowanie i dopracowanie UI:** Dostosowanie komponentów z Shadcn/ui do wyglądu aplikacji, zapewnienie responsywności i spójności wizualnej.
10. **Testowanie manualne:** Przeprowadzenie testów wszystkich historyjek użytkownika (`US-003`, `US-004`) w celu weryfikacji poprawności działania.
