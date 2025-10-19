# Plan implementacji widoku Ticket Modal View

## 1. Przegląd

Widok Ticket Modal View to modalne okno dialogowe służące do tworzenia nowych ticketów, edycji istniejących lub podglądu ich szczegółów w aplikacji Sisyflow. Głównym celem jest zapewnienie intuicyjnego interfejsu do zarządzania ticketami bez opuszczania głównego widoku tablicy Kanban, z integracją sugestii AI poprawiających kompletność opisów. Widok obsługuje role użytkowników, walidację danych i interakcje z API, zapewniając wysoką dostępność i responsywność, szczególnie na urządzeniach mobilnych.

## 2. Routing widoku

Widok nie jest samodzielną stroną, lecz komponentem modalnym osadzonym w głównym widoku tablicy Kanban (`/board`). Otwierany jest programowo poprzez stan aplikacji (useState w komponencie Board), wyzwalany przyciskiem „Utwórz Ticket” w top barze lub kliknięciem na kartę ticketa. Nie wymaga dedykowanej ścieżki URL, ale korzysta z query params (`/board?ticketId=uuid`) do otwierania w trybie edycji.

## 3. Struktura komponentów

Hierarchia komponentów:

- `TicketModal` (główny komponent modalny)
  - `Dialog` (z Shadcn/ui) – kontener modalny
    - `DialogContent` – zawartość modalu
      - `TicketForm` – formularz edycji/danych
        - `TitleInput` – pole tytułu
        - `DescriptionEditor` – edytor Markdown z podglądem
        - `TypeSelect` – wybór typu ticketa
        - `AssigneeSection` – sekcja przypisania osoby
        - `ReporterDisplay` – wyświetlanie osoby zgłaszającej (tylko odczyt)
      - `AIAnalysisButton` – przycisk do analizy AI
      - `AISuggestionsList` – lista sugestii AI (warunkowa)
      - `AIRating` – ocena sugestii (warunkowa)
      - `ActionButtons` – przyciski akcji (Zapisz, Anuluj, Przypisz mnie)

## 4. Szczegóły komponentów

### TicketModal

- Opis komponentu: Główny komponent zarządzający stanem modalu, trybem (create/edit/view) i integracją z API. Składa się z Dialog z Shadcn/ui, obsługuje otwieranie/zamykanie i fokus trap.
- Główne elementy: `<Dialog open={isOpen} onOpenChange={handleClose}>`, `<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">` z `<TicketForm />`, `<AISuggestionsList />`, `<ActionButtons />`.
- Obsługiwane zdarzenia: onOpen (załadowanie danych dla edycji), onClose (reset stanu), keydown (Esc/Enter).
- Obsługiwana walidacja: Koordynuje walidację formularza przed zapisem; blokuje zapis jeśli błędy.
- Typy: `TicketModalProps`, `FullTicketDTO`, `AISuggestionSessionDTO`.
- Propsy: `{ isOpen: boolean, onClose: () => void, mode: 'create' | 'edit' | 'view', initialTicket?: FullTicketDTO, onSave: (ticket: FullTicketDTO) => void }`.

### TicketForm

- Opis komponentu: Formularz do wprowadzania/ edycji danych ticketa, z obsługą Markdown i walidacją client-side.
- Główne elementy: `<form onSubmit={handleSubmit}>`, `<TitleInput />`, `<DescriptionEditor />`, `<TypeSelect />`, `<AssigneeSection />`, `<ReporterDisplay />`.
- Obsługiwane zdarzenia: onSubmit (walidacja i API call), onChange (aktualizacja stanu).
- Obsługiwana walidacja: Tytuł: wymagany, 1-200 znaków; Opis: opcjonalny, <10000 znaków; Typ: wymagany z listy ['Bug', 'Improvement', 'Task'].
- Typy: `CreateTicketCommand`, `UpdateTicketCommand`.
- Propsy: `{ formData: Partial<CreateTicketCommand>, onChange: (data: Partial<CreateTicketCommand>) => void, errors: Record<string, string>, mode: 'create' | 'edit' | 'view' }`.

### DescriptionEditor

- Opis komponentu: Textarea z podglądem Markdown, wykorzystujący bibliotekę jak react-markdown.
- Główne elementy: `<div className="grid md:grid-cols-2 gap-4"> <Textarea /> <MarkdownPreview /> </div>`.
- Obsługiwane zdarzenia: onChange (aktualizacja opisu i podglądu).
- Obsługiwana walidacja: Limit długości, ostrzeżenie o przekroczeniu.
- Typy: `string` dla opisu.
- Propsy: `{ value: string, onChange: (value: string) => void, error?: string }`.

### TypeSelect

- Opis komponentu: Dropdown do wyboru typu ticketa z predefiniowanymi opcjami.
- Główne elementy: `<Select>` z Shadcn/ui, opcje: Bug, Improvement, Task.
- Obsługiwane zdarzenia: onValueChange.
- Obsługiwana walidacja: Wymagany wybór.
- Typy: `Ticket['type']`.
- Propsy: `{ value: Ticket['type'], onChange: (value: Ticket['type']) => void, error?: string }`.

