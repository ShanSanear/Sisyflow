# Plan implementacji widoku Ticket Modal View

## 1. Przegląd

Widok Ticket Modal View to modalne okno dialogowe służące do tworzenia nowych ticketów, edycji istniejących lub podglądu ich szczegółów w aplikacji Sisyflow (wersja MVP bez integracji AI). Głównym celem jest zapewnienie intuicyjnego interfejsu do zarządzania ticketami bez opuszczania głównego widoku tablicy Kanban. Widok obsługuje role użytkowników, walidację danych i interakcje z API Supabase, zapewniając wysoką dostępność i responsywność, szczególnie na urządzeniach mobilnych. Integracja AI (sugestie, rating) jest future feature – patrz ticket-modal-with-ai-suggestions.md.

## 2. Routing widoku

Widok nie jest samodzielną stroną, lecz komponentem modalnym osadzonym w głównym widoku tablicy Kanban (`/board`). Otwierany jest programowo poprzez globalny TicketModalContext (React Context w src/lib/TicketModalContext.tsx), wyzwalany przyciskiem „Create Ticket” w NavigationBar (tryb tworzenia) lub kliknięciem na kartę ticketa (tryb edycji/podglądu). Nie wymaga dedykowanej ścieżki URL, ale korzysta z query params (`/board?ticketId=uuid`) do otwierania w trybie edycji/podglądu. Po close modala, czyść query params via history.replaceState.

### 2.1 Integracja z NavigationBar

Użyj TicketModalContext do komunikacji:

- W NavigationBar.tsx: useTicketModal() do setOpen({ mode: 'create', ticketId: null }) zamiast window.location.href.
- W Board.tsx (KanbanBoardView): useContext do renderowania <TicketModal /> i obsługi query params (np. const urlParams = new URLSearchParams(window.location.search); if (urlParams.get('ticketId')) setOpen({ mode: 'edit', ticketId: urlParams.get('ticketId') })).
- Context definiuje: { isOpen: boolean, mode: 'create'|'edit'|'view', ticketId?: string, setOpen: (data: {mode: string, ticketId?: string}) => void, onClose: () => void, onSave: (ticket: FullTicketDTO) => void }.

## 3. Struktura komponentów

Hierarchia komponentów (MVP bez AI):

- `TicketModal` (główny komponent modalny)
  - `Dialog` (z Shadcn/ui) – kontener modalny
    - `DialogContent` – zawartość modalu (max-w-2xl max-h-[90vh] overflow-y-auto, Tailwind responsive)
      - `TicketForm` – formularz edycji/danych
        - `TitleInput` – pole tytułu (Input z Shadcn)
        - `DescriptionEditor` – edytor tekstu (Textarea z Shadcn, plain text dla MVP)
        - `TypeSelect` – wybór typu ticketa (Select z Shadcn)
        - `AssigneeSection` – sekcja przypisania osoby
        - `ReporterDisplay` – wyświetlanie osoby zgłaszającej (tylko odczyt, Badge/Avatar)
      - `ActionButtons` – przyciski akcji (Zapisz, Anuluj, Przypisz mnie)

## 4. Szczegóły komponentów

### TicketModal

- Opis komponentu: Główny komponent zarządzający stanem modalu, trybem (create/edit/view) i integracją z backend API aplikacji. Używa Dialog z Shadcn/ui, obsługuje otwieranie/zamykanie i focus trap (wbudowany w Dialog).
- Główne elementy: `<Dialog open={isOpen} onOpenChange={onClose}>`, `<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">` z `<TicketForm />`, `<ActionButtons />`.
- Obsługiwane zdarzenia: onOpen (załadowanie danych dla edycji via useEffect i fetch GET /tickets/:id), onClose (reset stanu via onClose callback), keydown (Esc/Enter via Dialog props).
- Obsługiwana walidacja: Koordynuje walidację formularza przed zapisem; blokuje zapis jeśli błędy (use Zod schema).
- Typy: `TicketModalProps`, `FullTicketDTO`.
- Propsy: `{ isOpen: boolean, onClose: () => void, mode: 'create' | 'edit' | 'view', initialTicket?: FullTicketDTO, onSave: (ticket: FullTicketDTO) => void, user: UserDTO z UserContext, isAdmin: boolean }`.

### TicketForm

- Opis komponentu: Formularz do wprowadzania/edycji danych ticketa, z obsługą plain text i walidacją client-side (Zod).
- Główne elementy: `<form onSubmit={handleSubmit}>`, `<TitleInput />`, `<DescriptionEditor />`, `<TypeSelect />`, `<AssigneeSection />`, `<ReporterDisplay />`.
- Obsługiwane zdarzenia: onSubmit (walidacja i API call), onChange (aktualizacja stanu formData).
- Obsługiwana walidacja: Tytuł: wymagany, 1-200 znaków; Opis: opcjonalny, <10000 znaków; Typ: wymagany z listy ['Bug', 'Improvement', 'Task']. Błędy inline pod polami (czerwone borders + <p className="text-destructive text-sm mt-1">{error}</p>).
- Typy: `CreateTicketCommand`, `UpdateTicketCommand`.
- Propsy: `{ formData: Partial<CreateTicketCommand>, onChange: (data: Partial<CreateTicketCommand>) => void, errors: Record<string, string>, mode: 'create' | 'edit' | 'view', user: UserDTO, isAdmin: boolean }`.

### DescriptionEditor

- Opis komponentu: Proste pole tekstowe do opisu ticketa (dla MVP: plain text bez Markdown preview lub renderingu; future: dodaj react-markdown – patrz ticket-modal-with-ai-suggestions.md).
- Główne elementy: `<Textarea rows={10} placeholder="Opisz ticket..." className={error ? 'border-destructive' : ''} />` z Shadcn.
- Obsługiwane zdarzenia: onChange (aktualizacja opisu).
- Obsługiwana walidacja: Limit długości, licznik znaków na dole (np. <p>{value.length}/10000</p>), ostrzeżenie >8000.
- Typy: `string` dla opisu.
- Propsy: `{ value: string, onChange: (value: string) => void, error?: string, mode: string }`. W 'view': readonly.

### TypeSelect

- Opis komponentu: Dropdown do wyboru typu ticketa z predefiniowanymi opcjami (Shadcn Select).
- Główne elementy: `<Select>`, opcje: Bug, Improvement, Task (z value i placeholder).
- Obsługiwane zdarzenia: onValueChange.
- Obsługiwana walidacja: Wymagany wybór (error jeśli pusty).
- Typy: `Ticket['type']`.
- Propsy: `{ value: Ticket['type'], onChange: (value: Ticket['type']) => void, error?: string, mode: string }`. W 'view': disabled.

### AssigneeSection

- Opis komponentu: Sekcja do przypisywania użytkownika, z opcją „Przypisz mnie” dla nieprzypisanych (dla usera); admin ma Select z listą users.
- Główne elementy: Jeśli !isAdmin: `<Button variant="outline" onClick={() => onAssign(user.id || null)}>Przypisz mnie</Button>` (jeśli assignee null; unassign via inny button); dla admin: `<Select>` z fetch GET /users (lista UserDTO[]).
- Obsługiwane zdarzenia: onClick (self-assign via PATCH /tickets/:id/assignee), onValueChange (dla admin).
- Obsługiwana walidacja: Opcjonalna, sprawdza uprawnienia (tylko self-assign jeśli !assignee i !isAdmin).
- Typy: `UpdateTicketAssigneeCommand`, `UserDTO[]`.
- Propsy: `{ assignee?: Pick<Profile, 'username'>, currentUser: UserDTO, users: UserDTO[], isAdmin: boolean, onAssign: (assigneeId: string | null) => void, mode: string }`. W 'view': readonly display.

