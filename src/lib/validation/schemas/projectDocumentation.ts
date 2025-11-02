import { z } from "zod";

/**
 * Schema walidacji dla aktualizacji dokumentacji projektu
 * Implementuje walidację zgodnie z wymaganiami biznesowymi:
 * - content: wymagany string o długości od 1 do 20000 znaków
 */
export const updateProjectDocumentationSchema = z.object({
  content: z.string().min(1, "Content cannot be empty").max(20000, "Content cannot exceed 20000 characters").trim(),
});

/**
 * Typ wywnioskowany ze schematu updateProjectDocumentationSchema
 */
export type UpdateProjectDocumentationInput = z.infer<typeof updateProjectDocumentationSchema>;
