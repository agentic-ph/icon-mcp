# Testing Patterns for MCP Server

## Test Structure

```typescript
// Test file naming: [module].test.ts
describe("IconSearchTools", () => {
  describe("search_icons", () => {
    it("should return matching icons", async () => {
      // Test implementation
    });

    it("should handle API errors gracefully", async () => {
      // Test implementation
    });
  });
});
```

## Mocking Strategy

```typescript
// Mock icon provider client
const mockIconProvider = {
  searchIcons: jest.fn(),
  getIcon: jest.fn(),
  getLibraryInfo: jest.fn(),
  // ... other methods
};

// Mock MCP server
const mockServer = {
  tool: jest.fn(),
  resource: jest.fn(),
  prompt: jest.fn(),
};
```

## Test Data Factory

```typescript
// Test data factories for consistent test data
const createMockIcon = (overrides = {}) => ({
  id: "home",
  name: "Home",
  library: "font-awesome",
  svg: "<svg>...</svg>",
  tags: ["house", "building"],
  ...overrides,
});

const createMockLibrary = (overrides = {}) => ({
  name: "font-awesome",
  displayName: "Font Awesome",
  version: "6.0.0",
  iconCount: 2000,
  ...overrides,
});
```

## Integration Test Patterns

```typescript
describe("API Integration", () => {
  it("should fetch real data from icon provider API", async () => {
    const provider = new FontAwesomeProvider();
    const icons = await provider.searchIcons("home");

    expect(icons).toBeInstanceOf(Array);
    expect(icons.length).toBeGreaterThan(0);
    expect(icons[0]).toHaveProperty("id");
    expect(icons[0]).toHaveProperty("name");
    expect(icons[0]).toHaveProperty("svg");
  });
});
```

## Performance Testing

```typescript
describe("Performance Tests", () => {
  it("should respond within 100ms for cached data", async () => {
    const start = Date.now();
    const result = await tool.searchIcons({ query: "home" });
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(100);
  });

  it("should handle 100 concurrent requests", async () => {
    const promises = Array(100)
      .fill(null)
      .map(() => tool.searchIcons({ query: "home" }));

    const results = await Promise.all(promises);
    expect(results).toHaveLength(100);
    results.forEach((result) => {
      expect(result).toBeDefined();
    });
  });
});
```

## Error Scenario Testing

```typescript
describe("Error Handling", () => {
  it("should handle network timeout", async () => {
    mockIconProvider.searchIcons.mockRejectedValue(
      new Error("Network timeout")
    );

    const result = await tool.searchIcons({ query: "home" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Network timeout");
  });

  it("should handle invalid icon IDs", async () => {
    const result = await tool.getIcon({ id: "invalid-icon", library: "font-awesome" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Icon not found");
  });
});
```

## Test Coverage Requirements

- **Unit Tests**: 90%+ coverage for all modules
- **Integration Tests**: Cover all icon provider APIs
- **Error Scenarios**: Test all error paths
- **Performance Tests**: Critical path performance validation
- **Edge Cases**: Empty results, malformed data, boundary values

## Continuous Testing

```json
// package.json scripts
{
  "test": "vitest",
  "test:watch": "vitest --watch",
  "test:coverage": "vitest --coverage",
  "test:integration": "vitest --config vitest.integration.config.js",
  "test:performance": "vitest --config vitest.performance.config.js"
}
