# Fuse.js Integration Guidelines

## Overview

Integration of Fuse.js library to provide powerful fuzzy search capabilities with typo tolerance, partial matching, and advanced scoring for icon search operations. Fuse.js is a lightweight, zero-dependency library that's perfect for client-side fuzzy searching.

## Core Integration Points

### 1. Search Service Enhancement

```typescript
import Fuse from 'fuse.js';

interface FuseSearchOptions {
  fuzzy?: boolean;
  threshold?: number; // 0.0-1.0, lower is more strict
  includeScore?: boolean;
  includeMatches?: boolean;
  keys?: string[]; // Fields to search in
  limit?: number;
}

class IconService {
  private fuseInstances: Map<string, Fuse<Icon>> = new Map();

  async searchIcons(query: string, options: FuseSearchOptions = {}): Promise<SearchResult> {
    const { fuzzy = true, threshold = 0.3 } = options;

    if (fuzzy) {
      return this.performFuseSearch(query, options);
    }
    return this.performExactSearch(query, options);
  }

  private createFuseInstance(icons: Icon[], library: string): Fuse<Icon> {
    const fuseOptions: Fuse.IFuseOptions<Icon> = {
      keys: [
        { name: 'name', weight: 1.0 },
        { name: 'tags', weight: 0.7 },
        { name: 'id', weight: 0.5 },
      ],
      threshold: 0.3,
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 2,
      shouldSort: true,
      findAllMatches: false,
      location: 0,
      distance: 100,
    };

    const fuse = new Fuse(icons, fuseOptions);
    this.fuseInstances.set(library, fuse);
    return fuse;
  }
}
```

### 2. Data Model Updates

```typescript
// Fuse.js result types
interface FuseResult<T> {
  item: T;
  score?: number;
  matches?: FuseMatch[];
  refIndex?: number;
}

interface FuseMatch {
  indices: number[][];
  value: string;
  key: string;
  arrayIndex?: number;
}

interface SearchResult {
  query: string;
  results: FuseResult<Icon>[];
  totalResults: number;
  searchType: 'exact' | 'fuzzy';
  executionTime: number;
  libraries: string[];
}

// Enhanced icon interface for better search
interface Icon {
  id: string;
  name: string;
  library: string;
  svg: string;
  tags: string[];
  category?: string;
  keywords?: string[]; // Additional searchable terms
  license?: string;
  author?: string;
}
```

### 3. Fuse.js Implementation Strategy

#### Phase 1: Basic Fuse.js Integration

- Set up Fuse.js instances for each icon library
- Implement basic fuzzy search for icon names
- Add relevance scoring and match highlighting

#### Phase 2: Advanced Search Features

- Multi-field search (name, tags, keywords)
- Weighted search keys for better relevance
- Custom scoring strategies

#### Phase 3: Performance Optimization

- Cached Fuse.js instances per library
- Lazy loading of search indices
- Search result pagination and streaming

## Implementation Patterns

### 1. Icon Name Fuzzy Search

```typescript
private async performFuseSearch(
  query: string,
  options: FuseSearchOptions
): Promise<SearchResult> {
  const startTime = Date.now();
  const { threshold = 0.3, limit = 50, includeScore = true, includeMatches = true } = options;

  const allResults: FuseResult<Icon>[] = [];
  const searchedLibraries: string[] = [];

  for (const [libraryName, icons] of this.iconLibraries) {
    const fuse = this.getFuseInstance(libraryName, icons);

    const fuseOptions: Fuse.IFuseOptions<Icon> = {
      ...fuse.options,
      threshold,
      includeScore,
      includeMatches,
      limit: limit * 2 // Get more results to filter later
    };

    const results = fuse.search(query, fuseOptions);
    allResults.push(...results);
    searchedLibraries.push(libraryName);
  }

  // Sort by score (lower is better in Fuse.js)
  const sortedResults = allResults
    .sort((a, b) => (a.score || 0) - (b.score || 0))
    .slice(0, limit);

  return {
    query,
    results: sortedResults,
    totalResults: allResults.length,
    searchType: 'fuzzy',
    executionTime: Date.now() - startTime,
    libraries: searchedLibraries
  };
}
```

### 2. Multi-Field Fuzzy Search

```typescript
private createAdvancedFuseInstance(icons: Icon[], library: string): Fuse<Icon> {
  const fuseOptions: Fuse.IFuseOptions<Icon> = {
    keys: [
      // Primary search fields with high weight
      { name: 'name', weight: 1.0 },
      { name: 'id', weight: 0.8 },

      // Secondary search fields
      { name: 'tags', weight: 0.6 },
      { name: 'keywords', weight: 0.5 },
      { name: 'category', weight: 0.4 }
    ],

    // Search configuration
    threshold: 0.3,        // 0.0 = perfect match, 1.0 = match anything
    location: 0,           // Expected location of match
    distance: 100,         // How far from location to search
    minMatchCharLength: 2, // Minimum character length to be considered a match

    // Result configuration
    includeScore: true,
    includeMatches: true,
    shouldSort: true,
    findAllMatches: false,

    // Performance tuning
    ignoreLocation: false,
    ignoreFieldNorm: false,
    fieldNormWeight: 1
  };

  return new Fuse(icons, fuseOptions);
}
```

### 3. Provider-Level Integration

