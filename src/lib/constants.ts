/**
 * Stałe używane w aplikacji
 */

// Stały user ID używany podczas developmentu
// TODO: Usunąć gdy zostanie zaimplementowane pełne uwierzytelnienie
export const DEVELOPMENT_USER_ID = "e62f8bf5-c112-45c3-a0e5-59bd956fa319";

// Limity załączników
export const ATTACHMENT_LIMITS = {
  MAX_PER_TICKET: 10,
  MAX_SIZE_PER_ATTACHMENT: 20 * 1024, // 20 KB
} as const;
