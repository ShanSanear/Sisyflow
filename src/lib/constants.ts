/**
 * Stałe używane w aplikacji
 */

// Stały user ID używany podczas developmentu
// TODO: Usunąć gdy zostanie zaimplementowane pełne uwierzytelnienie
export const DEVELOPMENT_USER_ID = "a66227cb-b970-4224-a6c0-f2ba668f136f";

// Limity załączników
export const ATTACHMENT_LIMITS = {
  MAX_PER_TICKET: 10,
  MAX_SIZE_PER_ATTACHMENT: 20 * 1024, // 20 KB
} as const;
