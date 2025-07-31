# General Rules for Icon MCP Server Development

## Project Overview

This project implements a Model Context Protocol (MCP) server for searching and accessing icons from multiple icon libraries, providing a unified interface for icon discovery and retrieval.

## Core Principles

1. **Type Safety First**: Always use TypeScript with strict mode enabled
2. **API Reliability**: Implement proper error handling, caching, and retry logic
3. **Performance Focus**: Use response caching, connection pooling, and efficient search algorithms
4. **Security**: Validate all inputs, sanitize outputs, use HTTPS only
5. **Documentation**: Maintain comprehensive JSDoc comments for all public APIs

## Development Standards

- Use TypeScript for all new code
- Follow the established project structure in `project.md`
- Write unit tests for all functions and tools
- Use descriptive variable and function names
- Add error handling for all external API calls and icon provider integrations
- Implement proper logging for debugging

## Code Organization

- Keep the modular structure defined in the implementation plan
- Separate concerns: types, services, tools, resources, prompts
- Use consistent naming conventions across all files
- Maintain clear separation between icon providers and MCP implementation

## Testing Requirements

- Unit tests for all tools and services
- Integration tests with actual icon provider APIs
- Test error scenarios and edge cases
- Performance testing for search operations
- Validate all input parameters and responses

## Documentation Standards

- JSDoc comments for all public methods
- README files for each major component
- Usage examples for all tools
- Icon provider integration documentation
- Deployment and setup instructions