### ReporterDisplay

- Opis komponentu: Wyświetlanie osoby zgłaszającej (nieedytowalne).
- Główne elementy: `<div>Reporter: <span className="font-medium">{reporter.username}</span></div>` lub Avatar + Badge.
- Propsy: `{ reporter: Pick<Profile, 'username'> }`.

### ActionButtons

- Opis komponentu: Przyciski akcji na dole modalu (Shadcn Button).
- Główne elementy: `<div className="flex justify-end gap-2 mt-4"> <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button> {mode !== 'view' && <Button type="submit" disabled={!isValid || loading}>Save</Button>} </div>`.
- Obsługiwane zdarzenia: onClick (cancel: onClose, save: submit form).
- Obsługiwana walidacja: Save wyłączony jeśli loading lub !isValid (z Zod).
- Typy: Brak specyficznych.
- Propsy: `{ onCancel: () => void, onSave: () => void, isLoading: boolean, isValid: boolean, mode: string }`.

## 5. Typy

Wykorzystujemy istniejące typy z `src/types.ts`. Nowe typy dla widoku (MVP bez AI):

- `TicketModalMode = 'create' | 'edit' | 'view'` – określa tryb modalu.
- `TicketModalState` – ViewModel dla stanu modalu:
  - `mode: TicketModalMode`
  - `ticket?: FullTicketDTO` – dane początkowe dla edyt/podgląd
  - `formData: Partial<CreateTicketCommand>` – aktualne dane formularza (title: string, description?: string, type: Ticket['type'])
  - `loading: boolean` – stan ładowania (API calls)
  - `errors: Record<string, string>` – błędy walidacji (np. {title: 'Pole wymagane'})
  - `users: UserDTO[]` – lista użytkowników dla select (dla admina, fetch jeśli potrzeba, jeśli nie ma endpointa - dummy data)

Powiązane typy: `FullTicketDTO` (z reporter/assignee, ignoruj ai_enhanced dla MVP), `CreateTicketCommand`, `UpdateTicketCommand`, `AnalyzeTicketCommand` (future).

Walidacja Zod (import { z } from 'zod';):
const ticketSchema = z.object({
title: z.string().min(1, 'Tytuł wymagany').max(200, 'Tytuł max 200 znaków'),
description: z.string().max(10000, 'Opis max 10000 znaków').optional(),
type: z.enum(['Bug', 'Improvement', 'Task'], { required_error: 'Typ wymagany' })
});

## 6. Zarządzanie stanem

Stan zarządzany lokalnie w `TicketModal` za pomocą `useState` dla `TicketModalState`. Custom hook `useTicketModal` (w src/components/hooks/useTicketModal.ts) do inicjalizacji stanu, obsługi submit i resetu. Dla 'create': formData = { title: '', description: '', type: 'Task' }, reporter_id = user.id z UserContext. Użyj `useEffect` do ładowania danych przy otwarciu (jeśli edit/view: fetch GET /tickets/:id poprzez API backendowe). Integracja z globalnym stanem via TicketModalContext i UserContext (z NavigationBar). Po zapisaniu – callback onSave do refetch ticketów w Board.tsx (useState refetch).

## 7. Integracja API

- **POST /tickets**: Tworzenie – request: `CreateTicketCommand` (bez description jeśli puste), response: `FullTicketDTO` (201). Pamiętaj o auth.
- **GET /tickets/:id**: Ładowanie dla edit/view – response: `FullTicketDTO` (200).
- **PUT /tickets/:id**: Edycja – request: `UpdateTicketCommand` (partial, bez reporter_id), response: `FullTicketDTO` (200).
- **PATCH /tickets/:id/assignee**: Przypisanie – request: `{assignee_id: string | null}`, response: `FullTicketDTO` (200).
- **DELETE /tickets/:id**: Usuwanie (admin only, future).

Wszystkie calls z error handling (try/catch, toasts via sonner). Auth: /api/auth/\* endpoints.

