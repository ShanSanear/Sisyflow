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

### Pod-widok: Modal Tworzenia/Edycji Ticketa

- **Nazwa widoku:** Ticket Modal View
- **Wyzwalacz:** Otwierany przez przycisk "Utwórz Ticket" w top barze (tryb tworzenia) lub kliknięcie na kartę ticketa na tablicy (tryb edycji/podglądu), via TicketModalContext (patrz ticket-modal.md).
- **Główny cel:** Umożliwienie tworzenia nowego ticketa, edycji istniejącego lub podglądu szczegółów bez opuszczania widoku tablicy Kanban (MVP bez AI; future AI w ticket-modal-with-ai-suggestions.md).
- **Kluczowe informacje do wyświetlenia:** W trybie tworzenia: puste pola formularza (title Input, description Textarea plain, type Select). W trybie edycji: załadowane dane ticketa (tytuł, opis plain text, typ, osoba przypisana, osoba zgłaszająca - readonly). Informacja o osobie zgłaszającej (nieedytowalna).
- **Kluczowe komponenty widoku:** `Dialog` (modal), `Input` (tytuł), `Textarea` (opis, plain dla MVP), `Select` (typ), `Button` ("Przypisz mnie"), przyciski akcji (Zapisz, Anuluj).
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Walidacja inline; toast po zapisaniu i odświeżenie tablicy; Enter do submit.
  - **Dostępność:** Focus trap w Dialog; ARIA labels dla pól.
  - **Bezpieczeństwo:** Client-side check uprawnień (UserContext); server RLS w Supabase.
- **Przypadki brzegowe i stany błędów:**
  - **Puste stany:** W modalu tworzenia: brak ticketów – zachęta; walidacja inline (Zod).
  - **Walidacja:** Błędy pól (tytuł, typ) lub limit opis <10000 – inline + toast API.
  - **Uprawnienia:** Edycja cudzego: auto 'view' mode jeśli użytkownik nie jest adminem.
  - **Sieciowe:** Offline: disable + toast.
  - **Mobilne:** Full-screen modal.

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

2.  **Główny przepływ (praca z ticketami, MVP bez AI):**
    - Po zalogowaniu, top bar staje się widoczny i umożliwia nawigację do ticketów/panelu.
    - Użytkownik znajduje się na widoku **Tablicy Kanban** (`/` bądź `/board`).
    - **Tworzenie ticketa:**
      - Kliknięcie przycisku "Utwórz Ticket" w top barze otwiera **Modal Tworzenia/Edycji Ticketa** w trybie tworzenia z pustymi polami (via TicketModalContext).
      - Wprowadzenie tytułu (wymagane, walidacja inline Zod) i wyboru typu z listy (Bug, Improvement, Task).
      - Opcjonalne wprowadzenie opisu (plain text, <10000 znaków).
      - Kliknięcie "Zapisz": walidacja, zapis ticketa; modal zamyka się, tablica odświeża się, nowy ticket pojawia w kolumnie "Otwarty", wyświetlany toast sukcesu (Sonner).
      - Anulowanie: zamknięcie modala bez zapisania zmian.
    - **Edycja ticketa:**
      - Kliknięcie na kartę ticketa na tablicy otwiera **Modal Tworzenia/Edycji Ticketa** w trybie edycji z załadowanymi danymi (tytuł, opis plain, typ, assignee). Jeśli nieuprawniony – 'view' mode.
      - Edycja pól (oprócz reportera); jeśli brak assignee, przycisk "Przypisz mnie".
      - Zapis zmian: aktualizacja ticketa, odświeżenie tablicy, toast potwierdzenia.
      - W trybie podglądu: pola readonly, bez edycji.
    - Przeciąganie karty ticketa na tablicy z kolumny "Otwarty" do "W toku", aby zasygnalizować rozpoczęcie pracy.
    - Po ukończeniu zadania przeciąganie karty do kolumny "Zamknięty".

