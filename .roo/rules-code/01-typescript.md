# TypeScript-Specific Rules for Icon MCP Server

## TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true
  }
}
```

## Interface Design

- **Prefix Interfaces**: Use descriptive names without I-prefix (e.g., `Icon`, not `IIcon`)
- **Optional Properties**: Use optional properties (`?`) judiciously, prefer required properties
- **Readonly Properties**: Mark immutable properties as `readonly`
- **Discriminated Unions**: Use for variant types (e.g., different icon provider types)

## Type Safety Rules

1. **No Any**: Never use `any` type, use `unknown` or proper typing instead
2. **Strict Null Checks**: Always handle null/undefined cases explicitly
3. **Type Guards**: Implement proper type guards for runtime validation
4. **Generic Constraints**: Use meaningful generic constraints
5. **Return Types**: Always specify return types for functions

## Zod Schema Standards

- **Schema Naming**: Use PascalCase with 'Schema' suffix (e.g., `IconSchema`)
- **Validation Messages**: Provide clear, user-friendly validation messages
- **Custom Refinements**: Add custom refinements for business rules
- **Type Inference**: Leverage Zod's type inference for TypeScript types

## Error Handling Patterns

```typescript
// Custom error types
class IconProviderError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'IconProviderError';
  }
}

// Result type pattern
type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };
```

## Async/Await Patterns

- **Always use async/await**: Avoid raw Promises or callbacks
- **Error Boundaries**: Wrap async operations in try-catch blocks
- **Cancellation**: Support cancellation tokens where appropriate
- **Parallel Operations**: Use Promise.all for independent async operations

## Module Organization

- **Barrel Exports**: Use index.ts files for clean imports
- **Single Responsibility**: Each module should have one clear purpose
- **Dependency Direction**: Dependencies should point inward (clean architecture)
- **Testability**: Design modules for easy testing
