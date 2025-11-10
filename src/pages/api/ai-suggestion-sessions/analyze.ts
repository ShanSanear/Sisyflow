import type { APIRoute } from "astro";
import type { AISuggestionsResponse } from "../../../types";
import { analyzeAiSuggestionsSchema } from "../../../lib/validation/ai.validation";
import { z } from "zod";
import {
  isZodError,
  isDatabaseConnectionError,
  createDatabaseConnectionErrorResponse,
  createZodValidationResponse,
} from "../../../lib/utils";
import { isFeatureEnabled, FeatureFlag } from "../../../features";
import { createOpenRouterService } from "@/lib/services/openRouter.service";
import { createSupabaseServerInstance } from "@/db/supabase.client";

export const prerender = false;

/**
 * POST /api/ai-suggestion-sessions/analyze
 *
 * Generates AI suggestions for tickets based on title and description.
 * Uses feature flags to control whether to return enhanced dummy data or basic dummy data.
 * OpenRouter integration is commented out but can be re-enabled when ready.
 * Wymaga uwierzytelnienia użytkownika.
 *
 * Request Body: { ticket_id: string, title: string, description?: string }
 * Response: 200 OK - { session_id: string, suggestions: Array<{ type: "INSERT"|"QUESTION", content: string, applied: boolean }> }
 * Error Responses: 400 Bad Request, 401 Unauthorized, 500 Internal Server Error
 */
export const POST: APIRoute = async ({ request, locals, cookies }) => {
  try {
    // Sprawdź czy użytkownik jest uwierzytelniony
    if (!locals.user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Authentication required",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Parsuj ciało żądania
    let requestData: z.infer<typeof analyzeAiSuggestionsSchema>;
    try {
      requestData = await request.json();
    } catch (parseError) {
      console.error("JSON parsing error:", parseError);
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Invalid JSON in request body",
          details: parseError instanceof Error ? parseError.message : "Unknown parsing error",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Walidacja danych wejściowych
    const validation = analyzeAiSuggestionsSchema.safeParse(requestData);
    if (!validation.success) {
      return createZodValidationResponse(validation.error);
    }

    // Check if AI analysis feature is enabled
    const aiAnalysisEnabled = isFeatureEnabled(FeatureFlag.AI_ANALYSIS);

    let suggestions: { type: "INSERT" | "QUESTION"; content: string; applied: boolean }[];

    if (aiAnalysisEnabled) {
      const userId = locals.user.id;
      const supabase = createSupabaseServerInstance({
        cookies,
        headers: request.headers,
      });
      const openRouterService = createOpenRouterService(supabase);
      const aiSuggestions = await openRouterService.getSuggestions({
        title: requestData.title,
        description: requestData.description,
        userId: userId,
      });
      suggestions = aiSuggestions.suggestions.map((s) => ({ ...s, applied: false }));
    } else {
      suggestions = [
        {
          type: "INSERT" as const,
          content: "This is a placeholder suggestion when AI analysis is disabled.",
          applied: false,
        },
        {
          type: "QUESTION" as const,
          content: "AI analysis is currently disabled in this environment.",
          applied: false,
        },
        {
          type: "INSERT" as const,
          content: "This is a placeholder suggestion when AI analysis is disabled.",
          applied: false,
        },
        {
          type: "QUESTION" as const,
          content: "AI analysis is currently disabled in this environment.",
          applied: false,
        },
        {
          type: "INSERT" as const,
          content: "This is a placeholder suggestion when AI analysis is disabled.",
          applied: false,
        },
        {
          type: "QUESTION" as const,
          content: "AI analysis is currently disabled in this environment.",
          applied: false,
        },
        {
          type: "INSERT" as const,
          content: "This is a placeholder suggestion when AI analysis is disabled.",
          applied: false,
        },
        {
          type: "QUESTION" as const,
          content: "AI analysis is currently disabled in this environment.",
          applied: false,
        },
        {
          type: "INSERT" as const,
          content: "This is a placeholder suggestion when AI analysis is disabled.",
          applied: false,
        },
        {
          type: "QUESTION" as const,
          content: "AI analysis is currently disabled in this environment.",
          applied: false,
        },
      ];
    }

    // Return only suggestions - session creation happens when saving
    const suggestionsResult: AISuggestionsResponse = {
      suggestions,
    };

    return new Response(JSON.stringify(suggestionsResult), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error in /api/ai-suggestion-sessions/analyze:", error);

    // Sprawdź czy to błąd połączenia z bazą danych
    if (isDatabaseConnectionError(error)) {
      return createDatabaseConnectionErrorResponse("AI suggestions generation");
    }

    // Obsługa błędów walidacji Zod (choć większość walidacji już wykonana)
    if (isZodError(error)) {
      return createZodValidationResponse(error);
    }

    // Obsługa innych błędów
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "Failed to generate AI suggestions. Please try again later.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
