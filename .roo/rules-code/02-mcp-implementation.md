# MCP Implementation Guidelines

## Tool Structure Template

```typescript
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerIconTools(server: McpServer) {
  server.tool(
    'search_icons',
    'Search for icons by name across all libraries',
    {
      query: z.string().describe('Search term for icon names'),
      libraries: z.array(z.string()).optional().describe('Specific libraries to search in'),
      limit: z.number().optional().default(10).describe('Maximum number of results'),
    },
    async ({ query, libraries, limit }) => {
      try {
        const data = await iconService.searchIcons(query, libraries, limit);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
```

## Parameter Validation

- **Required Parameters**: Mark with zod `.required()`
- **Optional Parameters**: Use `.optional()` with sensible defaults
- **Code Validation**: Validate icon IDs and library names against known patterns
- **Type Validation**: Ensure correct data types for all inputs

## Response Format Standards

```typescript
// Success response
{
  content: [{
    type: 'text',
    text: JSON.stringify(data, null, 2)
  }]
}

// Error response
{
  content: [{
    type: 'text',
    text: 'Error: [descriptive message]'
  }],
  isError: true
}
```

## Tool Categories Implementation Order

1. **Core Icon Tools** (implement in this order):
   - Icon Search tools (`search_icons`, `get_icon`, etc.)
   - Library tools (`list_libraries`, `get_library_info`, etc.)
   - Category tools (`search_by_category`, etc.)

2. **Search and Discovery Tools**: Implement after basic icon tools
3. **Validation Tools**: Icon ID validation and library validation tools
4. **Advanced Features**: Filtering, pagination, caching

## Resource Implementation

```typescript
// Static resources
server.resource('icon-libraries', 'icons://libraries', async () => ({
  contents: [
    {
      uri: 'icons://libraries',
      mimeType: 'application/json',
      text: JSON.stringify(iconLibraries),
    },
  ],
}));

// Dynamic resources
server.resource('library-icons', 'icons://libraries/{library}/icons', async (uri, { library }) => {
  const icons = await iconProvider.getLibraryIcons(library);
  return {
    contents: [
      {
        uri: uri.href,
        mimeType: 'application/json',
        text: JSON.stringify(icons),
      },
    ],
  };
});
```

## Prompt Templates

```typescript
// Discovery prompt
server.prompt(
  'explore-icons',
  'Explore available icon libraries and search for icons',
  {
    startFrom: z.enum(['libraries', 'search', 'categories']).default('libraries'),
  },
  async ({ startFrom }) => {
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Let's explore icons starting from ${startFrom}. What would you like to find?`,
          },
        },
      ],
    };
  }
);
```

## Caching Strategy

- **Tool Results**: Cache based on parameters
- **API Responses**: Cache with TTL based on data volatility
- **Static Data**: Cache indefinitely with cache invalidation
- **Cache Keys**: Use consistent key generation for cache hits

## Error Handling Patterns

```typescript
// API errors
class IconProviderError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public provider: string
  ) {
    super(message);
    this.name = 'IconProviderError';
  }
}

// Validation errors
class ValidationError extends Error {
  constructor(
    message: string,
    public field: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}
```
