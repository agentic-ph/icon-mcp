/**
 * Provider Registry and Exports
 *
 * Central registry for all icon providers with automatic initialization
 * and management capabilities.
 */

import { BootstrapIconsProvider } from './bootstrap-icons.provider.js';
import { FeatherProvider } from './feather.provider.js';
import { ProviderRegistry } from './icon-provider.interface.js';
import { OcticonsProvider } from './octicons.provider.js';
import { TablerIconsProvider } from './tabler-icons.provider.js';

// Export all providers
export { BootstrapIconsProvider } from './bootstrap-icons.provider.js';
export { FeatherProvider } from './feather.provider.js';
export { OcticonsProvider } from './octicons.provider.js';
export { TablerIconsProvider } from './tabler-icons.provider.js';
export { BaseNpmProvider } from './base-npm-provider.js';
export { IconProvider, ProviderRegistry } from './icon-provider.interface.js';

/**
 * Create and configure the default provider registry
 */
export function createDefaultProviderRegistry(): ProviderRegistry {
  const registry = new ProviderRegistry();

  // Register all available npm-based providers
  registry.register(new BootstrapIconsProvider());
  registry.register(new FeatherProvider());
  registry.register(new OcticonsProvider());
  registry.register(new TablerIconsProvider());

  return registry;
}

/**
 * Initialize all providers in the registry
 */
export async function initializeAllProviders(registry: ProviderRegistry): Promise<void> {
  console.log('🚀 Initializing icon providers...');

  const providers = registry.getAll();
  const initPromises = providers.map(async (provider) => {
    try {
      await provider.initialize();
      console.log(`✅ ${provider.displayName} initialized successfully`);
    } catch (error) {
      console.warn(
        `⚠️  Failed to initialize ${provider.displayName}:`,
        error instanceof Error ? error.message : error
      );
    }
  });

  await Promise.all(initPromises);

  const availableProviders = await registry.getAvailableProviders();
  console.log(
    `🎉 Initialized ${availableProviders.length}/${providers.length} providers successfully`
  );
}

/**
 * Get provider statistics
 */
export async function getProviderStatistics(registry: ProviderRegistry): Promise<{
  totalProviders: number;
  availableProviders: number;
  totalIcons: number;
  providerBreakdown: Array<{
    name: string;
    displayName: string;
    iconCount: number;
    available: boolean;
  }>;
}> {
  const providers = registry.getAll();
  const availableProviders = await registry.getAvailableProviders();

  let totalIcons = 0;
  const providerBreakdown = await Promise.all(
    providers.map(async (provider) => {
      const available = await provider.isAvailable();
      const iconCount = available ? await provider.getIconCount() : 0;

      if (available) {
        totalIcons += iconCount;
      }

      return {
        name: provider.name,
        displayName: provider.displayName,
        iconCount,
        available,
      };
    })
  );

  return {
    totalProviders: providers.length,
    availableProviders: availableProviders.length,
    totalIcons,
    providerBreakdown,
  };
}