3 **Mapa podróży wraz z integracją AI (Future Step w MVP):**

    - W modalu tworzenia/edycji: Po fill title/desc, klik "Poproś o sugestie AI" – loading (Spinner), analiza via backend (Openrouter.ai).
    - Sugestie: Lista INSERT (Button "Dodaj" – wstaw do description + \n\n) i QUESTION (Checkbox "Zastosowano" – set applied, ai_enhanced=true).
    - Po apply: Show AIRating (1-5 gwiazdek), editable do submit; zapisz rating z ticket.
    - Zapis: Jeśli ai_enhanced=true, set flag w POST/PUT /tickets; ticket pokazuje MagicWand icon w KanbanCard.
    - Edge: Brak sugestii – toast "Opis kompletny"; błąd AI – toast + retry.

4.  **Przepływ Administratora: (bez integracji AI)**
    - Administrator klika link "Panel Administratora" w nawigacji, przechodząc do `/admin`.
    - W panelu wybiera zakładkę "Zarządzanie Użytkownikami", aby dodać lub usunąć użytkownika.
5.  **Przepływ Administratora: (z integracją AI)**
    - To samo co w normalnym przepływie administratora
    - Przechodzi do zakładki "Zarządzanie Dokumentacją", aby zaktualizować kontekst dla AI.

## 4. Układ i struktura nawigacji

- **Główny układ:** Aplikacja posiada stały, górny pasek nawigacyjny oraz główną sekcję treści, w której renderowane są poszczególne widoki.
- **Pasek nawigacyjny:** Jest to główny element nawigacyjny, zawsze widoczny dla zalogowanego użytkownika.
  - **Po lewej:** Logo aplikacji (link do tablicy Kanban).
  - **W centrum:** Linki do głównych widoków: "Tablica Kanban" (dla wszystkich) i "Panel Administratora" (tylko dla Admina).
  - **Po prawej:** Przycisk "Utwórz Ticket" oraz menu użytkownika (ikona/avatar) z opcjami "Mój profil" i "Wyloguj".
- **Nawigacja wewnątrz widoków:** Panel Administratora posiada własną nawigację (zakładki) do przełączania się między zarządzaniem użytkownikami a dokumentacją.

## 5. Kluczowe komponenty

Poniżej znajduje się lista kluczowych, reużywalnych komponentów opartych na bibliotece Shadcn/ui, które będą stanowić podstawę interfejsu (MVP):

- **`Dialog`:** Używany do wszystkich okien modalnych, w tym tworzenia/edycji ticketów.
- **`AlertDialog`:** Do potwierdzeń destrukcyjnych (np. usuwanie).
- **`Button`:** Dla akcji (zapisz, anuluj).
- **`Input`, `Textarea`, `Select`, `Label`:** Elementy formularzy.
- **`Card`:** Dla ticket cards i sekcji.
- **`Table`:** Lista users w admin.
- **`DropdownMenu`:** Menu użytkownika.
- **`Badge`:** Typy ticketów.
- **`Tooltip`:** Pełne tytuły.
- **`Skeleton`:** Loading states.
- **`Sonner`:** Toasts.
- **`Navigation`:** Top bar.
- **`MarkdownViewer`:** Future dla opisu w view (react-markdown).

### 5.2 Komponenty dla Integracji AI (Future w MVP)

- **`SuggestionList`:** Lista sugestii AI z Button/Checkbox (dynamic, Tailwind space-y).
- **`StarRating`:** Ocena 1-5 (custom z lucide-react StarIcon, clickable Buttons).
- **`AIAnalysisButton`:** Przycisk analizy z loading (Button + Spinner).
- **`MagicWandIcon`:** Ikona w TicketCard jeśli ai_enhanced (lucide-react Wand2).
- **`MarkdownViewer`:** Render opisu z MD (react-markdown, w view i preview).
- Integracja: Openrouter.ai via /api/ai endpoints (Supabase edge functions lub Astro API routes).
