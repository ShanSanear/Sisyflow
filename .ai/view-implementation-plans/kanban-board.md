# Plan implementacji widoku Kanban Board

## 1. Przegląd

Widok Kanban Board jest głównym interfejsem aplikacji Sisyflow, przeznaczonym do wizualizacji i zarządzania cyklem życia ticketów. Umożliwia użytkownikom przeglądanie zadań w kolumnach odpowiadających ich statusom (`Otwarty`, `W toku`, `Zamknięty`) oraz intuicyjną zmianę statusu poprzez mechanizm "przeciągnij i upuść".

## 2. Routing widoku

Widok będzie dostępny pod główną ścieżką aplikacji: `/` oraz `/board`.

## 3. Struktura komponentów

Komponenty zostaną zaimplementowane w React i wyrenderowane po stronie klienta wewnątrz strony Astro. Hierarchia będzie wyglądać następująco:

```
/src/pages/index.astro
└── /src/components/views/KanbanBoardView.tsx (client:load)
    ├── /src/components/kanban/BoardContainer.tsx
    │   ├── /src/components/kanban/KanbanColumn.tsx (status="OPEN")
    │   │   ├── /src/components/kanban/TicketCard.tsx
    │   │   └── ...
    │   ├── /src/components/kanban/KanbanColumn.tsx (status="IN_PROGRESS")
    │   │   └── ...
    │   └── /src/components/kanban/KanbanColumn.tsx (status="CLOSED")
    │       └── ...
    └── /src/components/ui/Skeleton.tsx (dla stanu ładowania)
```

## 4. Szczegóły komponentów

### `KanbanBoardView`

- **Opis komponentu:** Główny komponent widoku. Jest odpowiedzialny za całą logikę, w tym wywołanie hooka `useKanbanBoard`, obsługę stanów ładowania i błędów. Przekazuje dane i handlery do prezentacyjnego komponentu `BoardContainer`.
- **Główne elementy:** Logika warunkowego renderowania: `Skeleton` na czas ładowania, komunikat o błędzie, komponent `EmptyState` (gdy brak ticketów) lub komponent `BoardContainer` po pomyślnym załadowaniu danych.
- **Obsługiwane interakcje:** Brak.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `KanbanViewModel`.
- **Propsy:** Brak.

### `BoardContainer`

- **Opis komponentu:** Komponent czysto prezentacyjny, odpowiedzialny za renderowanie struktury tablicy. Inicjuje kontekst dla operacji "przeciągnij i upuść" i deleguje obsługę zdarzenia `onDragEnd` do komponentu nadrzędnego.
- **Główne elementy:** `DndContext` od `@dnd-kit`, mapowanie i renderowanie komponentów `KanbanColumn`.
- **Obsługiwane interakcje:** `onDragEnd` - wywoływane po zakończeniu przeciągania karty, przekazywane do `KanbanBoardView`.
- **Obsługiwana walidacja:** Sprawdzenie, czy karta została upuszczona w innej kolumnie niż źródłowa.
- **Typy:** `KanbanViewModel`, `TicketCardViewModel`.
- **Propsy:**
  ```typescript
  interface BoardContainerProps {
    boardState: KanbanViewModel;
    handleDragEnd: (event: DragEndEvent) => void;
    savingTicketId: string | null;
  }
  ```

### `KanbanColumn`

- **Opis komponentu:** Reprezentuje pojedynczą kolumnę statusu (np. "Otwarty"). Działa jako cel do upuszczania kart (`droppable`). Renderuje listę przypisanych do niej ticketów.
- **Główne elementy:** Nagłówek kolumny (`<h2>`), kontener na karty, który jest obszarem `droppable`. Mapowanie i renderowanie `TicketCard` lub `TicketCardSkeleton`.
- **Obsługiwane interakcje:** Przyjęcie upuszczonej karty.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `TicketCardViewModel[]`.
- **Propsy:**
  ```typescript
  interface KanbanColumnProps {
    id: TicketStatus; // "OPEN" | "IN_PROGRESS" | "CLOSED"
    title: string;
    tickets: TicketCardViewModel[];
    savingTicketId: string | null;
  }
  ```

### `TicketCard`

- **Opis komponentu:** Reprezentuje pojedynczą kartę ticketa. Jest elementem przeciąganym (`draggable`). Wyświetla kluczowe informacje o tickecie. Informuje wizualnie o stanie zapisywania po operacji "przeciągnij i upuść" oraz o uprawnieniach do przeniesienia.
- **Główne elementy:** Kontener karty (ze zmiennym stylem dla stanu zapisywania), tytuł (`<p>`), komponent `Badge` (Shadcn/ui) dla typu ticketa, nazwa osoby przypisanej, ikona "magicznej różdżki" (`Sparkles`), `Tooltip` (Shadcn/ui) dla pełnego tytułu.
- **Obsługiwane interakcje:** `onPointerDown` (inicjacja przeciągania), `onHover` (wyświetlenie tooltipa, jeśli tytuł nie jest w pełni wyświetlony).
- **Obsługiwana walidacja:** Wizualna walidacja uprawnień – karta, której użytkownik nie może przenieść, będzie miała styl `cursor: not-allowed` i nie będzie reagować na przeciąganie.
- **Typy:** `TicketCardViewModel`.
- **Propsy:**
  ```typescript
  interface TicketCardProps {
    ticket: TicketCardViewModel;
    canMove: boolean; // Flaga określająca uprawnienia do przeciągania
    isSaving: boolean; // Flaga określająca stan zapisywania
  }
  ```

