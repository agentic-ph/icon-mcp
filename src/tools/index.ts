import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { SearchService } from '../services/search.service.js';
import { FuseSearchOptions } from '../types/index.js';

/**
 * Register all icon search tools with the MCP server using the new registerTool API
 */
export function registerIconSearchTools(server: McpServer, searchService: SearchService): void {
  // Register search_icons tool
  server.registerTool(
    'search_icons',
    {
      title: 'Search Icons',
      description: 'Search for icons by name across all or specific libraries with fuzzy matching',
      inputSchema: {
        query: z.string().min(1).describe('Search term for icon names'),
        libraries: z.array(z.string()).optional().describe('Specific libraries to search in'),
        fuzzy: z.boolean().default(true).describe('Enable fuzzy search for typo tolerance'),
        limit: z.number().default(10).describe('Maximum number of results to return'),
        threshold: z
          .number()
          .min(0)
          .max(1)
          .default(0.3)
          .describe('Minimum match score for fuzzy search (0.0-1.0)'),
        includeScore: z.boolean().default(true).describe('Include match scores in results'),
        includeMatches: z
          .boolean()
          .default(true)
          .describe('Include match details for highlighting'),
        keys: z.array(z.string()).optional().describe('Specific fields to search in'),
        useExtendedSearch: z.boolean().default(false).describe('Enable advanced query syntax'),
        ignoreLocation: z.boolean().default(false).describe('Ignore location-based scoring'),
        minMatchCharLength: z.number().default(2).describe('Minimum match length'),
        isCaseSensitive: z.boolean().default(false).describe('Case sensitive search'),
      },
    },
    async (params) => {
      try {
        const searchOptions: FuseSearchOptions = {
          fuzzy: params.fuzzy,
          threshold: params.threshold,
          limit: params.limit,
          includeScore: params.includeScore,
          includeMatches: params.includeMatches,
          keys: params.keys,
          useExtendedSearch: params.useExtendedSearch,
          ignoreLocation: params.ignoreLocation,
          minMatchCharLength: params.minMatchCharLength,
          isCaseSensitive: params.isCaseSensitive,
        };

        const result = await searchService.searchIcons(
          params.query,
          searchOptions,
          params.libraries
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Register get_icon tool
  server.registerTool(
    'get_icon',
    {
      title: 'Get Icon',
      description: 'Get detailed information about a specific icon',
      inputSchema: {
        id: z.string().min(1).describe('Unique identifier of the icon'),
        library: z.string().min(1).describe('Library name where the icon is located'),
      },
    },
    async (params) => {
      try {
        const icon = await searchService.getIcon(params.id, params.library);

        if (!icon) {
          return {
            content: [
              {
                type: 'text',
                text: `Icon "${params.id}" not found in library "${params.library}"`,
              },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(icon, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Register list_libraries tool
  server.registerTool(
    'list_libraries',
    {
      title: 'List Libraries',
      description: 'Get a list of all available icon libraries',
      inputSchema: {},
    },
    async () => {
      try {
        const libraries = await searchService.getLibraries();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  libraries,
                  count: libraries.length,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Register get_library_info tool
  server.registerTool(
    'get_library_info',
    {
      title: 'Get Library Info',
      description: 'Get detailed information about a specific library',
      inputSchema: {
        library: z.string().min(1).describe('Name of the library'),
      },
    },
    async (params) => {
      try {
        const providerRegistry = searchService.getProviderRegistry();
        const provider = providerRegistry.get(params.library);

        if (!provider) {
          return {
            content: [
              {
                type: 'text',
                text: `Library "${params.library}" not found`,
              },
            ],
            isError: true,
          };
        }

        const info = await provider.getInfo();
        const iconCount = await provider.getIconCount();
        const categories = await provider.getCategories();
        const styles = await provider.getStyles();

        const libraryInfo = {
          ...info,
          iconCount,
          categories,
          styles,
          isAvailable: await provider.isAvailable(),
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(libraryInfo, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error getting library info: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Register search_by_category tool
  server.registerTool(
    'search_by_category',
    {
      title: 'Search by Category',
      description: 'Find icons by category or tag with fuzzy matching',
      inputSchema: {
        category: z.string().min(1).describe('Category name to search for'),
        libraries: z.array(z.string()).optional().describe('Specific libraries to search in'),
        fuzzy: z.boolean().default(true).describe('Enable fuzzy search for category names'),
        limit: z.number().default(10).describe('Maximum number of results to return'),
        threshold: z
          .number()
          .min(0)
          .max(1)
          .default(0.3)
          .describe('Minimum match score for fuzzy search'),
      },
    },
    async (params) => {
      try {
        const searchOptions: FuseSearchOptions = {
          fuzzy: params.fuzzy,
          threshold: params.threshold,
          limit: params.limit,
        };

        const result = await searchService.searchByCategory(
          params.category,
          params.libraries,
          searchOptions
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
