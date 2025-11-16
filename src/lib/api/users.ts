import { apiGet, apiPost, apiDelete, type QueryParams, NotFoundError, ConflictError, BadRequestError } from "./base";
import type { UserDTO, CreateUserCommand } from "@/types";

/**
 * Users API endpoints
 */

/**
 * User-specific error classes
 */
export class UserNotFoundError extends NotFoundError {
  constructor(userId?: string, code?: string, details?: string[]) {
    super(userId ? `User with ID '${userId}' not found` : "User not found", code, details);
    this.name = "UserNotFoundError";
  }
}

export class UserAlreadyExistsError extends ConflictError {
  constructor(message = "User with this username or email already exists", code?: string, details?: string[]) {
    super(message, code, details);
    this.name = "UserAlreadyExistsError";
  }
}

export class UserValidationError extends BadRequestError {
  constructor(message = "User data is invalid", code?: string, details?: string[]) {
    super(message, code, details);
    this.name = "UserValidationError";
  }
}

// Legacy interface for backward compatibility (will be removed)
export interface UserApiError extends Error {
  status: number;
  code?: string;
  details?: string[];
}

// Request types
export interface GetUsersParams extends QueryParams {
  limit?: number;
  page?: number;
}

// Response types
export interface GetUsersResponse {
  users: UserDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

/**
 * Gets a paginated list of users
 * @param params - Query parameters for pagination
 * @returns Promise with paginated users data
 */
export async function getUsers(params: GetUsersParams = {}): Promise<GetUsersResponse> {
  const response = await apiGet<GetUsersResponse>("/api/users", params);
  return response.data;
}

/**
 * Creates a new user
 * @param userData - User creation data
 * @returns Promise with created user data
 * @throws UserAlreadyExistsError if user already exists
 * @throws UserValidationError if user data is invalid
 */
export async function createUser(userData: CreateUserCommand): Promise<UserDTO> {
  try {
    const response = await apiPost<UserDTO>("/api/users", userData);
    return response.data;
  } catch (error) {
    if (error instanceof ConflictError) {
      throw new UserAlreadyExistsError(error.message, error.code, error.details);
    }
    if (error instanceof BadRequestError) {
      throw new UserValidationError(error.message, error.code, error.details);
    }
    throw error;
  }
}

/**
 * Deletes a user by ID
 * @param userId - ID of the user to delete
 * @returns Promise with deletion confirmation
 * @throws UserNotFoundError if user doesn't exist
 */
export async function deleteUser(userId: string): Promise<void> {
  try {
    await apiDelete(`/api/users/${userId}`);
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw new UserNotFoundError(userId, error.code, error.details);
    }
    throw error;
  }
}
