import { z } from "zod";

/**
 * Schema walidacji dla parametrów query w GET /api/ai-errors
 * Implementuje walidację parametrów paginacji i filtrowania:
 * - limit: opcjonalny, domyślnie 50, maksymalnie 100, minimum 1
 * - offset: opcjonalny, domyślnie 0, minimum 0
 * - ticket_id: opcjonalny, prawidłowy format UUID dla filtrowania błędów po ticketcie
 */
export const getAIErrorsQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 50))
    .refine((val) => val >= 1 && val <= 100, {
      message: "Limit must be between 1 and 100",
    }),
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 0))
    .refine((val) => val >= 0, {
      message: "Offset must be greater than or equal to 0",
    }),
  ticket_id: z.string().uuid("Invalid UUID format for ticket_id").optional(),
});

/**
 * Schema walidacji dla tworzenia nowego błędu AI
 * Implementuje walidację zgodnie z wymaganiami biznesowymi:
 * - error_message: wymagany, niepusty ciąg znaków, maksymalnie 1000 znaków
 * - error_details: opcjonalny obiekt JSON z dodatkowymi szczegółami błędu
 * - ticket_id: opcjonalny, prawidłowy format UUID dla powiązania z ticketem
 * - user_id: opcjonalny, prawidłowy format UUID dla identyfikacji użytkownika
 */
export const createAIErrorSchema = z.object({
  error_message: z
    .string()
    .min(1, "Error message is required")
    .max(1000, "Error message cannot exceed 1000 characters")
    .trim(),
  error_details: z.any().optional(), // JSON object for additional error details
  ticket_id: z.string().uuid("Invalid UUID format for ticket_id").optional(),
  user_id: z.string().uuid("Invalid UUID format for user_id").optional(),
});

/**
 * Typ wywnioskowany ze schematu createAIErrorSchema
 */
export type CreateAIErrorInput = z.infer<typeof createAIErrorSchema>;

/**
 * Typ wywnioskowany ze schematu getAIErrorsQuerySchema
 */
export type GetAIErrorsQueryInput = z.infer<typeof getAIErrorsQuerySchema>;
