#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { registerIconSearchPrompts } from './prompts/index.js';
import { createDefaultProviderRegistry, initializeAllProviders } from './providers/index.js';
import { registerIconSearchResources } from './resources/index.js';
import { CacheService } from './services/cache.service.js';
import { SearchService } from './services/search.service.js';
import { registerIconSearchTools } from './tools/index.js';

/**
 * Icon MCP Server
 *
 * A Model Context Protocol server that provides unified search capabilities
 * across multiple icon libraries with fuzzy search and intelligent caching.
 */
class IconSearchMCPServer {
  private server: McpServer;
  private cacheService: CacheService;
  private searchService: SearchService;

  constructor() {
    this.server = new McpServer({
      name: 'icon-mcp',
      version: '1.0.0',
    });

    // Initialize services
    this.cacheService = new CacheService();
    const providerRegistry = createDefaultProviderRegistry();
    this.searchService = new SearchService(this.cacheService, providerRegistry);

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupToolHandlers(): void {
    // Register all icon search tools, resources, and prompts using the new McpServer API
    registerIconSearchTools(this.server, this.searchService);
    registerIconSearchResources(this.server, this.searchService);
    registerIconSearchPrompts(this.server, this.searchService);
  }

  private setupErrorHandling(): void {
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('[Uncaught Exception]', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('[Unhandled Rejection]', reason, 'at:', promise);
      process.exit(1);
    });
  }

  async start(): Promise<void> {
    try {
      // Initialize all providers
      const providerRegistry = this.searchService.getProviderRegistry();
      await initializeAllProviders(providerRegistry);

      // Start the server
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.error('Icon MCP Server running on stdio');
    } catch (error) {
      console.error('Failed to start server:', error);
      throw error;
    }
  }
}

// Start the server
async function main(): Promise<void> {
  const server = new IconSearchMCPServer();
  await server.start();
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
