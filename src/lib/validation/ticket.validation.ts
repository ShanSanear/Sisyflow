import { z } from "zod";

/**
 * Schema walidacji dla tworzenia nowego ticketu
 * Implementuje walidację zgodnie z wymaganiami biznesowymi:
 * - title: 1-200 znaków
 * - description: opcjonalne, max 10000 znaków
 * - type: jedna z dozwolonych wartości enum
 * - attachments: opcjonalne, tablica z filename i content
 */
export const createTicketSchema = z.object({
  title: z.string().min(1, "Title cannot be empty").max(200, "Title cannot exceed 200 characters").trim(),
  description: z.string().max(10000, "Description cannot exceed 10000 characters").optional(),
  type: z.enum(["BUG", "IMPROVEMENT", "TASK"], {
    errorMap: () => ({ message: "Type must be one of: BUG, IMPROVEMENT, TASK" }),
  }),
  attachments: z
    .array(
      z.object({
        filename: z
          .string()
          .min(1, "Filename cannot be empty")
          .max(255, "Filename cannot exceed 255 characters")
          .trim(),
        content: z.string().min(1, "Content cannot be empty"),
      })
    )
    .max(10, "Maximum 10 attachments allowed")
    .optional(),
});

/**
 * Schema walidacji dla pojedynczego załącznika
 */
export const createAttachmentSchema = z.object({
  filename: z.string().min(1, "Filename cannot be empty").max(255, "Filename cannot exceed 255 characters").trim(),
  content: z.string().min(1, "Content cannot be empty"),
});

// Typy wywnioskowane ze schematów
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type CreateAttachmentInput = z.infer<typeof createAttachmentSchema>;
