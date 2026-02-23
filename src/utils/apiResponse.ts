export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  timestamp: string;
}

export class ResponseBuilder {
  static success<T>(message: string, data?: T): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  static error(
    message: string,
    code: string,
    details?: string
  ): ApiResponse {
    return {
      success: false,
      message,
      error: {
        code,
        message,
        details,
      },
      timestamp: new Date().toISOString(),
    };
  }

  static validationError(message: string, details?: string): ApiResponse {
    return this.error(message, 'VALIDATION_ERROR', details);
  }

  static conflictError(message: string, details?: string): ApiResponse {
    return this.error(message, 'CONFLICT_ERROR', details);
  }

  static internalError(message: string, details?: string): ApiResponse {
    return this.error(message, 'INTERNAL_ERROR', details);
  }

  static notFound(message: string, details?: string): ApiResponse {
    return this.error(message, 'NOT_FOUND', details);
  }
}

export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
} as const;
