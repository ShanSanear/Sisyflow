# Architektura UI dla Sisyflow

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika (UI) dla aplikacji Sisyflow została zaprojektowana w celu zapewnienia prostoty, intuicyjności i efektywności, z głównym naciskiem na zarządzanie zadaniami na tablicy Kanban. Struktura opiera się na podejściu "desktop-first" i wykorzystuje framework Astro z interaktywnymi komponentami React oraz designu opartego na Tailwind z gotowymi komponentami z Shadcn/ui. Kluczowe operacje, takie jak tworzenie i edycja ticketów, odbywają się w oknach modalnych, aby zminimalizować przełączanie kontekstu i utrzymać użytkownika w głównym widoku tablicy. Architektura uwzględnia dwie role użytkowników (Użytkownik i Administrator), dynamicznie dostosowując dostępne widoki i akcje. Zarządzanie stanem globalnym (np. dane zalogowanego użytkownika) realizowane jest przez React Context, a obsługa błędów i stanów ładowania opiera się na globalnych powiadomieniach (toasts) i wskaźnikach (spinners, skeletons).

## 2. Lista widoków

### Widok Uwierzytelniania

- **Nazwa widoku:** Authentication View
- **Ścieżka widoku:** `/auth` (obsługuje logowanie i rejestrację)
- **Główny cel:** Umożliwienie użytkownikom zalogowania się do aplikacji lub, jeśli jest to pierwszy użytkownik, zarejestrowania konta z uprawnieniami Administratora.
- **Kluczowe informacje do wyświetlenia:** Formularz z polami na e-mail i hasło (oraz nazwę użytkownika przy rejestracji), komunikaty o błędach walidacji lub logowania. Brak top bara do momentu zalogowania.
- **Kluczowe komponenty widoku:** `Card`, `Input`, `Button`, `Label`. Widok dynamicznie przełącza się między trybem logowania a rejestracji na podstawie zapytania do API o istnienie jakichkolwiek użytkowników.
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Jasne komunikaty o błędach "inline" pod polami formularza. Obsługa wysyłania formularza klawiszem Enter.
  - **Dostępność:** Użycie semantycznych tagów `<form>`, `<input>`, `<label>`. Zarządzanie focusem.
  - **Bezpieczeństwo:** Komunikacja z API odbywa się przez HTTPS. Hasła nie są przechowywane w stanie aplikacji.

### Widok Główny / Tablica Kanban

- **Nazwa widoku:** Kanban Board View
- **Ścieżka widoku:** `/` (lub `/board`)
- **Główny cel:** Wizualizacja, zarządzanie i śledzenie postępu prac nad ticketami w systemie. Jest to centralny punkt interakcji dla użytkowników.
- **Kluczowe informacje do wyświetlenia:** Trzy kolumny reprezentujące statusy ticketów (`Otwarty`, `W toku`, `Zamknięty`). W kolumnach znajdują się karty ticketów, wyświetlające tytuł, osobę przypisaną, typ (oznaczony kolorem i komponentem `Badge`) oraz ikonę "magicznej różdżki", jeśli użyto sugestii AI. Top bar powinien być renderowany.
- **Kluczowe komponenty widoku:** `BoardContainer`, `KanbanColumn`, `TicketCard`, `Skeleton` (dla stanu ładowania), `Tooltip`, `Badge`.
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Funkcjonalność "przeciągnij i upuść" (drag-and-drop) do zmiany statusu ticketa. Skracanie długich tytułów z wyświetlaniem pełnej treści w tooltipie. Wizualne wskazówki (zmiana cienia/tła) przy najechaniu na kartę. Na urządzeniach mobilnych tablica jest przewijana horyzontalnie. W przypadku braku ticketów - wyświetlenie odpowiedniego komunikatu o ich braku.
  - **Dostępność:** Alternatywna obsługa zmiany statusu poprzez menu kontekstowe na karcie ticketa bądź poprzez użycie klawiatury.
  - **Bezpieczeństwo:** Uprawnienia do zmiany statusu ticketa są weryfikowane po stronie serwera przy każdej operacji.

