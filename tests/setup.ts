/**
 * Test setup file for Icon MCP Server
 *
 * This file is run before all tests to set up the testing environment.
 */

import { vi } from 'vitest';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Keep error and warn for debugging
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
};

// Set up global test timeout
vi.setConfig({
  testTimeout: 10000, // 10 seconds
});

// Mock environment variables for testing
process.env.NODE_ENV = 'test';

// Global test utilities
export const createMockIcon = (overrides = {}) => ({
  name: 'test-icon',
  library: 'test-library',
  tags: ['test', 'icon'],
  path: 'test/path/icon.svg',
  style: 'solid',
  categories: ['test'],
  size: '24x24',
  source: 'https://github.com/test/test-icons',
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createMockLibrary = (overrides = {}) => ({
  name: 'test-library',
  displayName: 'Test Library',
  description: 'A test icon library',
  version: '1.0.0',
  iconCount: 100,
  submodulePath: 'icon-libraries/test-library',
  sourceUrl: 'https://github.com/test/test-icons',
  license: 'MIT',
  styles: ['solid', 'outline'],
  categories: ['test', 'ui'],
  lastUpdated: new Date().toISOString(),
  ...overrides,
});
