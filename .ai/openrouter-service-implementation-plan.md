# Przewodnik Implementacji Usługi OpenRouter

## 1. Opis usługi

Usługa OpenRouter (`OpenRouterService`) będzie hermetyzować logikę interakcji z API OpenRouter.ai. Jej głównym zadaniem jest przyjmowanie danych wejściowych (takich jak tytuł i opis zgłoszenia), konstruowanie odpowiedniego zapytania do modelu językowego (LLM), wysyłanie go do API, a następnie parsowanie i walidacja strukturyzowanej odpowiedzi. Usługa ta będzie fundamentem dla funkcji opartych na AI, takich jak generowanie sugestii dla zgłoszeń.

## 2. Opis konstruktora

Konstruktor `OpenRouterService` będzie odpowiedzialny za inicjalizację usługi, w tym za wczytanie i walidację kluczowych zmiennych środowiskowych.

```typescript
// Lokalizacja: src/lib/services/OpenRouterService.ts

import { SupabaseClient } from "src/db/supabase.client";
import { AiResponseSchema } from "src/lib/validation/ai";
import { z } from "zod";

type AiResponseType = z.infer<typeof AiResponseSchema>;

export class OpenRouterService {
  private apiKey: string;
  private supabase: SupabaseClient;
  private readonly openRouterUrl = "https://openrouter.ai/api/v1/chat/completions";

  constructor(supabase: SupabaseClient) {
    const apiKey = import.meta.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      console.error("Klucz API OpenRouter nie jest ustawiony w zmiennych środowiskowych.");
      throw new Error("OPENROUTER_API_KEY jest wymagany.");
    }

    this.apiKey = apiKey;
    this.supabase = supabase;
  }
}
```

- **Parametry:**
  - `supabase: SupabaseClient`: Instancja klienta Supabase, przekazywana w celu umożliwienia logowania błędów do bazy danych.
- **Logika:**
  1.  Pobiera `OPENROUTER_API_KEY` ze zmiennych środowiskowych serwera (dostępnych w Astro poprzez `import.meta.env`).
  2.  Sprawdza, czy klucz API istnieje. Jeśli nie, loguje błąd i rzuca wyjątkiem, aby zapobiec działaniu aplikacji w nieprawidłowym stanie.
  3.  Przypisuje klucz API i klienta Supabase do prywatnych pól klasy.

## 3. Publiczne metody i pola

### `async getSuggestions(params: { title: string; description?: string; userId?: string; }): Promise<AiResponseType>`

Główna metoda publiczna, która orkiestruje proces uzyskiwania sugestii AI.

- **Parametry:**
  - `params.title: string`: Tytuł analizowanego zgłoszenia.
  - `params.description?: string`: Opcjonalny opis zgłoszenia.
  - `params.userId?: string`: ID użytkownika do celów logowania błędów.
- **Zwraca:**
  - `Promise<AiResponseType>`: Obiekt z sugestiami, zgodny ze schematem Zod `AiResponseSchema`.
- **Logika:**
  1.  Pobiera dokumentację projektu z bazy danych.
  2.  Wywołuje prywatną metodę `_buildMessages` w celu stworzenia promptów systemowego i użytkownika.
  3.  Wywołuje prywatną metodę `_buildPayload` w celu skonstruowania pełnego ciała żądania.
  4.  Wysyła żądanie do API OpenRouter za pomocą `fetch`.
  5.  Obsługuje odpowiedź, parsuje i waliduje jej zawartość.
  6.  W przypadku błędu na dowolnym etapie, wywołuje metodę `_handleError` i rzuca przetworzonym wyjątkiem.

## 4. Prywatne metody i pola

### `_buildMessages(title: string, description: string | undefined, context: string)`

Tworzy tablicę wiadomości (`system` i `user`) dla API.

- **Cel:** Oddzielenie logiki tworzenia promptów od logiki wywołania API.
- **Logika:**
  - **Komunikat systemowy:** Definiuje rolę i zadania AI, a także instruuje, aby odpowiedź była w formacie JSON zgodnym z dostarczonym schematem.
  - **Komunikat użytkownika:** Formatuje dane wejściowe (tytuł, opis, kontekst) w czytelny sposób dla modelu.

### `_buildPayload(messages: any[])`

Konstruuje pełne ciało (`payload`) żądania POST do API OpenRouter.

- **Cel:** Centralizacja konfiguracji modelu i parametrów.
- **Logika:**
  - **`model`:** Ustawia nazwę modelu do użycia (np. `'mistralai/mistral-7b-instruct'`). Nazwę modelu należy przechowywać jako stałą wartość w ramach MVP.
  - **`messages`:** Dołącza wiadomości wygenerowane przez `_buildMessages`.
  - **`response_format`:** Definiuje oczekiwany format odpowiedzi. Należy użyć `zod-to-json-schema` do konwersji schematu Zod na JSON Schema, a następnie opakować go w strukturę wymaganą przez OpenRouter.
  - **Parametry modelu:** Ustawia parametry takie jak `temperature`, `max_tokens` itp.

