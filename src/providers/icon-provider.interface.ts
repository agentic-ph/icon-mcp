import { Icon, IconLibrary, FuseResult, FuseSearchOptions } from '../types/index.js';

/**
 * Abstract base class for icon providers
 *
 * Defines the standard interface that all icon providers must implement
 * to ensure consistent behavior across different icon libraries.
 */
export abstract class IconProvider {
  protected initialized = false;

  constructor(
    public readonly name: string,
    public readonly displayName: string,
    public readonly version: string
  ) {}

  /**
   * Initialize the provider (load icons, setup connections, etc.)
   */
  abstract initialize(): Promise<void>;

  /**
   * Search for icons using fuzzy search
   */
  abstract searchIcons(query: string, options?: FuseSearchOptions): Promise<FuseResult<Icon>[]>;

  /**
   * Get a specific icon by ID
   */
  abstract getIcon(id: string): Promise<Icon | null>;

  /**
   * Get all icons from this provider
   */
  abstract getAllIcons(): Promise<Icon[]>;

  /**
   * Get provider information
   */
  abstract getInfo(): Promise<IconLibrary>;

  /**
   * Check if provider is available and properly initialized
   */
  async isAvailable(): Promise<boolean> {
    return this.initialized;
  }

  /**
   * Get the total number of icons in this provider
   */
  async getIconCount(): Promise<number> {
    const icons = await this.getAllIcons();
    return icons.length;
  }

  /**
   * Get all available categories from this provider
   */
  async getCategories(): Promise<string[]> {
    const icons = await this.getAllIcons();
    const categories = new Set<string>();

    for (const icon of icons) {
      if (icon.categories) {
        for (const category of icon.categories) {
          categories.add(category);
        }
      }
    }

    return Array.from(categories).sort();
  }

  /**
   * Get all available styles from this provider
   */
  async getStyles(): Promise<string[]> {
    const icons = await this.getAllIcons();
    const styles = new Set<string>();

    for (const icon of icons) {
      if (icon.style) {
        styles.add(icon.style);
      }
    }

    return Array.from(styles).sort();
  }

  /**
   * Get all available tags from this provider
   */
  async getTags(): Promise<string[]> {
    const icons = await this.getAllIcons();
    const tags = new Set<string>();

    for (const icon of icons) {
      for (const tag of icon.tags) {
        tags.add(tag);
      }
    }

    return Array.from(tags).sort();
  }

  /**
   * Search icons by category
   */
  async searchByCategory(
    category: string,
    _options?: FuseSearchOptions
  ): Promise<FuseResult<Icon>[]> {
    const icons = await this.getAllIcons();
    const categoryIcons = icons.filter((icon) =>
      icon.categories?.some((cat) => cat.toLowerCase().includes(category.toLowerCase()))
    );

    // Convert to FuseResult format for consistency
    return categoryIcons.map((icon, index) => ({
      item: icon,
      score: 0, // Perfect match for category filter
      refIndex: index,
    }));
  }

  /**
   * Search icons by style
   */
  async searchByStyle(style: string, _options?: FuseSearchOptions): Promise<FuseResult<Icon>[]> {
    const icons = await this.getAllIcons();
    const styleIcons = icons.filter((icon) => icon.style?.toLowerCase() === style.toLowerCase());

    // Convert to FuseResult format for consistency
    return styleIcons.map((icon, index) => ({
      item: icon,
      score: 0, // Perfect match for style filter
      refIndex: index,
    }));
  }

  /**
   * Search icons by tags
   */
  async searchByTags(tags: string[], _options?: FuseSearchOptions): Promise<FuseResult<Icon>[]> {
    const icons = await this.getAllIcons();
    const taggedIcons = icons.filter((icon) =>
      tags.some((tag) =>
        icon.tags.some((iconTag) => iconTag.toLowerCase().includes(tag.toLowerCase()))
      )
    );

    // Convert to FuseResult format for consistency
    return taggedIcons.map((icon, index) => ({
      item: icon,
      score: 0, // Perfect match for tag filter
      refIndex: index,
    }));
  }

  /**
   * Validate that the provider is properly initialized
   */
  protected ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error(`Provider ${this.name} is not initialized. Call initialize() first.`);
    }
  }

  /**
   * Normalize icon data to ensure consistency
   */
  protected normalizeIcon(icon: Partial<Icon>): Icon {
    if (!icon.name || !icon.library || !icon.tags || !icon.path || !icon.svg) {
      throw new Error('Icon must have name, library, tags, path, and svg properties');
    }

    return {
      name: icon.name,
      library: icon.library,
      tags: icon.tags,
      path: icon.path,
      svg: icon.svg,
      style: icon.style,
      categories: icon.categories || [],
      size: icon.size,
      source: icon.source,
      updatedAt: icon.updatedAt || new Date().toISOString(),
    };
  }

  /**
   * Generate a unique icon ID based on library and name
   */
  protected generateIconId(name: string): string {
    return `${this.name}:${name}`;
  }

  /**
   * Clean up resources when the provider is destroyed
   */
  async destroy(): Promise<void> {
    this.initialized = false;
  }
}

/**
 * Provider registry for managing multiple icon providers
 */
export class ProviderRegistry {
  private providers = new Map<string, IconProvider>();

  /**
   * Register a new icon provider
   */
  register(provider: IconProvider): void {
    this.providers.set(provider.name, provider);
  }

  /**
   * Unregister an icon provider
   */
  unregister(name: string): boolean {
    return this.providers.delete(name);
  }

  /**
   * Get a specific provider by name
   */
  get(name: string): IconProvider | undefined {
    return this.providers.get(name);
  }

  /**
   * Get all registered providers
   */
  getAll(): IconProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get all provider names
   */
  getNames(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Initialize all registered providers
   */
  async initializeAll(): Promise<void> {
    const initPromises = Array.from(this.providers.values()).map((provider) =>
      provider.initialize().catch((error) => {
        console.error(`Failed to initialize provider ${provider.name}:`, error);
      })
    );

    await Promise.all(initPromises);
  }

  /**
   * Get all available providers (initialized and available)
   */
  async getAvailableProviders(): Promise<IconProvider[]> {
    const providers = Array.from(this.providers.values());
    const availabilityChecks = await Promise.all(
      providers.map(async (provider) => ({
        provider,
        available: await provider.isAvailable(),
      }))
    );

    return availabilityChecks.filter(({ available }) => available).map(({ provider }) => provider);
  }

  /**
   * Clear all providers
   */
  clear(): void {
    this.providers.clear();
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    totalProviders: number;
    providerNames: string[];
  } {
    return {
      totalProviders: this.providers.size,
      providerNames: Array.from(this.providers.keys()),
    };
  }
}
