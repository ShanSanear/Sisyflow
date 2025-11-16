// TODO after ticket modal implementation - simplify validation schemas to be in one file, rather than in two different ones
import { z } from "zod";

/**
 * Schema walidacji dla formularza ticket modal
 * Używany w TicketForm dla trybów create i edit
 */
export const ticketSchema = z.object({
  title: z.string().min(1, "Title required").max(200, "Title cannot exceed 200 characters"),
  description: z.string().max(10000, "Description cannot exceed 10000 characters").optional(),
  type: z.enum(["BUG", "IMPROVEMENT", "TASK"], { required_error: "Type is required" }),
  assignee: z
    .object({
      id: z.string(),
      username: z.string(),
    })
    .nullable()
    .optional(),
  ai_enhanced: z.boolean(),
});

/**
 * Typ wywnioskowany ze schematu ticketSchema
 */
export type TicketFormData = z.infer<typeof ticketSchema>;