### Widok Profilu Użytkownika

- **Nazwa widoku:** User Profile View
- **Ścieżka widoku:** `/profile`
- **Główny cel:** Umożliwienie użytkownikowi edycji podstawowych informacji o swoim koncie oraz personalizacji ustawień aplikacji.
- **Kluczowe informacje do wyświetlenia:** Formularz do zmiany nazwy użytkownika, jego hasła, informacja o roli oraz przełącznik do zmiany motywu kolorystycznego (jasny/ciemny). Top bar powinien być renderowany.
- **Kluczowe komponenty widoku:** `Card`, `Input`, `Button`, `Switch` (dla motywu).
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Informacja zwrotna (toast) po pomyślnym zapisaniu zmian.
  - **Dostępność:** Poprawne etykietowanie pól formularza.
  - **Bezpieczeństwo:** Użytkownik może modyfikować tylko własne dane.

### Widok Panelu Administratora

- **Nazwa widoku:** Admin Panel View
- **Ścieżka widoku:** `/admin`
- **Główny cel:** Zapewnienie Administratorowi centralnego miejsca do zarządzania użytkownikami systemu oraz konfiguracji kontekstu dla AI.
- **Kluczowe informacje do wyświetlenia:** Nawigacja w formie zakładek, prowadząca do pod-widoków: "Zarządzanie Dokumentacją" (domyślny widok) i "Zarządzanie Użytkownikami". Top bar powinien być renderowany.
- **Kluczowe komponenty widoku:** `Tabs`.
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Czytelny podział na sekcje.
  - **Dostępność:** Dostępna nawigacja między sekcjami.
  - **Bezpieczeństwo:** Dostęp do całej ścieżki `/admin` jest chroniony przez middleware weryfikujący rolę Administratora.

#### Pod-widok: Zarządzanie Dokumentacją

- **Nazwa widoku:** Documentation Management View
- **Ścieżka widoku:** `/admin/documentation`
- **Główny cel:** Umożliwienie Administratorowi edycji dokumentacji projektu, która służy jako kontekst dla sugestii AI.
- **Kluczowe informacje do wyświetlenia:** Duże pole tekstowe z aktualną treścią dokumentacji, licznik znaków.
- **Kluczowe komponenty widoku:** `Textarea`, `Button` ("Zapisz").
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Wskaźnik zapisywania i informacja zwrotna o powodzeniu operacji.
  - **Dostępność:** Pole tekstowe jest poprawnie etykietowane.
  - **Bezpieczeństwo:** Dostęp chroniony rolą Administratora.

#### Pod-widok: Zarządzanie Użytkownikami

- **Nazwa widoku:** User Management View
- **Ścieżka widoku:** `/admin/users`
- **Główny cel:** Umożliwienie Administratorowi dodawania i usuwania użytkowników.
- **Kluczowe informacje do wyświetlenia:** Tabela z listą wszystkich użytkowników, zawierająca ich nazwę, e-mail, rolę.
- **Kluczowe komponenty widoku:** `Table`, `Button` ("Dodaj użytkownika"), `Dialog` (z formularzem dodawania użytkownika), `AlertDialog` (do potwierdzenia usunięcia), `DropdownMenu` (dla akcji przy każdym wierszu).
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Wszelkie akcje destrukcyjne wymagają dodatkowego potwierdzenia.
  - **Dostępność:** Tabela jest dostępna dla czytników ekranu.
  - **Bezpieczeństwo:** Administrator nie może usunąć własnego konta z poziomu interfejsu.

## 3. Mapa podróży użytkownika

1.  **Uwierzytelnianie:**
    - Nowy system (brak użytkowników): Użytkownik trafia na `/auth` i widzi formularz **rejestracji**. Po utworzeniu konta staje się Administratorem i jest przekierowywany na `/`.
    - Istniejący system: Użytkownik trafia na `/auth` i widzi formularz **logowania**. Po pomyślnym zalogowaniu jest przekierowywany na `/`.
