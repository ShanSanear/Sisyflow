# Plan implementacji widoku Panel Administratora — Błędy AI

## 1. Przegląd

Widok "Błędy AI" w panelu administratora ma na celu dostarczenie administratorom narzędzia do monitorowania i diagnozowania problemów związanych z integracją ze sztuczną inteligencją (np. OpenRouter.ai). Widok ten prezentuje listę wszystkich zarejestrowanych błędów w formie paginowanej tabeli, umożliwiając szybkie zidentyfikowanie problemów, zrozumienie ich kontekstu i dostęp do szczegółowych danych technicznych niezbędnych do ich rozwiązania. Dostęp do tej sekcji jest ściśle ograniczony do użytkowników z rolą `ADMIN`.

## 2. Routing widoku

- **Ścieżka widoku:** `/admin/ai-errors`
- Widok ten będzie dostępny jako nowa zakładka w panelu administratora, obok istniejących zakładek, takich jak "Zarządzanie dokumentacją". Dostęp do ścieżki `/admin/*` jest chroniony przez middleware, które weryfikuje rolę administratora.

## 3. Struktura komponentów

Komponenty zostaną zaimplementowane jako React island w ramach strony Astro. Wykorzystane zostaną gotowe komponenty z biblioteki `shadcn/ui`.

```
/admin/ai-errors (Astro Page)
└─ AIErrorsView (React Island)
   ├─ AIErrorsFilters
   │  ├─ Input (dla ticket_id)
   │  └─ Button (Filtruj)
   ├─ AIErrorsTable
   │  └─ Table (shadcn/ui)
   │     ├─ TableHeader
   │     └─ TableBody
   │        └─ TableRow (dla każdego błędu)
   │           ├─ TableCell (dla każdej właściwości)
   │           └─ Button ("Szczegóły")
   ├─ PaginationControls
   │  └─ Pagination (shadcn/ui)
   └─ ErrorDetailsSheet (renderowany warunkowo)
      ├─ Sheet (shadcn/ui)
      └─ CodeBlock (dla sformatowanego JSON)
```

## 4. Szczegóły komponentów

### AIErrorsView

- **Opis komponentu:** Główny komponent-kontener (React island), który zarządza stanem całego widoku. Odpowiada za pobieranie danych z API, obsługę filtrów i paginacji oraz komunikację między komponentami podrzędnymi.
- **Główne elementy:** `AIErrorsFilters`, `AIErrorsTable`, `PaginationControls`, `ErrorDetailsSheet`.
- **Obsługiwane interakcje:** Inicjalne pobranie danych, obsługa zmian paginacji, aplikowanie filtrów, otwieranie i zamykanie modala ze szczegółami błędu.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `AIErrorsViewState`.
- **Propsy:** Brak (komponent jest stroną).

### AIErrorsFilters

- **Opis komponentu:** Formularz zawierający pola do filtrowania listy błędów. W pierwszej wersji będzie zawierał tylko pole do filtrowania po ID ticketa.
- **Główne elementy:** `Input` z `label` ("Ticket ID"), `Button` ("Filtruj").
- **Obsługiwane interakcje:** Wprowadzanie tekstu w pole, kliknięcie przycisku "Filtruj", które wywołuje zdarzenie `onFilterChange`.
- **Obsługiwana walidacja:** Walidacja formatu UUID po stronie klienta, aby zapobiec nieprawidłowym zapytaniom do API. Przycisk "Filtruj" jest nieaktywny, jeśli wprowadzona wartość nie jest poprawnym UUID.
- **Typy:** `FiltersState`.
- **Propsy:** `{ filters: FiltersState; onFilterChange: (filters: FiltersState) => void; }`

### AIErrorsTable

- **Opis komponentu:** Komponent prezentacyjny renderujący tabelę z błędami AI. Wykorzystuje komponenty `Table` z `shadcn/ui`. Wyświetla również stany ładowania (skeleton) i braku wyników.
- **Główne elementy:** `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`, `Button` ("Szczegóły"), `Badge` (dla kodu statusu HTTP).
- **Obsługiwane interakcje:** Kliknięcie przycisku "Szczegóły" lub całego wiersza emituje zdarzenie `onShowDetails` z obiektem wybranego błędu.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `AIErrorViewModel[]`.
- **Propsy:** `{ errors: AIErrorViewModel[]; isLoading: boolean; onShowDetails: (error: AIErrorViewModel) => void; }`

### PaginationControls

- **Opis komponentu:** Komponent do nawigacji między stronami wyników. Wykorzystuje komponent `Pagination` z `shadcn/ui`.
- **Główne elementy:** Przyciski "Poprzednia", "Następna", numery stron.
- **Obsługiwane interakcje:** Kliknięcie na numer strony lub przyciski nawigacyjne emituje zdarzenie `onPageChange` z nowym numerem strony.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `PaginationDTO`.
- **Propsy:** `{ pagination: PaginationDTO; onPageChange: (page: number) => void; }`

### ErrorDetailsSheet

