# Icon MCP Server

A powerful Model Context Protocol (MCP) server that provides unified search capabilities across multiple icon libraries with fuzzy search, intelligent caching, and comprehensive filtering options.

## 🚀 Features

- **Multi-Library Support**: Search across multiple icon libraries simultaneously
- **Fuzzy Search**: Advanced search with typo tolerance using Fuse.js
- **Intelligent Caching**: Fast response times with smart caching strategies
- **Comprehensive Filtering**: Filter by library, style, category, tags, and more
- **NPM Package Integration**: Automatic icon library management via NPM packages
- **TypeScript**: Full type safety and excellent developer experience
- **MCP Protocol**: Standard Model Context Protocol for seamless integration

## 📦 Supported Icon Libraries

- **Bootstrap Icons** - Official open source SVG icon library for Bootstrap
- **Feather** - Beautiful open source icons
- **Octicons** - GitHub's icon library
- **Tabler Icons** - Free and open source icons

## 🛠️ Installation

### NPM Package

```bash
npm install -g icon-mcp
```

### From Source

```bash
git clone https://github.com/your-org/icon-mcp.git
cd icon-mcp
npm install
npm run build
```

### Build Icon Index

```bash
# Build icon indices from NPM packages
npm run build-icons
```

## 🚀 Quick Start

### As MCP Server

```bash
# Start the MCP server
npm start
```

### Configuration

The server can be configured via environment variables:

```bash
# Cache configuration
CACHE_TTL=300000          # Cache TTL in milliseconds (default: 5 minutes)
CACHE_MAX_SIZE=1000       # Maximum cache entries (default: 1000)

# Search configuration
DEFAULT_SEARCH_LIMIT=50   # Default search result limit
FUZZY_THRESHOLD=0.3       # Default fuzzy search threshold

# Logging
LOG_LEVEL=info           # Logging level (error, warn, info, debug)
```

## 🔌 Configuration for MCP Clients

### Claude Desktop

