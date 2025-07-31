/**
 * Mock data fixtures for testing
 */
import { Icon, IconLibrary, FuseResult } from '../../src/types/index.js';

export const createMockIcon = (overrides: Partial<Icon> = {}): Icon => ({
  name: 'home',
  library: 'test-library',
  tags: ['house', 'building', 'home'],
  style: 'solid',
  path: 'icons/home.svg',
  svg: '<svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>',
  categories: ['navigation', 'ui'],
  size: '24x24',
  source: 'https://github.com/test/test-icons',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

export const createMockLibrary = (overrides: Partial<IconLibrary> = {}): IconLibrary => ({
  name: 'test-library',
  displayName: 'Test Library',
  description: 'A test icon library for unit testing',
  version: '1.0.0',
  iconCount: 100,
  submodulePath: 'icon-libraries/test-library',
  sourceUrl: 'https://github.com/test/test-icons',
  license: 'MIT',
  styles: ['solid', 'outline'],
  categories: ['navigation', 'ui', 'social'],
  lastUpdated: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

export const createMockFuseResult = <T>(
  item: T,
  overrides: Partial<FuseResult<T>> = {}
): FuseResult<T> => ({
  item,
  score: 0.1,
  refIndex: 0,
  matches: [
    {
      indices: [[0, 3]],
      value: 'home',
      key: 'name',
    },
  ],
  ...overrides,
});

export const mockIcons: Icon[] = [
  createMockIcon({
    name: 'home',
    tags: ['house', 'building', 'home'],
    categories: ['navigation'],
  }),
  createMockIcon({
    name: 'search',
    tags: ['find', 'magnify', 'look'],
    categories: ['ui'],
  }),
  createMockIcon({
    name: 'user',
    tags: ['person', 'profile', 'account'],
    categories: ['user'],
  }),
  createMockIcon({
    name: 'settings',
    tags: ['gear', 'config', 'preferences'],
    categories: ['ui'],
  }),
  createMockIcon({
    name: 'arrow-right',
    tags: ['arrow', 'direction', 'next'],
    categories: ['navigation'],
  }),
];

export const mockLibraries: IconLibrary[] = [
  createMockLibrary({
    name: 'octicons',
    displayName: 'Octicons',
    description: "GitHub's icon library",
    iconCount: 200,
  }),
  createMockLibrary({
    name: 'feather',
    displayName: 'Feather Icons',
    description: 'Simply beautiful open source icons',
    iconCount: 287,
  }),
  createMockLibrary({
    name: 'bootstrap-icons',
    displayName: 'Bootstrap Icons',
    description: 'Official open source SVG icon library for Bootstrap',
    iconCount: 1800,
  }),
];

export const mockSearchResults = mockIcons.map((icon, index) =>
  createMockFuseResult(icon, {
    score: index * 0.1,
    refIndex: index,
  })
);