- **Opis komponentu:** Komponent typu "arkusz" (z `shadcn/ui`), który wysuwa się z boku ekranu, wyświetlając szczegółowe informacje o błędzie w formacie JSON.
- **Główne elementy:** `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetDescription`, komponent do wyświetlania sformatowanego kodu (np. `<pre><code>`). Przycisk "Kopiuj" do skopiowania JSON do schowka.
- **Obsługiwane interakcje:** Zamknięcie arkusza.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `AIErrorViewModel`.
- **Propsy:** `{ error: AIErrorViewModel | null; isOpen: boolean; onClose: () => void; }`

## 5. Typy

Do poprawnej implementacji widoku konieczne jest zdefiniowanie poniższych typów po stronie frontendu.

```typescript
import type { AIErrorDTO, PaginationDTO, Json } from "src/types";

// UWAGA: Dla optymalnego działania, backend powinien zostać zmodyfikowany,
// aby zwracać nowy typ DTO, który zawiera już nazwę użytkownika.
// Poniższy typ zakłada taką modyfikację.
export interface AIErrorWithUserDTO extends Omit<AIErrorDTO, "user_id"> {
  user: {
    id: string;
    username: string | null;
  } | null;
}

// ViewModel używany bezpośrednio przez komponenty React do renderowania danych.
export interface AIErrorViewModel {
  id: string;
  ticket_id: string | null;
  error_message: string;
  created_at: string;
  user: {
    id: string;
    username: string; // Wyświetlana nazwa użytkownika
  } | null;
  http_status: number | null; // Sparsowany kod statusu HTTP
  details_json: Json; // Surowy obiekt 'error_details'
}

// Stan filtrów
export interface FiltersState {
  ticket_id: string;
}

// Główny stan widoku zarządzany przez customowy hook.
export interface AIErrorsViewState {
  errors: AIErrorViewModel[];
  pagination: PaginationDTO | null;
  filters: FiltersState;
  api: {
    isLoading: boolean;
    error: string | null;
  };
  selectedError: AIErrorViewModel | null; // Błąd wybrany do wyświetlenia w szczegółach
}
```

## 6. Zarządzanie stanem

Stan widoku będzie zarządzany lokalnie w komponencie `AIErrorsView` przy użyciu hooka `useReducer`, co zapewni przewidywalne i zorganizowane zarządzanie złożonym stanem (filtry, paginacja, dane, status API).

Cała logika związana z pobieraniem danych, zarządzaniem stanem i obsługą interakcji zostanie zamknięta w customowym hooku `useAIErrors`.

- **`useAIErrors` hook:**
  - Będzie zarządzał obiektem stanu `AIErrorsViewState`.
  - Będzie zawierał funkcję `fetchAIErrors`, która komunikuje się z API, uwzględniając aktualne filtry i paginację.
  - Użyje `useEffect` do ponownego pobrania danych, gdy zmienią się filtry lub numer strony.
  - Będzie odpowiedzialny za transformację danych z `AIErrorWithUserDTO` (z API) na `AIErrorViewModel` (dla UI), w tym za parsowanie kodu statusu HTTP z pola `details_json`.
  - Udostępni metody do modyfikacji stanu, np. `applyFilters`, `changePage`, `selectError`.

## 7. Integracja API

Integracja opiera się na komunikacji z jednym punktem końcowym.

- **Endpoint:** `GET /api/ai-errors`
- **Typ Żądania (Query Params):**
  ```typescript
  interface GetAIErrorsQuery {
    limit?: number; // Domyślnie 50
    offset?: number; // Domyślnie 0
    ticket_id?: string; // Opcjonalny UUID
  }
  ```
- **Typ Odpowiedzi (Sukces):**
  ```typescript
  interface GetAIErrorsResponse {
    errors: AIErrorWithUserDTO[]; // Oczekiwany nowy typ DTO z backendu
    pagination: PaginationDTO;
  }
  ```
- **Przepływ:**
  1. Hook `useAIErrors` na podstawie stanu `filters` i `pagination` konstruuje parametry zapytania.
  2. `offset` jest obliczany jako `(page - 1) * limit`.
  3. Wywoływana jest funkcja `fetch` z odpowiednimi parametrami.
  4. Po otrzymaniu odpowiedzi, dane `errors` są mapowane na `AIErrorViewModel`.
  5. Stan komponentu jest aktualizowany, co powoduje ponowne renderowanie UI.

## 8. Interakcje użytkownika

- **Ładowanie widoku:** Po wejściu na stronę, komponent `AIErrorsView` montuje się, hook `useAIErrors` pobiera pierwszą stronę błędów. W trakcie ładowania widoczny jest skeleton tabeli.
- **Zmiana strony:** Użytkownik klika na przycisk paginacji. Wywoływana jest funkcja `changePage` z hooka, która aktualizuje numer strony w stanie, co z kolei uruchamia `useEffect` i pobiera dane dla nowej strony.
- **Filtrowanie:** Użytkownik wpisuje UUID w pole `ticket_id` i klika "Filtruj". Wywoływana jest funkcja `applyFilters`, która aktualizuje stan filtrów, resetuje paginację do pierwszej strony i pobiera nowe dane.
- **Wyświetlanie szczegółów:** Użytkownik klika przycisk "Szczegóły". Wywoływana jest funkcja `selectError`, która ustawia w stanie wybrany obiekt błędu. To powoduje otwarcie komponentu `ErrorDetailsSheet` i wyświetlenie danych.
- **Zamykanie szczegółów:** Użytkownik klika przycisk zamknięcia w `ErrorDetailsSheet`. `selectedError` w stanie jest ustawiany na `null`, co zamyka arkusz.

