# Icon MCP Server Architecture

## High-Level Overview

```mermaid
graph TD
    A[MCP Client] -->|MCP Protocol| B[Icon MCP Server]
    B --> C[Tool Registry]
    B --> D[Resource Registry]
    B --> E[Prompt Registry]

    C --> F[Search Tools]
    C --> G[Library Tools]
    C --> H[Icon Tools]

    F --> I[search_icons]
    F --> J[search_by_category]
    F --> K[search_by_tags]

    G --> L[list_libraries]
    G --> M[get_library_info]

    H --> N[get_icon]
    H --> O[get_icon_svg]
    H --> P[validate_icon]

    B --> Q[Search Service]
    B --> R[Cache Service]
    B --> S[Provider Registry]

    Q --> T[Fuse.js Engine]
    Q --> U[Exact Search]
    Q --> V[Category Filter]

    S --> W[Icon Providers]
    W --> X[Material Design Icons]
    W --> Y[Heroicons]
    W --> Z[Bootstrap Icons]
    W --> AA[Feather Icons]
    W --> BB[Octicons]
    W --> CC[Font Awesome]

    X --> DD[NPM Package Files]
    Y --> DD
    Z --> DD
    AA --> DD
    BB --> DD
    CC --> DD

    R --> FF[Memory Cache]
    R --> GG[File Cache]
```

## Component Flow Diagram

```mermaid
sequenceDiagram
    participant Client as MCP Client
    participant Server as MCP Server
    participant Search as Search Service
    participant Cache as Cache Service
    participant Provider as Icon Provider
    participant Files as Local Files/API

    Client->>Server: search_icons("home", fuzzy=true)
    Server->>Cache: Check cache for "home"
    Cache-->>Server: Cache miss

    Server->>Search: performFuseSearch("home")
    Search->>Provider: getAllIcons()
    Provider->>Files: Read SVG files/API call
    Files-->>Provider: Icon data
    Provider-->>Search: Normalized icons

    Search->>Search: Create Fuse.js instance
    Search->>Search: Execute fuzzy search
    Search-->>Server: Search results with scores

    Server->>Cache: Store results
    Server-->>Client: Formatted search results
```

## Data Flow Architecture

```mermaid
graph LR
    A[Icon Libraries] --> B[Provider Layer]
    B --> C[Normalization]
    C --> D[Search Service]
    D --> E[Fuse.js Processing]
    E --> F[Result Ranking]
    F --> G[Cache Layer]
    G --> H[MCP Tools]
    H --> I[Client Response]

    J[Cache Service] --> G
    K[Validation] --> C
    L[Error Handling] --> H
```

## Provider Architecture

```mermaid
graph TD
    A[IconProvider Interface] --> B[Base Provider]
    B --> C[NPM Provider]
    B --> D[Bundled Provider]

    C --> E[Heroicons]
    C --> F[Bootstrap Icons]
    C --> G[Feather Icons]
    C --> H[Octicons]
    C --> I[Lucide Icons]
    C --> J[Simple Icons]
    C --> K[Tabler Icons]

    D --> L[Pre-built Icons]

    E --> M[NPM Package]
    F --> M
    G --> M
    H --> M
    I --> M
    J --> M
    K --> M

    L --> N[Bundled JSON]
```

## Search Engine Architecture

```mermaid
graph TD
    A[Search Request] --> B{Fuzzy Search?}
    B -->|Yes| C[Fuse.js Engine]
    B -->|No| D[Exact Match Engine]

    C --> E[Multi-field Search]
    E --> F[Name Matching]
    E --> G[Tag Matching]
    E --> H[Category Matching]
    E --> I[Keyword Matching]

    F --> J[Weighted Scoring]
    G --> J
    H --> J
    I --> J

    D --> K[String Comparison]
    K --> L[Case Insensitive]
    L --> M[Partial Matching]

    J --> N[Result Ranking]
    M --> N
    N --> O[Pagination]
    O --> P[Response Formatting]
```

## Cache Strategy

```mermaid
graph TD
    A[Cache Request] --> B{Cache Type}
    B -->|Icon Data| C[Long-term Cache]
    B -->|Search Results| D[Short-term Cache]
    B -->|Library Info| E[Medium-term Cache]

    C --> F[24 Hours TTL]
    D --> G[5 Minutes TTL]
    E --> H[1 Hour TTL]

    F --> I[File System]
    G --> J[Memory]
    H --> J

    I --> K[Persistent Storage]
    J --> L[Fast Access]
```

## Error Handling Flow

```mermaid
graph TD
    A[Request] --> B[Input Validation]
    B --> C{Valid?}
    C -->|No| D[ValidationError]
    C -->|Yes| E[Provider Call]

    E --> F{Provider Success?}
    F -->|No| G[ProviderError]
    F -->|Yes| H[Search Processing]

    H --> I{Search Success?}
    I -->|No| J[SearchError]
    I -->|Yes| K[Response Formatting]

    D --> L[Error Response]
    G --> M[Fallback Provider]
    J --> L

    M --> N{Fallback Success?}
    N -->|No| L
    N -->|Yes| H

    K --> O[Success Response]
```

## Key Components

### 1. MCP Server Core

- **Tool Registry**: Manages all available MCP tools
- **Resource Registry**: Handles static and dynamic resources
- **Prompt Registry**: Provides guided interaction prompts

### 2. Search Engine

- **Fuse.js Integration**: Fuzzy search with typo tolerance
- **Multi-field Search**: Name, tags, categories, keywords
- **Weighted Scoring**: Relevance-based result ranking
- **Exact Search Fallback**: For precise matching needs

### 3. Provider System

- **Unified Interface**: Consistent API across all providers
- **Multiple Sources**: Local files, APIs, NPM packages
- **Data Normalization**: Standardized icon format
- **Error Handling**: Graceful degradation and fallbacks

### 4. Caching Layer

- **Multi-level Caching**: Memory and file-based storage
- **TTL Management**: Different expiration times by data type
- **Cache Invalidation**: Smart cache refresh strategies

### 5. Icon Libraries Supported

- Heroicons (NPM Package)
- Bootstrap Icons (NPM Package)
- Feather Icons (NPM Package)
- Octicons (NPM Package)
- Lucide Icons (NPM Package)
- Simple Icons (NPM Package)
- Tabler Icons (NPM Package)

## Request/Response Flow

1. **Client Request**: MCP client sends tool request
2. **Input Validation**: Server validates parameters using Zod schemas
3. **Cache Check**: Search service checks for cached results
4. **Provider Query**: If cache miss, query appropriate providers
5. **Data Processing**: Normalize and prepare icon data
6. **Search Execution**: Run fuzzy or exact search algorithm
7. **Result Ranking**: Score and sort results by relevance
8. **Cache Storage**: Store results for future requests
9. **Response Formatting**: Format results according to MCP specification
10. **Client Response**: Return structured data to client

## Performance Characteristics

- **Search Latency**: < 100ms for cached results, < 500ms for fresh searches
- **Memory Usage**: Efficient Fuse.js instances with lazy loading
- **Scalability**: Horizontal scaling through stateless design
- **Reliability**: Multiple fallback mechanisms and error recovery
