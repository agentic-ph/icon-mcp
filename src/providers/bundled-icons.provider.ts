import fs from 'fs/promises';
import path from 'path';
import Fuse from 'fuse.js';
import { Icon, IconLibrary, FuseResult, FuseSearchOptions } from '../types/index.js';
import { IconProvider } from './icon-provider.interface.js';

/**
 * Provider that reads icons from a pre-built icons.json file
 * This approach bundles all icons with the package instead of using submodules
 */
export class BundledIconsProvider extends IconProvider {
  private icons: Icon[] = [];
  private fuseInstance?: Fuse<Icon>;
  private iconsData: Record<string, unknown> | null = null;

  constructor() {
    super('bundled-icons', 'Bundled Icons', '1.0.0');
  }

  /**
   * Initialize the provider by loading icons from the bundled JSON file
   */
  async initialize(): Promise<void> {
    try {
      console.log('Initializing bundled icons provider...');

      // Load from dist directory (built by postinstall script)
      const iconsPath = path.join(process.cwd(), 'dist', 'icons.json');

      const iconsData = JSON.parse(await fs.readFile(iconsPath, 'utf-8'));
      this.icons = iconsData.icons || [];

      // Create Fuse.js instance for fuzzy search
      this.createFuseInstance();

      this.initialized = true;
      console.log(`✅ Bundled icons provider initialized with ${this.icons.length} icons`);
    } catch (error) {
      console.error('Failed to initialize bundled icons provider:', error);
      // Initialize with empty array as fallback
      this.icons = [];
      this.initialized = true;
    }
  }

  /**
   * Search for icons using Fuse.js fuzzy search
   */
  async searchIcons(query: string, options: FuseSearchOptions = {}): Promise<FuseResult<Icon>[]> {
    this.ensureInitialized();

    if (!this.fuseInstance) {
      this.createFuseInstance();
    }

    const { threshold = 0.3, limit = 50, includeScore = true, includeMatches = true } = options;

    const fuseOptions = {
      threshold,
      includeScore,
      includeMatches,
      limit,
    };

    const results = this.fuseInstance?.search(query, fuseOptions) || [];
    return results.slice(0, limit) as FuseResult<Icon>[];
  }

  /**
   * Get a specific icon by ID
   */
  async getIcon(id: string): Promise<Icon | null> {
    this.ensureInitialized();
    return this.icons.find((icon) => icon.name === id) || null;
  }

  /**
   * Get all icons from this provider
   */
  async getAllIcons(): Promise<Icon[]> {
    this.ensureInitialized();
    return [...this.icons];
  }

  /**
   * Get provider information
   */
  async getInfo(): Promise<IconLibrary> {
    return {
      name: this.name,
      displayName: this.displayName,
      description: 'Pre-built collection of icons from multiple libraries',
      version: this.version,
      iconCount: this.icons.length,
      submodulePath: 'bundled',
      sourceUrl: 'https://github.com/decano/icon-mcp',
      license: 'Various (see individual libraries)',
      styles: [...new Set(this.icons.map((icon) => icon.style).filter(Boolean))] as string[],
      categories: [...new Set(this.icons.flatMap((icon) => icon.categories || []))],
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Create Fuse.js instance for fuzzy search
   */
  private createFuseInstance(): void {
    const fuseOptions = {
      keys: [
        { name: 'name', weight: 1.0 },
        { name: 'tags', weight: 0.7 },
        { name: 'categories', weight: 0.5 },
      ],
      threshold: 0.3,
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 2,
      shouldSort: true,
      location: 0,
      distance: 100,
    };

    this.fuseInstance = new Fuse(this.icons, fuseOptions);
  }

  /**
   * Get all available libraries
   */
  async getLibraries(): Promise<string[]> {
    this.ensureInitialized();
    return [...new Set(this.icons.map((icon) => icon.library))];
  }

  /**
   * Get icons by library
   */
  async getIconsByLibrary(library: string): Promise<Icon[]> {
    this.ensureInitialized();
    return this.icons.filter((icon) => icon.library === library);
  }
}
