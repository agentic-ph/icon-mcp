/**
 * Unit tests for CacheService
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CacheService } from '../../../src/services/cache.service.js';
import { CacheError } from '../../../src/types/index.js';

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    cacheService = new CacheService({
      ttl: 1000, // 1 second for testing
      maxSize: 5,
      checkPeriod: 100, // 100ms for testing
    });
  });

  afterEach(() => {
    cacheService.destroy();
  });

  describe('set and get', () => {
    it('should_store_and_retrieve_values_correctly', () => {
      const key = 'test-key';
      const value = { data: 'test-value' };

      cacheService.set(key, value);
      const retrieved = cacheService.get(key);

      expect(retrieved).toEqual(value);
    });

    it('should_return_null_for_non_existent_keys', () => {
      const result = cacheService.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('should_handle_different_data_types', () => {
      cacheService.set('string', 'test');
      cacheService.set('number', 42);
      cacheService.set('boolean', true);
      cacheService.set('object', { key: 'value' });
      cacheService.set('array', [1, 2, 3]);

      expect(cacheService.get('string')).toBe('test');
      expect(cacheService.get('number')).toBe(42);
      expect(cacheService.get('boolean')).toBe(true);
      expect(cacheService.get('object')).toEqual({ key: 'value' });
      expect(cacheService.get('array')).toEqual([1, 2, 3]);
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should_expire_entries_after_ttl', async () => {
      const key = 'expiring-key';
      const value = 'expiring-value';

      cacheService.set(key, value, 50); // 50ms TTL
      expect(cacheService.get(key)).toBe(value);

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 60));
      expect(cacheService.get(key)).toBeNull();
    });

    it('should_use_custom_ttl_over_default', async () => {
      const key = 'custom-ttl-key';
      const value = 'custom-ttl-value';

      cacheService.set(key, value, 50); // Custom 50ms TTL
      expect(cacheService.get(key)).toBe(value);

      await new Promise((resolve) => setTimeout(resolve, 60));
      expect(cacheService.get(key)).toBeNull();
    });

    it('should_update_access_statistics_on_get', () => {
      const key = 'access-stats-key';
      const value = 'access-stats-value';

      cacheService.set(key, value);

      // Access multiple times
      cacheService.get(key);
      cacheService.get(key);
      cacheService.get(key);

      const stats = cacheService.getStats();
      expect(stats.totalAccesses).toBeGreaterThan(0);
    });
  });

  describe('has method', () => {
    it('should_return_true_for_existing_keys', () => {
      const key = 'existing-key';
      cacheService.set(key, 'value');

      expect(cacheService.has(key)).toBe(true);
    });

    it('should_return_false_for_non_existent_keys', () => {
      expect(cacheService.has('non-existent-key')).toBe(false);
    });

    it('should_return_false_for_expired_keys', async () => {
      const key = 'expiring-key';
      cacheService.set(key, 'value', 50);

      expect(cacheService.has(key)).toBe(true);

      await new Promise((resolve) => setTimeout(resolve, 60));
      expect(cacheService.has(key)).toBe(false);
    });
  });

  describe('delete method', () => {
    it('should_remove_entries_successfully', () => {
      const key = 'delete-key';
      cacheService.set(key, 'value');

      expect(cacheService.has(key)).toBe(true);
      const deleted = cacheService.delete(key);

      expect(deleted).toBe(true);
      expect(cacheService.has(key)).toBe(false);
    });

    it('should_return_false_for_non_existent_keys', () => {
      const deleted = cacheService.delete('non-existent-key');
      expect(deleted).toBe(false);
    });
  });

  describe('clear method', () => {
    it('should_remove_all_entries', () => {
      cacheService.set('key1', 'value1');
      cacheService.set('key2', 'value2');
      cacheService.set('key3', 'value3');

      expect(cacheService.getStats().size).toBe(3);

      cacheService.clear();

      expect(cacheService.getStats().size).toBe(0);
      expect(cacheService.get('key1')).toBeNull();
      expect(cacheService.get('key2')).toBeNull();
      expect(cacheService.get('key3')).toBeNull();
    });
  });

  describe('size limits', () => {
    it('should_evict_least_recently_used_when_max_size_reached', () => {
      // Create cache with small max size for testing
      cacheService.destroy();
      cacheService = new CacheService({ maxSize: 2 });

      // Fill cache to max size
      cacheService.set('key0', 'value0');
      cacheService.set('key1', 'value1');

      // Verify initial state
      expect(cacheService.get('key0')).toBe('value0');
      expect(cacheService.get('key1')).toBe('value1');

      // Access key1 to make it recently used
      cacheService.get('key1');

      // Add one more item to trigger eviction
      cacheService.set('key2', 'value2');

      // Verify eviction occurred
      expect(cacheService.get('key0')).toBeNull(); // Should be evicted
      expect(cacheService.get('key1')).toBe('value1'); // Should remain
      expect(cacheService.get('key2')).toBe('value2'); // Should be added
    });
  });

  describe('getOrSet method', () => {
    it('should_return_cached_value_if_exists', async () => {
      const key = 'cached-key';
      const cachedValue = 'cached-value';
      const factory = vi.fn().mockResolvedValue('factory-value');

      cacheService.set(key, cachedValue);

      const result = await cacheService.getOrSet(key, factory);

      expect(result).toBe(cachedValue);
      expect(factory).not.toHaveBeenCalled();
    });

    it('should_call_factory_and_cache_result_if_not_exists', async () => {
      const key = 'new-key';
      const factoryValue = 'factory-value';
      const factory = vi.fn().mockResolvedValue(factoryValue);

      const result = await cacheService.getOrSet(key, factory);

      expect(result).toBe(factoryValue);
      expect(factory).toHaveBeenCalledOnce();
      expect(cacheService.get(key)).toBe(factoryValue);
    });

    it('should_handle_factory_errors', async () => {
      const key = 'error-key';
      const error = new Error('Factory error');
      const factory = vi.fn().mockRejectedValue(error);

      await expect(cacheService.getOrSet(key, factory)).rejects.toThrow(CacheError);
      expect(factory).toHaveBeenCalledOnce();
    });
  });

  describe('getStats method', () => {
    it('should_return_accurate_statistics', () => {
      cacheService.set('key1', 'value1');
      cacheService.set('key2', 'value2');

      // Access key1 multiple times
      cacheService.get('key1');
      cacheService.get('key1');

      const stats = cacheService.getStats();

      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBe(5);
      expect(stats.totalAccesses).toBeGreaterThan(0);
      expect(stats.expiredEntries).toBe(0);
    });

    it('should_count_expired_entries_correctly', async () => {
      cacheService.set('expiring1', 'value1', 50);
      cacheService.set('expiring2', 'value2', 50);
      cacheService.set('persistent', 'value3', 10000);

      await new Promise((resolve) => setTimeout(resolve, 60));

      const stats = cacheService.getStats();
      expect(stats.expiredEntries).toBe(2);
    });
  });

  describe('generateKey static method', () => {
    it('should_generate_consistent_keys_from_parts', () => {
      const key1 = CacheService.generateKey('search', 'home', 'octicons');
      const key2 = CacheService.generateKey('search', 'home', 'octicons');

      expect(key1).toBe(key2);
      expect(key1).toBe('search:home:octicons');
    });

    it('should_handle_different_data_types', () => {
      const key = CacheService.generateKey('search', 123, true, 'test');
      expect(key).toBe('search:123:true:test');
    });

    it('should_sanitize_special_characters', () => {
      const key = CacheService.generateKey('search', 'test@#$%', 'library!');
      expect(key).toMatch(/^[a-z0-9:_]+$/);
    });
  });

  describe('cleanup timer', () => {
    it('should_automatically_remove_expired_entries', async () => {
      const shortTtlCache = new CacheService({
        ttl: 50,
        checkPeriod: 30, // Check every 30ms
      });

      shortTtlCache.set('expiring', 'value', 50);
      expect(shortTtlCache.get('expiring')).toBe('value');

      // Wait for cleanup cycle
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(shortTtlCache.get('expiring')).toBeNull();

      shortTtlCache.destroy();
    });
  });

  describe('error handling', () => {
    it('should_throw_CacheError_on_set_failure', () => {
      // Mock a scenario where set might fail
      const originalSet = Map.prototype.set;
      Map.prototype.set = vi.fn().mockImplementation(() => {
        throw new Error('Map set failed');
      });

      expect(() => {
        cacheService.set('error-key', 'value');
      }).toThrow(CacheError);

      // Restore original method
      Map.prototype.set = originalSet;
    });

    it('should_throw_CacheError_on_get_failure', () => {
      // Mock a scenario where get might fail
      const originalGet = Map.prototype.get;
      Map.prototype.get = vi.fn().mockImplementation(() => {
        throw new Error('Map get failed');
      });

      expect(() => {
        cacheService.get('error-key');
      }).toThrow(CacheError);

      // Restore original method
      Map.prototype.get = originalGet;
    });
  });

  describe('destroy method', () => {
    it('should_stop_cleanup_timer_and_clear_cache', () => {
      cacheService.set('key', 'value');
      expect(cacheService.getStats().size).toBe(1);

      cacheService.destroy();

      expect(cacheService.getStats().size).toBe(0);
    });
  });
});
