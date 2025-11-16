# Plan implementacji widoku Ticket Modal View

## 1. Przegląd

Widok Ticket Modal View to modalne okno dialogowe służące do tworzenia nowych ticketów, edycji istniejących lub podglądu ich szczegółów w aplikacji Sisyflow (wersja MVP bez integracji AI). Głównym celem jest zapewnienie intuicyjnego interfejsu do zarządzania ticketami bez opuszczania głównego widoku tablicy Kanban. Widok obsługuje role użytkowników, walidację danych i interakcje z API Supabase, zapewniając wysoką dostępność i responsywność, szczególnie na urządzeniach mobilnych. Integracja AI (sugestie, rating) jest future feature – patrz ticket-modal-with-ai-suggestions.md.

## 2. Routing widoku

Widok nie jest samodzielną stroną, lecz komponentem modalnym osadzonym w głównym widoku tablicy Kanban (`/board`). Otwierany jest programowo poprzez globalny TicketModalContext (React Context w src/lib/contexts/TicketModalContext.tsx), wyzwalany przyciskiem „Create Ticket” w NavigationBar (tryb tworzenia) lub kliknięciem na kartę ticketa (tryb edycji/podglądu). Nie wymaga dedykowanej ścieżki URL, ale korzysta z query params (`/board?ticketId=uuid`) do otwierania w trybie edycji/podglądu. Po close modala, czyść query params via history.replaceState.

### 2.1 Integracja z NavigationBar

Użyj TicketModalContext do komunikacji:

- W NavigationBar.tsx: useTicketModal() do setOpen({ mode: 'create', ticketId: null }) zamiast window.location.href.
- W Board.tsx (KanbanBoardView): useContext do renderowania <TicketModal /> i obsługi query params (np. const urlParams = new URLSearchParams(window.location.search); if (urlParams.get('ticketId')) setOpen({ mode: 'edit', ticketId: urlParams.get('ticketId') })).
- Context definiuje: { isOpen: boolean, mode: 'create'|'edit'|'view', ticketId?: string, setOpen: (data: {mode: string, ticketId?: string}) => void, onClose: () => void, onSave: (ticket: FullTicketDTO) => void }.
- Założenie: Istnieje src/lib/contexts/UserContext.tsx z hookiem useUser() zwracającym { user: UserDTO | null, isAdmin: boolean, refetchUser: () => Promise<void> }. Użyj useUser() w TicketModal do pobierania roli. Jeśli UserContext nie istnieje, stwórz go z tokenem z cookies (via middleware w src/middleware/index.ts, który injectuje supabase z context.locals.supabase z src/db/supabase.client.ts). Fetch roli via GET /api/profiles/me, gdzie backend używa supabase.auth.getUser() z tokenem z locals.

### 2.2 Implementacja Auth i Kontekstów w Astro

