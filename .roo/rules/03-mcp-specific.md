# MCP Server Implementation Rules

## Tool Development Guidelines

1. **Tool Structure**: Each tool should follow the MCP tool specification
2. **Parameter Validation**: Use Zod schemas for all input validation
3. **Error Responses**: Return user-friendly error messages
4. **Documentation**: Include clear descriptions and examples for each tool
5. **Performance**: Implement caching for frequently accessed data

## Required Tools Implementation Order

Follow the phases outlined in project.md:

### Phase 1: Core Infrastructure

1. **Basic MCP Server**: Set up the foundational MCP server structure
2. **Cache Service**: Implement caching for icon data and search results
3. **Icon Provider Interface**: Define the standard interface for icon providers

### Phase 2: Icon Providers

1. **Font Awesome Provider**: Implement Font Awesome icon integration
2. **Material Icons Provider**: Implement Material Design Icons integration
3. **Provider Registry**: Create a system to manage multiple providers

### Phase 3: Search and Discovery Tools

1. **Core Search Tools**:
   - `search_icons` - Search for icons by name across libraries
   - `get_icon` - Get detailed information about a specific icon
   - `list_libraries` - List all available icon libraries

2. **Discovery Tools**:
   - `get_library_info` - Get detailed information about a library
   - `search_by_category` - Find icons by category or tag

## Icon Provider Standards

- **Consistent Interface**: All providers must implement the `IconProvider` interface
- **Error Handling**: Handle provider-specific errors gracefully
- **Caching**: Implement provider-level caching with appropriate TTL
- **Rate Limiting**: Respect provider API rate limits
- **Data Normalization**: Convert provider-specific data to standard Icon format

## Response Format Standards

- **Success**: Return structured data matching TypeScript interfaces
- **Errors**: Return clear error messages with appropriate context
- **Empty Results**: Return empty arrays instead of null/undefined
- **Consistency**: Maintain consistent response structure across all tools

## Security Requirements

- **Input Validation**: Validate all parameters before processing
- **Output Sanitization**: Sanitize all data returned to clients
- **HTTPS Only**: All external API calls must use HTTPS
- **Rate Limiting**: Implement per-client rate limiting
- **Error Information**: Don't expose internal system details in errors

## Resource Implementation

- **Static Resources**: Provide access to cached icon library metadata
- **Dynamic Resources**: Support parameterized queries for specific libraries
- **Icon Resources**: Enable direct access to icon SVG data
- **Caching**: Cache resource responses with appropriate TTL

## Prompt Guidelines

- **Common Queries**: Create prompts for frequent icon search patterns
- **Discovery**: Implement guided discovery for exploring icon libraries
- **Category Exploration**: Add prompts for browsing icons by category
- **Examples**: Include usage examples in all prompts
