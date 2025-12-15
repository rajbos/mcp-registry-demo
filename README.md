# mcp-registry-demo
Demo MCP Registry with GitHub Pages

This repository hosts a GitHub Pages site that provides a Model Context Protocol (MCP) registry v0.1 API for GitHub Copilot.

## Features

- ✅ Full MCP Registry v0.1 API specification support
- ✅ **OpenAPI 3.1 compliant** - Validated against [official MCP Registry OpenAPI spec](https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/api/openapi.yaml)
- ✅ RESTful API endpoints for server discovery
- ✅ CORS support for cross-origin requests
- ✅ Static site generation for GitHub Pages deployment
- ✅ Integration tests with Jest and Supertest
- ✅ Automated OpenAPI schema validation
- ✅ Automated deployment via GitHub Actions

## API Endpoints

The registry implements the v0.1 specification:

### List All Servers
```
GET /v0.1/servers
```
Returns a paginated list of all MCP servers. Supports query parameters:
- `search` - Filter servers by name, description, or tags
- `limit` - Maximum number of results (default: 30, max: 100)
- `updated_since` - Filter servers updated after this date

Example: `https://rajbos.github.io/mcp-registry-demo/v0.1/servers/`

### Get Latest Server Version
```
GET /v0.1/servers/:serverName/versions/latest
```
Returns the latest version of a specific server.

Example: `https://rajbos.github.io/mcp-registry-demo/v0.1/servers/github-mcp-server/versions/latest/`

### Get Specific Server Version
```
GET /v0.1/servers/:serverName/versions/:version
```
Returns a specific version of a server.

Example: `https://rajbos.github.io/mcp-registry-demo/v0.1/servers/github-mcp-server/versions/1.0.0/`

## Project Structure

```
├── src/
│   ├── app.js                    # Express application with API routes
│   ├── server.js                 # Server entry point for local development
│   ├── build-static.js           # Static site generator
│   └── data/
│       └── servers.json          # Server registry data
├── tests/
│   ├── api.test.js               # API integration tests
│   └── openapi-validation.test.js # OpenAPI schema validation tests
├── docs/
│   └── openapi.yaml              # OpenAPI specification (from MCP registry)
├── .github/
│   └── workflows/
│       └── pages.yml             # GitHub Actions deployment workflow
├── index.html                    # Landing page
└── package.json                  # Node.js dependencies and scripts
```

## Development

### Prerequisites
- Node.js 20.x or later
- npm

### Setup
```bash
npm install
```

### Run Tests
```bash
npm test
```

### Run Development Server
```bash
npm run dev
```
The API will be available at `http://localhost:3000`

### Build Static Site
```bash
npm run build
```
This generates static JSON files in the `_site` directory for GitHub Pages deployment.

### Validate Registry API
```bash
./tests/bash-validation.sh [REGISTRY_URL]
```
Runs comprehensive validation tests against a registry API. Tests include:
- Endpoint availability and response codes (GET /v0.1/servers, etc.)
- JSON structure validation
- HTTP header validation
- **CORS headers validation** (required for VS Code):
  - `Access-Control-Allow-Origin: *`
  - `Access-Control-Allow-Methods: GET, OPTIONS`
  - `Access-Control-Allow-Headers: Authorization, Content-Type`
- OPTIONS preflight request support
- Pagination support
- Error handling

Examples:
```bash
# Test local server
./tests/bash-validation.sh http://localhost:3000

# Test official MCP registry
./tests/bash-validation.sh https://registry.modelcontextprotocol.io

# Verbose output
VERBOSE=1 ./tests/bash-validation.sh http://localhost:3000
```

**Note**: The bash validation script checks for proper CORS headers. If deploying to GitHub Pages, note that GitHub Pages does not support custom HTTP headers. Consider using a service like Azure API Management to add CORS headers if needed for production use with VS Code.

## Deployment

The site is automatically deployed to GitHub Pages via GitHub Actions when changes are pushed to the `main` branch. The workflow:

1. Installs Node.js dependencies
2. Runs integration tests
3. Builds the static site
4. Deploys to GitHub Pages

## Usage with GitHub Copilot

To use this registry with GitHub Copilot:

1. Navigate to your organization or enterprise GitHub Copilot settings
2. Set the MCP registry URL to: `https://rajbos.github.io/mcp-registry-demo/`
3. Set the policy to "Registry only" to restrict access to servers listed in this registry

## Adding Servers

To add a new MCP server to the registry:

1. Edit `src/data/servers.json`
2. Add your server following the JSON schema format
3. Run tests to validate: `npm test`
4. Build and verify: `npm run build`
5. Commit and push changes

## References

- [GitHub Copilot MCP Registry Documentation](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-mcp-usage/configure-mcp-registry)
- [Model Context Protocol Registry](https://github.com/modelcontextprotocol/registry)
