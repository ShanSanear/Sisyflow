import type { ProfileDTO } from "../../types";

/**
 * UserViewModel - Uproszczony model na potrzeby komponentów UI.
 * Zawiera tylko niezbędne dane oraz pole pochodne (initials).
 */
export interface UserViewModel {
  username: string;
  role: ProfileDTO["role"];
  initials: string; // Wyliczane z username, np. "Jan Kowalski" -> "JK"
}