## 9. Warunki i walidacja

- **Filtr `ticket_id`:** Komponent `AIErrorsFilters` waliduje wprowadzany ciąg znaków za pomocą wyrażenia regularnego sprawdzającego format UUID. Przycisk "Filtruj" jest nieaktywny (`disabled`), jeśli format jest nieprawidłowy, zapobiegając wysyłaniu błędnych zapytań do API.
- **Dostęp:** Widok jest dostępny tylko dla administratorów. Jeśli API zwróci błąd 403 (Forbidden), na ekranie zostanie wyświetlony komunikat o braku uprawnień.

## 10. Obsługa błędów

- **Błąd pobierania danych (np. 500):** Jeśli zapytanie do API zakończy się niepowodzeniem, hook `useAIErrors` ustawi odpowiedni komunikat w stanie `api.error`. Komponent `AIErrorsView` wyświetli ogólny komunikat o błędzie zamiast tabeli.
- **Brak uprawnień (401/403):** Zostanie wyświetlony dedykowany komunikat, np. "Brak dostępu. Tylko administratorzy mogą przeglądać błędy AI."
- **Brak wyników:** Jeśli API zwróci pustą tablicę `errors`, komponent `AIErrorsTable` wyświetli informację "Nie znaleziono żadnych błędów AI."
- **Nieprawidłowy filtr (400):** W przypadku, gdyby walidacja po stronie klienta przepuściła nieprawidłowy `ticket_id`, błąd 400 z API zostanie przechwycony i wyświetlony użytkownikowi, np. obok pola filtra.

## 11. Kroki implementacji

1. **Struktura plików i routing:**
   - Utworzyć plik strony Astro `/src/pages/admin/ai-errors.astro`.
   - Wewnątrz pliku `.astro` zaimportować i wyrenderować nowy komponent React `AIErrorsView` jako wyspę (`client:load`).
   - Zaktualizować komponent `AdminTabs`, aby dodać nową zakładkę "Błędy AI" z linkiem do `/admin/ai-errors`.

2. **Definicje typów i hook stanu:**
   - Zdefiniować typy `AIErrorViewModel` i `AIErrorsViewState` w pliku `src/components/admin/AIErrorsView.tsx` lub dedykowanym pliku typów dla widoku.
   - Zaimplementować szkielet customowego hooka `useAIErrors` z `useReducer` do zarządzania stanem `AIErrorsViewState`.

3. **Komponenty UI (prezentacyjne):**
   - Stworzyć komponent `AIErrorsTable`, który przyjmuje `errors` i `isLoading` i renderuje tabelę lub stan ładowania/pusty.
   - Stworzyć komponent `AIErrorsFilters` z polem na `ticket_id` i logiką walidacji UUID.
   - Stworzyć komponent `PaginationControls` opakowujący komponent `Pagination` z `shadcn/ui`.
   - Stworzyć komponent `ErrorDetailsSheet` do wyświetlania sformatowanego JSON.

4. **Integracja z API w `useAIErrors`:**
   - Zaimplementować funkcję `fetchAIErrors` wewnątrz hooka, która wykonuje zapytanie `GET /api/ai-errors` z odpowiednimi parametrami.
   - Dodać logikę mapowania odpowiedzi z `AIErrorWithUserDTO` na `AIErrorViewModel`, w tym parsowanie `http_status`.
   - Dodać obsługę błędów API (ustawianie `api.error` w stanie).

5. **Połączenie logiki i UI:**
   - W głównym komponencie `AIErrorsView` użyć hooka `useAIErrors`.
   - Przekazać odpowiednie części stanu i funkcje do komponentów podrzędnych (`AIErrorsTable`, `AIErrorsFilters`, `PaginationControls`, `ErrorDetailsSheet`).
   - Zaimplementować logikę otwierania/zamykania `ErrorDetailsSheet` poprzez aktualizację `selectedError` w stanie.

6. **Styling i finalne poprawki:**
   - Dopracować style za pomocą Tailwind CSS, aby zapewnić spójność z resztą aplikacji.
   - Dodać skeleton loaders dla tabeli, aby poprawić UX podczas ładowania danych.
   - Upewnić się, że wszystkie elementy interaktywne mają odpowiednie stany `focus` i `hover`.

7. **Testowanie manualne:**
   - Sprawdzić poprawność renderowania danych.
   - Przetestować działanie paginacji.
   - Przetestować filtrowanie z poprawnym i niepoprawnym UUID.
   - Sprawdzić obsługę błędów API i stanów pustych/ładowania.
   - Zweryfikować działanie modala ze szczegółami.
