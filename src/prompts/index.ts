import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { SearchService } from '../services/search.service.js';

/**
 * Register all icon search prompts with the MCP server
 */
export function registerIconSearchPrompts(server: McpServer, searchService: SearchService): void {
  // Prompt for exploring icon libraries
  server.registerPrompt(
    'explore-icons',
    {
      title: 'Explore Icon Libraries',
      description: 'Get started with exploring available icon libraries and their contents',
      argsSchema: {
        startFrom: z
          .string()
          .optional()
          .describe('Where to start exploring: libraries, search, or categories'),
      },
    },
    async ({ startFrom = 'libraries' }) => {
      let content = '';

      switch (startFrom) {
        case 'libraries': {
          const libraries = await searchService.getLibraries();
          content = `Here are the available icon libraries:\n\n${libraries.map((lib) => `- ${lib}`).join('\n')}\n\nYou can get detailed information about any library using the get_library_info tool.`;
          break;
        }
        case 'search': {
          content =
            'You can search for icons using the search_icons tool. Try searching for common terms like "home", "user", "arrow", or "settings".';
          break;
        }
        case 'categories': {
          content =
            'You can explore icons by category using the search_by_category tool. Common categories include "navigation", "social", "communication", "media", and "interface".';
          break;
        }
        default: {
          const libraries = await searchService.getLibraries();
          content = `Here are the available icon libraries:\n\n${libraries.map((lib) => `- ${lib}`).join('\n')}\n\nYou can get detailed information about any library using the get_library_info tool.`;
          break;
        }
      }

      return {
        messages: [
          {
            role: 'assistant',
            content: {
              type: 'text',
              text: content,
            },
          },
        ],
      };
    }
  );

  // Prompt for finding the right icon
  server.registerPrompt(
    'find-icon',
    {
      title: 'Find the Right Icon',
      description: 'Help find the perfect icon for a specific use case',
      argsSchema: {
        useCase: z.string().describe('Describe what you need the icon for'),
        style: z
          .string()
          .optional()
          .describe('Preferred icon style (any, outline, solid, filled, regular)'),
        libraries: z
          .string()
          .optional()
          .describe('Comma-separated list of specific libraries to search in'),
      },
    },
    async ({ useCase, style, libraries }) => {
      // Generate search suggestions based on use case
      const searchTerms =
        useCase
          ?.toLowerCase()
          .split(' ')
          .filter((word) => word.length > 2) || [];
      const suggestions = searchTerms.slice(0, 3);

      let libraryFilter = '';
      if (libraries && libraries.length > 0) {
        const libraryList = libraries.split(',').map((lib) => lib.trim());
        libraryFilter = ` in libraries: ${libraryList.join(', ')}`;
      }

      let styleFilter = '';
      if (style && style !== 'any') {
        styleFilter = ` with ${style} style`;
      }

      const content = `I'll help you find the perfect icon for "${useCase}"${libraryFilter}${styleFilter}.

Here are some search strategies:

1. **Direct search**: Try searching for these terms:
   ${suggestions.map((term) => `   - "${term}"`).join('\n')}

2. **Related concepts**: Consider these related terms:
   - For UI elements: "interface", "control", "button"
   - For actions: "action", "tool", "function"
   - For objects: "object", "item", "element"

3. **Category search**: Try searching by category:
   - "interface" for UI elements
   - "navigation" for directional icons
   - "communication" for messaging/contact icons
   - "media" for multimedia icons

Use the search_icons tool with fuzzy search enabled to find the best matches!`;

      return {
        messages: [
          {
            role: 'assistant',
            content: {
              type: 'text',
              text: content,
            },
          },
        ],
      };
    }
  );

  // Prompt for icon comparison
  server.registerPrompt(
    'compare-icons',
    {
      title: 'Compare Icon Libraries',
      description: 'Compare different icon libraries to help choose the best one',
      argsSchema: {
        criteria: z
          .string()
          .optional()
          .describe('What to compare: count, style, categories, or license'),
      },
    },
    async ({ criteria }) => {
      const comparisonCriteria = criteria || 'count';
      const libraries = await searchService.getLibraries();

      let content = `Here's a comparison of available icon libraries based on ${comparisonCriteria}:\n\n`;

      for (const libraryName of libraries) {
        const provider = searchService.getProviderRegistry().get(libraryName);
        if (provider) {
          try {
            const info = await provider.getInfo();

            switch (comparisonCriteria) {
              case 'count': {
                const iconCount = await provider.getIconCount();
                content += `**${info.displayName}**: ${iconCount} icons\n`;
                break;
              }
              case 'style': {
                const styles = await provider.getStyles();
                content += `**${info.displayName}**: ${styles.join(', ')}\n`;
                break;
              }
              case 'categories': {
                const categories = await provider.getCategories();
                content += `**${info.displayName}**: ${categories.slice(0, 5).join(', ')}${categories.length > 5 ? '...' : ''}\n`;
                break;
              }
              case 'license': {
                content += `**${info.displayName}**: ${info.license}\n`;
                break;
              }
            }
          } catch {
            content += `**${libraryName}**: Information unavailable\n`;
          }
        }
      }

      content +=
        '\nUse the get_library_info tool to get detailed information about any specific library.';

      return {
        messages: [
          {
            role: 'assistant',
            content: {
              type: 'text',
              text: content,
            },
          },
        ],
      };
    }
  );

  // Prompt for icon usage recommendations
  server.registerPrompt(
    'icon-usage',
    {
      title: 'Icon Usage Recommendations',
      description: 'Get recommendations for icon usage in different contexts',
      argsSchema: {
        context: z.string().describe('Where the icons will be used (web, mobile, desktop, print)'),
        size: z.string().optional().describe('Expected icon size (small, medium, large)'),
      },
    },
    async ({ context, size }) => {
      const iconSize = size || 'medium';
      let recommendations = '';

      switch (context) {
        case 'web':
          recommendations = `For web applications:
- Use SVG format for scalability
- Consider outline styles for better clarity at small sizes
- Ensure icons work well with your color scheme
- Test accessibility with screen readers`;
          break;
        case 'mobile':
          recommendations = `For mobile applications:
- Use filled/solid styles for better touch targets
- Ensure minimum 24px touch area
- Consider platform-specific icon guidelines
- Test on various screen densities`;
          break;
        case 'desktop':
          recommendations = `For desktop applications:
- Use consistent icon families
- Consider platform conventions (Windows, macOS, Linux)
- Ensure icons scale well for high-DPI displays
- Maintain visual hierarchy`;
          break;
        case 'print':
          recommendations = `For print materials:
- Use high-contrast icons
- Avoid very thin lines that may not print well
- Consider solid/filled styles
- Test at actual print size`;
          break;
      }

      const sizeGuidance = {
        small: 'For small icons (16-24px), prefer simple, bold designs with minimal detail.',
        medium: 'For medium icons (24-48px), you have more flexibility with detail and style.',
        large:
          'For large icons (48px+), detailed designs work well and can include more visual elements.',
      };

      const content = `${recommendations}

**Size considerations for ${iconSize} icons:**
${sizeGuidance[iconSize as keyof typeof sizeGuidance] || sizeGuidance.medium}

**General best practices:**
- Maintain consistent visual weight across icon sets
- Use appropriate padding/margins around icons
- Consider the icon's semantic meaning in your context
- Test icons with your target audience

Use the search_icons tool to find icons that match these criteria!`;

      return {
        messages: [
          {
            role: 'assistant',
            content: {
              type: 'text',
              text: content,
            },
          },
        ],
      };
    }
  );
}
