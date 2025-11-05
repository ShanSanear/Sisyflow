import { createSupabaseServerInstance, createSupabaseAdminInstance } from "../../db/supabase.client";
import type { CreateUserCommand, UserDTO, Profile } from "../../types";
import { createUserSchema } from "../validation/schemas/user";
import { extractSupabaseError } from "../utils";
import { POSTGREST_ERROR_CODES } from "../constants";
import { z } from "zod";

type SupabaseType = ReturnType<typeof createSupabaseServerInstance>;
type AdminSupabaseType = ReturnType<typeof createSupabaseAdminInstance>;

/**
 * Custom error classes for user service operations
 */
export class UserServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserServiceError";
  }
}

export class AccessDeniedError extends UserServiceError {
  constructor(message = "Access denied") {
    super(message);
    this.name = "AccessDeniedError";
  }
}

export class UserProfileNotFoundError extends UserServiceError {
  constructor(message = "User profile not found") {
    super(message);
    this.name = "UserProfileNotFoundError";
  }
}

export class EmailAlreadyExistsError extends UserServiceError {
  constructor(message = "Email already exists") {
    super(message);
    this.name = "EmailAlreadyExistsError";
  }
}

export class UsernameAlreadyExistsError extends UserServiceError {
  constructor(message = "Username already exists") {
    super(message);
    this.name = "Username already exists";
  }
}

export class AuthUserCreationError extends UserServiceError {
  constructor(message = "Failed to retrieve email from auth user") {
    super(message);
    this.name = "AuthUserCreationError";
  }
}

export class UserDeletionError extends UserServiceError {
  constructor(message = "Failed to delete user") {
    super(message);
    this.name = "UserDeletionError";
  }
}

export class SelfDeletionError extends UserServiceError {
  constructor(message = "Users cannot delete their own account") {
    super(message);
    this.name = "SelfDeletionError";
  }
}

export class UserToDeleteNotFoundError extends UserServiceError {
  constructor(message = "User to delete not found") {
    super(message);
    this.name = "UserToDeleteNotFoundError";
  }
}

/**
 * Service odpowiedzialny za operacje na użytkownikach
 * Implementuje logikę biznesową dla tworzenia i zarządzania użytkownikami
 */
export class UserService {
  private supabaseAdmin: AdminSupabaseType;

  constructor(private supabase: SupabaseType) {
    // Inicjalizuj admin client dla operacji wymagających uprawnień administratora
    this.supabaseAdmin = createSupabaseAdminInstance();
  }

