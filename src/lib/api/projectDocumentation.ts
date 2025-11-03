import type { ProjectDocumentationDTO, UpdateProjectDocumentationCommand } from "@/types";

interface ApiError extends Error {
  status: number;
  details?: string[];
}

/**
 * Pobiera dokumentację projektu
 * @returns Promise<ProjectDocumentationDTO>
 * @throws Error jeśli żądanie się nie powiedzie
 */
export async function getProjectDocumentation(): Promise<ProjectDocumentationDTO> {
  const response = await fetch("/api/project-documentation", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(
      errorData.message || `Failed to fetch project documentation: ${response.status}`
    ) as ApiError;
    error.status = response.status;
    error.details = errorData.details;
    throw error;
  }

  return response.json();
}

/**
 * Aktualizuje dokumentację projektu
 * @param command - dane do aktualizacji
 * @returns Promise<ProjectDocumentationDTO>
 * @throws Error jeśli żądanie się nie powiedzie
 */
export async function updateProjectDocumentation(
  command: UpdateProjectDocumentationCommand
): Promise<ProjectDocumentationDTO> {
  const response = await fetch("/api/project-documentation", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(
      errorData.message || `Failed to update project documentation: ${response.status}`
    ) as ApiError;
    error.status = response.status;
    error.details = errorData.details;
    throw error;
  }

  return response.json();
}
