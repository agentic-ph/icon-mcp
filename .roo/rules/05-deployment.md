# Deployment and Distribution Rules

## Build Process

1. **TypeScript Compilation**: Ensure clean compilation with no errors
2. **Bundle Optimization**: Minimize bundle size for distribution
3. **Source Maps**: Generate source maps for debugging
4. **Dependency Check**: Verify all dependencies are properly declared

## Docker Deployment

- **Base Image**: Use official Node.js Alpine image for smaller size
- **Multi-stage Build**: Separate build and runtime stages
- **Security**: Run as non-root user, minimize attack surface
- **Health Checks**: Include container health check endpoints
- **Environment Variables**: Support configuration via environment variables

## NPM Package Distribution

- **Package.json**: Ensure proper metadata, keywords, and descriptions
- **Entry Points**: Define correct main and types entry points
- **Files**: Use files array to include only necessary files
- **Versioning**: Follow semantic versioning (SemVer)
- **Publishing**: Include pre-publish validation steps

## Environment Configuration

- **API Base URL**: Configurable via environment variable
- **Cache TTL**: Configurable cache expiration times
- **Rate Limits**: Configurable rate limiting parameters
- **Port**: Configurable server port
- **Log Level**: Configurable logging verbosity

## Production Considerations

- **Error Handling**: Comprehensive error logging and monitoring
- **Performance**: Enable response compression
- **Security**: Implement request rate limiting
- **Monitoring**: Add health check endpoints
- **Scalability**: Design for horizontal scaling

## Deployment Commands

```bash
# Development
npm run dev

# Production build
npm run build
npm start

# Docker
docker build -t icon-mcp .
docker run -p 3000:3000 icon-mcp

# NPM publish
npm run build
npm publish
```

## Documentation Requirements

- **README**: Comprehensive setup and usage instructions
- **API Documentation**: Clear examples for all tools
- **Deployment Guide**: Step-by-step deployment instructions
- **Troubleshooting**: Common issues and solutions
- **Contributing**: Guidelines for contributors