### `async _handleError(error: unknown, context: Record<string, any>)`

Centralna funkcja do obsługi i logowania błędów.

- **Cel:** Standaryzacja logowania błędów i zapobieganie wyciekowi wrażliwych informacji do klienta.
- **Logika:**
  1.  Analizuje typ błędu (`Error`, `Response` z `fetch`, błąd walidacji Zod itp.).
  2.  Konstruuje obiekt błędu zawierający szczegółowe informacje.
  3.  Zapisuje błąd w tabeli `ai_errors` w Supabase, dołączając kontekst ( `ticket_id` (jeśli został zapisany), `user_id` (użytkownik który wywołał ten endpoint)).
  4.  Rzuca nowy, generyczny błąd, który zostanie przechwycony przez Astro API route i przekształcony na odpowiedź HTTP 500.

## 5. Obsługa błędów

Usługa musi być odporna na błędy i zapewniać mechanizmy do ich diagnozowania.

1.  **Błędy API OpenRouter (status 4xx/5xx):** Przechwytywane po wywołaniu `fetch`. Odpowiedź z API jest logowana do tabeli `ai_errors` w Supabase.
2.  **Błędy sieciowe:** `fetch` może rzucić wyjątek (np. brak połączenia). Jest on przechwytywany i logowany.
3.  **Błędy parsowania JSON:** Jeśli odpowiedź z API nie jest poprawnym JSON-em, błąd jest przechwytywany i logowany wraz z surową odpowiedzią tekstową.
4.  **Błędy walidacji (Zod):** Jeśli struktura odpowiedzi JSON jest niezgodna ze schematem `AiResponseSchema`, `safeParse` zwróci błąd. Szczegóły niezgodności i oryginalne dane są logowane.
5.  **Błąd konfiguracji:** Brak klucza `OPENROUTER_API_KEY` powoduje rzucenie wyjątku w konstruktorze, co uniemożliwia uruchomienie serwera w wadliwym stanie.

## 6. Kwestie bezpieczeństwa

1.  **Zarządzanie kluczem API:** Klucz `OPENROUTER_API_KEY` musi być przechowywany wyłącznie jako zmienna środowiskowa na serwerze i nigdy nie może być eksponowany po stronie klienta.
2.  **Ograniczanie dostępu:** Endpoint API Astro (`/api/ai-suggestion-sessions/analyze`), który korzysta z tej usługi, musi być zabezpieczony i dostępny tylko dla uwierzytelnionych użytkowników. Należy wykorzystać middleware Astro do weryfikacji tokena sesji Supabase.
3.  **Walidacja danych wejściowych:** Dane przychodzące do endpointu API (tytuł, opis) powinny być walidowane za pomocą Zod, aby zapobiec atakom typu injection, chociaż w kontekście promptu LLM ryzyko jest inne niż w SQL.

## 7. Plan wdrożenia krok po kroku

### Krok 1: Instalacja zależności

Dodaj bibliotekę do konwersji schematów Zod na JSON Schema.

```bash
npm install zod-to-json-schema
```

### Krok 2: Konfiguracja zmiennych środowiskowych

W pliku `.env` w głównym katalogu projektu dodaj swój klucz API.

```
# .env
OPENROUTER_API_KEY="sk-or-v1-..."
```

Upewnij się, że plik `.env` jest dodany do `.gitignore`.

### Krok 3: Definicja schematów walidacji Zod

Utwórz plik do walidacji związanej z AI, w którym zdefiniujesz oczekiwaną strukturę odpowiedzi.

```typescript
// Lokalizacja: src/lib/validation/ai.validation.ts

import { z } from "zod";

// Schemat pojedynczej sugestii
export const AiSuggestionSchema = z.object({
  type: z.enum(["INSERT", "QUESTION"]).describe("Suggestion type: INSERT to insert text, QUESTION for a question."),
  content: z.string().min(10).describe("Content of the suggestion or question."),
});

// Schemat całej odpowiedzi z listą sugestii
export const AiResponseSchema = z.object({
  suggestions: z.array(AiSuggestionSchema).max(3).describe("List of 1 to 3 suggestions for user."),
});
```

### Krok 4: Implementacja `OpenRouterService`

Utwórz plik usługi i zaimplementuj pełną logikę klasy.