```typescript
abstract class IconProvider {
  protected fuseInstance?: Fuse<Icon>;

  abstract fetchIcons(): Promise<Icon[]>;

  async searchIconsFuzzy(
    query: string,
    options: FuseSearchOptions = {}
  ): Promise<FuseResult<Icon>[]> {
    if (!this.fuseInstance) {
      const icons = await this.fetchIcons();
      this.fuseInstance = this.createFuseInstance(icons);
    }

    const fuseOptions = {
      threshold: options.threshold || 0.3,
      includeScore: options.includeScore !== false,
      includeMatches: options.includeMatches !== false,
      limit: options.limit || 50,
    };

    return this.fuseInstance.search(query, fuseOptions);
  }

  private createFuseInstance(icons: Icon[]): Fuse<Icon> {
    return new Fuse(icons, {
      keys: this.getSearchKeys(),
      threshold: 0.3,
      includeScore: true,
      includeMatches: true,
    });
  }

  protected getSearchKeys(): Fuse.FuseOptionKey<Icon>[] {
    return [
      { name: 'name', weight: 1.0 },
      { name: 'tags', weight: 0.7 },
      { name: 'id', weight: 0.5 },
    ];
  }
}
```

## MCP Tool Integration

### Enhanced Tool Parameters

```typescript
// Updated search_icons tool schema
const searchIconsSchema = z.object({
  query: z.string().describe('Search term for icon names'),
  libraries: z.array(z.string()).optional().describe('Specific libraries to search in'),
  fuzzy: z.boolean().default(true).describe('Enable Fuse.js fuzzy search'),
  threshold: z.number().min(0).max(1).default(0.3).describe('Fuse.js search threshold (0.0-1.0)'),
  limit: z.number().default(10).describe('Maximum number of results'),
  includeScore: z.boolean().default(true).describe('Include Fuse.js match scores'),
  includeMatches: z.boolean().default(true).describe('Include match details'),
  keys: z.array(z.string()).optional().describe('Specific fields to search in'),
});
```

### Tool Implementation

```typescript
server.tool(
  'search_icons',
  'Search for icons with Fuse.js fuzzy matching capabilities',
  searchIconsSchema,
  async ({ query, libraries, fuzzy, threshold, limit, includeScore, includeMatches, keys }) => {
    try {
      const searchOptions: FuseSearchOptions = {
        fuzzy,
        threshold,
        includeScore,
        includeMatches,
        keys,
        limit,
      };

      const result = await iconService.searchIcons(query, searchOptions, libraries);

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
            text: `Error: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);
```

## Performance Considerations

### 1. Caching Strategy

- Cache Fuse.js instances per library to avoid recreation
- Implement LRU cache for search results
- Pre-build search indices during startup

### 2. Search Optimization

- Use appropriate threshold values (0.3 is a good default)
- Limit search results and implement pagination
- Use weighted keys for better relevance

### 3. Memory Management

- Lazy load Fuse.js instances only when needed
- Implement search result streaming for large datasets
- Monitor memory usage with large icon libraries

## Testing Requirements

### 1. Fuse.js Search Accuracy

- Test various threshold values (0.1, 0.3, 0.5, 0.7)
- Test multi-character typos and partial matches
- Validate relevance scoring and result ordering

### 2. Performance Testing

- Benchmark search performance with different library sizes
- Test memory usage with multiple Fuse.js instances
- Measure search latency under load

### 3. Edge Cases

- Empty search queries
- Special characters and Unicode
- Very long search terms
- Searches with no results

## Error Handling

```typescript
class FuseSearchError extends Error {
  constructor(message: string, public query: string, public cause?: Error) {
    super(message);
    this.name = "FuseSearchError";
  }
}

// Graceful degradation
async searchWithFallback(query: string, options: FuseSearchOptions) {
  try {
    return await this.performFuseSearch(query, options);
  } catch (error) {
    console.warn(`Fuse.js search failed for "${query}", falling back to exact search`);
    return await this.performExactSearch(query, { ...options, fuzzy: false });
  }
}
```

## Advanced Features

### 1. Custom Scoring

```typescript
// Custom scoring function for icon relevance
const customScoringFunction = (item: Icon, query: string): number => {
  let score = 0;

  // Exact name match gets highest score
  if (item.name.toLowerCase() === query.toLowerCase()) {
    score += 100;
  }

  // Name starts with query gets high score
  if (item.name.toLowerCase().startsWith(query.toLowerCase())) {
    score += 50;
  }

  // Tag matches get medium score
  const tagMatches = item.tags.filter((tag) =>
    tag.toLowerCase().includes(query.toLowerCase())
  ).length;
  score += tagMatches * 20;

  return score;
};
```

### 2. Search Result Highlighting

```typescript
const highlightMatches = (result: FuseResult<Icon>): string => {
  if (!result.matches) return result.item.name;

  let highlighted = result.item.name;
  const matches = result.matches.find((m) => m.key === 'name');

  if (matches) {
    // Apply highlighting to matched indices
    matches.indices.forEach(([start, end]) => {
      const before = highlighted.substring(0, start);
      const match = highlighted.substring(start, end + 1);
      const after = highlighted.substring(end + 1);
      highlighted = `${before}<mark>${match}</mark>${after}`;
    });
  }

  return highlighted;
};
```