2.  **Główny przepływ (praca z ticketami):**
    - Po zalogowaniu, top bar staje się widoczny i umożliwia nawigację do ticketów/panelu
    - Użytkownik znajduje się na widoku **Tablicy Kanban** (`/` bądź `/board`).
    - Klika przycisk "Utwórz Ticket", co otwiera **Modal Tworzenia/Edycji Ticketa**.
    - Wypełnia formularz, opcjonalnie korzysta z sugestii AI.
    - Zapisuje ticket. Modal zamyka się, tablica odświeża, a nowy ticket jest widoczny w kolumnie "Otwarty".
    - Użytkownik klika na istniejący ticket, co ponownie otwiera **Modal Tworzenia/Edycji Ticketa** (w trybie podglądu/edycji), gdzie może przypisać się do zadania lub edytować treść.
    - Przeciąga kartę ticketa na tablicy z kolumny "Otwarty" do "W toku", aby zasygnalizować rozpoczęcie pracy.
    - Po ukończeniu zadania przeciąga kartę do kolumny "Zamknięty".
3.  **Przepływ Administratora:**
    - Administrator klika link "Panel Administratora" w nawigacji, przechodząc do `/admin`.
    - W panelu wybiera zakładkę "Zarządzanie Użytkownikami", aby dodać lub usunąć użytkownika.
    - Przechodzi do zakładki "Zarządzanie Dokumentacją", aby zaktualizować kontekst dla AI.

## 4. Układ i struktura nawigacji

- **Główny układ:** Aplikacja posiada stały, górny pasek nawigacyjny oraz główną sekcję treści, w której renderowane są poszczególne widoki.
- **Pasek nawigacyjny:** Jest to główny element nawigacyjny, zawsze widoczny dla zalogowanego użytkownika.
  - **Po lewej:** Logo aplikacji (link do tablicy Kanban).
  - **W centrum:** Linki do głównych widoków: "Tablica Kanban" (dla wszystkich) i "Panel Administratora" (tylko dla Admina).
  - **Po prawej:** Przycisk "Utwórz Ticket" oraz menu użytkownika (ikona/avatar) z opcjami "Mój profil" i "Wyloguj".
- **Nawigacja wewnątrz widoków:** Panel Administratora posiada własną nawigację (zakładki) do przełączania się między zarządzaniem użytkownikami a dokumentacją.

## 5. Kluczowe komponenty

Poniżej znajduje się lista kluczowych, reużywalnych komponentów opartych na bibliotece Shadcn/ui, które będą stanowić podstawę interfejsu:

- **`Dialog`:** Używany do wszystkich okien modalnych, w tym tworzenia/edycji ticketów oraz dodawania użytkowników.
- **`AlertDialog`:** Używany do okien dialogowych wymagających potwierdzenia akcji destrukcyjnych (np. usuwanie ticketa, usuwanie użytkownika).
- **`Button`:** Standardowe przyciski dla wszystkich akcji (zapisz, anuluj, utwórz itp.).
- **`Input`, `Textarea`, `Select`, `Label`:** Podstawowe elementy formularzy.
- **`Card`:** Kontener dla kart ticketów na tablicy Kanban oraz dla sekcji w widokach profilu i uwierzytelniania.
- **`Table`:** Używana do wyświetlania listy użytkowników w panelu Administratora.
- **`DropdownMenu`:** Używane dla menu użytkownika w głównym pasku nawigacyjnym oraz dla menu akcji w tabeli użytkowników.
- **`Badge`:** Kolorowe etykiety do wizualnego oznaczania typów ticketów (`Bug`, `Improvement`, `Task`).
- **`Tooltip`:** Używany do wyświetlania pełnych tytułów ticketów po najechaniu myszą.
- **`Skeleton`:** Używany jako wskaźnik ładowania dla całej tablicy Kanban.
- **`Spinner`:** Używany jako wskaźnik ładowania dla akcji wewnątrz komponentów (np. podczas analizy AI w modalu).
- **`Sonner`:** Globalne powiadomienia (typu "pop-up") informujące o powodzeniu lub niepowodzeniu operacji.
- **`Navigation`:** Główny element implementacyjny top bara
