import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SearchService } from '../services/search.service.js';

/**
 * Register all icon search resources with the MCP server
 */
export function registerIconSearchResources(server: McpServer, searchService: SearchService): void {
  // Static resource for all available libraries
  server.registerResource(
    'icon-libraries',
    'icons://libraries',
    {
      title: 'Icon Libraries',
      description: 'List of all available icon libraries',
      mimeType: 'application/json',
    },
    async () => {
      const libraries = await searchService.getLibraries();
      const libraryDetails = await Promise.all(
        libraries.map(async (libraryName) => {
          const provider = searchService.getProviderRegistry().get(libraryName);
          if (provider) {
            const info = await provider.getInfo();
            const iconCount = await provider.getIconCount();
            return {
              name: libraryName,
              displayName: info.displayName,
              description: info.description,
              iconCount,
              version: info.version,
            };
          }
          return { name: libraryName };
        })
      );

      return {
        contents: [
          {
            uri: 'icons://libraries',
            mimeType: 'application/json',
            text: JSON.stringify(libraryDetails, null, 2),
          },
        ],
      };
    }
  );

  // Dynamic resource for specific library information
  server.registerResource(
    'library-info',
    new ResourceTemplate('icons://libraries/{library}', { list: undefined }),
    {
      title: 'Library Information',
      description: 'Detailed information about a specific icon library',
      mimeType: 'application/json',
    },
    async (uri, { library }) => {
      const libraryName = Array.isArray(library) ? library[0] : library;
      const provider = searchService.getProviderRegistry().get(libraryName);
      if (!provider) {
        throw new Error(`Library "${libraryName}" not found`);
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
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify(libraryInfo, null, 2),
          },
        ],
      };
    }
  );

  // Dynamic resource for library icons
  server.registerResource(
    'library-icons',
    new ResourceTemplate('icons://libraries/{library}/icons', { list: undefined }),
    {
      title: 'Library Icons',
      description: 'All icons from a specific library',
      mimeType: 'application/json',
    },
    async (uri, { library }) => {
      const libraryName = Array.isArray(library) ? library[0] : library;
      const provider = searchService.getProviderRegistry().get(libraryName);
      if (!provider) {
        throw new Error(`Library "${libraryName}" not found`);
      }

      const icons = await provider.getAllIcons();

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify(icons, null, 2),
          },
        ],
      };
    }
  );

  // Dynamic resource for specific icon
  server.registerResource(
    'icon-detail',
    new ResourceTemplate('icons://libraries/{library}/icons/{iconId}', { list: undefined }),
    {
      title: 'Icon Details',
      description: 'Detailed information about a specific icon',
      mimeType: 'application/json',
    },
    async (uri, { library, iconId }) => {
      const libraryName = Array.isArray(library) ? library[0] : library;
      const iconIdStr = Array.isArray(iconId) ? iconId[0] : iconId;
      const icon = await searchService.getIcon(iconIdStr, libraryName);
      if (!icon) {
        throw new Error(`Icon "${iconIdStr}" not found in library "${libraryName}"`);
      }

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify(icon, null, 2),
          },
        ],
      };
    }
  );

  // Resource for search results
  server.registerResource(
    'search-results',
    new ResourceTemplate('icons://search/{query}', { list: undefined }),
    {
      title: 'Search Results',
      description: 'Icon search results for a specific query',
      mimeType: 'application/json',
    },
    async (uri, { query }) => {
      const queryStr = Array.isArray(query) ? query[0] : query;
      const searchResult = await searchService.searchIcons(decodeURIComponent(queryStr));

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify(searchResult, null, 2),
          },
        ],
      };
    }
  );
}