- **UserContext:** Jeśli nie istnieje, stwórz `src/lib/contexts/UserContext.tsx` jako React Context. Użyj `useEffect` do fetch `/api/profiles/me` (z auth via cookies – middleware w `src/middleware/index.ts` auto-dodaje Bearer token z Supabase session do headers fetch). Hook `useUser()` zwraca `{ user: UserDTO | null, isAdmin: boolean, refetchUser: () => Promise<void> }`. Nie używaj Supabase SDK bezpośrednio na frontendzie (tylko fetch); middleware (`src/middleware/index.ts`) parsuje cookies (np. `supabase.auth.token`) i injectuje do `context.locals.user` dla API routes. Przykład: W middleware: `const { data: { user } } = await supabase.auth.getUser(event.locals.supabaseAccessToken); context.locals.user = user;`.
- **TicketModalContext:** Stwórz `src/lib/contexts/TicketModalContext.tsx` z Providerem w `src/components/layout/Layout.tsx` (embedowanym w każdej .astro page via `<Layout>`). Context: `{ isOpen: boolean, mode: 'create'|'edit'|'view', ticketId?: string, setOpen: (data: {mode: string, ticketId?: string}) => void, onClose: () => void, onSave: (ticket: FullTicketDTO) => void }`. W `src/pages/Board.astro`: `<Client:load code="./KanbanBoardView.tsx" />` i w KanbanBoardView: `const { isOpen, ... } = useTicketModal();` + `<TicketModal client:load />` (jako React island).
- **Query Params Handling:** W `KanbanBoardView.tsx`: `import { getCurrentInstance } from 'astro'; const { url } = Astro; const urlParams = new URLSearchParams(url.search); if (urlParams.get('ticketId')) { setOpen({ mode: 'edit', ticketId: urlParams.get('ticketId') }); }`. OnClose: `const newUrl = new URL(Astro.url); newUrl.searchParams.delete('ticketId'); history.replaceState({}, '', newUrl.toString());` (kompatybilne z Astro client-side routing).
- **Layout** Użyj React 19 islands w Astro 5 dla hydratacji; unikaj pełnego Supabase SDK na frontendzie – tylko fetch do /api z auto-auth.

### 2.3 Mechanizm przełączania między trybami View/Edit

- **Domyślny tryb:** Modal otwiera się domyślnie w trybie "view" (nie "edit") przy kliknięciu na kartę ticketa, zapewniając bezpieczny podgląd przed edycją.
- **Przycisk Edit:** W trybie "view" widoczny jest przycisk "Edit" obok przycisku "Close" (w tym samym miejscu gdzie przycisk "Save" w trybie edit). Przycisk widoczny tylko jeśli użytkownik ma uprawnienia do edycji (admin lub właściciel ticketa).
- **Dropdown menu:** W TicketCard.tsx dropdown (MoreHorizontal) rozszerzony o opcję "Edit ticket" - pozwala natychmiastowe przejście do trybu edycji bez otwierania modala w trybie view.
- **Sprawdzenie uprawnień:** Client-side sprawdzenie czy użytkownik może edytować ticket (admin || ticket.reporter.id === user.id). Jeśli brak uprawnień, przycisk "Edit" nie jest widoczny.
- **Zachowanie stanu:** Przy przełączaniu między trybami view/edit stan formularza jest resetowany (zakładamy, że użytkownik nie chce zachować niezapisanych zmian przy przełączaniu trybów).
- **UX:** Przełączanie trybów nie wymaga przeładowania danych - formularz już ma załadowane dane z trybu view.

## 3. Struktura komponentów

Hierarchia komponentów (MVP bez AI):

- `TicketModal` (główny komponent modalny, src/components/TicketModal.tsx)
  - `Dialog` (z Shadcn/ui) – kontener modalny
    - `DialogContent` – zawartość modalu (max-w-2xl max-h-[90vh] overflow-y-auto, Tailwind responsive)
      - `TicketForm` – formularz edycji/danych
        - `TitleInput` – pole tytułu (Input z Shadcn)
        - `DescriptionEditor` – edytor tekstu (Textarea z Shadcn, plain text dla MVP)
        - `TypeSelect` – wybór typu ticketa (Select z Shadcn)
        - `AssigneeSection` – sekcja przypisania osoby
        - `ReporterDisplay` – wyświetlanie osoby zgłaszającej (tylko odczyt, Badge/Avatar)
      - `ActionButtons` – przyciski akcji (Zapisz, Anuluj, Przypisz mnie)

Embeduj TicketModal w Astro page (np. src/pages/Board.astro) via <Client:load components/TicketModal.astro> z islands dla React hydratacji.

## 4. Szczegóły komponentów

### TicketModal