  /**
   * Tworzy nowego użytkownika wraz z kontem w Supabase Auth i profilem
   * Wykonuje operację dwuetapową: najpierw Auth, potem profiles
   *
   * @param command Dane do utworzenia użytkownika
   * @param adminUserId ID administratora wykonującego operację
   * @returns Pełny obiekt użytkownika z danymi z Auth i profiles
   * @throws Error jeśli walidacja nie powiedzie się, użytkownik nie ma uprawnień lub wystąpi błąd bazy danych
   */
  async createUser(command: CreateUserCommand, adminUserId: string): Promise<UserDTO> {
    // Walidacja danych wejściowych
    const validatedData = createUserSchema.parse(command);

    try {
      // Sprawdź czy użytkownik wykonujący operację ma rolę ADMIN
      const { data: adminProfile, error: adminCheckError } = await this.supabase
        .from("profiles")
        .select("role")
        .eq("id", adminUserId)
        .single();

      if (adminCheckError || !adminProfile) {
        throw new UserProfileNotFoundError();
      }

      if (adminProfile.role !== ("ADMIN" as Profile["role"])) {
        throw new AccessDeniedError("Only administrators can create users");
      }

      // Sprawdź czy email już istnieje w auth.users
      const { data: existingAuthUsers, error: authCheckError } = await this.supabaseAdmin.auth.admin.listUsers();

      if (authCheckError) {
        throw extractSupabaseError(authCheckError, "Failed to check existing users in auth");
      }

      const emailExists = existingAuthUsers.users.some((user) => user.email === validatedData.email);
      if (emailExists) {
        throw new EmailAlreadyExistsError();
      }

      // Sprawdź czy username już istnieje w profiles
      const { data: existingProfile, error: profileCheckError } = await this.supabase
        .from("profiles")
        .select("id")
        .eq("username", validatedData.username)
        .single();

      if (profileCheckError && profileCheckError.code !== POSTGREST_ERROR_CODES.NO_ROWS_RETURNED_FOR_SINGLE) {
        // PGRST116 to kod dla "no rows returned", co oznacza że username jest dostępny
        throw extractSupabaseError(profileCheckError, "Failed to check existing username");
      }

      if (existingProfile) {
        throw new UsernameAlreadyExistsError();
      }

      // Utwórz użytkownika w Supabase Auth
      const { data: authUser, error: authError } = await this.supabaseAdmin.auth.admin.createUser({
        email: validatedData.email,
        password: validatedData.password,
        email_confirm: true, // Automatycznie potwierdzony email dla nowych użytkowników
      });

      if (authError || !authUser.user) {
        throw extractSupabaseError(authError, "Failed to create user in auth");
      }

      // Utwórz profil w tabeli profiles
      const { data: profile, error: profileError } = await this.supabase
        .from("profiles")
        .insert({
          id: authUser.user.id,
          username: validatedData.username,
          role: validatedData.role,
        })
        .select()
        .single();

      if (profileError) {
        // Jeśli tworzenie profilu się nie powiedzie, spróbuj usunąć użytkownika z Auth
        try {
          await this.supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        } catch (cleanupError) {
          console.error("Failed to cleanup auth user after profile creation failed:", cleanupError);
        }
        throw extractSupabaseError(profileError, "Failed to create user profile");
      }

      // Sprawdź czy email istnieje w danych auth
      if (!authUser.user.email) {
        throw new AuthUserCreationError();
      }

      // Formatuj odpowiedź zgodnie z UserDTO
      const result: UserDTO = {
        id: profile.id,
        email: authUser.user.email,
        username: profile.username,
        role: profile.role,
        created_at: profile.created_at,
      };

      return result;
    } catch (error) {
      // Przekaż błędy walidacji Zod bez zmian
      if (error instanceof z.ZodError) {
        throw error;
      }

      // Dla innych błędów, opakuj w bardziej przyjazny komunikat
      throw new Error(`Failed to create user: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Pobiera paginowaną listę wszystkich użytkowników systemu
   * Łączy dane z tabeli profiles z informacjami o email z Supabase Auth
   * Sortuje wyniki po created_at DESC
   *
   * @param limit Liczba użytkowników na stronę (1-100)
   * @param offset Przesunięcie w wynikach (minimum 0)
   * @returns Obiekt zawierający listę użytkowników i łączną liczbę użytkowników
   * @throws Error jeśli wystąpi błąd bazy danych
   */
  async getUsersPaginated(limit: number, offset: number): Promise<{ users: UserDTO[]; total: number }> {
    try {
      // Najpierw pobierz łączną liczbę użytkowników
      const { count: total, error: countError } = await this.supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      if (countError) {
        throw extractSupabaseError(countError, "Failed to count users");
      }

      // Następnie pobierz użytkowników z paginacją i JOIN z auth.users
      // Uwaga: Supabase nie obsługuje bezpośredniego JOIN między profiles a auth.users w pojedynczym zapytaniu
      // Musimy wykonać dwa zapytania: jeden dla profili, drugi dla emaili z auth

      const { data: profiles, error: profilesError } = await this.supabase
        .from("profiles")
        .select("id, username, role, created_at")
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (profilesError) {
        throw extractSupabaseError(profilesError, "Failed to fetch user profiles");
      }

      if (!profiles || profiles.length === 0) {
        return { users: [], total: total || 0 };
      }

      // Pobierz emaile dla użytkowników z Supabase Auth
      const { data: authUsers, error: authError } = await this.supabaseAdmin.auth.admin.listUsers();

      if (authError) {
        throw extractSupabaseError(authError, "Failed to fetch auth users");
      }

      // Mapuj profile z emailami z auth
      const users: UserDTO[] = profiles
        .map((profile) => {
          const authUser = authUsers.users.find((user) => user.id === profile.id);
          if (!authUser || !authUser.email) {
            console.warn(`No email found for user ${profile.id}`);
            return null;
          }

          return {
            id: profile.id,
            email: authUser.email,
            username: profile.username,
            role: profile.role,
            created_at: profile.created_at,
          };
        })
        .filter((user): user is UserDTO => user !== null);

      return {
        users,
        total: total || 0,
      };
    } catch (error) {
      throw new Error(`Failed to fetch users: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Usuwa użytkownika z systemu wraz z jego profilem i aktualizuje powiązane tickety
   * Wykonuje operację dwuetapową: sprawdzenie uprawnień, a następnie usunięcie przez Supabase Auth SDK
   * które automatycznie usuwa rekord z auth.users i profiles (cascade delete) oraz ustawia null dla reporter_id/assignee_id w ticketach
   *
   * @param userIdToDelete ID użytkownika do usunięcia
   * @param adminUserId ID administratora wykonującego operację
   * @throws Error jeśli walidacja nie powiedzie się, użytkownik nie ma uprawnień, próbuje usunąć samego siebie lub wystąpi błąd bazy danych
   */
  async deleteUser(userIdToDelete: string, adminUserId: string): Promise<void> {
    try {
      // Sprawdź czy użytkownik wykonujący operację ma rolę ADMIN
      const { data: adminProfile, error: adminCheckError } = await this.supabase
        .from("profiles")
        .select("role")
        .eq("id", adminUserId)
        .single();

      if (adminCheckError || !adminProfile) {
        throw new UserProfileNotFoundError();
      }

      if (adminProfile.role !== ("ADMIN" as Profile["role"])) {
        throw new AccessDeniedError("Only administrators can delete users");
      }

      // Zabrania użytkownikowi usunięcia własnego konta
      if (userIdToDelete === adminUserId) {
        throw new SelfDeletionError();
      }

      // Sprawdź czy użytkownik do usunięcia istnieje
      const { data: userToDelete, error: userCheckError } = await this.supabase
        .from("profiles")
        .select("id")
        .eq("id", userIdToDelete)
        .single();

      if (userCheckError || !userToDelete) {
        throw new UserToDeleteNotFoundError();
      }

      // Usuń użytkownika używając Supabase Auth SDK
      // To automatycznie usunie rekord z auth.users i profiles (przez cascade delete)
      // oraz ustawi null dla reporter_id i assignee_id w ticketach
      const { error: deleteError } = await this.supabaseAdmin.auth.admin.deleteUser(userIdToDelete);

      if (deleteError) {
        throw extractSupabaseError(deleteError, "Failed to delete user from auth");
      }
    } catch (error) {
      // Przekaż błędy walidacji Zod bez zmian
      if (error instanceof z.ZodError) {
        throw error;
      }

      // Dla innych błędów, opakuj w bardziej przyjazny komunikat
      throw new UserDeletionError(`Failed to delete user: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}

/**
 * Factory function do tworzenia instancji UserService
 * @param supabase Supabase client instance
 * @returns UserService instance
 */
export function createUserService(supabase: SupabaseType): UserService {
  return new UserService(supabase);
}
