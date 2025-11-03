# Plan implementacji widoku Panel Administratora — Zarządzanie dokumentacją

## 1. Przegląd

Widok pozwala Administratorowi edytować centralną dokumentację projektu, która stanowi kontekst dla AI. Użytkownik (ADMIN) widzi duże pole tekstowe, licznik znaków oraz przycisk „Zapisz”. Widok wspiera walidację długości treści, informację o stanie zapisu, komunikaty sukcesu/błędu i ochronę przed utratą niezapisanych zmian.

## 2. Routing widoku

- Ścieżka główna panelu: `/admin` (z zakładkami).
- Pod-widok dokumentacji: `/admin/documentation` (domyślna zakładka po wejściu do panelu).
- Dostęp chroniony rolą ADMIN (middleware/guard po stronie serwera). Niezalogowany lub nie-ADMIN nie zobaczy widoku (zostanie odrzucony wcześniej), ale komponent obsłuży ewentualne kody 401/403 z API.

## 3. Struktura komponentów

```
AdminPanelLayout (Astro)
└─ AdminTabs (React)
   ├─ Tab: „Zarządzanie dokumentacją” (domyślna)
   │  └─ DocumentationManagementView (React island)
   │     ├─ DocumentationEditorForm
   │     │  ├─ Textarea (treść dokumentacji)
   │     │  ├─ CharCounter (licznik znaków)
   │     │  └─ SaveBar (przycisk Zapisz + status)
   │     └─ FeedbackToasts (powiadomienia sukces/błąd)
   └─ Tab: „Zarządzanie użytkownikami” (istniejący pod-widok)
```

## 4. Szczegóły komponentów

### AdminPanelLayout

- Opis komponentu: Layout sekcji administratora z top barem i przestrzenią na zawartość zakładek.
- Główne elementy: kontener, top bar, miejsce na `AdminTabs` jako React island.
- Obsługiwane interakcje: brak (prezentacyjny).
- Obsługiwana walidacja: brak.
- Typy: brak specyficznych.
- Propsy: `{ children: ReactNode }` (renderuje `AdminTabs`).

### AdminTabs

- Opis komponentu: Nawigacja zakładkowa między „Zarządzanie dokumentacją” i „Zarządzanie użytkownikami”.
- Główne elementy: `Tabs` (z shadcn/ui), `TabTrigger`, `TabContent` albo linki do pod-tras (`/admin/documentation`, `/admin/users`).
- Obsługiwane interakcje: klik na zakładkę zmienia aktywny pod-widok (nawigacja/SSR lub CSR).
- Obsługiwana walidacja: brak.
- Typy: `enum`/union dla kluczy zakładek: `"documentation" | "users"`.
- Propsy: `{ active: "documentation" | "users" }` lub bazowanie na aktualnej ścieżce URL.

### DocumentationManagementView

- Opis komponentu: Kontener logiki dla edytora dokumentacji. Ładuje dane z API, zarządza stanem i przekazuje go do formularza.
- Główne elementy: wrapper, sekcja nagłówka (tytuł, ewentualnie info o ostatniej aktualizacji), `DocumentationEditorForm`, `FeedbackToasts`.
- Obsługiwane interakcje: inicjalne pobranie danych, zapis zmian, ostrzeżenie o niezapisanych zmianach, skrót klawiaturowy `Ctrl/Cmd+S`.
- Obsługiwana walidacja: długość treści 1..20000; brak zapisu przy nieważnych danych.
- Typy: `ProjectDocumentationDTO`, `UpdateProjectDocumentationCommand`, `DocumentationViewModel` (patrz sekcja 5).
- Propsy: brak (komponent stronowy).

### DocumentationEditorForm

- Opis komponentu: Formularz edycji treści z walidacją i UI „Save”.
- Główne elementy: `Textarea` (duże), `CharCounter`, `SaveBar` (przycisk „Zapisz”, stan: idle/saving/success/error), opcjonalnie etykieta pola i hinty.
- Obsługiwane interakcje:
  - input w `Textarea` (aktualizacja `content`, ustawienie `dirty`),
  - klik „Zapisz”,
  - `Ctrl/Cmd+S` wywołuje `onSave`.
- Obsługiwana walidacja:
  - `content.length > 0`,
  - `content.length <= 20000` (górny limit),
  - dezaktywacja przycisku, jeśli nieważne lub brak zmian.