## 5. Typy

Do obsługi widoku potrzebne będą następujące struktury danych, które zostaną zdefiniowane w dedykowanym pliku: `src/components/views/KanbanBoardView.types.ts`.

```typescript
// Typy statusu i typu ticketa
type TicketStatus = "OPEN" | "IN_PROGRESS" | "CLOSED";
type TicketType = "BUG" | "IMPROVEMENT" | "TASK";

// ViewModel dla pojedynczej karty na tablicy
interface TicketCardViewModel {
  id: string;
  title: string;
  assigneeName?: string;
  type: TicketType;
  isAiEnhanced: boolean;
  reporterId: string;
  assigneeId?: string | null;
}

// ViewModel dla całej tablicy Kanban
type KanbanViewModel = {
  [key in TicketStatus]: {
    title: string; // np. "Otwarty"
    tickets: TicketCardViewModel[];
  };
};

// Dane użytkownika potrzebne do weryfikacji uprawnień
interface CurrentUser {
  id: string;
  role: "USER" | "ADMIN";
}
```

## 6. Zarządzanie stanem

Logika zarządzania stanem zostanie wyizolowana w dedykowanym customowym hooku `useKanbanBoard`.

- **`useKanbanBoard` hook:**
  - **Cel:** Enkapsulacja całej logiki związanej z tablicą Kanban: pobieranie danych, transformacja do `KanbanViewModel`, obsługa optymistycznych aktualizacji UI po przeciągnięciu karty oraz komunikacja z API.
  - **Zależności:**
    - `useAuth()`: Hook dostarczający dane zalogowanego użytkownika (`id` i `role`), niezbędne do weryfikacji uprawnień. Na potrzeby implementacji dane te mogą być zamockowane do czasu wdrożenia pełnej autentykacji.
  - **Zarządzany stan:**
    - `boardState: KanbanViewModel | null` - przechowuje aktualny stan tablicy.
    - `isLoading: boolean` - flaga stanu ładowania.
    - `error: Error | null` - obiekt błędu w przypadku problemów z API.
    - `savingTicketId: string | null` - ID ticketa, który jest w trakcie zapisywania po operacji drag-and-drop.
  - **Udostępniane funkcje:**
    - `handleDragEnd(result: DragEndEvent)`: Funkcja do przekazania do `BoardContainer`, która przetwarza wynik operacji "przeciągnij i upuść".

## 7. Integracja API

- **Pobieranie danych:**
  - **Endpoint:** `GET /api/tickets`
  - **Logika:** Po zamontowaniu komponentu `KanbanBoardView`, hook `useKanbanBoard` wywoła ten endpoint, aby pobrać wszystkie tickety. Odpowiedź `TicketDTO[]` zostanie przetransformowana na strukturę `KanbanViewModel`.
- **Aktualizacja statusu:**
  - **Endpoint:** `PATCH /api/tickets/:id/status`
  - **Logika:** Po upuszczeniu karty w nowej kolumnie, funkcja `handleDragEnd` w hooku `useKanbanBoard` wykona następujące kroki:
    1.  Optymistycznie zaktualizuje stan lokalny (`boardState`), aby UI zareagowało natychmiast.
    2.  Ustawi `savingTicketId` na ID przenoszonego ticketa.
    3.  Wysyła żądanie `PATCH` z nowym statusem.
    4.  **Typ żądania (`UpdateTicketStatusCommand`):** `{ status: TicketStatus }`
    5.  **Typ odpowiedzi (`TicketDTO`):** Zaktualizowany obiekt ticketa.
    6.  Po otrzymaniu odpowiedzi (sukces lub błąd), ustawi `savingTicketId` na `null`.
    7.  W przypadku błędu API, przywróci poprzedni stan `boardState` i wyświetli komunikat o błędzie.

## 8. Interakcje użytkownika

- **Przeciąganie i upuszczanie:**
  - Użytkownik chwyta kartę (`TicketCard`), którą może przesuwać.
  - Karta podąża za kursorem.
  - Upuszczenie karty w nowej kolumnie (`KanbanColumn`) natychmiastowo przenosi ją w nowe miejsce (optymistyczna aktualizacja).
- **Wyświetlanie pełnego tytułu:**
  - Najechanie kursorem na kartę z długim, skróconym tytułem wyświetli `Tooltip` z pełną treścią.
- **Dostępność:**
  - Alternatywą dla "przeciągnij i upuść" będzie menu kontekstowe dostępne na każdej karcie, pozwalające na wybór nowego statusu z listy.
  - Interakcje "przeciągnij i upuść" będą również obsługiwane za pomocą klawiatury.

## 9. Warunki i walidacja

