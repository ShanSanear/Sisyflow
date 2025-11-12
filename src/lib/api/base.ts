/**
 * Base API utilities and types for consistent error handling and HTTP requests
 */

/**
 * Base API error class that all API errors extend from
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly details?: string[];

  constructor(message: string, status: number, code?: string, details?: string[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * HTTP Status-based error classes
 */
export class BadRequestError extends ApiError {
  constructor(message = "Bad Request", code?: string, details?: string[]) {
    super(message, 400, code, details);
    this.name = "BadRequestError";
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized", code?: string, details?: string[]) {
    super(message, 401, code, details);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "Forbidden", code?: string, details?: string[]) {
    super(message, 403, code, details);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Not Found", code?: string, details?: string[]) {
    super(message, 404, code, details);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends ApiError {
  constructor(message = "Conflict", code?: string, details?: string[]) {
    super(message, 409, code, details);
    this.name = "ConflictError";
  }
}

export class InternalServerError extends ApiError {
  constructor(message = "Internal Server Error", code?: string, details?: string[]) {
    super(message, 500, code, details);
    this.name = "InternalServerError";
  }
}

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  ok: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export type QueryParams = Record<string, string | number | boolean | undefined>;

/**
 * Maps HTTP status codes to appropriate error classes
 */
export function createApiErrorFromStatus(
  status: number,
  message?: string,
  code?: string,
  details?: string[]
): ApiError {
  switch (status) {
    case 400:
      return new BadRequestError(message || "Bad Request", code, details);
    case 401:
      return new UnauthorizedError(message || "Unauthorized", code, details);
    case 403:
      return new ForbiddenError(message || "Forbidden", code, details);
    case 404:
      return new NotFoundError(message || "Not Found", code, details);
    case 409:
      return new ConflictError(message || "Conflict", code, details);
    case 500:
      return new InternalServerError(message || "Internal Server Error", code, details);
    default:
      return new ApiError(message || `Request failed: ${status}`, status, code, details);
  }
}

/**
 * Creates a standardized API error from a fetch response
 */
export function createApiError(response: Response, message?: string): ApiError {
  return createApiErrorFromStatus(
    response.status,
    message || `Request failed: ${response.status} ${response.statusText}`
  );
}

/**
 * Parses error response from API
 */
export async function parseApiError(response: Response): Promise<ApiError> {
  try {
    const errorData = await response.json();
    return createApiErrorFromStatus(
      response.status,
      errorData.message || errorData.error,
      errorData.code,
      errorData.details
    );
  } catch {
    return createApiError(response);
  }
}

/**
 * Builds query string from parameters object
 */
export function buildQueryString(params: QueryParams): string {
  const filteredParams = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => [key, String(value)]);

  if (filteredParams.length === 0) return "";

  const searchParams = new URLSearchParams(filteredParams);
  return searchParams.toString();
}

/**
 * Combines base URL with query parameters
 */
export function buildUrl(url: string, params?: QueryParams): string {
  if (!params) return url;

  const queryString = buildQueryString(params);
  if (!queryString) return url;

  return `${url}?${queryString}`;
}

/**
 * Base fetch wrapper with consistent error handling
 */
export async function apiRequest<T = unknown>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const defaultHeaders = {
    "Content-Type": "application/json",
  };

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });
  } catch (error) {
    // If it's already an ApiError, re-throw it
    if (error instanceof ApiError) {
      throw error;
    }
    // Handle network errors (aborted requests, connection failures, etc.)
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new ApiError(
        "Network error: Failed to connect to the server. Please check your connection and try again.",
        0,
        "NETWORK_ERROR"
      );
    }
    // Handle aborted requests (DOMException with name "AbortError")
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("Request was cancelled. Please try again.", 0, "REQUEST_ABORTED");
    }
    // Convert any other error to ApiError for consistent error handling
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    throw new ApiError(`Network error: ${errorMessage}`, 0, "NETWORK_ERROR");
  }

  if (!response.ok) {
    throw await parseApiError(response);
  }

  let data: T;
  try {
    data = await response.json();
  } catch {
    // For endpoints that don't return JSON (like 204 No Content)
    data = {} as T;
  }

  return {
    data,
    status: response.status,
    ok: response.ok,
  };
}

/**
 * GET request wrapper
 */
export async function apiGet<T = unknown>(
  url: string,
  params?: QueryParams,
  options: Omit<RequestInit, "method"> = {}
): Promise<ApiResponse<T>> {
  const fullUrl = buildUrl(url, params);
  return apiRequest<T>(fullUrl, { ...options, method: "GET" });
}

/**
 * POST request wrapper
 */
export async function apiPost<T = unknown>(
  url: string,
  data?: unknown,
  options: Omit<RequestInit, "method" | "body"> = {}
): Promise<ApiResponse<T>> {
  return apiRequest<T>(url, {
    ...options,
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PUT request wrapper
 */
export async function apiPut<T = unknown>(
  url: string,
  data?: unknown,
  options: Omit<RequestInit, "method" | "body"> = {}
): Promise<ApiResponse<T>> {
  return apiRequest<T>(url, {
    ...options,
    method: "PUT",
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PATCH request wrapper
 */
export async function apiPatch<T = unknown>(
  url: string,
  data?: unknown,
  options: Omit<RequestInit, "method" | "body"> = {}
): Promise<ApiResponse<T>> {
  return apiRequest<T>(url, {
    ...options,
    method: "PATCH",
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * DELETE request wrapper
 */
export async function apiDelete<T = unknown>(
  url: string,
  options: Omit<RequestInit, "method"> = {}
): Promise<ApiResponse<T>> {
  return apiRequest<T>(url, { ...options, method: "DELETE" });
}