```typescript
// Lokalizacja: src/lib/services/OpenRouterService.ts

import { SupabaseClient } from "src/db/supabase.client";
import { AiResponseSchema } from "src/lib/validation/ai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

// --- Typy ---
type AiResponseType = z.infer<typeof AiResponseSchema>;
type Message = { role: "system" | "user"; content: string };

// --- Stałe ---
const MODEL_NAME = "mistralai/mistral-7b-instruct";

export class OpenRouterService {
  private apiKey: string;
  private supabase: SupabaseClient;
  private readonly openRouterUrl = "https://openrouter.ai/api/v1/chat/completions";

  constructor(supabase: SupabaseClient) {
    const apiKey = import.meta.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error("API OpenRouter key is not set.");
      throw new Error("OPENROUTER_API_KEY is required.");
    }
    this.apiKey = apiKey;
    this.supabase = supabase;
  }

  public async getSuggestions(params: {
    title: string;
    description?: string;
    userId?: string; // Do logowania błędów
  }): Promise<AiResponseType> {
    try {
      const { data: doc } = await this.supabase.from("project_documentation").select("content").single();
      const context = doc?.content ?? "";

      const messages = this._buildMessages(params.title, params.description, context);
      const payload = this._buildPayload(messages);

      const response = await fetch(this.openRouterUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw response; // Rzuć obiektem odpowiedzi, aby obsłużyć go w _handleError
      }

      const jsonResponse = await response.json();
      const content = JSON.parse(jsonResponse.choices[0].message.content);

      const validation = AiResponseSchema.safeParse(content);
      if (!validation.success) {
        throw { type: "ValidationError", errors: validation.error, data: content };
      }

      return validation.data;
    } catch (error) {
      await this._handleError(error, { userId: params.userId, title: params.title });
      throw new Error("Failed to get AI suggestions.");
    }
  }

  private _buildMessages(title: string, description: string = "", context: string): Message[] {
    const systemMessage = `You are an expert software developer. Your task is to analyze the ticket title, description, and project documentation to generate helpful suggestions what can be additionaly included in the ticket description. Suggestions can be of two types: 'INSERT' (suggesting specific text to add) or 'QUESTION' (asking a clarifying question). Always respond only with a JSON object that conforms to the provided schema. Do not add any additional comments or text outside the JSON format. Respond in the same language as the provided ticket title and description.`;

    const userMessage = `Analyze the following ticket and documentation, then generate suggestions.

--- TICKET ---
Title: ${title}
Description: ${description}

--- PROJECT DOCUMENTATION ---
${context}`;

    return [
      { role: "system", content: systemMessage },
      { role: "user", content: userMessage },
    ];
  }

  private _buildPayload(messages: Message[]) {
    const jsonSchema = zodToJsonSchema(AiResponseSchema, "AiResponseSchema");

    return {
      model: MODEL_NAME,
      messages: messages,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "AiResponseSchema",
          strict: true,
          schema: jsonSchema.definitions!.AiResponseSchema,
        },
      },
      temperature: 0.6,
      max_tokens: 1024,
    };
  }

  private async _handleError(error: unknown, context: Record<string, any>): Promise<void> {
    let errorDetails: Record<string, any> = { message: "Unknown error" };

    if (error instanceof Response) {
      errorDetails = {
        message: `OpenRouter API error: ${error.status} ${error.statusText}`,
        details: await error.text(),
      };
    } else if (error instanceof Error) {
      errorDetails = { message: error.message, stack: error.stack };
    } else if (typeof error === "object" && error !== null && "type" in error && error.type === "ValidationError") {
      errorDetails = {
        message: "Model response validation error.",
        details: (error as any).errors,
        receivedData: (error as any).data,
      };
    } else {
      errorDetails = { message: "An unexpected error occurred", details: String(error) };
    }

    console.error("Error in OpenRouterService:", errorDetails);

    await this.supabase.from("ai_errors").insert({
      user_id: context.userId,
      error_message: errorDetails.message,
      error_details: errorDetails,
    });
  }
}
```

### Krok 5: Integracja z Astro API Route

Utwórz lub zmodyfikuj endpoint API, który będzie korzystał z nowej usługi.

```typescript
// Lokalizacja: src/pages/api/ai-suggestion-sessions/analyze.ts

import type { APIRoute } from "astro";
import { OpenRouterService } from "src/lib/services/OpenRouterService";
import { z } from "zod";

// Schemat walidacji ciała żądania
const RequestBodySchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
});

export const POST: APIRoute = async ({ request, locals }) => {
  const { user } = locals;
  if (!user) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  const body = await request.json();
  const validation = RequestBodySchema.safeParse(body);

  if (!validation.success) {
    return new Response(JSON.stringify({ message: "Invalid input", errors: validation.error }), {
      status: 400,
    });
  }

  const { title, description } = validation.data;
  const supabase = locals.supabase;

  try {
    const openRouterService = new OpenRouterService(supabase);

    const suggestions = await openRouterService.getSuggestions({
      title,
      description,
      userId: user.id,
    });

    // TODO: Zaimplementować zapis sesji i sugestii do bazy danych
    const sessionId = "generowane-uuid";

    return new Response(
      JSON.stringify({
        session_id: sessionId,
        suggestions: suggestions.suggestions.map((s) => ({ ...s, applied: false })),
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in /analyze endpoint:", error);
    return new Response(JSON.stringify({ message: "Internal server error while generating suggestions." }), {
      status: 500,
    });
  }
};
```
