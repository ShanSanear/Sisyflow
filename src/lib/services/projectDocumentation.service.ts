import { createSupabaseServerInstance, createSupabaseAdminInstance } from "../../db/supabase.client";
import type { UpdateProjectDocumentationCommand, ProjectDocumentationDTO } from "../../types";
import { updateProjectDocumentationSchema } from "../validation/schemas/projectDocumentation";
import { extractSupabaseError } from "../utils";

type SupabaseType = ReturnType<typeof createSupabaseServerInstance>;

const PROJECT_DOCUMENTATION_ID = "28ea0010-8a14-40c1-ad56-e324f9d0d872";

/**
 * Options for fetching project documentation
 */
interface FetchProjectDocumentationOptions {
  useAdminSupabaseInstance?: boolean;
}

/**
 * Custom error classes for project documentation service operations
 */
export class ProjectDocumentationServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProjectDocumentationServiceError";
  }
}

export class AccessDeniedError extends ProjectDocumentationServiceError {
  constructor(message = "Access denied") {
    super(message);
    this.name = "AccessDeniedError";
  }
}

export class UserProfileNotFoundError extends ProjectDocumentationServiceError {
  constructor(message = "User profile not found") {
    super(message);
    this.name = "UserProfileNotFoundError";
  }
}

/**
 * Service odpowiedzialny za operacje na dokumentacji projektu
 * Implementuje logikę biznesową dla pobierania i aktualizacji dokumentacji projektu
 */
export class ProjectDocumentationService {
  constructor(private supabase: SupabaseType) {}

  /**
   * Private method to fetch project documentation from database
   * @param options Configuration options for the fetch operation
   * @returns Raw documentation data from database
   */
  private async fetchProjectDocumentation(options: FetchProjectDocumentationOptions = {}): Promise<
    {
      id: string;
      content: string;
      updated_at: string;
      updated_by: string | null;
      profiles: { username: string } | null;
    }[]
  > {
    const { useAdminSupabaseInstance = false } = options;
    const client = useAdminSupabaseInstance ? createSupabaseAdminInstance() : this.supabase;

    const { data: documentation, error: fetchError } = await client
      .from("project_documentation")
      .select(
        `
        id,
        content,
        updated_at,
        updated_by,
        profiles!project_documentation_updated_by_fkey (
          username
        )
      `
      )
      .eq("id", PROJECT_DOCUMENTATION_ID)
      .limit(1);

    if (fetchError) {
      throw extractSupabaseError(fetchError, "Failed to fetch project documentation");
    }

    return documentation;
  }

  /**
   * Pobiera dokumentację projektu
   * Operacja dostępna tylko dla użytkowników z rolą ADMIN
   * Pobiera pojedynczy rekord z tabeli project_documentation wraz z informacjami o użytkowniku
   *
   * @returns Obiekt dokumentacji projektu wraz z informacjami o użytkowniku
   * @throws Error jeśli użytkownik nie ma uprawnień lub wystąpi błąd bazy danych
   */
  async getProjectDocumentation(): Promise<ProjectDocumentationDTO> {
    try {
      // Sprawdź czy użytkownik wykonujący operację jest administratorem
      const { data: isAdmin, error: adminCheckError } = await this.supabase.rpc("is_admin");

      if (adminCheckError) {
        throw extractSupabaseError(adminCheckError, "Failed to check admin status");
      }

      if (!isAdmin) {
        throw new AccessDeniedError("Only administrators can access project documentation");
      }

      const documentation = await this.fetchProjectDocumentation({ useAdminSupabaseInstance: false });

      if (!documentation || documentation.length === 0) {
        // Jeśli nie ma rekordu w tabeli, zwróć pusty string jako wartość
        const result: ProjectDocumentationDTO = {
          id: PROJECT_DOCUMENTATION_ID,
          content: "",
          updated_at: null,
          updated_by: undefined,
        };
        return result;
      }

      // Pobierz pierwszy (i jedyny) rekord z tablicy
      const doc = documentation[0];

      // Przekształć dane do oczekiwanego formatu DTO
      const result: ProjectDocumentationDTO = {
        id: doc.id,
        content: doc.content,
        updated_at: doc.updated_at,
        updated_by: doc.profiles
          ? {
              username: (doc.profiles as { username: string }).username,
            }
          : undefined,
      };

      return result;
    } catch (error) {
      // Re-throw custom errors
      if (error instanceof ProjectDocumentationServiceError) {
        throw error;
      }

      // Wrap other errors
      throw new ProjectDocumentationServiceError(
        error instanceof Error ? error.message : "Unknown error occurred while fetching project documentation"
      );
    }
  }