- Opis komponentu: Główny komponent zarządzający stanem modalu, trybem (create/edit/view) i integracją z backend API aplikacji. Używa Dialog z Shadcn/ui, obsługuje otwieranie/zamykanie i focus trap (wbudowany w Dialog).
- Główne elementy: `<Dialog open={isOpen} onOpenChange={onClose}>`, `<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">` z `<TicketForm />`, `<ActionButtons />`.
- Obsługiwane zdarzenia: onOpen (załadowanie danych dla edycji via useEffect i fetch GET /api/tickets/:id), onClose (reset stanu via onClose callback), keydown (Esc/Enter via Dialog props).
- Obsługiwana walidacja: Koordynuje walidację formularza przed zapisem; blokuje zapis jeśli błędy (use Zod schema).
- Typy: `TicketModalProps`, `FullTicketDTO`.
- Propsy: `{ isOpen: boolean, onClose: () => void, mode: 'create' | 'edit' | 'view', initialTicket?: FullTicketDTO, onSave: (ticket: FullTicketDTO) => void, user: Awaited<ReturnType<typeof useUser>>['user'], isAdmin: boolean }`.

useEffect([ticketId, mode]): if (mode === 'edit' || 'view') { const { data } = await supabase.from('tickets').select('\*').eq('id', ticketId).single(); if (!data) { toast.error('Ticket not found'); onClose(); return; } setFormData(data); if (data.reporter_id !== user.id && !isAdmin) setMode('view'); }.

### Error Handling

Użyj Sonner do toasts (import { toast } from 'sonner';). Dla offline: useEffect(() => { if (!navigator.onLine) { toast.warning('No connection (offline)'); disableSubmit(); } }, [navigator.onLine]);

### TicketForm

- Opis komponentu: Formularz do wprowadzania/edycji danych ticketa, z obsługą plain text i walidacją client-side (Zod).
- Główne elementy: `<form onSubmit={handleSubmit}>`, `<TitleInput />`, `<DescriptionEditor />`, `<TypeSelect />`, `<AssigneeSection />`, `<ReporterDisplay />`.
- Obsługiwane zdarzenia: onSubmit (walidacja i API call), onChange (aktualizacja stanu formData).
- Obsługiwana walidacja: Tytuł: wymagany, 1-200 znaków; Opis: opcjonalny, <10000 znaków; Typ: wymagany z listy ['Bug', 'Improvement', 'Task']. Błędy inline pod polami (czerwone borders + <p className="text-destructive text-sm mt-1">{error}</p>).
- Typy: `CreateTicketCommand`, `UpdateTicketCommand`.
- Propsy: `{ formData: Partial<CreateTicketCommand>, onChange: (data: Partial<CreateTicketCommand>) => void, errors: Record<string, string>, mode: 'create' | 'edit' | 'view', user: UserDTO, isAdmin: boolean }`.

Użyj React Hook Form z Zod resolver: import { useForm } from 'react-hook-form'; import { zodResolver } from '@hookform/resolvers/zod'; const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(ticketSchema) });. Przenieś schema do src/lib/validation/schemas/ticket.ts (stwórz folder jeśli brak).

### DescriptionEditor

- Opis komponentu: Proste pole tekstowe do opisu ticketa (w MVP: plain text bez Markdown; future: dodaj react-markdown dla preview/renderingu – patrz ticket-modal-with-ai-suggestions.md sekcja 4. DescriptionEditor z Markdown Preview).
- Główne elementy: `<Textarea rows={10} placeholder="Opisz ticket..." className={error ? 'border-destructive' : ''} />` z Shadcn. W 'view': readonly + future: <Markdown>{value}</Markdown> (import z 'react-markdown').
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
- Główne elementy: Jeśli !isAdmin: `<Button variant="outline" onClick={() => onAssign(user.id || null)}>Przypisz mnie</Button>` (jeśli assignee null; unassign via inny button); dla admin: `<Select>` z fetch GET /api/users (lista UserDTO[]).
- Obsługiwane zdarzenia: onClick (self-assign via PATCH /api/tickets/:id/assignee), onValueChange (dla admin).
- Obsługiwana walidacja: Opcjonalna, sprawdza uprawnienia (tylko self-assign jeśli !assignee i !isAdmin).
- Typy: `UpdateTicketAssigneeCommand`, `UserDTO[]`.
- Propsy: `{ assignee?: Pick<Profile, 'username'>, currentUser: UserDTO, users: UserDTO[], isAdmin: boolean, onAssign: (assigneeId: string | null) => void, mode: string }`. W 'view': readonly display.

