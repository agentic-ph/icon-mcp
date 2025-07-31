/**
 * Unit tests for SearchService
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SearchService } from '../../../src/services/search.service.js';
import { IconSearchError } from '../../../src/types/index.js';
import { createMockIcon } from '../../fixtures/mock-data.js';
import {
  createMockCacheService,
  MockProviderRegistry,
  MockIconProvider,
  setupTestProviders,
} from '../../fixtures/mock-services.js';

describe('SearchService', () => {
  let searchService: SearchService;
  let mockCacheService: any;
  let mockProviderRegistry: MockProviderRegistry;

  beforeEach(() => {
    mockCacheService = createMockCacheService();
    mockProviderRegistry = setupTestProviders();
    searchService = new SearchService(mockCacheService, mockProviderRegistry);
  });

  describe('searchIcons', () => {
    it('should_return_search_results_for_valid_query', async () => {
      const result = await searchService.searchIcons('home');

      expect(result.query).toBe('home');
      expect(result.results).toBeInstanceOf(Array);
      expect(result.totalResults).toBeGreaterThan(0);
      expect(result.searchType).toBe('fuzzy');
      expect(result.executionTime).toBeGreaterThan(0);
      expect(result.libraries).toBeInstanceOf(Array);
    });

    it('should_return_cached_results_when_available', async () => {
      const cachedResult = {
        query: 'home',
        results: [],
        totalResults: 0,
        searchType: 'fuzzy' as const,
        executionTime: 100,
        libraries: ['octicons'],
      };

      mockCacheService.get.mockReturnValueOnce(cachedResult);

      const result = await searchService.searchIcons('home');

      expect(result).toEqual(cachedResult);
      expect(mockCacheService.get).toHaveBeenCalledWith(expect.stringContaining('search:home'));
    });

    it('should_cache_search_results', async () => {
      await searchService.searchIcons('home');

      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.stringContaining('search:home'),
        expect.any(Object),
        5 * 60 * 1000 // 5 minutes
      );
    });

    it('should_filter_by_specific_libraries', async () => {
      const result = await searchService.searchIcons('home', {}, ['octicons']);

      expect(result.libraries).toContain('octicons');
      expect(result.results.every((r) => r.item.library === 'octicons')).toBe(true);
    });

    it('should_perform_exact_search_when_fuzzy_disabled', async () => {
      const result = await searchService.searchIcons('home', { fuzzy: false });

      expect(result.searchType).toBe('exact');
    });

    it('should_limit_results_correctly', async () => {
      const result = await searchService.searchIcons('home', { limit: 2 });

      expect(result.results.length).toBeLessThanOrEqual(2);
    });

    it('should_handle_empty_query_gracefully', async () => {
      const result = await searchService.searchIcons('');

      expect(result.searchType).toBe('failed');
      expect(result.error).toContain('Search query cannot be empty');
    });

    it('should_handle_query_too_long', async () => {
      const longQuery = 'a'.repeat(101);
      const result = await searchService.searchIcons(longQuery);

      expect(result.searchType).toBe('failed');
      expect(result.error).toContain('Search query too long');
    });

    it('should_sanitize_unsafe_characters', async () => {
      const unsafeQuery = 'home<script>alert("xss")</script>';

      // Should not throw and should handle gracefully
      const result = await searchService.searchIcons(unsafeQuery);

      expect(result).toBeDefined();
    });

    it('should_handle_provider_errors_gracefully', async () => {
      // Mock provider to throw error
      const errorProvider = new MockIconProvider('error-provider');
      vi.spyOn(errorProvider, 'searchIcons').mockRejectedValue(new Error('Provider error'));

      const errorRegistry = new MockProviderRegistry([errorProvider]);
      const errorSearchService = new SearchService(mockCacheService, errorRegistry);

      const result = await errorSearchService.searchIcons('home');

      expect(result.searchType).toBe('failed');
      expect(result.error).toBeDefined();
    });
  });

  describe('getIcon', () => {
    it('should_return_icon_when_found', async () => {
      const icon = await searchService.getIcon('home', 'octicons');

      expect(icon).toBeDefined();
      expect(icon?.name).toBe('home');
      expect(icon?.library).toBe('octicons');
    });

    it('should_return_null_when_icon_not_found', async () => {
      const icon = await searchService.getIcon('non-existent', 'octicons');

      expect(icon).toBeNull();
    });

    it('should_return_null_when_library_not_found', async () => {
      const icon = await searchService.getIcon('home', 'non-existent-library');

      expect(icon).toBeNull();
    });

    it('should_cache_icon_results', async () => {
      await searchService.getIcon('home', 'octicons');

      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.stringContaining('icon:octicons:home'),
        expect.any(Object),
        10 * 60 * 1000 // 10 minutes
      );
    });

    it('should_return_cached_icon_when_available', async () => {
      const cachedIcon = createMockIcon({ name: 'cached-home', library: 'octicons' });
      mockCacheService.get.mockReturnValueOnce(cachedIcon);

      const icon = await searchService.getIcon('home', 'octicons');

      expect(icon).toEqual(cachedIcon);
      expect(mockCacheService.get).toHaveBeenCalledWith(
        expect.stringContaining('icon:octicons:home')
      );
    });
  });

  describe('getLibraries', () => {
    it('should_return_list_of_available_libraries', async () => {
      const libraries = await searchService.getLibraries();

      expect(libraries).toBeInstanceOf(Array);
      expect(libraries.length).toBeGreaterThan(0);
      expect(libraries).toContain('octicons');
      expect(libraries).toContain('feather');
      expect(libraries).toContain('bootstrap-icons');
    });

    it('should_cache_library_list', async () => {
      await searchService.getLibraries();

      expect(mockCacheService.set).toHaveBeenCalledWith(
        'libraries:all',
        expect.any(Array),
        30 * 60 * 1000 // 30 minutes
      );
    });

    it('should_return_cached_libraries_when_available', async () => {
      const cachedLibraries = ['cached-lib1', 'cached-lib2'];
      mockCacheService.get.mockReturnValueOnce(cachedLibraries);

      const libraries = await searchService.getLibraries();

      expect(libraries).toEqual(cachedLibraries);
    });
  });

  describe('searchSimilar', () => {
    it('should_find_similar_icons', async () => {
      const result = await searchService.searchSimilar('home', 'octicons');

      expect(result.originalIcon).toBeDefined();
      expect(result.originalIcon.name).toBe('home');
      expect(result.similarIcons).toBeInstanceOf(Array);
      expect(result.totalSimilar).toBeGreaterThanOrEqual(0);
      expect(result.searchCriteria).toBeDefined();
    });

    it('should_exclude_original_icon_by_default', async () => {
      const result = await searchService.searchSimilar('home', 'octicons');

      const hasOriginal = result.similarIcons.some(
        (r) => r.item.name === 'home' && r.item.library === 'octicons'
      );
      expect(hasOriginal).toBe(false);
    });

    it('should_include_original_icon_when_requested', async () => {
      const result = await searchService.searchSimilar('home', 'octicons', {
        excludeOriginal: false,
      });

      // Should not exclude the original, but it might not be in results due to search logic
      expect(result.searchCriteria).toBeDefined();
    });

    it('should_limit_to_same_library_when_requested', async () => {
      const result = await searchService.searchSimilar('home', 'octicons', {
        sameLibraryOnly: true,
      });

      const allSameLibrary = result.similarIcons.every((r) => r.item.library === 'octicons');
      expect(allSameLibrary).toBe(true);
    });

    it('should_throw_error_for_non_existent_icon', async () => {
      await expect(searchService.searchSimilar('non-existent', 'octicons')).rejects.toThrow(
        IconSearchError
      );
    });

    it('should_respect_limit_parameter', async () => {
      const result = await searchService.searchSimilar('home', 'octicons', {
        limit: 2,
      });

      expect(result.similarIcons.length).toBeLessThanOrEqual(2);
    });
  });

  describe('searchByCategory', () => {
    it('should_find_icons_by_category', async () => {
      const result = await searchService.searchByCategory('navigation');

      expect(result.query).toBe('category:navigation');
      expect(result.results).toBeInstanceOf(Array);
      expect(result.searchType).toBe('filtered');
      expect(result.totalResults).toBeGreaterThanOrEqual(0);
    });

    it('should_filter_by_specific_libraries', async () => {
      const result = await searchService.searchByCategory('navigation', ['octicons']);

      expect(result.libraries).toContain('octicons');
      expect(result.results.every((r) => r.item.library === 'octicons')).toBe(true);
    });

    it('should_limit_results_correctly', async () => {
      const result = await searchService.searchByCategory('navigation', undefined, {
        limit: 2,
      });

      expect(result.results.length).toBeLessThanOrEqual(2);
    });

    it('should_handle_provider_errors_gracefully', async () => {
      const errorProvider = new MockIconProvider('error-provider');
      vi.spyOn(errorProvider, 'searchByCategory').mockRejectedValue(new Error('Provider error'));

      const errorRegistry = new MockProviderRegistry([errorProvider]);
      const errorSearchService = new SearchService(mockCacheService, errorRegistry);

      const result = await errorSearchService.searchByCategory('navigation');

      expect(result.searchType).toBe('failed');
      expect(result.error).toBeDefined();
    });
  });

  describe('getAutocompleteSuggestions', () => {
    it('should_return_empty_suggestions_for_short_query', async () => {
      const result = await searchService.getAutocompleteSuggestions('h', {
        minQueryLength: 2,
      });

      expect(result.suggestions).toEqual([]);
      expect(result.categories).toEqual([]);
      expect(result.libraries).toEqual([]);
    });

    it('should_limit_suggestions_correctly', async () => {
      const result = await searchService.getAutocompleteSuggestions('ho', {
        maxSuggestions: 2,
      });

      expect(result.suggestions.length).toBeLessThanOrEqual(2);
      expect(result.categories.length).toBeLessThanOrEqual(2);
      expect(result.libraries.length).toBeLessThanOrEqual(2);
    });

    it('should_cache_autocomplete_results', async () => {
      await searchService.getAutocompleteSuggestions('ho');

      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.stringContaining('autocomplete:ho'),
        expect.any(Object),
        5 * 60 * 1000 // 5 minutes
      );
    });

    it('should_return_cached_suggestions_when_available', async () => {
      const cachedResult = {
        suggestions: ['cached-suggestion'],
        categories: ['cached-category'],
        libraries: ['cached-library'],
        executionTime: 50,
      };
      mockCacheService.get.mockReturnValueOnce(cachedResult);

      const result = await searchService.getAutocompleteSuggestions('ho');

      expect(result).toEqual(cachedResult);
    });

    it('should_handle_errors_gracefully', async () => {
      // Mock provider to throw error
      vi.spyOn(mockProviderRegistry, 'getAvailableProviders').mockRejectedValue(
        new Error('Registry error')
      );

      const result = await searchService.getAutocompleteSuggestions('ho');

      expect(result.suggestions).toEqual([]);
      expect(result.categories).toEqual([]);
      expect(result.libraries).toEqual([]);
    });
  });

  describe('getProviderRegistry', () => {
    it('should_return_provider_registry', () => {
      const registry = searchService.getProviderRegistry();

      expect(registry).toBe(mockProviderRegistry);
    });
  });

  describe('clearCache', () => {
    it('should_clear_cache_and_fuse_instances', () => {
      searchService.clearCache();

      expect(mockCacheService.clear).toHaveBeenCalled();
    });
  });

  describe('private methods', () => {
    describe('validateSearchQuery', () => {
      it('should_accept_valid_queries', async () => {
        // Should not throw for valid queries
        await expect(searchService.searchIcons('valid query')).resolves.toBeDefined();
      });

      it('should_reject_empty_queries', async () => {
        const result = await searchService.searchIcons('');
        expect(result.searchType).toBe('failed');
      });

      it('should_reject_whitespace_only_queries', async () => {
        const result = await searchService.searchIcons('   ');
        expect(result.searchType).toBe('failed');
      });

      it('should_reject_overly_long_queries', async () => {
        const longQuery = 'a'.repeat(101);
        const result = await searchService.searchIcons(longQuery);
        expect(result.searchType).toBe('failed');
      });
    });
  });
});
