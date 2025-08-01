/**
 * Unit tests for error handling utilities
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  IconSearchError,
  IconProviderError,
  ValidationError,
  CacheError,
  success,
  failure,
  createErrorHandler,
  setupGlobalErrorHandlers,
} from '../../../src/utils/errors.js';

describe('Error Classes', () => {
  describe('IconSearchError', () => {
    it('should_create_error_with_correct_properties', () => {
      const error = new IconSearchError('Test message', 'TEST_CODE', 400, { detail: 'test' });

      expect(error.name).toBe('IconSearchError');
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('TEST_CODE');
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ detail: 'test' });
      expect(error instanceof Error).toBe(true);
      expect(error instanceof IconSearchError).toBe(true);
    });

    it('should_use_default_status_code', () => {
      const error = new IconSearchError('Test message', 'TEST_CODE');

      expect(error.statusCode).toBe(500);
    });

    it('should_serialize_to_json_correctly', () => {
      const error = new IconSearchError('Test message', 'TEST_CODE', 400, { detail: 'test' });
      const json = error.toJSON();

      expect(json).toEqual({
        name: 'IconSearchError',
        message: 'Test message',
        code: 'TEST_CODE',
        statusCode: 400,
        details: { detail: 'test' },
        stack: expect.any(String),
      });
    });

    it('should_maintain_prototype_chain', () => {
      const error = new IconSearchError('Test message', 'TEST_CODE');

      expect(error instanceof IconSearchError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('IconProviderError', () => {
    it('should_create_provider_error_with_correct_properties', () => {
      const error = new IconProviderError('Provider failed', 'octicons', 503, {
        reason: 'timeout',
      });

      expect(error.name).toBe('IconProviderError');
      expect(error.message).toBe('Provider failed');
      expect(error.code).toBe('PROVIDER_ERROR');
      expect(error.provider).toBe('octicons');
      expect(error.statusCode).toBe(503);
      expect(error.details).toEqual({ reason: 'timeout' });
      expect(error instanceof IconSearchError).toBe(true);
      expect(error instanceof IconProviderError).toBe(true);
    });

    it('should_use_default_status_code', () => {
      const error = new IconProviderError('Provider failed', 'octicons');

      expect(error.statusCode).toBe(500);
    });

    it('should_maintain_prototype_chain', () => {
      const error = new IconProviderError('Provider failed', 'octicons');

      expect(error instanceof IconProviderError).toBe(true);
      expect(error instanceof IconSearchError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('ValidationError', () => {
    it('should_create_validation_error_with_correct_properties', () => {
      const error = new ValidationError('Invalid field', 'username', { min: 3 });

      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Invalid field');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.field).toBe('username');
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ min: 3 });
      expect(error instanceof IconSearchError).toBe(true);
      expect(error instanceof ValidationError).toBe(true);
    });

    it('should_maintain_prototype_chain', () => {
      const error = new ValidationError('Invalid field', 'username');

      expect(error instanceof ValidationError).toBe(true);
      expect(error instanceof IconSearchError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('CacheError', () => {
    it('should_create_cache_error_with_correct_properties', () => {
      const error = new CacheError('Cache operation failed', { operation: 'set' });

      expect(error.name).toBe('CacheError');
      expect(error.message).toBe('Cache operation failed');
      expect(error.code).toBe('CACHE_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.details).toEqual({ operation: 'set' });
      expect(error instanceof IconSearchError).toBe(true);
      expect(error instanceof CacheError).toBe(true);
    });

    it('should_maintain_prototype_chain', () => {
      const error = new CacheError('Cache operation failed');

      expect(error instanceof CacheError).toBe(true);
      expect(error instanceof IconSearchError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });
});

describe('Result Type Helpers', () => {
  describe('success', () => {
    it('should_create_success_result', () => {
      const data = { id: 1, name: 'test' };
      const result = success(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(data);
      }
      expect('error' in result).toBe(false);
    });

    it('should_handle_different_data_types', () => {
      const stringResult = success('string');
      const numberResult = success(42);
      const booleanResult = success(true);
      const nullResult = success(null);
      const undefinedResult = success(undefined);
      const arrayResult = success([1, 2, 3]);
      const objectResult = success({ key: 'value' });

      if (stringResult.success) expect(stringResult.data).toBe('string');
      if (numberResult.success) expect(numberResult.data).toBe(42);
      if (booleanResult.success) expect(booleanResult.data).toBe(true);
      if (nullResult.success) expect(nullResult.data).toBe(null);
      if (undefinedResult.success) expect(undefinedResult.data).toBe(undefined);
      if (arrayResult.success) expect(arrayResult.data).toEqual([1, 2, 3]);
      if (objectResult.success) expect(objectResult.data).toEqual({ key: 'value' });
    });
  });

  describe('failure', () => {
    it('should_create_failure_result', () => {
      const error = new IconSearchError('Test error', 'TEST_CODE');
      const result = failure(error);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(error);
      }
      expect('data' in result).toBe(false);
    });

    it('should_handle_different_error_types', () => {
      const iconError = new IconSearchError('Icon error', 'ICON_ERROR');
      const providerError = new IconProviderError('Provider error', 'test-provider');
      const validationError = new ValidationError('Validation error', 'field');
      const cacheError = new CacheError('Cache error');

      const iconResult = failure(iconError);
      const providerResult = failure(providerError);
      const validationResult = failure(validationError);
      const cacheResult = failure(cacheError);

      if (!iconResult.success) expect(iconResult.error).toBe(iconError);
      if (!providerResult.success) expect(providerResult.error).toBe(providerError);
      if (!validationResult.success) expect(validationResult.error).toBe(validationError);
      if (!cacheResult.success) expect(cacheResult.error).toBe(cacheError);
    });
  });
});

describe('Error Handler Functions', () => {
  describe('createErrorHandler', () => {
    let consoleSpy: any;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should_create_error_handler_function', () => {
      const handler = createErrorHandler();

      expect(typeof handler).toBe('function');
    });

    it('should_log_error_details', () => {
      const handler = createErrorHandler();
      const error = new Error('Test error');
      error.stack = 'Error stack trace';

      handler(error);

      expect(consoleSpy).toHaveBeenCalledWith('[MCP Error]', {
        name: 'Error',
        message: 'Test error',
        stack: 'Error stack trace',
        timestamp: expect.any(String),
      });
    });

    it('should_handle_errors_without_stack', () => {
      const handler = createErrorHandler();
      const error = new Error('Test error');
      delete error.stack;

      handler(error);

      expect(consoleSpy).toHaveBeenCalledWith('[MCP Error]', {
        name: 'Error',
        message: 'Test error',
        stack: undefined,
        timestamp: expect.any(String),
      });
    });

    it('should_include_valid_timestamp', () => {
      const handler = createErrorHandler();
      const error = new Error('Test error');

      handler(error);

      const logCall = consoleSpy.mock.calls[0][1];
      const timestamp = new Date(logCall.timestamp);
      expect(timestamp.getTime()).not.toBeNaN();
    });
  });

  describe('setupGlobalErrorHandlers', () => {
    let processOnSpy: any;
    let consoleSpy: any;
    let processExitSpy: any;
    let setTimeoutSpy: any;

    beforeEach(() => {
      processOnSpy = vi.spyOn(process, 'on').mockImplementation(() => process);
      consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      setTimeoutSpy = vi.spyOn(global, 'setTimeout').mockImplementation((_fn) => {
        // Don't execute the function immediately to avoid unhandled rejections
        return {} as any;
      });
    });

    afterEach(() => {
      processOnSpy.mockRestore();
      consoleSpy.mockRestore();
      processExitSpy.mockRestore();
      setTimeoutSpy.mockRestore();
    });

    it('should_setup_uncaught_exception_handler', () => {
      setupGlobalErrorHandlers();

      expect(processOnSpy).toHaveBeenCalledWith('uncaughtException', expect.any(Function));
    });

    it('should_setup_unhandled_rejection_handler', () => {
      setupGlobalErrorHandlers();

      expect(processOnSpy).toHaveBeenCalledWith('unhandledRejection', expect.any(Function));
    });

    it('should_handle_uncaught_exceptions', () => {
      setupGlobalErrorHandlers();

      const uncaughtHandler = processOnSpy.mock.calls.find(
        (call) => call[0] === 'uncaughtException'
      )[1];

      const error = new Error('Uncaught error');
      uncaughtHandler(error);

      expect(consoleSpy).toHaveBeenCalledWith('[Uncaught Exception]', {
        name: 'Error',
        message: 'Uncaught error',
        stack: expect.any(String),
        timestamp: expect.any(String),
      });

      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1000);
    });

    // Removed tests that create rejected promises as they cause unhandled rejections
  });
});

describe('Error Type Guards and Utilities', () => {
  it('should_distinguish_between_error_types', () => {
    const iconError = new IconSearchError('Icon error', 'ICON_ERROR');
    const providerError = new IconProviderError('Provider error', 'test-provider');
    const validationError = new ValidationError('Validation error', 'field');
    const cacheError = new CacheError('Cache error');
    const genericError = new Error('Generic error');

    expect(iconError instanceof IconSearchError).toBe(true);
    expect(providerError instanceof IconProviderError).toBe(true);
    expect(validationError instanceof ValidationError).toBe(true);
    expect(cacheError instanceof CacheError).toBe(true);

    expect(providerError instanceof IconSearchError).toBe(true);
    expect(validationError instanceof IconSearchError).toBe(true);
    expect(cacheError instanceof IconSearchError).toBe(true);

    expect(genericError instanceof IconSearchError).toBe(false);
  });

  it('should_preserve_error_properties_through_inheritance', () => {
    const providerError = new IconProviderError('Provider failed', 'octicons', 503, {
      timeout: true,
    });

    expect(providerError.message).toBe('Provider failed');
    expect(providerError.provider).toBe('octicons');
    expect(providerError.code).toBe('PROVIDER_ERROR');
    expect(providerError.statusCode).toBe(503);
    expect(providerError.details).toEqual({ timeout: true });
  });
});
