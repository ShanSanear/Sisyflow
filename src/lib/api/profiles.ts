import { apiGet, apiPut, apiPatch, ConflictError, BadRequestError, NotFoundError } from "./base";
import type { ProfileDTO, UpdateProfileCommand, UpdatePasswordCommand } from "@/types";

/**
 * Profile-specific error classes
 */
export class ProfileNotFoundError extends NotFoundError {
  constructor(message = "Profile not found", code?: string, details?: string[]) {
    super(message, code, details);
    this.name = "ProfileNotFoundError";
  }
}

export class UsernameAlreadyTakenError extends ConflictError {
  constructor(message = "Username is already taken", code?: string, details?: string[]) {
    super(message, code, details);
    this.name = "UsernameAlreadyTakenError";
  }
}

/**
 * Profile API endpoints
 */

/**
 * Gets the current user's profile
 * @returns Promise with current user profile data
 */
export async function getCurrentUserProfile(): Promise<ProfileDTO> {
  try {
    const response = await apiGet<ProfileDTO>("/api/profiles/me");
    return response.data;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw new ProfileNotFoundError(error.message, error.code, error.details);
    }
    throw error;
  }
}

/**
 * Updates the current user's profile (username)
 * @param data UpdateProfileCommand with username
 * @returns Promise with updated profile data
 */
export async function updateUserProfile(data: UpdateProfileCommand): Promise<ProfileDTO> {
  try {
    const response = await apiPut<ProfileDTO>("/api/profiles/me", data);
    return response.data;
  } catch (error) {
    if (error instanceof ConflictError) {
      throw new UsernameAlreadyTakenError(error.message, error.code, error.details);
    }
    if (error instanceof NotFoundError) {
      throw new ProfileNotFoundError(error.message, error.code, error.details);
    }
    throw error;
  }
}

/**
 * Updates the current user's password
 * @param data UpdatePasswordCommand with password and confirmPassword
 * @returns Promise that resolves when password is updated
 */
export async function updateUserPassword(data: UpdatePasswordCommand): Promise<void> {
  try {
    await apiPatch("/api/auth/password", data);
  } catch (error) {
    if (error instanceof BadRequestError) {
      throw new BadRequestError("Invalid password data", error.code, error.details);
    }
    throw error;
  }
}
