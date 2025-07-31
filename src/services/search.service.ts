import Fuse from 'fuse.js';
import { ProviderRegistry } from '../providers/icon-provider.interface.js';
import {
  Icon,
  FuseResult,
  FuseSearchOptions,
  SearchResult,
  SimilarIconsResult,
  SimilarSearchOptions,
  AutocompleteResult,
  AutocompleteOptions,
  IconSearchError,
} from '../types/index.js';
import { CacheService } from './cache.service.js';

/**
 * Central search service that provides unified search capabilities
 * across all registered icon providers using Fuse.js for fuzzy matching.
 */
export class SearchService {
  private fuseInstances = new Map<string, Fuse<Icon>>();
  private providerRegistry: ProviderRegistry;

  constructor(
    private cacheService: CacheService,
    providerRegistry?: ProviderRegistry
  ) {
    this.providerRegistry = providerRegistry || new ProviderRegistry();
  }

  /**
   * Search for icons across all or specific libraries
   */
  async searchIcons(
    query: string,
    options: FuseSearchOptions = {},
    libraries?: string[]
  ): Promise<SearchResult> {
    const startTime = Date.now();

    try {
      this.validateSearchQuery(query);

      const cacheKey = CacheService.generateKey(
        'search',
        query,
        JSON.stringify(options),
        libraries?.join(',') || 'all'
      );

      // Try to get from cache first
      const cached = this.cacheService.get<SearchResult>(cacheKey);
      if (cached) {
        return cached;
      }

      const { fuzzy = true, limit = 50 } = options;

      let searchResults: FuseResult<Icon>[] = [];
      const searchedLibraries: string[] = [];

      if (fuzzy) {
        searchResults = await this.performFuseSearch(query, options, libraries);
      } else {
        searchResults = await this.performExactSearch(query, options, libraries);
      }

      // Get library names that were searched
      const providers = await this.getTargetProviders(libraries);
      searchedLibraries.push(...providers.map((p) => p.name));

      // Sort by score (lower is better in Fuse.js) and apply limit
      const sortedResults = searchResults
        .sort((a, b) => (a.score || 0) - (b.score || 0))
        .slice(0, limit);

      const result: SearchResult = {
        query,
        results: sortedResults,
        totalResults: searchResults.length,
        searchType: fuzzy ? 'fuzzy' : 'exact',
        executionTime: Date.now() - startTime,
        libraries: searchedLibraries,
        fuseOptions: options,
      };

      // Cache the result
      this.cacheService.set(cacheKey, result, 5 * 60 * 1000); // 5 minutes

      return result;
    } catch (error) {
      return {
        query,
        results: [],
        totalResults: 0,
        searchType: 'failed',
        executionTime: Date.now() - startTime,
        libraries: [],
        error: error instanceof Error ? error.message : 'Unknown search error',
      };
    }
  }

  /**
   * Get a specific icon by ID and library
   */
  async getIcon(id: string, library: string): Promise<Icon | null> {
    try {
      const cacheKey = CacheService.generateKey('icon', library, id);

      // Try cache first
      const cached = this.cacheService.get<Icon>(cacheKey);
      if (cached) {
        return cached;
      }

      const provider = this.providerRegistry.get(library);
      if (!provider) {
        throw new IconSearchError(`Library "${library}" not found`, 'LIBRARY_NOT_FOUND', 404);
      }

      const icon = await provider.getIcon(id);

      if (icon) {
        // Cache the icon for 10 minutes
        this.cacheService.set(cacheKey, icon, 10 * 60 * 1000);
      }

      return icon;
    } catch (error) {
      console.error(`Error getting icon ${id} from ${library}:`, error);
      return null;
    }
  }

