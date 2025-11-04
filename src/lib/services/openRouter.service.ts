import { createSupabaseServerInstance } from "../../db/supabase.client";
import type { Json } from "../../db/database.types";
import { AiResponseSchema } from "../validation/ai.validation";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { createProjectDocumentationService } from "./projectDocumentation.service";

// --- Typy ---
type AiResponseType = z.infer<typeof AiResponseSchema>;
type SupabaseType = ReturnType<typeof createSupabaseServerInstance>;
interface Message {
  role: "system" | "user";
  content: string;
}

interface ValidationError {
  type: "ValidationError";
  errors: z.ZodError;
  data: unknown;
}

interface ErrorDetails {
  message: string;
  details?: unknown;
  stack?: string;
  receivedData?: unknown;
}

// --- Stałe ---
const MODEL_NAME = "mistralai/mistral-7b-instruct";

/**
 * Serwis odpowiedzialny za komunikację z API OpenRouter.ai
 * Hermetyzuje logikę interakcji z modelem językowym dla generowania sugestii AI
 */
export class OpenRouterService {
  private apiKey: string;
  private supabase: SupabaseType;
  private projectDocumentationService: ReturnType<typeof createProjectDocumentationService>;
  private readonly openRouterUrl = "https://openrouter.ai/api/v1/chat/completions";

  /**
   * Tworzy nową instancję serwisu OpenRouter
   * @param supabase Instancja klienta Supabase dla logowania błędów
   * @throws Error jeśli OPENROUTER_API_KEY nie jest skonfigurowany
   */
  constructor(supabase: SupabaseType) {
    const apiKey = import.meta.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      console.error("OPENROUTER_API_KEY nie jest ustawiony w zmiennych środowiskowych.");
      throw new Error("OPENROUTER_API_KEY jest wymagany.");
    }

    this.apiKey = apiKey;
    this.supabase = supabase;
    this.projectDocumentationService = createProjectDocumentationService(supabase);
  }

  /**
   * Główna metoda publiczna generująca sugestie AI na podstawie tytułu i opisu zgłoszenia
   * @param params Parametry zawierające tytuł, opcjonalny opis i opcjonalne ID użytkownika
   * @returns Obiekt z sugestiami zgodny ze schematem AiResponseSchema
   * @throws Error jeśli wystąpi błąd podczas komunikacji z API lub walidacji odpowiedzi
   */
  public async getSuggestions(params: {
    title: string;
    description?: string;
    userId?: string;
  }): Promise<AiResponseType> {
    try {
      // Pobierz dokumentację projektu używając service
      const context = await this.projectDocumentationService.getProjectDocumentationContent();

      // Przygotuj wiadomości dla modelu AI
      const messages = this._buildMessages(params.title, params.description, context);

      // Przygotuj payload żądania
      const payload = this._buildPayload(messages);

      // Wyślij żądanie do API OpenRouter
      const response = await fetch(this.openRouterUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      // Sprawdź status odpowiedzi
      if (!response.ok) {
        throw response; // Rzuć obiektem odpowiedzi, aby obsłużyć go w _handleError
      }

      // Parsuj odpowiedź JSON
      const jsonResponse = await response.json();
      const content = JSON.parse(jsonResponse.choices[0].message.content);

      // Waliduj odpowiedź zgodnie ze schematem
      const validation = AiResponseSchema.safeParse(content);
      if (!validation.success) {
        throw { type: "ValidationError", errors: validation.error, data: content };
      }

      return validation.data;
    } catch (error) {
      await this._handleError(error, { userId: params.userId ?? null, title: params.title });
      throw new Error("Failed to get AI suggestions.");
    }
  }

  /**
   * Prywatna metoda budująca wiadomości systemowe i użytkownika dla modelu AI
   * @param title Tytuł zgłoszenia
   * @param description Opcjonalny opis zgłoszenia
   * @param context Dokumentacja projektu
   * @returns Tablica wiadomości dla API
   */
  private _buildMessages(title: string, description = "", context: string): Message[] {
    const systemMessage = `You are an expert software developer. Your task is to analyze the ticket title, description, and project documentation to generate helpful suggestions what can be additionally included in the ticket description. Suggestions can be of two types: 'INSERT' (suggesting specific text to add) or 'QUESTION' (asking a clarifying question). Always respond only with a JSON object that conforms to the provided schema. Do not add any additional comments or text outside the JSON format. Respond in the same language as the provided ticket title and description. Respond with maximum of 6 suggestions.`;

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

  /**
   * Prywatna metoda budująca payload żądania dla API OpenRouter
   * @param messages Tablica wiadomości do wysłania do modelu
   * @returns Obiekt payload zgodny z API OpenRouter
   */
  private _buildPayload(messages: Message[]) {
    const jsonSchema = zodToJsonSchema(AiResponseSchema, "AiResponseSchema");

    // Sprawdź czy schema zawiera definicje
    if (!jsonSchema.definitions || !jsonSchema.definitions.AiResponseSchema) {
      throw new Error("Failed to generate JSON schema for AiResponseSchema");
    }

    return {
      model: MODEL_NAME,
      messages: messages,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "AiResponseSchema",
          strict: true,
          schema: jsonSchema.definitions.AiResponseSchema,
        },
      },
      temperature: 0.6,
      max_tokens: 1024,
    };
  }

  /**
   * Prywatna metoda sprawdzająca czy błąd jest błędem walidacji
   * @param error Błąd do sprawdzenia
   * @returns true jeśli błąd jest typu ValidationError
   */
  private _isValidationError(error: unknown): error is ValidationError {
    return typeof error === "object" && error !== null && "type" in error && error.type === "ValidationError";
  }

  /**
   * Prywatna metoda obsługująca błędy i zapisująca je do bazy danych
   * @param error Nieznany błąd do obsłużenia
   * @param error_context Dodatkowy kontekst błędu (userId, title)
   */
  private async _handleError(error: unknown, error_context: { userId: string | null; title: string }): Promise<void> {
    let errorDetails: ErrorDetails;

    if (error instanceof Response) {
      // Błąd API OpenRouter (4xx/5xx)
      errorDetails = {
        message: `OpenRouter API error: ${error.status} ${error.statusText}`,
        details: await error.text(),
      };
    } else if (error instanceof Error) {
      // Standardowy błąd JavaScript
      errorDetails = { message: error.message, stack: error.stack };
    } else if (this._isValidationError(error)) {
      // Błąd walidacji odpowiedzi modelu
      errorDetails = {
        message: "Model response validation error.",
        details: error.errors,
        receivedData: error.data,
      };
    } else {
      // Nieznany typ błędu
      errorDetails = { message: "An unexpected error occurred", details: String(error) };
    }

    console.error("Error in OpenRouterService:", errorDetails);

    // Zapisz błąd do tabeli ai_errors w Supabase
    const errorInsert: {
      user_id?: string | null;
      error_message: string;
      error_details?: Json | null;
    } = {
      user_id: error_context.userId,
      error_message: errorDetails.message,
      error_details: errorDetails as unknown as Json,
    };

    await this.supabase.from("ai_errors").insert(errorInsert);
  }
}

/**
 * Factory function do tworzenia instancji OpenRouterService
 * @param supabase Supabase client instance
 * @returns OpenRouterService instance
 */
export function createOpenRouterService(supabase: SupabaseType): OpenRouterService {
  return new OpenRouterService(supabase);
}
