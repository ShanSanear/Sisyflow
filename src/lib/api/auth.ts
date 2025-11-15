import { apiPost } from "./base";
import type { UserDTO } from "@/types";

/**
 * Authentication API endpoints
 */

// Domain-specific errors
export interface AuthApiError extends Error {
  status: number;
  code?: string;
  details?: string[];
}

// Request types
export interface SignInRequest {
  identifier: string; // email or username
  password: string;
}

export interface SignUpRequest {
  email: string;
  username?: string;
  password: string;
}

// Response types
export interface SignInResponse {
  user: UserDTO;
  // Additional auth data like tokens would go here if needed
}

export interface SignUpResponse {
  user: UserDTO;
  message: string;
}

export interface SignOutResponse {
  message: string;
}

/**
 * Signs in a user with email/username and password
 * @param credentials - User sign-in credentials
 * @returns Promise with user data
 */
export async function signIn(credentials: SignInRequest): Promise<SignInResponse> {
  const response = await apiPost<SignInResponse>("/api/auth/sign-in", credentials);
  return response.data;
}

/**
 * Signs up a new user
 * @param userData - User registration data
 * @returns Promise with created user data
 */
export async function signUp(userData: SignUpRequest): Promise<SignUpResponse> {
  const response = await apiPost<SignUpResponse>("/api/auth/sign-up", userData);
  return response.data;
}

/**
 * Signs out the current user
 * @returns Promise with sign-out confirmation
 */
export async function signOut(): Promise<SignOutResponse> {
  const response = await apiPost<SignOutResponse>("/api/auth/sign-out");
  return response.data;
}