  /**
   * Gets project documentation content for AI processing (public access)
   * This method provides read-only access to project documentation content
   * without requiring admin privileges, for use in AI suggestion generation.
   * Uses admin instance to bypass RLS restrictions.
   *
   * @returns Project documentation content string
   */
  async getProjectDocumentationContent(): Promise<string> {
    try {
      const documentation = await this.fetchProjectDocumentation({ useAdminSupabaseInstance: true });

      // Return content or empty string if no documentation exists
      return documentation && documentation.length > 0 ? documentation[0].content : "";
    } catch (error) {
      // Return empty string on error to allow AI processing to continue
      console.warn("Failed to fetch project documentation content:", error);
      return "";
    }
  }

  /**
   * Aktualizuje dokumentację projektu
   * Operacja dostępna tylko dla użytkowników z rolą ADMIN
   * Aktualizuje pojedynczy rekord w tabeli project_documentation (upsert)
   *
   * @param command Dane do aktualizacji dokumentacji projektu
   * @param userId ID użytkownika wykonującego operację
   * @returns Zaktualizowany obiekt dokumentacji projektu wraz z informacjami o użytkowniku
   * @throws Error jeśli walidacja nie powiedzie się, użytkownik nie ma uprawnień lub wystąpi błąd bazy danych
   */
  async updateProjectDocumentation(
    command: UpdateProjectDocumentationCommand,
    userId: string
  ): Promise<ProjectDocumentationDTO> {
    // Walidacja danych wejściowych
    const validatedData = updateProjectDocumentationSchema.parse(command);

    try {
      // Sprawdź czy użytkownik wykonujący operację jest administratorem
      const { data: isAdmin, error: adminCheckError } = await this.supabase.rpc("is_admin");

      if (adminCheckError) {
        throw extractSupabaseError(adminCheckError, "Failed to check admin status");
      }

      if (!isAdmin) {
        throw new AccessDeniedError("Only administrators can update project documentation");
      }

      // Aktualizuj dokumentację projektu (upsert - ponieważ tabela zawiera tylko jeden rekord)
      // Używamy upsert z onConflict na stałym polu, aby zawsze aktualizować ten sam rekord
      // updated_at jest automatycznie obsługiwany przez trigger update_updated_at_column()
      const { data: updatedDoc, error: updateError } = await this.supabase
        .from("project_documentation")
        .upsert(
          {
            id: PROJECT_DOCUMENTATION_ID, // Stały ID dla pojedynczego rekordu dokumentacji
            content: validatedData.content,
            updated_by: userId,
          },
          {
            onConflict: "id", // Konflikt na polu id - zawsze aktualizuj ten sam rekord
          }
        )
        .select(
          `
          id,
          content,
          updated_at,
          updated_by,
          profiles!project_documentation_updated_by_fkey (
            username
          )
        `
        )
        .single();

      if (updateError) {
        throw extractSupabaseError(updateError, "Failed to update project documentation");
      }

      if (!updatedDoc) {
        throw new ProjectDocumentationServiceError("Failed to retrieve updated project documentation");
      }

      // Przekształć dane do oczekiwanego formatu DTO
      const result: ProjectDocumentationDTO = {
        id: updatedDoc.id,
        content: updatedDoc.content,
        updated_at: updatedDoc.updated_at,
        updated_by: updatedDoc.profiles
          ? {
              username: (updatedDoc.profiles as { username: string }).username,
            }
          : undefined,
      };

      return result;
    } catch (error) {
      // Re-throw custom errors
      if (error instanceof ProjectDocumentationServiceError) {
        throw error;
      }

      // Wrap other errors
      throw new ProjectDocumentationServiceError(
        error instanceof Error ? error.message : "Unknown error occurred while updating project documentation"
      );
    }
  }
}

/**
 * Factory function to create a ProjectDocumentationService instance
 * @param supabase Supabase client instance
 * @returns ProjectDocumentationService instance
 */
export function createProjectDocumentationService(supabase: SupabaseType): ProjectDocumentationService {
  return new ProjectDocumentationService(supabase);
}