## 8. Interakcje użytkownika

- Otwarcie modalu: Z NavigationBar (create, puste pola, fokus na tytuł via useRef + useEffect) lub z karty (edit/view, załaduj dane via fetch). Użyj TicketModalContext do wyzwolenia.
- Wypełnianie formularza: Wpis title/description, wybór type/assignee. Enter submituje form.
- Przypisanie: „Assign me” dla nieprzypisanych (PATCH), admin wybiera z listy (Select).
- Zapisz: Walidacja Zod, API call, toast sukces (sonner), onClose + onSave (refetch w Board).
- Anuluj/Esc: onClose bez zapisu, reset stanu.
- Podgląd (view): Pola readonly (disabled + plain text), brak submit, opis jako plain text, opcja close.
- Mobilne: Modal full-screen (Tailwind sm:max-w-2xl else w-full), touch-friendly buttons.
- Uprawnienia: Client-side check (if mode='edit' && reporter_id !== user.id && !isAdmin → switch to 'view' + toast).

## 9. Warunki i walidacja

- **Client-side walidacja** (w `TicketForm`): Użyj Zod schema (jak w sekcji 5) – safeParse(formData) do errors. Błędy inline pod polami (czerwone borders/tooltips via Tailwind + Shadcn). Blokada submit jeśli !isValid || (errors.length > 0).
- **Uprawnienia**: Z UserContext – admin: pełna edycja; user: tylko własne tickety (if reporter_id === user.id lub admin). Tryb view dla innych. Client-side switch + server-side via Supabase RLS.
- **Tryby**: Create: reporter_id = current user, assignee null; Edit: editable if allowed; View: readonly.
- **Długość**: Live counter dla description, ostrzeżenie >8000 znaków (Tailwind text-warning).

## 10. Obsługa błędów

- **Walidacja**: Inline errors (np. „Title required”) + shake animacja (Tailwind @keyframes).
- **API Errors**: 400/403/404/500 – toasty (Shadcn Sonner): „Validation error”, „Unauthorized” (switch to view), „Ticket not found”, „Server error”. Retry button dla fetch errors.
- **Brzegowe**: Brak ticketu – toast + close; Offline – navigator.onLine, disable buttons + toast „No connetion (offline)” (disable submit).
- **Permissions**: Unauthorized (401) – redirect do /auth.
- Logging: console.error dla dev

## 11. Kroki implementacji podstawowej (MVP)

1. Utwórz `src/lib/TicketModalContext.tsx` z React Context jak w sekcji 2.1 (TypeScript).
2. Utwórz nowy plik `src/components/ticket/TicketModal.tsx` z importami Shadcn (Dialog, Input, Textarea, Select, Button) i Zod (z `lib/validation/ticket.validation.ts` jeśli dostępne, jeśli nie - dodaj tam i zaimportuj, pamiętaj o używaniu obsługi błędów z `lib/utils.ts`).
3. Zdefiniuj typy w `src/types.ts` (dodaj TicketModalMode, TicketModalState bez AI).
4. Zaimplementuj `TicketForm` z walidacją Zod.
5. Dodaj `DescriptionEditor` jako proste Textarea (bez preview).
6. Stwórz custom hook `useTicketModal` do zarządzania stanem i API calls.
7. Integruj `TicketModal` w `KanbanBoardView.tsx` (useContext, render if isOpen, onSave refetch tickets via API).
8. Zaktualizuj NavigationBar.tsx: useTicketModal do setOpen('create').
9. Dodaj self-assign w `AssigneeSection` z PATCH call (API call).
10. Testuj walidację, tryby, uprawnienia (mock user role).
11. Dodaj ARIA labels (aria-label dla buttons/inputs), keyboard nav (focus trap w Dialog), responsive classes Tailwind (sm: etc.).
12. Uruchom `npm run lint:fix` i `npm run format`.
13. Przetestuj edge cases: błędy, mobile, permissions.