### AssigneeSection

- Opis komponentu: Sekcja do przypisywania użytkownika, z opcją „Przypisz mnie” dla nieprzypisanych.
- Główne elementy: `<Select>` dla admina (lista użytkowników), lub `<Button>Przypisz mnie</Button>` dla zwykłych users.
- Obsługiwane zdarzenia: onValueChange, onClick (self-assign).
- Obsługiwana walidacja: Opcjonalna, ale sprawdza uprawnienia.
- Typy: `UpdateTicketAssigneeCommand`, `UserDTO[]`.
- Propsy: `{ assignee?: Pick<Profile, 'username'>, currentUser: UserDTO, users: UserDTO[], isAdmin: boolean, onAssign: (assigneeId: string | null) => void, mode: string }`.

### AISuggestionsList

- Opis komponentu: Dynamiczna lista sugestii AI z przyciskami „Dodaj” i checkboxami.
- Główne elementy: `<ul>` z itemami: dla INSERT – `<Button>Dodaj</Button>`, dla QUESTION – `<Checkbox>Zastosowano</Checkbox>`.
- Obsługiwane zdarzenia: onClick (dodaj tekst do opisu), onCheckedChange (oznacz jako zastosowane, set ai_enhanced=true).
- Obsługiwana walidacja: Brak, ale śledzi zastosowane sugestie.
- Typy: `AISuggestionSessionDTO`.
- Propsy: `{ suggestions: AISuggestionSessionDTO['suggestions'], onApplyInsert: (content: string) => void, onApplyQuestion: (index: number) => void }`.

### AIRating

- Opis komponentu: Komponent oceny gwiazdkami 1-5 po analizie AI.
- Główne elementy: 5 `<Button variant="ghost">` z ikonami gwiazdek, lub custom StarRating z Shadcn.
- Obsługiwane zdarzenia: onClick (wybór ratingu).
- Obsługiwana walidacja: Wymagany po sugestiach? Opcjonalny.
- Typy: `RateAISuggestionCommand`.
- Propsy: `{ rating: number | null, onRate: (rating: number) => void }`.

### ActionButtons

- Opis komponentu: Przyciski akcji na dole modalu.
- Główne elementy: `<div className="flex justify-end gap-2"> <Button variant="outline">Anuluj</Button> <Button>Zapisz</Button> </div>`.
- Obsługiwane zdarzenia: onClick (anuluj: close, zapisz: submit).
- Obsługiwana walidacja: Wyłączone jeśli loading lub błędy.
- Typy: Brak specyficznych.
- Propsy: `{ onCancel: () => void, onSave: () => void, isLoading: boolean, isValid: boolean }`.

## 5. Typy

Wykorzystujemy istniejące typy z `src/types.ts`. Nowe typy dla widoku:

- `TicketModalMode = 'create' | 'edit' | 'view'` – określa tryb modalu.
- `TicketModalState` – ViewModel dla stanu modalu:
  - `mode: TicketModalMode`
  - `ticket?: FullTicketDTO` – dane początkowe dla edyt/podgląd
  - `formData: Partial<CreateTicketCommand>` – aktualne dane formularza (title: string, description?: string, type: Ticket['type'])
  - `suggestions?: AISuggestionSessionDTO` – sesja sugestii AI (session_id: string, suggestions: Array<{type: 'INSERT' | 'QUESTION', content: string, applied: boolean}>)
  - `rating: number | null` – ocena AI (1-5)
  - `aiEnhanced: boolean` – flaga czy użyto AI (ustawiana po zastosowaniu sugestii)
  - `loading: boolean` – stan ładowania (API calls)
  - `errors: Record<string, string>` – błędy walidacji (np. {title: 'Pole wymagane'})
  - `users: UserDTO[]` – lista użytkowników dla select (dla admina)

Powiązane typy: `FullTicketDTO` (z reporter/assignee), `AnalyzeTicketCommand` (title/description dla AI), `RateAISuggestionCommand` (rating).

## 6. Zarządzanie stanem

Stan zarządzany lokalnie w `TicketModal` za pomocą `useState` dla `TicketModalState`. Custom hook `useTicketModal` do inicjalizacji stanu, obsługi submit i resetu. Dla sugestii AI – osobny stan w `useState<AISuggestionSessionDTO | null>`. Użyj `useEffect` do ładowania danych przy otwarciu (jeśli edit/view: fetch GET /tickets/:id). Integracja z globalnym stanem (np. Redux/Zustand jeśli istnieje, ale dla MVP lokalny stan wystarczy). Po zapisaniu – callback onSave do odświeżenia tablicy w rodzicu.

## 7. Integracja API