Dla admin: useEffect(() => { if (isAdmin) { fetch('/api/users').then(setUsers); } }, [isAdmin]);. Fallback jeśli !isAdmin: ukryj Select, pokaż tylko 'Assign me' jeśli assignee null.

### ReporterDisplay

- Opis komponentu: Wyświetlanie osoby zgłaszającej (nieedytowalne).
- Główne elementy: `<div>Reporter: <span className="font-medium">{reporter.username}</span></div>` lub Avatar + Badge.
- Propsy: `{ reporter: Pick<Profile, 'username'> }`.

### ActionButtons

- Opis komponentu: Przyciski akcji na dole modalu (Shadcn Button) - obsługuje wszystkie trzy tryby z różnymi zestawami przycisków.
- Główne elementy:
  - Tryb create/edit: `<Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>` + `<Button type="submit" disabled={!isValid || loading}>Save</Button>`
  - Tryb view: `<Button type="button" variant="outline" onClick={onCancel}>Close</Button>` + `{canEdit && <Button type="button" onClick={onEdit}>Edit</Button>}`
- Obsługiwane zdarzenia: onClick (cancel/close: onClose, save: submit form, edit: przełącz na tryb edit).
- Obsługiwana walidacja: Save wyłączony jeśli loading lub !isValid (z Zod); Edit przycisk widoczny tylko jeśli canEdit.
- Typy: Brak specyficznych.
- Propsy: `{ onCancel: () => void, onSave: () => void, onEdit?: () => void, isLoading: boolean, isValid: boolean, mode: string, canEdit?: boolean }`.

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

Rozszerz FullTicketDTO: interface FullTicketDTO extends Ticket { reporter: { id: string; username: string }; assignee?: { id: string; username: string }; ai_enhanced?: boolean; } (ai_enhanced: false w MVP, true po apply AI w future). Dodaj w src/types.ts: export interface CreateTicketCommand { title: string; description?: string; type: Ticket['type']; } export interface UpdateTicketCommand extends Partial<CreateTicketCommand> {} (bez reporter_id). Import: "import type { UserDTO, Ticket } from '../types';".

Powiązane typy: `FullTicketDTO` (z reporter/assignee, ignoruj ai_enhanced dla MVP), `CreateTicketCommand`, `UpdateTicketCommand`, `AnalyzeTicketCommand` (future).

Walidacja Zod (import { z } from 'zod';):

const ticketSchema = z.object({
title: z.string().min(1, 'Title required').max(200, 'Tytuł max 200 znaków'),
description: z.string().max(10000, 'Opis max 10000 znaków').optional(),
type: z.enum(['Bug', 'Improvement', 'Task'], { required_error: 'Typ wymagany' })
});

## 6. Zarządzanie stanem

Stan zarządzany lokalnie w `TicketModal` za pomocą `useState` dla `TicketModalState`. Custom hook `useTicketModal` (w src/components/hooks/useTicketModal.ts) do inicjalizacji stanu, obsługi submit i resetu. Dla 'create': formData = { title: '', description: '', type: 'Task' }, reporter_id = user.id z UserContext. Użyj `useEffect` do ładowania danych przy otwarciu (jeśli edit/view: fetch GET /tickets/:id poprzez API backendowe). Integracja z globalnym stanem via TicketModalContext i UserContext (z NavigationBar). Po zapisaniu – callback onSave do refetch ticketów w Board.tsx (useState refetch).

