/**
 * Stałe używane w aplikacji
 */

// Stały user ID używany podczas developmentu
// TODO: Usunąć gdy zostanie zaimplementowane pełne uwierzytelnienie
// export const DEVELOPMENT_USER_ID = "e62f8bf5-c112-45c3-a0e5-59bd956fa319";
export const DEVELOPMENT_USER_ID = "0255e637-e96a-463c-b8cb-12c6e785e9f3";

// Limity załączników
export const ATTACHMENT_LIMITS = {
  MAX_PER_TICKET: 10,
  MAX_SIZE_PER_ATTACHMENT: 20 * 1024, // 20 KB
} as const;

// Kody błędów PostgREST (Supabase)
export const POSTGREST_ERROR_CODES = {
  // No rows returned for a query that expects exactly one row
  NO_ROWS_RETURNED_FOR_SINGLE: "PGRST116",
} as const;
