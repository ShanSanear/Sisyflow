import { z } from "zod";

/**
 * Schema walidacji dla tworzenia nowego ticketu
 * Implementuje walidację zgodnie z wymaganiami biznesowymi:
 * - title: 1-200 znaków
 * - description: opcjonalne, max 10000 znaków
 * - type: jedna z dozwolonych wartości enum
 */
export const createTicketSchema = z.object({
  title: z.string().min(1, "Title cannot be empty").max(200, "Title cannot exceed 200 characters").trim(),
  description: z.string().max(10000, "Description cannot exceed 10000 characters").optional(),
  type: z.enum(["BUG", "IMPROVEMENT", "TASK"], {
    errorMap: () => ({ message: "Type must be one of: BUG, IMPROVEMENT, TASK" }),
  }),
});

/**
 * Schema walidacji dla parametrów query GET /tickets
 * Implementuje walidację zgodnie z wymaganiami API:
 * - limit: 1-100, domyślnie 10
 * - offset: >= 0, domyślnie 0
 * - status: opcjonalny enum statusu
 * - type: opcjonalny enum typu
 * - assignee_id: opcjonalny UUID
 * - reporter_id: opcjonalny UUID
 * - sort: opcjonalny string sortowania
 */
export const getTicketsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(10),
  offset: z.coerce.number().int().min(0).default(0),
  status: z.enum(["OPEN", "IN_PROGRESS", "CLOSED"]).optional(),
  type: z.enum(["BUG", "IMPROVEMENT", "TASK"]).optional(),
  assignee_id: z.string().uuid().optional(),
  reporter_id: z.string().uuid().optional(),
  sort: z.string().default("created_at desc"),
});

/**
 * Schema walidacji dla parametrów URL zawierających ID ticketu
 * Implementuje walidację zgodnie z wymaganiami API:
 * - id: prawidłowy UUID format
 */
export const ticketIdParamsSchema = z.object({
  id: z.string().uuid("Invalid ticket ID format - must be a valid UUID"),
});

/**
 * Schema walidacji dla aktualizacji statusu ticketu
 * Implementuje walidację zgodnie z wymaganiami biznesowymi:
 * - status: jedna z dozwolonych wartości enum ("OPEN", "IN_PROGRESS", "CLOSED")
 */
export const updateTicketStatusSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "CLOSED"], {
    errorMap: () => ({ message: "Status must be one of: OPEN, IN_PROGRESS, CLOSED" }),
  }),
});

/**
 * Schema walidacji dla aktualizacji ticketu (PUT /tickets/:id)
 * Implementuje walidację zgodnie z wymaganiami biznesowymi:
 * - title: opcjonalne, 1-200 znaków
 * - description: opcjonalne, max 10000 znaków
 * - type: opcjonalne, jedna z dozwolonych wartości enum
 * Wymaga przynajmniej jednego pola do aktualizacji
 */
export const updateTicketSchema = z
  .object({
    title: z.string().min(1, "Title cannot be empty").max(200, "Title cannot exceed 200 characters").trim().optional(),
    description: z.string().max(10000, "Description cannot exceed 10000 characters").optional(),
    type: z
      .enum(["BUG", "IMPROVEMENT", "TASK"], {
        errorMap: () => ({ message: "Type must be one of: BUG, IMPROVEMENT, TASK" }),
      })
      .optional(),
  })
  .refine(
    (data) => {
      // Sprawdź czy przynajmniej jedno pole zostało podane do aktualizacji
      return Object.values(data).some((value) => value !== undefined);
    },
    {
      message: "At least one field must be provided for update",
    }
  );

// Typy wywnioskowane ze schematów
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type GetTicketsQueryInput = z.infer<typeof getTicketsQuerySchema>;
export type TicketIdParamsInput = z.infer<typeof ticketIdParamsSchema>;
export type UpdateTicketStatusInput = z.infer<typeof updateTicketStatusSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