Add the icon MCP server to your Claude Desktop configuration:

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "icon-search": {
      "command": "npx",
      "args": ["icon-mcp"],
      "env": {
        "CACHE_TTL": "300000",
        "DEFAULT_SEARCH_LIMIT": "50",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### VS Code MCP Extension

Configure the MCP extension in VS Code settings:

```json
{
  "mcp.servers": [
    {
      "name": "icon-search",
      "command": "npx",
      "args": ["icon-mcp"],
      "cwd": "${workspaceFolder}",
      "env": {
        "CACHE_TTL": "300000",
        "DEFAULT_SEARCH_LIMIT": "50"
      }
    }
  ]
}
```

### Local Development Setup

For development with a local build:

```json
{
  "mcpServers": {
    "icon-search-dev": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "/path/to/icon-mcp",
      "env": {
        "NODE_ENV": "development",
        "LOG_LEVEL": "debug",
        "CACHE_TTL": "60000"
      }
    }
  }
}
```

### Docker Configuration

Using the Docker image:

```json
{
  "mcpServers": {
    "icon-search-docker": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "--env",
        "CACHE_TTL=300000",
        "--env",
        "LOG_LEVEL=info",
        "icon-mcp:latest"
      ]
    }
  }
}
```

### Environment Variables for Client Configuration

Configure the server behavior through environment variables:

| Variable               | Description                              | Default      | Example       |
| ---------------------- | ---------------------------------------- | ------------ | ------------- |
| `CACHE_TTL`            | Cache time-to-live in milliseconds       | `300000`     | `600000`      |
| `CACHE_MAX_SIZE`       | Maximum number of cached entries         | `1000`       | `2000`        |
| `DEFAULT_SEARCH_LIMIT` | Default number of search results         | `50`         | `100`         |
| `FUZZY_THRESHOLD`      | Default fuzzy search threshold (0.0-1.0) | `0.3`        | `0.5`         |
| `LOG_LEVEL`            | Logging verbosity                        | `info`       | `debug`       |
| `NODE_ENV`             | Environment mode                         | `production` | `development` |

### Connection Verification

After configuring your MCP client, verify the connection:

1. **Check Server Status**: The server should appear in your MCP client's server list
2. **Test Basic Tool**: Try the `list_libraries` tool to verify connectivity
3. **Check Logs**: Look for connection messages in the client logs

### Troubleshooting

#### Common Issues

**Server Not Starting**

```bash
# Check if the package is installed
npm list -g icon-mcp

# Reinstall if needed
npm install -g icon-mcp
```

**Permission Errors**

```bash
# On Unix systems, ensure proper permissions
chmod +x $(which icon-mcp)
```

**Icon Index Missing**

```bash
# Build the icon index
cd /path/to/icon-mcp
npm run build-icons
```

#### Debug Mode

Enable debug logging for troubleshooting:

```json
{
  "mcpServers": {
    "icon-search": {
      "command": "npx",
      "args": ["icon-mcp"],
      "env": {
        "LOG_LEVEL": "debug",
        "NODE_ENV": "development"
      }
    }
  }
}
```

#### Connection Testing

Test the server manually:

```bash
# Start the server directly
npx icon-mcp

# Or with debug output
LOG_LEVEL=debug npx icon-mcp
```

### Advanced Configuration

#### Custom Icon Libraries

Configure additional icon libraries by setting up the icon index:

```bash
# Add custom libraries to package.json dependencies
npm install custom-icon-library

# Rebuild the icon index
npm run build-icons
```

#### Performance Tuning

For high-performance scenarios:

```json
{
  "env": {
    "CACHE_TTL": "1800000",
    "CACHE_MAX_SIZE": "5000",
    "DEFAULT_SEARCH_LIMIT": "100",
    "FUZZY_THRESHOLD": "0.2"
  }
}
```

#### Memory Optimization

For memory-constrained environments:

```json
{
  "env": {
    "CACHE_MAX_SIZE": "500",
    "DEFAULT_SEARCH_LIMIT": "25",
    "NODE_OPTIONS": "--max-old-space-size=512"
  }
}
```

## 📖 API Reference

### Available Tools

#### `search_icons`

Search for icons by name across all or specific libraries with fuzzy matching.

**Parameters:**

- `query` (string, required): Search term for icon names
- `libraries` (string[], optional): Specific libraries to search in
- `fuzzy` (boolean, optional): Enable fuzzy search (default: true)
- `limit` (number, optional): Maximum results to return (default: 10)
- `threshold` (number, optional): Fuzzy search threshold 0.0-1.0 (default: 0.3)
- `includeScore` (boolean, optional): Include match scores (default: true)

**Example:**

```json
{
  "query": "home",
  "libraries": ["bootstrap-icons", "feather"],
  "fuzzy": true,
  "limit": 20,
  "threshold": 0.3
}
```

**Response:**

```json
{
  "query": "home",
  "results": [
    {
      "item": {
        "name": "house",
        "library": "bootstrap-icons",
        "tags": ["house", "home", "building"],
        "style": "regular",
        "path": "node_modules/bootstrap-icons/icons/house.svg",
        "categories": ["navigation"],
        "size": "16x16"
      },
      "score": 0.0
    }
  ],
  "totalResults": 15,
  "searchType": "fuzzy",
  "executionTime": 45,
  "libraries": ["bootstrap-icons", "feather"]
}
```

#### `get_icon`

Get detailed information about a specific icon.

**Parameters:**

- `id` (string, required): Unique identifier of the icon
- `library` (string, required): Library name where the icon is located

**Example:**

```json
{
  "id": "house",
  "library": "bootstrap-icons"
}
```

#### `list_libraries`

Get a list of all available icon libraries.

**Parameters:** None

**Response:**

```json
{
  "libraries": ["bootstrap-icons", "feather", "octicons", "lucide", "tabler-icons"],
  "count": 5
}
```

#### `get_library_info`

Get detailed information about a specific library.

**Parameters:**

- `library` (string, required): Name of the library

**Response:**

```json
{
  "name": "bootstrap-icons",
  "displayName": "Bootstrap Icons",
  "description": "Official open source SVG icon library for Bootstrap",
  "version": "1.11.3",
  "iconCount": 1800,
  "categories": ["navigation", "communication", "media", "ui"],
  "styles": ["regular"],
  "isAvailable": true
}
```

#### `search_by_category`

Find icons by category or tag with fuzzy matching.

**Parameters:**

- `category` (string, required): Category name to search for
- `libraries` (string[], optional): Specific libraries to search in
- `fuzzy` (boolean, optional): Enable fuzzy search (default: true)
- `limit` (number, optional): Maximum results to return (default: 10)

## 🏗️ Architecture

### Core Components

```
src/
├── index.ts                 # Main MCP server entry point
├── providers/               # Icon provider implementations
│   ├── icon-provider.interface.ts
│   ├── base-npm-provider.ts
│   ├── heroicons.provider.ts
│   ├── bootstrap-icons.provider.ts
│   ├── feather.provider.ts
│   ├── octicons.provider.ts
│   ├── lucide.provider.ts
│   ├── simple-icons.provider.ts
│   └── tabler-icons.provider.ts
├── services/               # Core services
│   ├── search.service.ts   # Unified search service
│   └── cache.service.ts    # Caching service
├── tools/                  # MCP tools
│   └── index.ts           # Icon search tools
├── types/                  # TypeScript type definitions
│   └── index.ts
└── utils/                  # Utility functions
    └── errors.ts
```

### Provider System

The provider system allows easy addition of new icon libraries:

```typescript
export abstract class IconProvider {
  abstract initialize(): Promise<void>;
  abstract searchIcons(query: string, options?: FuseSearchOptions): Promise<FuseResult<Icon>[]>;
  abstract getIcon(id: string): Promise<Icon | null>;
  abstract getAllIcons(): Promise<Icon[]>;
  abstract getInfo(): Promise<IconLibrary>;
}
```

### Search Service

The search service provides unified search across all providers:

- **Fuzzy Search**: Powered by Fuse.js with configurable thresholds
- **Caching**: Intelligent caching with TTL and LRU eviction
- **Filtering**: Advanced filtering by library, style, category, and tags
- **Performance**: Optimized for fast response times

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration

# Run performance tests
npm run test:performance
```

## 🔧 Development

### Setup Development Environment

```bash
git clone https://github.com/your-org/icon-mcp.git
cd icon-mcp
npm install

# Install icon library dependencies
npm install

# Build the project
npm run build

# Start in development mode
npm run dev
```

### Adding New Icon Libraries

1. Add the library as an NPM dependency:

```bash
npm install new-icon-library
```

2. Create a provider class extending `BaseNpmProvider`:

```typescript
export class NewLibraryProvider extends BaseNpmProvider {
  constructor() {
    super('new-library', 'New Library', '1.0.0', 'new-icon-library', ['icons/*.svg']);
  }

  protected getDescription(): string {
    return 'Description of the new library';
  }

  protected getSourceUrl(): string {
    return 'https://github.com/library/icons';
  }

  protected getLicense(): string {
    return 'MIT';
  }
}
```

3. Register the provider in `src/providers/index.ts`:

```typescript
registry.register(new NewLibraryProvider());
```

4. Add the library configuration to `scripts/build-index.js`:

```javascript
'new-icon-library': {
  name: 'new-library',
  displayName: 'New Library',
  description: 'Description of the new library',
  sourceUrl: 'https://github.com/library/icons',
  license: 'MIT',
  iconPaths: ['icons/*.svg'],
  styles: ['regular'],
}
```

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Configured with TypeScript rules
- **Prettier**: Consistent code formatting
- **Husky**: Pre-commit hooks for quality checks

## 📊 Performance

- **Search Speed**: < 100ms for most queries with caching
- **Memory Usage**: Efficient memory management with LRU caching
- **Scalability**: Supports thousands of icons across multiple libraries
- **Fuzzy Search**: Optimized Fuse.js configuration for best performance

## 🔒 Security

- **Input Validation**: All inputs validated with Zod schemas
- **Output Sanitization**: Safe handling of SVG content
- **Error Handling**: Comprehensive error handling without information leakage
- **Dependencies**: Regular security audits and updates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Write tests for new features
- Follow TypeScript best practices
- Update documentation for API changes
- Ensure all CI checks pass

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Fuse.js](https://fusejs.io/) for powerful fuzzy search capabilities
- [Model Context Protocol](https://modelcontextprotocol.io/) for the standard protocol
- All the icon library maintainers for their amazing work

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-org/icon-mcp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/icon-mcp/discussions)
- **Documentation**: [Wiki](https://github.com/your-org/icon-mcp/wiki)

---

Made with ❤️ for the developer community