- **Uprawnienia do zmiany statusu:**
  - **Warunek:** Użytkownik może przenieść kartę tylko jeśli jest Administratorem, osobą zgłaszającą (`reporter_id`) lub osobą przypisaną (`assignee_id`).
  - **Walidacja (UI):** Komponent `TicketCard` otrzyma props `canMove: boolean`. Jeśli `false`, karta będzie wizualnie "zablokowana" (np. `cursor: not-allowed`) i nie będzie można jej przeciągnąć.
  - **Walidacja (Logika):** Funkcja `handleDragEnd` przed wysłaniem żądania do API ponownie sprawdzi uprawnienia.
  - **Walidacja (API):** Backend ostatecznie zweryfikuje uprawnienia i zwróci błąd `403 Forbidden` w razie ich braku.

## 10. Obsługa błędów

- **Błąd pobierania danych:** Jeśli początkowe żądanie `GET /api/tickets` zakończy się niepowodzeniem, widok wyświetli globalny komunikat o błędzie z przyciskiem "Spróbuj ponownie".
- **Brak danych (pusta tablica):** Jeśli żądanie `GET /api/tickets` zwróci pustą listę, widok wyświetli informację dla użytkownika, np. "Nie znaleziono żadnych ticketów. Stwórz nowy, aby rozpocząć pracę!".
- **Błąd aktualizacji statusu:**
  - **Scenariusz:** Żądanie `PATCH` kończy się błędem (np. sieciowym, błędem serwera 500, lub błędem uprawnień 403, który ominął walidację UI).
  - **Obsługa:** Optymistyczna zmiana w UI zostanie cofnięta (karta wróci na swoje pierwotne miejsce), a użytkownik zobaczy powiadomienie typu "toast" z informacją o błędzie, np. "Nie udało się zaktualizować statusu ticketa".

## 11. Kroki implementacji

1.  **Struktura plików:** Utworzenie pustych plików komponentów: `KanbanBoardView.tsx`, `BoardContainer.tsx`, `KanbanColumn.tsx`, `TicketCard.tsx` oraz pliku na typy `KanbanBoardView.types.ts` w odpowiednich katalogach.
2.  **Definicje typów:** Zdefiniowanie typów `TicketCardViewModel` i `KanbanViewModel` w pliku `src/components/views/KanbanBoardView.types.ts`.
3.  **Komponenty statyczne:** Implementacja UI dla `KanbanColumn`, `TicketCard` oraz `EmptyState` przy użyciu statycznych danych (mock data), stylując je za pomocą Tailwind CSS i komponentów Shadcn/ui.
4.  **Hook `useKanbanBoard`:** Stworzenie logiki hooka, na początku z mockową funkcją pobierającą dane oraz zamockowanym kontekstem użytkownika (`useAuth`).
5.  **Struktura widoku:** Implementacja `KanbanBoardView` jako komponentu zarządzającego stanem (wywołującego hooka) i `BoardContainer` jako komponentu prezentacyjnego, przekazując do niego dane przez propsy. Dodanie logiki wyświetlania stanu pustego.
6.  **Integracja API:** Zastąpienie mockowej funkcji w `useKanbanBoard` rzeczywistym wywołaniem `fetch` do `GET /api/tickets`. Dodanie obsługi stanów ładowania i błędów.
7.  **Implementacja Drag and Drop:**
    - Dodanie biblioteki `@dnd-kit/core`, `@dnd-kit/sortable`.
    - Owinięcie tablicy w `DndContext` w `BoardContainer`.
    - Użycie `useDraggable` w `TicketCard` i `useDroppable` w `KanbanColumn`.
8.  **Logika `handleDragEnd`:** Implementacja funkcji `handleDragEnd` w `useKanbanBoard`, w tym:
    - Logika optymistycznej aktualizacji stanu.
    - Zarządzanie stanem `savingTicketId`.
    - Wywołanie `PATCH /api/tickets/:id/status`.
    - Logika przywracania stanu w przypadku błędu.
9.  **Wizualizacja stanu zapisywania:** Dodanie w `TicketCard` logiki, która na podstawie propa `isSaving` zmienia wygląd karty (zmniejsza opacity) by dać użytkownikowi znać że zmiana jest właśnie dokonywana.
10. **Obsługa uprawnień:** Implementacja logiki `canMove` na podstawie danych zalogowanego użytkownika i przekazanie jej jako prop do `TicketCard` w celu zablokowania przeciągania.
11. **Responsywność:** Dostosowanie stylów Tailwind CSS, aby na urządzeniach mobilnych tablica była przewijana horyzontalnie.
12. **Dostępność (Menu):** Implementacja menu kontekstowego (np. używając komponentu `DropdownMenu` z Shadcn/ui) jako alternatywy dla zmiany statusu.
13. **Dostępność (Klawiatura):** Rozszerzenie implementacji "przeciągnij i upuść" o obsługę z klawiatury przy użyciu `KeyboardSensor` z biblioteki `@dnd-kit`. Ten krok można pominąć w pierwszej iteracji, jeśli okaże się zbyt czasochłonny.
14. **Finalne testy:** Przetestowanie wszystkich interakcji, obsługi błędów i responsywności.
