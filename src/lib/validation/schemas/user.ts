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