## 7. Integracja API

- **POST /api/tickets**: Tworzenie – request: `CreateTicketCommand` (bez description jeśli puste), response: `FullTicketDTO` (201). Pamiętaj o auth.
- **GET /api/tickets/:id**: Ładowanie dla edit/view – response: `FullTicketDTO` (200).
- **PUT /api/tickets/:id**: Edycja – request: `UpdateTicketCommand` (partial, bez reporter_id), response: `FullTicketDTO` (200).
- **PATCH /api/tickets/:id/assignee**: Przypisanie – request: `{assignee_id: string | null}`, response: `FullTicketDTO` (200).
- **DELETE /api/tickets/:id**: Usuwanie (admin only, future).
  Wszystkie calls z error handling (try/catch, toasts via sonner). Auth: Użyj fetch('/api/tickets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) }) – middleware (`src/middleware/index.ts`) auto-dodaje Authorization: Bearer z Supabase session cookies (bez manualnego Supabase SDK na frontendzie; backend w API routes używa supabase.auth.getUser() z locals). Obsługa RLS: Server-side via Supabase policies (np. reporter_id = auth.uid() dla create). Jeśli useApi nie istnieje, stwórz `src/lib/hooks/useApi.ts` jako wrapper: export const useApi = (url: string, options?: RequestInit) => { const [data, setData] = useState(); const [error, setError] = useState(); useEffect(() => { fetch(url, options).then(res => res.json()).then(setData).catch(setError); }, [url]); return { data, error }; }.

## 8. Interakcje użytkownika

- Otwarcie modalu: Z NavigationBar (create, puste pola, fokus na tytuł via useRef + useEffect) lub z karty (view domyślnie, załaduj dane via fetch). Użyj TicketModalContext do wyzwolenia.
- Wypełnianie formularza: Wpis title/description, wybór type/assignee. Enter submituje form.
- Przypisanie: „Assign me" dla nieprzypisanych (PATCH), admin wybiera z listy (Select).
- Zapisz: Walidacja Zod, API call, toast sukces (sonner), onClose + onSave (refetch w Board).
- Anuluj/Esc: onClose bez zapisu, reset stanu.
- Podgląd (view): Pola readonly (disabled + plain text), brak submit, opis jako plain text, opcje: Close + Edit (jeśli uprawnienia).
- Przełączanie trybów: Z view do edit via przycisk "Edit" (zachowuje dane, resetuje stan formularza).
- Mobilne: Modal full-screen (Tailwind sm:max-w-2xl else w-full), touch-friendly buttons.
- Uprawnienia: Client-side check (if mode='edit' && reporter_id !== user.id && !isAdmin → switch to 'view' + toast); przycisk Edit widoczny tylko dla uprawnionych.
- Dropdown w karcie: Opcja "Edit ticket" pozwala natychmiastowe otwarcie w trybie edit.

Sync z query params: Użyj Astro's URLSearchParams(window.location.search); if (urlParams.get('ticketId')) setOpen({ mode: 'edit', ticketId: urlParams.get('ticketId') }); onClose: const newUrl = new URL(window.location); newUrl.searchParams.delete('ticketId'); history.replaceState({}, '', newUrl.toString());

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

1. Utwórz `src/lib/contexts/TicketModalContext.tsx` z React Context jak w sekcji 2.1 (TypeScript).
2. Utwórz nowy plik `src/components/TicketModal.tsx` z importami Shadcn (Dialog, Input, Textarea, Select, Button) i Zod (z `src/lib/validation/schemas/ticket.ts` jeśli dostępne, jeśli nie - dodaj tam i zaimportuj, pamiętaj o używaniu obsługi błędów z `src/lib/utils.ts`).
3. Zdefiniuj typy w `src/types.ts` (dodaj TicketModalMode, TicketModalState bez AI).
4. Zaimplementuj `TicketForm` z walidacją Zod.
5. Dodaj `DescriptionEditor` jako proste Textarea (bez preview).
6. Stwórz custom hook `src/lib/hooks/useTicketModal.ts` do zarządzania stanem i API calls.
7. Integruj `TicketModal` w `KanbanBoardView.tsx` (useContext, render if isOpen, onSave refetch tickets via API).
8. Zaktualizuj NavigationBar.tsx: useTicketModal do setOpen('create').
9. Dodaj self-assign w `AssigneeSection` z PATCH call (API call).
10. Dodaj mechanizm przełączania między trybami view/edit:
    - Zmień domyślny tryb w `KanbanBoardView.tsx` z "edit" na "view"
    - Rozszerz `ActionButtons` o przycisk "Edit" dla trybu view
    - Dodaj funkcję `canEditTicket()` w `TicketModal.tsx`
    - Dodaj handler `handleEditMode()` do przełączania trybów
    - Dodaj opcję "Edit ticket" w dropdown `TicketCard.tsx`
11. Testuj walidację, tryby, uprawnienia i przełączanie trybów (mock user role).
12. Dodaj ARIA labels (aria-label dla buttons/inputs), keyboard nav (focus trap w Dialog), responsive classes Tailwind (sm: etc.).
13. Uruchom `npm run lint:fix` i `npm run format` (z workspace rules).
14. Przetestuj edge cases: błędy, mobile, permissions, przełączanie trybów.

Dla Shadcn UI komponentów (Dialog, Input, etc.): Użyj npx shadcn-ui@latest add [component] (auto-instaluje deps). sonner jest już w src/components/ui/sonner.tsx (dodaj via shadcn-ui add sonner jeśli potrzeba); zainstaluj react-hook-form @hookform/resolvers/zod osobno dla walidacji formularzy.

### 4.7 Zależności i Instalacja Komponentów

- Przed implementacją: Uruchom `npx shadcn-ui@latest add dialog input textarea select button badge avatar` (dla Dialog, Input, etc.). Dla walidacji: `npm install react-hook-form @hookform/resolvers/zod` (dodaj do package.json). Dla future Markdown (z prd.md): `npm install react-markdown` (użyj w DescriptionEditor dla preview w view mode i insertach AI).
- Konflikt z PRD: W MVP opis to plain text (bez Markdown renderingu), ale struktura pozwala na future upgrade (patrz ticket-modal-with-ai-suggestions.md). W prd.md zaktualizuj linię 28: "Opis (plain text w MVP, future: Markdown)".
- Auth w fetch (np. AssigneeSection): Użyj relative paths jak `fetch('/api/users')` – middleware auto-dodaje Authorization: Bearer z cookies (z api-plan.md). Obsługa błędów: `if (!res.ok) { toast.error('Unauthorized'); onClose(); }`.

### 4.8 Mechanizm przełączania między trybami View/Edit

- **Domyślny tryb:** `setOpen({ mode: "view", ticketId })`.
- **Rozszerzenie ActionButtons:** Wymagany prop `onEdit?: () => void` i `canEdit?: boolean`. W trybie view pokaż przycisk "Edit" obok "Close" jeśli `canEdit` jest true.
- **Rozszerzenie TicketCard dropdown:** Dodaj opcję "Edit ticket" w dropdown menu, która otwiera modal bezpośrednio w trybie edit.
- **Sprawdzenie uprawnień:** W `TicketModal.tsx` dodaj funkcję `canEditTicket(ticket: FullTicketDTO, user: UserDTO | null, isAdmin: boolean): boolean` zwracającą `isAdmin || (ticket && user && ticket.reporter.id === user.id)`.
- **Obsługa przełączania:** Dodaj handler `handleEditMode()` w `TicketModal.tsx` który resetuje formData do wartości z ticket i przełącza tryb poprzez `setOpen({ mode: "edit", ticketId: ticket?.id })`.
