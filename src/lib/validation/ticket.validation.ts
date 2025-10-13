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

// Typy wywnioskowane ze schematów
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
