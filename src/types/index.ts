import { z } from 'zod';

/**
 * Core Icon interface based on the project specification
 */
export const IconSchema = z.object({
  name: z.string().min(1).describe("Icon name (e.g., 'arrow-right')"),
  library: z.string().min(1).describe("Library name (e.g., 'octicons')"),
  tags: z.array(z.string()).describe("Searchable tags (e.g., ['arrow', 'right'])"),
  style: z.string().optional().describe("Style variant (e.g., 'solid', 'outline', 'regular')"),
  path: z.string().min(1).describe('Local file path to SVG'),
  svg: z.string().min(1).describe('SVG content as string for UI rendering'),
  categories: z.array(z.string()).optional().describe("Categories (e.g., ['navigation'])"),
  size: z.string().optional().describe("Icon size (e.g., '24x24', '16x16')"),
  source: z.string().url().optional().describe('Source repository URL'),
  updatedAt: z.string().datetime().optional().describe('Last update timestamp'),
});

export type Icon = z.infer<typeof IconSchema>;

/**
 * Fuse.js result types for fuzzy search
 */
export interface FuseResult<T> {
  item: T;
  score?: number; // Relevance score (0 = perfect match, 1 = no match)
  matches?: FuseMatch[]; // Match details for highlighting
  refIndex?: number; // Original index in the dataset
}

export interface FuseMatch {
  indices: number[][]; // Character indices of matches
  value: string; // Matched text value
  key: string; // Field name that matched
  arrayIndex?: number; // Index if field is an array
}

/**
 * Search result interface
 */
export interface SearchResult {
  query: string;
  results: FuseResult<Icon>[];
  totalResults: number;
  searchType: 'fuzzy' | 'exact' | 'filtered' | 'failed';
  executionTime: number;
  libraries: string[];
  fuseOptions?: Partial<import('fuse.js').IFuseOptions<Icon>>; // Properly typed Fuse.js options
  error?: string;
}

/**
 * Autocomplete result interface
 */
export interface AutocompleteResult {
  suggestions: string[];
  categories: string[];
  libraries: string[];
  executionTime: number;
}

/**
 * Similar icons result interface
 */
export interface SimilarIconsResult {
  originalIcon: Icon;
  similarIcons: FuseResult<Icon>[];
  totalSimilar: number;
  searchCriteria: {
    threshold: number;
    sameLibraryOnly: boolean;
    fieldsCompared: string[];
  };
}

/**
 * Icon Library interface
 */
export const IconLibrarySchema = z.object({
  name: z.string().min(1).describe('Library identifier'),
  displayName: z.string().min(1).describe('Human-readable library name'),
  description: z.string().describe('Library description'),
  version: z.string().describe('Library version'),
  iconCount: z.number().min(0).describe('Total number of icons'),
  submodulePath: z.string().describe('Path to Git submodule'),
  sourceUrl: z.string().url().describe('Original repository URL'),
  license: z.string().describe('License information'),
  styles: z.array(z.string()).describe('Available styles (solid, outline, etc.)'),
  categories: z.array(z.string()).describe('Available categories'),
  lastUpdated: z.string().datetime().describe('Last submodule update'),
});

export type IconLibrary = z.infer<typeof IconLibrarySchema>;

/**
 * SVG Metadata interface
 */
export interface SVGMetadata {
  viewBox: string;
  width?: number;
  height?: number;
  paths: string[]; // SVG path elements
  fills: string[]; // Fill colors used
  strokes: string[]; // Stroke colors used
  hasAnimations: boolean; // Contains animations
  complexity: number; // Relative complexity score
}

/**
 * Search options for Fuse.js integration
 */
export interface FuseSearchOptions {
  libraries?: string[]; // Specific libraries to search in
  fuzzy?: boolean; // Enable/disable fuzzy search (default: true)
  threshold?: number; // Search threshold 0.0-1.0 (default: 0.3)
  limit?: number; // Maximum results (default: 50)
  includeScore?: boolean; // Include relevance scores (default: true)
  includeMatches?: boolean; // Include match details for highlighting (default: true)
  keys?: string[]; // Specific fields to search in
  useExtendedSearch?: boolean; // Enable advanced query syntax (default: false)
  ignoreLocation?: boolean; // Ignore location-based scoring (default: false)
  minMatchCharLength?: number; // Minimum match length (default: 2)
  isCaseSensitive?: boolean; // Case sensitive search (default: false)
}

/**
 * Similar search options
 */
export interface SimilarSearchOptions {
  limit?: number; // Maximum similar icons to return (default: 10)
  threshold?: number; // Similarity threshold (default: 0.4)
  excludeOriginal?: boolean; // Exclude the original icon from results (default: true)
  sameLibraryOnly?: boolean; // Search only within the same library (default: false)
}

/**
 * Search filters for advanced search
 */
export interface SearchFilters {
  libraries?: string[]; // Filter by specific libraries
  styles?: string[]; // Filter by icon styles
  categories?: string[]; // Filter by categories
  sizes?: string[]; // Filter by icon sizes
  tags?: string[]; // Must include these tags
  excludeTags?: string[]; // Must not include these tags
  fuseOptions?: FuseSearchOptions; // Fuse.js search configuration
}

/**
 * Autocomplete options
 */
export interface AutocompleteOptions {
  maxSuggestions?: number; // Maximum suggestions (default: 10)
  includeLibraries?: boolean; // Include library names in suggestions (default: true)
  includeCategories?: boolean; // Include category names in suggestions (default: true)
  minQueryLength?: number; // Minimum query length for suggestions (default: 2)
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum cache size
  checkPeriod: number; // Cache cleanup check period
}

/**
 * Icon Provider interface
 */
export interface IconProvider {
  readonly name: string;
  readonly displayName: string;
  readonly version: string;

  /**
   * Initialize the provider
   */
  initialize(): Promise<void>;

  /**
   * Search for icons
   */
  searchIcons(query: string, options?: FuseSearchOptions): Promise<FuseResult<Icon>[]>;

  /**
   * Get a specific icon by ID
   */
  getIcon(id: string): Promise<Icon | null>;

  /**
   * Get all icons from this provider
   */
  getAllIcons(): Promise<Icon[]>;

  /**
   * Get provider information
   */
  getInfo(): Promise<IconLibrary>;

  /**
   * Check if provider is available
   */
  isAvailable(): Promise<boolean>;
}

/**
 * Error types for the icon search system
 */
export class IconSearchError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'IconSearchError';
  }
}

export class IconProviderError extends IconSearchError {
  constructor(
    message: string,
    public provider: string,
    statusCode: number = 500
  ) {
    super(message, 'PROVIDER_ERROR', statusCode);
    this.name = 'IconProviderError';
  }
}

export class ValidationError extends IconSearchError {
  constructor(
    message: string,
    public field: string
  ) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class CacheError extends IconSearchError {
  constructor(message: string) {
    super(message, 'CACHE_ERROR', 500);
    this.name = 'CacheError';
  }
}

/**
 * Result type pattern for error handling
 */
export type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };
