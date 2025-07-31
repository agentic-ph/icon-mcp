/**
 * Error handling utilities for the Icon MCP Server
 */

/**
 * Base error class for all icon search related errors
 */
export class IconSearchError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = 'IconSearchError';

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, IconSearchError.prototype);
  }

  /**
   * Convert error to JSON for serialization
   */
  toJSON(): object {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      stack: this.stack,
    };
  }
}

/**
 * Error for icon provider related issues
 */
export class IconProviderError extends IconSearchError {
  constructor(
    message: string,
    public provider: string,
    statusCode: number = 500,
    details?: unknown
  ) {
    super(message, 'PROVIDER_ERROR', statusCode, details);
    this.name = 'IconProviderError';
    Object.setPrototypeOf(this, IconProviderError.prototype);
  }
}

/**
 * Error for validation issues
 */
export class ValidationError extends IconSearchError {
  constructor(
    message: string,
    public field: string,
    details?: unknown
  ) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Error for cache related issues
 */
export class CacheError extends IconSearchError {
  constructor(message: string, details?: unknown) {
    super(message, 'CACHE_ERROR', 500, details);
    this.name = 'CacheError';
    Object.setPrototypeOf(this, CacheError.prototype);
  }
}

/**
 * Result type for operations that can fail
 */
export type Result<T, E = IconSearchError> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Create a success result
 */
export function success<T>(data: T): Result<T> {
  return { success: true, data };
}

/**
 * Create an error result
 */
export function failure<E extends IconSearchError>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * Error handler for MCP server
 */
export function createErrorHandler(): (error: Error) => void {
  return (error: Error): void => {
    console.error('[MCP Error]', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  };
}

/**
 * Global error handlers for process
 */
export function setupGlobalErrorHandlers(): void {
  process.on('uncaughtException', (error: Error) => {
    console.error('[Uncaught Exception]', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });

    // Give time for logging then exit
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
    console.error('[Unhandled Rejection]', {
      reason:
        reason instanceof Error
          ? {
              name: reason.name,
              message: reason.message,
              stack: reason.stack,
            }
          : reason,
      promise: promise.toString(),
      timestamp: new Date().toISOString(),
    });

    // Give time for logging then exit
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });
}
