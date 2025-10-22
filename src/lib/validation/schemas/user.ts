import { z } from "zod";

/**
 * Schema walidacji dla tworzenia nowego użytkownika
 * Implementuje walidację zgodnie z wymaganiami biznesowymi:
 * - email: prawidłowy format email, wymagany
 * - username: 3-30 znaków, wymagany, tylko litery, cyfry, podkreślenia i kropki
 * - password: wymagany, minimum 8 znaków
 * - role: jedna z dozwolonych wartości enum (USER lub ADMIN)
 */
export const createUserSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email format").trim().toLowerCase(),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters long")
    .max(30, "Username cannot exceed 30 characters")
    .regex(/^[a-zA-Z0-9_.]+$/, "Username can only contain letters, numbers, underscores and dots")
    .trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(100, "Password cannot exceed 100 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),
  role: z.enum(["USER", "ADMIN"], {
    errorMap: () => ({ message: "Role must be either USER or ADMIN" }),
  }),
});

/**
 * Typ wywnioskowany ze schematu createUserSchema
 */
export type CreateUserInput = z.infer<typeof createUserSchema>;

/**
 * Schema walidacji dla parametrów query w GET /api/users
 * Implementuje walidację parametrów paginacji:
 * - limit: opcjonalny, domyślnie 50, maksymalnie 100, minimum 1
 * - offset: opcjonalny, domyślnie 0, minimum 0
 */
export const getUsersQuerySchema = z.object({
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
});

/**
 * Typ wywnioskowany ze schematu getUsersQuerySchema
 */
export type GetUsersQueryInput = z.infer<typeof getUsersQuerySchema>;

/**
 * Schema walidacji dla parametrów ścieżki zawierających user ID
 * Implementuje walidację formatu UUID dla identyfikatora użytkownika
 */
export const userIdParamsSchema = z.object({
  id: z.string().uuid("Invalid UUID format for user ID").trim(),
});

/**
 * Typ wywnioskowany ze schematu userIdParamsSchema
 */
export type UserIdParamsInput = z.infer<typeof userIdParamsSchema>;
