// TODO after ticket modal implementation - simplify validation schemas to be in one file, rather than in two different ones
import { z } from "zod";

/**
 * Schema walidacji dla formularza ticket modal
 * Używany w TicketForm dla trybów create i edit
 */
export const ticketSchema = z.object({
  title: z.string().min(1, "Tytuł wymagany").max(200, "Tytuł max 200 znaków"),
  description: z.string().max(10000, "Opis max 10000 znaków").optional(),
  type: z.enum(["BUG", "IMPROVEMENT", "TASK"], { required_error: "Typ wymagany" }),
});

/**
 * Typ wywnioskowany ze schematu ticketSchema
 */
export type TicketFormData = z.infer<typeof ticketSchema>;