  /**
   * Get all available libraries
   */
  async getLibraries(): Promise<string[]> {
    const cacheKey = 'libraries:all';

    const cached = this.cacheService.get<string[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const providers = await this.providerRegistry.getAvailableProviders();
    const libraryNames = providers.map((p) => p.name);

    // Cache for 30 minutes
    this.cacheService.set(cacheKey, libraryNames, 30 * 60 * 1000);

    return libraryNames;
  }

  /**
   * Search for similar icons based on a reference icon
   */
  async searchSimilar(
    iconName: string,
    library: string,
    options: SimilarSearchOptions = {}
  ): Promise<SimilarIconsResult> {
    const {
      limit = 10,
      threshold = 0.4,
      excludeOriginal = true,
      sameLibraryOnly = false,
    } = options;

    try {
      // Get the original icon
      const originalIcon = await this.getIcon(iconName, library);
      if (!originalIcon) {
        throw new IconSearchError(
          `Icon "${iconName}" not found in library "${library}"`,
          'ICON_NOT_FOUND',
          404
        );
      }

      // Search for similar icons based on tags and name
      const searchTerms = [originalIcon.name, ...originalIcon.tags].join(' ');
      const searchOptions: FuseSearchOptions = {
        threshold,
        limit: limit * 2, // Get more results to filter
        libraries: sameLibraryOnly ? [library] : undefined,
      };

      const searchResult = await this.searchIcons(searchTerms, searchOptions);

      // Filter out the original icon if requested
      let similarIcons = searchResult.results;
      if (excludeOriginal) {
        similarIcons = similarIcons.filter(
          (result) =>
            !(
              result.item.name === originalIcon.name && result.item.library === originalIcon.library
            )
        );
      }

      // Limit results
      similarIcons = similarIcons.slice(0, limit);

      return {
        originalIcon,
        similarIcons,
        totalSimilar: similarIcons.length,
        searchCriteria: {
          threshold,
          sameLibraryOnly,
          fieldsCompared: ['name', 'tags'],
        },
      };
    } catch (error) {
      throw new IconSearchError(
        `Failed to find similar icons: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SIMILAR_SEARCH_FAILED'
      );
    }
  }

  /**
   * Search icons by category
   */
  async searchByCategory(
    category: string,
    libraries?: string[],
    options: FuseSearchOptions = {}
  ): Promise<SearchResult> {
    const startTime = Date.now();

    try {
      const providers = await this.getTargetProviders(libraries);
      const allResults: FuseResult<Icon>[] = [];
      const searchedLibraries: string[] = [];

      for (const provider of providers) {
        const results = await provider.searchByCategory(category, options);
        allResults.push(...results);
        searchedLibraries.push(provider.name);
      }

      const { limit = 50 } = options;
      const limitedResults = allResults.slice(0, limit);

      return {
        query: `category:${category}`,
        results: limitedResults,
        totalResults: allResults.length,
        searchType: 'filtered',
        executionTime: Date.now() - startTime,
        libraries: searchedLibraries,
      };
    } catch (error) {
      return {
        query: `category:${category}`,
        results: [],
        totalResults: 0,
        searchType: 'failed',
        executionTime: Date.now() - startTime,
        libraries: [],
        error: error instanceof Error ? error.message : 'Category search failed',
      };
    }
  }

  /**
   * Get autocomplete suggestions for partial queries
   */
  async getAutocompleteSuggestions(
    partialQuery: string,
    options: AutocompleteOptions = {}
  ): Promise<AutocompleteResult> {
    const startTime = Date.now();
    const {
      maxSuggestions = 10,
      includeLibraries = true,
      includeCategories = true,
      minQueryLength = 2,
    } = options;

    if (partialQuery.length < minQueryLength) {
      return {
        suggestions: [],
        categories: [],
        libraries: [],
        executionTime: Date.now() - startTime,
      };
    }

    try {
      const cacheKey = CacheService.generateKey(
        'autocomplete',
        partialQuery,
        JSON.stringify(options)
      );
      const cached = this.cacheService.get<AutocompleteResult>(cacheKey);
      if (cached) {
        return cached;
      }

      const suggestions = new Set<string>();
      const categories = new Set<string>();
      const libraries = new Set<string>();

      const providers = await this.providerRegistry.getAvailableProviders();

      for (const provider of providers) {
        const icons = await provider.getAllIcons();

        // Add library name if it matches
        if (includeLibraries && provider.name.toLowerCase().includes(partialQuery.toLowerCase())) {
          libraries.add(provider.name);
        }

        for (const icon of icons) {
          // Add icon names that start with or contain the query
          if (icon.name.toLowerCase().includes(partialQuery.toLowerCase())) {
            suggestions.add(icon.name);
          }

          // Add matching tags
          for (const tag of icon.tags) {
            if (tag.toLowerCase().includes(partialQuery.toLowerCase())) {
              suggestions.add(tag);
            }
          }

          // Add matching categories
          if (includeCategories && icon.categories) {
            for (const category of icon.categories) {
              if (category.toLowerCase().includes(partialQuery.toLowerCase())) {
                categories.add(category);
              }
            }
          }
        }
      }

      const result: AutocompleteResult = {
        suggestions: Array.from(suggestions).slice(0, maxSuggestions),
        categories: Array.from(categories).slice(0, maxSuggestions),
        libraries: Array.from(libraries).slice(0, maxSuggestions),
        executionTime: Date.now() - startTime,
      };

      // Cache for 5 minutes
      this.cacheService.set(cacheKey, result, 5 * 60 * 1000);

      return result;
    } catch {
      return {
        suggestions: [],
        categories: [],
        libraries: [],
        executionTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Perform fuzzy search using Fuse.js
   */
  private async performFuseSearch(
    query: string,
    options: FuseSearchOptions,
    libraries?: string[]
  ): Promise<FuseResult<Icon>[]> {
    const providers = await this.getTargetProviders(libraries);
    const allResults: FuseResult<Icon>[] = [];

    for (const provider of providers) {
      const results = await provider.searchIcons(query, options);
      allResults.push(...results);
    }

    return allResults;
  }

  /**
   * Perform exact string matching search
   */
  private async performExactSearch(
    query: string,
    options: FuseSearchOptions,
    libraries?: string[]
  ): Promise<FuseResult<Icon>[]> {
    const providers = await this.getTargetProviders(libraries);
    const allResults: FuseResult<Icon>[] = [];
    const lowerQuery = query.toLowerCase();

    for (const provider of providers) {
      const icons = await provider.getAllIcons();

      const matchingIcons = icons.filter(
        (icon) =>
          icon.name.toLowerCase().includes(lowerQuery) ||
          icon.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
      );

      // Convert to FuseResult format
      const results: FuseResult<Icon>[] = matchingIcons.map((icon, index) => ({
        item: icon,
        score: 0, // Perfect match for exact search
        refIndex: index,
      }));

      allResults.push(...results);
    }

    return allResults;
  }

  /**
   * Get target providers based on library filter
   */
  private async getTargetProviders(
    libraries?: string[]
  ): Promise<import('../providers/icon-provider.interface.js').IconProvider[]> {
    const availableProviders = await this.providerRegistry.getAvailableProviders();

    if (!libraries || libraries.length === 0) {
      return availableProviders;
    }

    return availableProviders.filter((provider) => libraries.includes(provider.name));
  }

  /**
   * Validate search query
   */
  private validateSearchQuery(query: string): void {
    if (!query || query.trim().length === 0) {
      throw new IconSearchError('Search query cannot be empty', 'INVALID_QUERY', 400);
    }

    if (query.length > 100) {
      throw new IconSearchError('Search query too long (max 100 characters)', 'INVALID_QUERY', 400);
    }

    // Sanitize query to prevent potential issues
    const sanitizedQuery = query.replace(/[<>"']/g, '');
    if (sanitizedQuery !== query) {
      console.warn('Search query contained potentially unsafe characters');
    }
  }

  /**
   * Get the provider registry
   */
  getProviderRegistry(): ProviderRegistry {
    return this.providerRegistry;
  }

  /**
   * Clear all cached search results
   */
  clearCache(): void {
    this.cacheService.clear();
    this.fuseInstances.clear();
  }
}