- **POST /tickets**: Tworzenie – request: `CreateTicketCommand`, response: `FullTicketDTO` (201). Użyj fetch z auth headers z locals.user.
- **GET /tickets/:id**: Ładowanie dla edyt/view – response: `FullTicketDTO` (200).
- **PUT /tickets/:id**: Edycja – request: `UpdateTicketCommand` (partial), response: `FullTicketDTO` (200).
- **PATCH /tickets/:id/assignee**: Przypisanie – request: `{assignee_id: string | null}`, response: `FullTicketDTO` (200).
- **POST /ai-suggestion-sessions/analyze**: Analiza AI – request: `AnalyzeTicketCommand`, response: `AISuggestionSessionDTO` (200), z loading spinnerem.
- **PUT /ai-suggestion-sessions/:id/rating**: Ocena – request: `{rating: number | null}`, brak response body.

Wszystkie calls z error handling (try/catch, toasts). Auth: użyj Supabase client z cookies/locals.

## 8. Interakcje użytkownika

- Otwarcie modalu: Kliknięcie „Utwórz Ticket” (create, puste pola) lub karty (edit/view, załaduj dane). Fokus na tytuł.
- Wypełnianie formularza: Wpis title/description, wybór type/assignee. Enter submituje.
- Analiza AI: Klik „Poproś o sugestie AI” – loading, potem lista sugestii. Jeśli brak – komunikat „Opis kompletny”.
- Zastosowanie sugestii: „Dodaj” wstawia tekst na końcu opisu (+2 nowe linie), checkbox oznacza applied i set ai_enhanced=true.
- Ocena: Wybór gwiazdek po sugestiach, zapisz przy submit.
- Przypisanie: „Przypisz mnie” dla nieprzypisanych (PATCH), admin wybiera z listy.
- Zapisz: Walidacja, API call, toast sukces, close + odśwież tablicę.
- Anuluj/Esc: Close bez zapisu, reset stanu.
- Podgląd (view): Pola readonly, brak submit, description renderowane jako markdown, opcja close.
- Mobilne: Modal full-screen, touch-friendly buttons.

## 9. Warunki i walidacja

- **Client-side walidacja** (w `TicketForm`): Użyj Zod schema zgodne z API – title: z.string().min(1).max(200), description: z.string().max(10000).optional(), type: z.enum(['Bug', 'Improvement', 'Task']). Błędy inline pod polami (czerwone borders/tooltips). Blokada submit jeśli !isValid.
- **Uprawnienia**: Sprawdź locals.user.role – admin: pełna edycja, user: tylko własne tickety (if reporter_id === user.id lub admin). Tryb tylko do podglądu dla innych.
- **Tryby**: Create: reporter_id = current user, assignee null; Edit: editable if allowed; View: readonly.
- **AI**: Tylko po zalogowaniu, błędy nie blokują submit.
- **Długość**: Live counter dla description, ostrzeżenie >8000 znaków.

## 10. Obsługa błędów

- **Walidacja**: Inline errors (np. „Tytuł jest wymagany”) + shake animacja.
- **API Errors**: 400/403/404/500 – toasty (Shadcn Toast): „Błąd walidacji”, „Brak uprawnień”, „Ticket nie znaleziony”, „Błąd serwera”. Dla AI: „Nieudana analiza, spróbuj ponownie” z retry button.
- **Brzegowe**: Brak ticketów – komunikat w modalu; Offline – detect navigator.onLine, disable buttons + toast „Brak połączenia”.
- **AI Brak**: Jeśli brak dokumentacji – komunikat o jej braku.
- **Permissions**: Unauthorized – redirect do login.
- Logging: console.error dla dev, Supabase errors table jeśli zintegrowane. Tabela ai_errors jesli AI jest implementowane.

## 11. Kroki implementacji podstawowej

1. Utwórz nowy plik `src/components/ticket/TicketModal.tsx` z importami Shadcn (Dialog, Input, Textarea, Select, Button, Checkbox) i react-markdown.
2. Zdefiniuj typy w `src/types.ts` (dodaj TicketModalMode, TicketModalState jeśli potrzebne).
3. Zaimplementuj `TicketForm` z walidacją Zod (import z lib/utils).
4. Dodaj `DescriptionEditor` z podglądem Markdown (użyj @uiw/react-md-editor lub simple react-markdown).
5. Stwórz custom hook `useTicketModal` do zarządzania stanem i API calls (użyj fetch lub Supabase SDK).
6. Integruj `TicketModal` w `Board.tsx` (otwórz z buttonem/kartą, onSave refetch tickets).
7. Dodaj self-assign w `AssigneeSection` z PATCH call.
8. Testuj walidację, tryby, AI flow (mock API jeśli potrzeba).
9. Dodaj ARIA labels, keyboard nav (focus trap w Dialog), responsive classes Tailwind.
10. Uruchom `npm run lint:fix` i `npm run format` do cleanup.
11. Przetestuj edge cases: błędy, mobile, permissions.

## 12. Kroki implementacji w drugiej rundzie - AI

1. Zaimplementuj `AISuggestionsList` i `AIRating` z logiką apply/rate.
2. Zaimplementuj obsługę błędów i ich zapisywanie do tabeli ai_errors.
3. Uruchom `npm run lint:fix` i `npm run format` do cleanup.
4. Przetestuj edge cases: błędy, mobile, permissions.
