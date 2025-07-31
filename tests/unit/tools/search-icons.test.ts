/**
 * Unit tests for search_icons tool
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SearchService } from '../../../src/services/search.service.js';
import { registerIconSearchTools } from '../../../src/tools/index.js';
import { mockSearchResults } from '../../fixtures/mock-data.js';
import {
  createMockCacheService,
  createMockMcpServer,
  setupTestProviders,
} from '../../fixtures/mock-services.js';

describe('search_icons tool', () => {
  let mockServer: any;
  let searchService: SearchService;
  let searchIconsTool: any;

  beforeEach(() => {
    mockServer = createMockMcpServer();
    const mockCacheService = createMockCacheService();
    const mockProviderRegistry = setupTestProviders();
    searchService = new SearchService(mockCacheService, mockProviderRegistry);

    // Register tools
    registerIconSearchTools(mockServer, searchService);

    // Extract the search_icons tool handler
    const registerToolCall = mockServer.registerTool.mock.calls.find(
      (call: any) => call[0] === 'search_icons'
    );
    searchIconsTool = registerToolCall[2]; // The handler function
  });

  describe('tool registration', () => {
    it('should_register_search_icons_tool_with_correct_name', () => {
      expect(mockServer.registerTool).toHaveBeenCalledWith(
        'search_icons',
        expect.any(Object),
        expect.any(Function)
      );
    });

    it('should_have_correct_tool_metadata', () => {
      const registerCall = mockServer.registerTool.mock.calls.find(
        (call: any) => call[0] === 'search_icons'
      );
      const metadata = registerCall[1];

      expect(metadata.title).toBe('Search Icons');
      expect(metadata.description).toContain('Search for icons by name');
      expect(metadata.inputSchema).toBeDefined();
    });

    it('should_define_required_parameters', () => {
      const registerCall = mockServer.registerTool.mock.calls.find(
        (call: any) => call[0] === 'search_icons'
      );
      const schema = registerCall[1].inputSchema;

      expect(schema.query).toBeDefined();
      expect(typeof schema.query.min).toBe('function');
    });

    it('should_define_optional_parameters_with_defaults', () => {
      const registerCall = mockServer.registerTool.mock.calls.find(
        (call: any) => call[0] === 'search_icons'
      );
      const schema = registerCall[1].inputSchema;

      expect(typeof schema.fuzzy.default).toBe('function');
      expect(typeof schema.limit.default).toBe('function');
      expect(typeof schema.threshold.default).toBe('function');
      expect(typeof schema.includeScore.default).toBe('function');
      expect(typeof schema.includeMatches.default).toBe('function');
    });
  });

  describe('tool execution', () => {
    it('should_return_search_results_for_valid_query', async () => {
      const mockSearchResult = {
        query: 'home',
        results: mockSearchResults,
        totalResults: mockSearchResults.length,
        searchType: 'fuzzy' as const,
        executionTime: 50,
        libraries: ['octicons', 'feather'],
      };

      vi.spyOn(searchService, 'searchIcons').mockResolvedValue(mockSearchResult);

      const result = await searchIconsTool({
        query: 'home',
        fuzzy: true,
        limit: 10,
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('home');
      expect(result.isError).toBeUndefined();
    });

    it('should_pass_correct_parameters_to_search_service', async () => {
      const searchSpy = vi.spyOn(searchService, 'searchIcons').mockResolvedValue({
        query: 'test',
        results: [],
        totalResults: 0,
        searchType: 'fuzzy' as const,
        executionTime: 10,
        libraries: [],
      });

      await searchIconsTool({
        query: 'test',
        libraries: ['octicons'],
        fuzzy: false,
        limit: 5,
        threshold: 0.5,
        includeScore: false,
        includeMatches: false,
        keys: ['name', 'tags'],
        useExtendedSearch: true,
        ignoreLocation: true,
        minMatchCharLength: 3,
        isCaseSensitive: true,
      });

      expect(searchSpy).toHaveBeenCalledWith(
        'test',
        {
          fuzzy: false,
          threshold: 0.5,
          limit: 5,
          includeScore: false,
          includeMatches: false,
          keys: ['name', 'tags'],
          useExtendedSearch: true,
          ignoreLocation: true,
          minMatchCharLength: 3,
          isCaseSensitive: true,
        },
        ['octicons']
      );
    });

    it('should_use_default_values_for_optional_parameters', async () => {
      const searchSpy = vi.spyOn(searchService, 'searchIcons').mockResolvedValue({
        query: 'test',
        results: [],
        totalResults: 0,
        searchType: 'fuzzy' as const,
        executionTime: 10,
        libraries: [],
      });

      await searchIconsTool({
        query: 'test',
      });

      // Verify the tool was called with the correct parameters
      expect(searchSpy).toHaveBeenCalledWith('test', expect.any(Object), undefined);

      // Check that the search service received the query parameter
      const callArgs = searchSpy.mock.calls[0];
      expect(callArgs[0]).toBe('test');
    });

    it('should_return_formatted_json_response', async () => {
      const mockSearchResult = {
        query: 'home',
        results: mockSearchResults.slice(0, 2),
        totalResults: 2,
        searchType: 'fuzzy' as const,
        executionTime: 50,
        libraries: ['octicons'],
      };

      vi.spyOn(searchService, 'searchIcons').mockResolvedValue(mockSearchResult);

      const result = await searchIconsTool({
        query: 'home',
      });

      const responseText = result.content[0].text;
      const parsedResponse = JSON.parse(responseText);

      expect(parsedResponse.query).toBe('home');
      expect(parsedResponse.results).toHaveLength(2);
      expect(parsedResponse.totalResults).toBe(2);
      expect(parsedResponse.searchType).toBe('fuzzy');
      expect(parsedResponse.executionTime).toBe(50);
      expect(parsedResponse.libraries).toEqual(['octicons']);
    });

    it('should_handle_search_service_errors', async () => {
      vi.spyOn(searchService, 'searchIcons').mockRejectedValue(new Error('Search service error'));

      const result = await searchIconsTool({
        query: 'home',
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Error: Search service error');
      expect(result.isError).toBe(true);
    });

    it('should_handle_unknown_errors', async () => {
      vi.spyOn(searchService, 'searchIcons').mockRejectedValue('Unknown error');

      const result = await searchIconsTool({
        query: 'home',
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Error: Unknown error occurred');
      expect(result.isError).toBe(true);
    });

    it('should_handle_empty_search_results', async () => {
      vi.spyOn(searchService, 'searchIcons').mockResolvedValue({
        query: 'nonexistent',
        results: [],
        totalResults: 0,
        searchType: 'fuzzy' as const,
        executionTime: 10,
        libraries: ['octicons'],
      });

      const result = await searchIconsTool({
        query: 'nonexistent',
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const responseText = result.content[0].text;
      const parsedResponse = JSON.parse(responseText);

      expect(parsedResponse.results).toEqual([]);
      expect(parsedResponse.totalResults).toBe(0);
      expect(result.isError).toBeUndefined();
    });

    it('should_handle_library_filtering', async () => {
      const mockSearchResult = {
        query: 'home',
        results: mockSearchResults.filter((r) => r.item.library === 'octicons'),
        totalResults: 1,
        searchType: 'fuzzy' as const,
        executionTime: 30,
        libraries: ['octicons'],
      };

      vi.spyOn(searchService, 'searchIcons').mockResolvedValue(mockSearchResult);

      const result = await searchIconsTool({
        query: 'home',
        libraries: ['octicons'],
      });

      const responseText = result.content[0].text;
      const parsedResponse = JSON.parse(responseText);

      expect(parsedResponse.libraries).toEqual(['octicons']);
      expect(parsedResponse.results.every((r: any) => r.item.library === 'octicons')).toBe(true);
    });

    it('should_handle_fuzzy_search_options', async () => {
      const searchSpy = vi.spyOn(searchService, 'searchIcons').mockResolvedValue({
        query: 'test',
        results: [],
        totalResults: 0,
        searchType: 'exact' as const,
        executionTime: 10,
        libraries: [],
      });

      await searchIconsTool({
        query: 'test',
        fuzzy: false,
        threshold: 0.1,
        useExtendedSearch: true,
        ignoreLocation: true,
        minMatchCharLength: 1,
        isCaseSensitive: true,
      });

      const searchOptions = searchSpy.mock.calls[0]?.[1];
      expect(searchOptions?.fuzzy).toBe(false);
      expect(searchOptions?.threshold).toBe(0.1);
      expect(searchOptions?.useExtendedSearch).toBe(true);
      expect(searchOptions?.ignoreLocation).toBe(true);
      expect(searchOptions?.minMatchCharLength).toBe(1);
      expect(searchOptions?.isCaseSensitive).toBe(true);
    });

    it('should_handle_custom_search_keys', async () => {
      const searchSpy = vi.spyOn(searchService, 'searchIcons').mockResolvedValue({
        query: 'test',
        results: [],
        totalResults: 0,
        searchType: 'fuzzy' as const,
        executionTime: 10,
        libraries: [],
      });

      await searchIconsTool({
        query: 'test',
        keys: ['name', 'tags', 'categories'],
      });

      const searchOptions = searchSpy.mock.calls[0]?.[1];
      expect(searchOptions?.keys).toEqual(['name', 'tags', 'categories']);
    });
  });

  describe('parameter validation', () => {
    it('should_handle_threshold_boundaries', async () => {
      const searchSpy = vi.spyOn(searchService, 'searchIcons').mockResolvedValue({
        query: 'test',
        results: [],
        totalResults: 0,
        searchType: 'fuzzy' as const,
        executionTime: 10,
        libraries: [],
      });

      // Test minimum threshold
      await searchIconsTool({
        query: 'test',
        threshold: 0.0,
      });

      expect(searchSpy.mock.calls[0]?.[1]?.threshold).toBe(0.0);

      // Test maximum threshold
      await searchIconsTool({
        query: 'test',
        threshold: 1.0,
      });

      expect(searchSpy.mock.calls[1]?.[1]?.threshold).toBe(1.0);
    });

    it('should_handle_limit_parameter', async () => {
      const searchSpy = vi.spyOn(searchService, 'searchIcons').mockResolvedValue({
        query: 'test',
        results: [],
        totalResults: 0,
        searchType: 'fuzzy' as const,
        executionTime: 10,
        libraries: [],
      });

      await searchIconsTool({
        query: 'test',
        limit: 100,
      });

      expect(searchSpy.mock.calls[0]?.[1]?.limit).toBe(100);
    });
  });
});
