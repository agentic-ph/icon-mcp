import { BaseNpmProvider } from './base-npm-provider.js';

/**
 * Tabler Icons Provider
 *
 * Provides access to Tabler Icons - free and open source icons
 * through NPM package integration.
 */
export class TablerIconsProvider extends BaseNpmProvider {
  constructor() {
    super('tabler-icons', 'Tabler Icons', '2.47.0', '@tabler/icons', ['icons/*.svg'], ['regular']);
  }

  protected getDescription(): string {
    return 'Free and open source icons designed to make your website or app attractive, visually consistent and simply beautiful.';
  }

  protected getSourceUrl(): string {
    return 'https://github.com/tabler/tabler-icons';
  }

  protected getLicense(): string {
    return 'MIT';
  }

  /**
   * Override tag generation for Tabler Icons specific patterns
   */
  protected generateTags(iconName: string): string[] {
    const tags = new Set(super.generateTags(iconName));

    // Add Tabler specific tags
    tags.add('tabler');
    tags.add('outline');
    tags.add('stroke');

    return Array.from(tags);
  }
}
