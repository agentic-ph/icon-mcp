/**
 * Mock services for testing
 */
import { vi } from 'vitest';
import { IconProvider, ProviderRegistry } from '../../src/providers/icon-provider.interface.js';
import { CacheService } from '../../src/services/cache.service.js';
import { Icon, IconLibrary, FuseResult, FuseSearchOptions } from '../../src/types/index.js';
import { mockIcons, mockLibraries, createMockIcon, createMockFuseResult } from './mock-data.js';

/**
 * Mock Icon Provider for testing
 */
export class MockIconProvider extends IconProvider {
  private icons: Icon[];
  private library: IconLibrary;

  constructor(name = 'test-provider', icons = mockIcons) {
    super(name, `Mock ${name}`, '1.0.0');
    this.icons = icons.map((icon) => ({ ...icon, library: name }));
    this.library = mockLibraries.find((lib) => lib.name === name) || { ...mockLibraries[0], name };
    this.initialized = true; // Initialize immediately for tests
  }

  async initialize(): Promise<void> {
    this.initialized = true;
  }

  async searchIcons(query: string, _options?: FuseSearchOptions): Promise<FuseResult<Icon>[]> {
    const lowerQuery = query.toLowerCase();
    const matchingIcons = this.icons.filter(
      (icon) =>
        icon.name.toLowerCase().includes(lowerQuery) ||
        icon.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );

    return matchingIcons.map((icon, index) =>
      createMockFuseResult(icon, {
        score: index * 0.1,
        refIndex: index,
      })
    );
  }

  async getIcon(id: string): Promise<Icon | null> {
    return this.icons.find((icon) => icon.name === id) || null;
  }

  async getAllIcons(): Promise<Icon[]> {
    return [...this.icons];
  }

  async getInfo(): Promise<IconLibrary> {
    return { ...this.library };
  }

  async searchByCategory(
    category: string,
    _options?: FuseSearchOptions
  ): Promise<FuseResult<Icon>[]> {
    const matchingIcons = this.icons.filter((icon) =>
      icon.categories?.some((cat) => cat.toLowerCase().includes(category.toLowerCase()))
    );

    return matchingIcons.map((icon, index) =>
      createMockFuseResult(icon, {
        score: 0,
        refIndex: index,
      })
    );
  }
}

/**
 * Mock Provider Registry for testing
 */
export class MockProviderRegistry extends ProviderRegistry {
  constructor(providers: IconProvider[] = []) {
    super();
    providers.forEach((provider) => {
      this.register(provider);
    });
  }
}

/**
 * Create a mock cache service
 */
export function createMockCacheService(): CacheService {
  const mockCache = new Map<string, any>();

  const cacheService = {
    get: vi.fn((key: string) => mockCache.get(key) || null),
    set: vi.fn((key: string, value: any, _ttl?: number) => {
      mockCache.set(key, value);
    }),
    has: vi.fn((key: string) => mockCache.has(key)),
    delete: vi.fn((key: string) => mockCache.delete(key)),
    clear: vi.fn(() => mockCache.clear()),
    getStats: vi.fn(() => ({
      size: mockCache.size,
      maxSize: 1000,
      hitRate: 0.8,
      totalAccesses: 100,
      expiredEntries: 0,
    })),
    getOrSet: vi.fn(async (key: string, factory: () => Promise<any>, _ttl?: number) => {
      const cached = mockCache.get(key);
      if (cached !== undefined) {
        return cached;
      }
      const value = await factory();
      mockCache.set(key, value);
      return value;
    }),
    destroy: vi.fn(),
    stopCleanupTimer: vi.fn(),
  };

  return cacheService as any;
}

/**
 * Create mock MCP server for tool testing
 */
export function createMockMcpServer() {
  return {
    registerTool: vi.fn(),
    tool: vi.fn(),
    resource: vi.fn(),
    prompt: vi.fn(),
  };
}

/**
 * Setup default test providers
 */
export function setupTestProviders(): MockProviderRegistry {
  const providers = [
    new MockIconProvider('octicons', [
      createMockIcon({ name: 'home', library: 'octicons', tags: ['house', 'building'] }),
      createMockIcon({ name: 'search', library: 'octicons', tags: ['find', 'magnify'] }),
      createMockIcon({ name: 'user', library: 'octicons', tags: ['person', 'profile'] }),
    ]),
    new MockIconProvider('feather', [
      createMockIcon({ name: 'home', library: 'feather', tags: ['house', 'building'] }),
      createMockIcon({ name: 'search', library: 'feather', tags: ['find', 'magnify'] }),
      createMockIcon({ name: 'settings', library: 'feather', tags: ['gear', 'config'] }),
    ]),
    new MockIconProvider('bootstrap-icons', [
      createMockIcon({ name: 'house', library: 'bootstrap-icons', tags: ['home', 'building'] }),
      createMockIcon({ name: 'search', library: 'bootstrap-icons', tags: ['find', 'magnify'] }),
      createMockIcon({ name: 'gear', library: 'bootstrap-icons', tags: ['settings', 'config'] }),
    ]),
  ];

  return new MockProviderRegistry(providers);
}