- Typy: `DocumentationFormState`, `SaveStatus`.
- Propsy:
  - `{ value: string; maxLength: number; charCount: number; dirty: boolean; status: SaveStatus; onChange(value: string): void; onSave(): void; disabled?: boolean; }`.

### CharCounter

- Opis komponentu: Pokazuje bieżącą liczbę znaków i limit.
- Główne elementy: licznik z kondycjonalnym kolorem (czerwony po przekroczeniu limitu, żółty przy zbliżaniu się do limitu (80% maksymalnej wartości)).
- Obsługiwane interakcje: brak.
- Obsługiwana walidacja: wizualna (kolor przy > max i przy > 80%).
- Typy: `{ current: number; max: number }`.
- Propsy: `{ current: number; max: number }`.

### SaveBar

- Opis komponentu: Pasek akcji z przyciskiem „Zapisz” i stanem ładowania/sukcesu/błędu.
- Główne elementy: `Button`, spinner, mały komunikat statusu.
- Obsługiwane interakcje: klik „Zapisz”.
- Obsługiwana walidacja: przycisk disabled, jeśli brak zmian, zapis w toku lub walidacja treści niezaliczona.
- Typy: `SaveStatus = "idle" | "saving" | "success" | "error"`.
- Propsy: `{ status: SaveStatus; disabled: boolean; onSave(): void }`.

### FeedbackToasts

- Opis komponentu: Wyświetla krótkie powiadomienia (sukces/błąd), np. shadcn/ui `useToast`.
- Główne elementy: kontener toastów.
- Obsługiwane interakcje: automatyczne chowanie po czasie, zamknięcie przez użytkownika.
- Obsługiwana walidacja: brak.
- Typy: struktura toasta `{ title?: string; description?: string; variant?: "default" | "destructive" }`.
- Propsy: `{ success?: string; error?: string }` lub sterowanie przez hook.

## 5. Typy

Nowe typy i ViewModel (frontend):

```ts
// Dane z backendu (już dostępne w src/types.ts):
// export type ProjectDocumentationDTO = {
//   id: string;
//   content: string;
//   updated_at: string;
//   updated_by?: { username: string };
// };
// export interface UpdateProjectDocumentationCommand { content: string }

export type SaveStatus = "idle" | "saving" | "success" | "error";

export interface DocumentationFormState {
  content: string;
  charCount: number;
  maxChars: number; // 20000
  dirty: boolean;
}

export interface ApiState {
  loading: boolean; // GET w toku
  saving: boolean; // PUT w toku
  error: string | null; // ogólny błąd UI
}

export interface DocumentationViewModel {
  data: ProjectDocumentationDTO | null;
  form: DocumentationFormState;
  api: ApiState;
}
```

## 6. Zarządzanie stanem

- Lokalny stan w `DocumentationManagementView`:
  - `viewModel: DocumentationViewModel` (początkowo `data=null`, `loading=true`).
  - źródło prawdy dla `content` to stan formularza, nie `data.content` (aby wspierać `dirty`).
- Custom hooki:
  - `useProjectDocumentation()` — ładowanie i zapis:
    - `load()` wywołuje GET, ustawia `data` i inicjuje `form.content`.
    - `setContent(value)` aktualizuje `form`, liczy znaki, ustawia `dirty`.
    - `save()` waliduje, wysyła PUT, po sukcesie aktualizuje `data`, resetuje `dirty`, ustawia `status=success`.
  - `useUnsavedChangesPrompt(enabled)` — ostrzeganie przy opuszczaniu strony, jeśli `dirty=true`.
- Skróty klawiaturowe: `Ctrl/Cmd+S` → `save()` (z `preventDefault`).

## 7. Integracja API

- Endpointy:
  - GET `/api/project-documentation` → `ProjectDocumentationDTO`.
  - PUT `/api/project-documentation` z `{ content: string }` → zaktualizowany `ProjectDocumentationDTO`.
- Wywołania (fetch, z ciasteczkami sesyjnymi Supabase):

```ts
async function getProjectDocumentation(): Promise<ProjectDocumentationDTO> {
  const res = await fetch("/api/project-documentation", { credentials: "include" });
  if (!res.ok) throw await toApiError(res);
  return res.json();
}

async function updateProjectDocumentation(cmd: UpdateProjectDocumentationCommand): Promise<ProjectDocumentationDTO> {
  const res = await fetch("/api/project-documentation", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(cmd),
  });
  if (!res.ok) throw await toApiError(res);
  return res.json();
}

async function toApiError(res: Response) {
  let message = `Request failed: ${res.status}`;
  try {
    const data = await res.json();
    if (data?.message) message = data.message;
  } catch {}
  return new Error(message);
}
```

- Walidacja po stronie UI przed PUT: `content.length in 1..20000`.
- Obsługa kodów błędów: 400 (walidacja), 401 (Unauthorized), 403 (Forbidden), 500 (Internal Error) — mapowane na toast + stan błędu.

## 8. Interakcje użytkownika

- Wejście na `/admin/documentation`: automatyczne pobranie dokumentacji, skeleton/loading, potem render formularza.
- Edycja treści: aktualizacja stanu, licznik znaków, ustawienie `dirty`.
- Zapis:
  - klik „Zapisz” lub `Ctrl/Cmd+S` → walidacja → PUT → toast sukcesu, reset `dirty`.
  - przy błędzie → toast błędu, status `error`.
- Nawigacja ze zmianami: ostrzeżenie o niezapisanych zmianach.

## 9. Warunki i walidacja

- Walidacja treści:
  - minimalnie 1 znak (po trimowaniu nie wymagamy, chyba że chcemy ściśle > 0 bez trim — trzymamy się backendu: > 0),
  - maksymalnie 20000 znaków.
- Przycisk „Zapisz” jest disabled, jeśli:
  - `saving=true`,
  - brak zmian (`dirty=false`),
  - `charCount === 0` lub `charCount > maxChars`.
- API wymaga roli ADMIN: przy 403 wyświetlamy komunikat o braku uprawnień.

## 10. Obsługa błędów

- 400 Bad Request (walidacja Zod): pokaż komunikat z odpowiedzi (np. „content length must be <= 20000”).
- 401 Unauthorized: informacja o braku sesji; przekierowanie na stronę logowania.
- 403 Forbidden: komunikat Access Denied — Only administrators can access project documentation”.
- 500 Internal Server Error / błąd połączenia: „Failed to update/save project documentation. Try again.”
- Sieć offline: wykrycie błędu sieci, toast „No network connection”.
- Utrata zmian: `useUnsavedChangesPrompt` (dialog przeglądarki) oraz opcjonalny własny modal przy zmianie zakładki/trasie.

## 11. Kroki implementacji

1. Routing i skeleton widoku
   - Dodać stronę `/admin/documentation` (Astro + React island) i wpiąć w `AdminTabs` jako domyślną.
   - Potwierdzić, że middleware/guard ADMIN działa dla `/admin/*`.
2. API client (frontend)
   - Dodać `getProjectDocumentation()` i `updateProjectDocumentation()` z typami z `src/types.ts`.
3. Hook stanu
   - Zaimplementować `useProjectDocumentation` (load, setContent, save, statusy, dirty, licznik).
   - Dodać `useUnsavedChangesPrompt` (włączać, gdy `dirty=true`).
4. Komponenty UI
   - `DocumentationManagementView`: pobranie na mount, bindowanie do formularza, obsługa toastów i skrótów klawiaturowych.
   - `DocumentationEditorForm`: `Textarea`, `CharCounter`, `SaveBar` z poprawnymi stanami i blokadami.
5. Walidacja i UX
   - Walidacja długości onChange i przed zapisem.
   - `SaveBar`: disabled według reguł; spinner podczas zapisu; sukces/błąd (ikony/kolory/toasty).
   - Dodanie `Ctrl/Cmd+S` handlera.
6. Obsługa błędów
   - Mapowanie kodów 400/401/403/500 na przyjazne komunikaty.
   - Testy scenariuszy: brak uprawnień, limit znaków, brak sieci.
7. Dostępność
   - Etykieta `Textarea` (np. `aria-label="Dokumentacja projektu"` lub widoczna `label`).
   - Kontrast i focus ring dla przycisku; komunikaty dostępne dla czytników ekranu.
8. Testy ręczne i e2e (minimalne)
   - Załadowanie istniejącej treści, edycja, zapis, ponowne odświeżenie — treść zachowana.
   - Przekroczenie 20000 znaków → przycisk nieaktywny i odpowiedni komunikat.
   - Niezapisane zmiany → ostrzeżenie przy nawigacji.
