import { useState, useEffect, useCallback } from "react";
import {
  getProjectDocumentation,
  updateProjectDocumentation,
  ProjectDocumentationNotFoundError,
  ProjectDocumentationValidationError,
  ProjectDocumentationForbiddenError,
} from "../api/projectDocumentation";
import type { ProjectDocumentationDTO, UpdateProjectDocumentationCommand, SaveStatus } from "@/types";

const MAX_CHARS = 20000;

export interface DocumentationFormState {
  content: string;
  charCount: number;
  maxChars: number;
  dirty: boolean;
}

export interface ApiState {
  loading: boolean;
  saving: boolean;
  error: string | null;
}

export interface DocumentationViewModel {
  data: ProjectDocumentationDTO | null;
  form: DocumentationFormState;
  api: ApiState;
}

export enum CharCountStatus {
  Normal = "normal",
  Warning = "warning",
  Error = "error",
}

interface ApiError extends Error {
  status: number;
  details?: string[];
}

/**
 * Oblicza status licznika znaków na podstawie aktualnej długości i maksymalnej
 * @param current - aktualna liczba znaków
 * @param max - maksymalna liczba znaków
 * @returns CharCountStatus
 */
function getCharCountStatus(current: number, max: number): CharCountStatus {
  if (current > max) return CharCountStatus.Error;
  if (current >= max * 0.8) return CharCountStatus.Warning;
  return CharCountStatus.Normal;
}

/**
 * Hook do zarządzania dokumentacją projektu w panelu administratora
 */
export const useProjectDocumentation = () => {
  const [viewModel, setViewModel] = useState<DocumentationViewModel>({
    data: null,
    form: {
      content: "",
      charCount: 0,
      maxChars: MAX_CHARS,
      dirty: false,
    },
    api: {
      loading: true,
      saving: false,
      error: null,
    },
  });

  /**
   * Ładuje dokumentację z API
   */
  const load = useCallback(async () => {
    try {
      setViewModel((prev) => ({
        ...prev,
        api: { ...prev.api, loading: true, error: null },
      }));

      const data = await getProjectDocumentation();

      setViewModel((prev) => ({
        ...prev,
        data,
        form: {
          content: data.content,
          charCount: data.content.length,
          maxChars: MAX_CHARS,
          dirty: false,
        },
        api: { ...prev.api, loading: false },
      }));
    } catch (error) {
      let message = "Failed to load project documentation";

      if (error instanceof ProjectDocumentationNotFoundError) {
        message = "Project documentation not found.";
      } else if (error instanceof ProjectDocumentationForbiddenError) {
        message = error.message;
      } else if (error instanceof ProjectDocumentationValidationError) {
        message = `Validation error: ${error.details?.join(", ") || error.message}`;
      } else {
        const err = error as ApiError;
        if (err.status === 401) {
          message = "Authentication required. Please log in again.";
          // TODO: przekierowanie na stronę logowania
        } else if (err.status >= 500) {
          message = "Server error. Please try again later.";
        } else if (err.message) {
          message = err.message;
        }
      }

      setViewModel((prev) => ({
        ...prev,
        api: { ...prev.api, loading: false, error: message },
      }));
      // Don't call showError here - let the component handle error display
    }
  }, []); // No dependencies to prevent recreation

  /**
   * Aktualizuje zawartość formularza
   */
  const setContent = useCallback((value: string) => {
    const charCount = value.length;
    setViewModel((prev) => ({
      ...prev,
      form: {
        ...prev.form,
        content: value,
        charCount,
        dirty: value !== (prev.data?.content || ""),
      },
    }));
  }, []);

  /**
   * Zapisuje dokumentację
   */
  const save = useCallback(async () => {
    const { content } = viewModel.form;
    const trimmedContent = content.trim();

    // Walidacja
    if (trimmedContent.length === 0) {
      throw new Error("Content cannot be empty");
    }

    if (content.length > MAX_CHARS) {
      throw new Error(`Content cannot exceed ${MAX_CHARS} characters`);
    }

    try {
      setViewModel((prev) => ({
        ...prev,
        api: { ...prev.api, saving: true, error: null },
      }));

      const command: UpdateProjectDocumentationCommand = { content };
      const updatedData = await updateProjectDocumentation(command);

      setViewModel((prev) => ({
        ...prev,
        data: updatedData,
        form: {
          ...prev.form,
          dirty: false,
        },
        api: { ...prev.api, saving: false },
      }));

      // Success is handled by the component
    } catch (error) {
      let message = "Failed to update project documentation";

      if (error instanceof ProjectDocumentationNotFoundError) {
        message = "Project documentation not found.";
      } else if (error instanceof ProjectDocumentationValidationError) {
        message = `Validation error: ${error.details?.join(", ") || error.message}`;
      } else if (error instanceof ProjectDocumentationForbiddenError) {
        message = error.message;
      } else {
        const err = error as ApiError;
        if (err.message === "Content cannot be empty" || err.message?.includes("Content cannot exceed")) {
          // Client-side validation error - use the thrown message directly
          message = err.message;
        } else if (err.status === 401) {
          message = "Authentication expired. Please log in again.";
          // TODO: przekierowanie na stronę logowania
        } else if (err.status >= 500) {
          message = "Server error. Please try again later.";
        } else if (err.message) {
          message = err.message;
        }
      }

      setViewModel((prev) => ({
        ...prev,
        api: { ...prev.api, saving: false, error: message },
      }));

      // Error display is handled by the component
      throw error; // Re-throw so component can handle it
    }
  }, [viewModel.form]);

  /**
   * Przeładuj dane z API
   */
  const refetch = useCallback(async () => {
    await load();
  }, [load]);

  // Załaduj dane przy montowaniu komponentu
  useEffect(() => {
    load();
  }, [load]); // Include load in dependencies for proper effect behavior

  // Oblicz status zapisu
  const saveStatus: SaveStatus = viewModel.api.saving
    ? "saving"
    : viewModel.api.error
      ? "error"
      : viewModel.form.dirty
        ? "idle"
        : "idle"; // Możemy dodać "success" jeśli będziemy śledzić stan sukcesu

  const charCountStatus = getCharCountStatus(viewModel.form.charCount, viewModel.form.maxChars);

  return {
    viewModel,
    saveStatus,
    charCountStatus,
    load,
    setContent,
    save,
    refetch,
    isDirty: viewModel.form.dirty,
    isLoading: viewModel.api.loading,
    isSaving: viewModel.api.saving,
    error: viewModel.api.error,
  };
};
