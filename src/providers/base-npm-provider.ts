import fs from 'fs/promises';
import path from 'path';
import Fuse from 'fuse.js';
import {
  Icon,
  IconLibrary,
  FuseResult,
  FuseSearchOptions,
  IconProviderError,
} from '../types/index.js';
import { IconProvider } from './icon-provider.interface.js';

/**
 * Base class for icon providers that use NPM packages
 *
 * This class provides common functionality for processing SVG files
 * from NPM packages and implementing the IconProvider interface.
 */
export abstract class BaseNpmProvider extends IconProvider {
  protected icons: Icon[] = [];
  protected fuseInstance?: Fuse<Icon>;
  protected readonly packageName: string;
  protected readonly iconPaths: string[];
  protected readonly styles: string[];

  constructor(
    name: string,
    displayName: string,
    version: string,
    packageName: string,
    iconPaths: string[],
    styles: string[] = ['regular']
  ) {
    super(name, displayName, version);
    this.packageName = packageName;
    this.iconPaths = iconPaths;
    this.styles = styles;
  }

  /**
   * Initialize the provider by loading icons from npm package
   */
  async initialize(): Promise<void> {
    try {
      console.log(`Initializing ${this.displayName} provider...`);

      // Get package path from node_modules
      const packagePath = this.getPackagePath();

      // Check if package directory exists
      if (!(await this.directoryExists(packagePath))) {
        throw new IconProviderError(
          `NPM package not found: ${this.packageName}. Please run 'npm install' to install dependencies.`,
          this.name,
          404
        );
      }

      // Load icons from npm package
      this.icons = await this.loadIconsFromPackage(packagePath);

      // Create Fuse.js instance for fuzzy search
      this.createFuseInstance();

      this.initialized = true;
      console.log(`✅ ${this.displayName} provider initialized with ${this.icons.length} icons`);
    } catch (error) {
      throw new IconProviderError(
        `Failed to initialize ${this.displayName} provider: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.name,
        500
      );
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
    const icon = this.icons.find((icon) => icon.name === id);

    if (!icon) {
      return null;
    }

    // If SVG content is not already loaded, read it from the file
    if (!icon.svg) {
      try {
        const svgContent = await fs.readFile(icon.path, 'utf-8');
        icon.svg = svgContent;
      } catch (error) {
        console.warn(`Warning: Could not read SVG content for ${icon.name}:`, error);
        // Return icon without SVG content rather than failing completely
      }
    }

    return icon;
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
      description: this.getDescription(),
      version: this.version,
      iconCount: this.icons.length,
      submodulePath: `node_modules/${this.packageName}`,
      sourceUrl: this.getSourceUrl(),
      license: this.getLicense(),
      styles: this.styles,
      categories: await this.getCategories(),
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Get the path to the npm package
   */
  protected getPackagePath(): string {
    return path.join(process.cwd(), 'node_modules', this.packageName);
  }

  /**
   * Load icons from the NPM package
   */
  protected async loadIconsFromPackage(packagePath: string): Promise<Icon[]> {
    const icons: Icon[] = [];

    for (const iconPath of this.iconPaths) {
      const fullPath = path.join(packagePath, iconPath);
      const svgFiles = await this.findSVGFiles(fullPath);

      for (const svgFile of svgFiles) {
        try {
          const icon = await this.processIconFile(svgFile, packagePath);
          if (icon) {
            icons.push(icon);
          }
        } catch (error) {
          console.warn(
            `Warning: Could not process ${svgFile}:`,
            error instanceof Error ? error.message : error
          );
        }
      }
    }

    return icons;
  }

  /**
   * Process a single SVG icon file
   */
  protected async processIconFile(filePath: string, _packagePath: string): Promise<Icon | null> {
    const fileName = path.basename(filePath, '.svg');
    const relativePath = path.relative(process.cwd(), filePath);

    // Extract style from path
    const style = this.extractStyleFromPath(filePath);

    // Generate tags from filename
    const tags = this.generateTags(fileName);

    // Generate categories
    const categories = this.generateCategories(fileName, filePath);

    // Read SVG content to get size information and store the content
    const svgContent = await fs.readFile(filePath, 'utf-8');
    const size = this.extractSizeFromSVG(svgContent);

    return this.normalizeIcon({
      name: fileName,
      library: this.name,
      tags,
      style,
      path: relativePath,
      svg: svgContent,
      categories,
      size,
      source: this.getSourceUrl(),
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Find all SVG files matching a pattern
   */
  protected async findSVGFiles(pattern: string): Promise<string[]> {
    const files: string[] = [];

    if (pattern.includes('*')) {
      const basePath = pattern.split('*')[0];
      const isRecursive = pattern.includes('**');

      if (await this.directoryExists(basePath)) {
        const foundFiles = await this.scanDirectory(basePath, isRecursive);
        files.push(...foundFiles.filter((file) => file.endsWith('.svg')));
      }
    } else if ((await this.fileExists(pattern)) && pattern.endsWith('.svg')) {
      files.push(pattern);
    }

    return files;
  }

  /**
   * Recursively scan directory for files
   */
  protected async scanDirectory(dirPath: string, recursive = false): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory() && recursive) {
          const subFiles = await this.scanDirectory(fullPath, recursive);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          files.push(fullPath);
        }
      }
    } catch {
      // Directory doesn't exist or can't be read
    }

    return files;
  }

  /**
   * Create Fuse.js instance for fuzzy search
   */
  protected createFuseInstance(): void {
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
   * Extract style from file path
   */
  protected extractStyleFromPath(filePath: string): string {
    const pathLower = filePath.toLowerCase();

    for (const style of this.styles) {
      if (pathLower.includes(style)) {
        return style;
      }
    }

    return this.styles[0] || 'regular';
  }

  /**
   * Generate searchable tags from icon name
   */
  protected generateTags(iconName: string): string[] {
    const tags = new Set<string>();

    // Add the original name
    tags.add(iconName);

    // Split on common separators and add parts
    const parts = iconName.split(/[-_\s]+/);
    parts.forEach((part) => {
      if (part.length > 1) {
        tags.add(part);
      }
    });

    // Add common synonyms
    const synonyms: Record<string, string[]> = {
      home: ['house', 'building'],
      user: ['person', 'profile', 'account'],
      search: ['find', 'magnify', 'lookup'],
      settings: ['config', 'preferences', 'options'],
      delete: ['remove', 'trash', 'bin'],
      edit: ['modify', 'change', 'update'],
      add: ['plus', 'create', 'new'],
      arrow: ['direction', 'pointer'],
    };

    for (const [key, values] of Object.entries(synonyms)) {
      if (iconName.includes(key)) {
        values.forEach((synonym) => tags.add(synonym));
      }
    }

    return Array.from(tags);
  }

  /**
   * Generate categories from icon name and path
   */
  protected generateCategories(iconName: string, filePath: string): string[] {
    const categories = new Set<string>();

    // Category mapping based on common patterns
    const categoryMap: Record<string, string[]> = {
      navigation: ['arrow', 'chevron', 'menu', 'home', 'back', 'forward'],
      communication: ['mail', 'message', 'chat', 'phone', 'call'],
      media: ['play', 'pause', 'stop', 'volume', 'music', 'video'],
      file: ['document', 'folder', 'file', 'download', 'upload'],
      ui: ['button', 'input', 'form', 'modal', 'tooltip'],
      social: ['share', 'like', 'follow', 'twitter', 'facebook'],
      commerce: ['cart', 'shop', 'buy', 'sell', 'money', 'payment'],
      weather: ['sun', 'cloud', 'rain', 'snow', 'storm'],
    };

    const searchText = `${iconName} ${filePath}`.toLowerCase();

    for (const [category, keywords] of Object.entries(categoryMap)) {
      if (keywords.some((keyword) => searchText.includes(keyword))) {
        categories.add(category);
      }
    }

    return categories.size > 0 ? Array.from(categories) : ['general'];
  }

  /**
   * Extract size information from SVG content
   */
  protected extractSizeFromSVG(svgContent: string): string {
    // Try to extract viewBox
    const viewBoxMatch = svgContent.match(/viewBox=["']([^"']+)["']/);
    if (viewBoxMatch) {
      const [, , width, height] = viewBoxMatch[1].split(/\s+/);
      return `${width}x${height}`;
    }

    // Try to extract width/height attributes
    const widthMatch = svgContent.match(/width=["']([^"']+)["']/);
    const heightMatch = svgContent.match(/height=["']([^"']+)["']/);

    if (widthMatch && heightMatch) {
      return `${widthMatch[1]}x${heightMatch[1]}`;
    }

    return '24x24'; // Default size
  }

  /**
   * Utility functions
   */
  protected async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(dirPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  protected async fileExists(filePath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(filePath);
      return stats.isFile();
    } catch {
      return false;
    }
  }

  /**
   * Abstract methods to be implemented by specific providers
   */
  protected abstract getDescription(): string;
  protected abstract getSourceUrl(): string;
  protected abstract getLicense(): string;
}
