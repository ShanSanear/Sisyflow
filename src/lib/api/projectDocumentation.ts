import { apiGet, apiPut, NotFoundError, ForbiddenError, BadRequestError, type ApiError } from "./base";
import type { ProjectDocumentationDTO, UpdateProjectDocumentationCommand } from "@/types";

/**
 * Project Documentation API endpoints
 */

/**
 * Project documentation-specific error classes
 */
export class ProjectDocumentationNotFoundError extends NotFoundError {
  constructor(message = "Project documentation not found", code?: string, details?: string[]) {
    super(message, code, details);
    this.name = "ProjectDocumentationNotFoundError";
  }
}

export class ProjectDocumentationForbiddenError extends ForbiddenError {
  constructor(
    message = "Access denied. Only administrators can access project documentation.",
    code?: string,
    details?: string[]
  ) {
    super(message, code, details);
    this.name = "ProjectDocumentationForbiddenError";
  }
}

export class ProjectDocumentationValidationError extends BadRequestError {
  constructor(message = "Project documentation data is invalid", code?: string, details?: string[]) {
    super(message, code, details);
    this.name = "ProjectDocumentationValidationError";
  }
}

// Legacy interface for backward compatibility (will be removed)
export interface ProjectDocumentationApiError extends Error {
  status: number;
  code?: string;
  details?: string[];
}

/**
 * Transforms API errors to domain-specific project documentation errors
 * @param error - The original API error
 * @returns Domain-specific error
 */
function transformProjectDocumentationApiError(error: ApiError): never {
  if (error instanceof NotFoundError) {
    const message = error.message && error.message !== "Not Found" ? error.message : undefined;
    throw new ProjectDocumentationNotFoundError(message, error.code, error.details);
  }
  if (error instanceof BadRequestError) {
    const message = error.message && error.message !== "Bad Request" ? error.message : undefined;
    throw new ProjectDocumentationValidationError(message, error.code, error.details);
  }
  if (error instanceof ForbiddenError) {
    const message = error.message && error.message !== "Forbidden" ? error.message : undefined;
    throw new ProjectDocumentationForbiddenError(message, error.code, error.details);
  }
  throw error;
}

/**
 * Gets project documentation
 * @returns Promise with project documentation data
 * @throws ProjectDocumentationNotFoundError if documentation doesn't exist
 * @throws ProjectDocumentationForbiddenError if user doesn't have permission to access documentation
 */
export async function getProjectDocumentation(): Promise<ProjectDocumentationDTO> {
  try {
    const response = await apiGet<ProjectDocumentationDTO>("/api/project-documentation");
    return response.data;
  } catch (error) {
    transformProjectDocumentationApiError(error as ApiError);
  }
}

/**
 * Updates project documentation
 * @param command - Update data
 * @returns Promise with updated project documentation data
 * @throws ProjectDocumentationNotFoundError if documentation doesn't exist
 * @throws ProjectDocumentationValidationError if update data is invalid
 * @throws ProjectDocumentationForbiddenError if user doesn't have permission to update documentation
 */
export async function updateProjectDocumentation(
  command: UpdateProjectDocumentationCommand
): Promise<ProjectDocumentationDTO> {
  try {
    const response = await apiPut<ProjectDocumentationDTO>("/api/project-documentation", command);
    return response.data;
  } catch (error) {
    transformProjectDocumentationApiError(error as ApiError);
  }
}
