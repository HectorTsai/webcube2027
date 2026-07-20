// Response — unified API response types and constructors
//
// All Gateway services use these types and constructors for consistent
// API responses. Hono-specific wrappers (c.json) live in each Gateway's
// own response utility.

// ── Error Codes ──

export const ErrorCode = {
  NOT_FOUND: 'NOT_FOUND',
  FORBIDDEN: 'FORBIDDEN',
  DELETE_PROTECTED: 'DELETE_PROTECTED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode];

// ── Source Types ──

/** Data source layer for query results. */
export type SourceType = 'L2' | 'L3';

// ── Response Types ──

export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  source: SourceType;
}

export interface ErrorDetail {
  code: ErrorCodeType;
  message: string;
  status: number;
}

export interface ErrorResponse {
  success: false;
  error: ErrorDetail;
}

export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

// ── Pagination ──

export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedData<T> {
  items: T[];
  pagination: PaginationInfo;
}

// ── Constructors ──

/** Create a success response. */
export function success<T>(data: T, source: SourceType = 'L2'): SuccessResponse<T> {
  return { success: true, data, source };
}

/** Create a paginated success response. */
export function paginated<T>(
  items: T[],
  pagination: PaginationInfo,
  source: SourceType = 'L2',
): SuccessResponse<PaginatedData<T>> {
  return success({ items, pagination }, source);
}

/** Create an error response. */
export function errorRes(
  code: ErrorCodeType,
  message: string,
  status: number,
): ErrorResponse {
  return { success: false, error: { code, message, status } };
}

/** Convenience factory for common error responses. */
export const Errors = {
  notFound: (message = 'Resource not found') =>
    errorRes(ErrorCode.NOT_FOUND, message, 404),

  forbidden: (message = 'Forbidden') =>
    errorRes(ErrorCode.FORBIDDEN, message, 403),

  deleteProtected: (message = 'This resource is protected and cannot be deleted') =>
    errorRes(ErrorCode.DELETE_PROTECTED, message, 403),

  validationError: (message = 'Validation failed') =>
    errorRes(ErrorCode.VALIDATION_ERROR, message, 422),

  badRequest: (message = 'Bad request') =>
    errorRes(ErrorCode.BAD_REQUEST, message, 400),

  internalError: (message = 'Internal server error') =>
    errorRes(ErrorCode.INTERNAL_ERROR, message, 500),
};
