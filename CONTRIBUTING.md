# Contributing to MCP Registry Demo

Thank you for your interest in contributing to the MCP Registry Demo! This document provides guidelines for adding new MCP servers to the registry.

## Adding a New MCP Server

To add a new server to the registry, follow these steps:

### 1. Edit the Server Data File

Open `src/data/servers.json` and add your server entry to the `servers` array. Each server must follow the MCP Registry v0.1 schema.

#### Example 1: Streamable HTTP Server

For servers that use streamable-http transport (hosted API servers):

```json
{
  "server": {
    "name": "io.github.username/server-name",
    "description": "Brief description (max 100 characters)",
    "title": "Server Display Name",
    "version": "1.0.0",
    "remotes": [
      {
        "type": "streamable-http",
        "url": "https://api.example.com/mcp/"
      }
    ]
  },
  "_meta": {
    "io.modelcontextprotocol.registry/official": {
      "status": "active",
      "publishedAt": "2025-12-11T00:00:00.000000Z",
      "updatedAt": "2025-12-11T00:00:00.000000Z",
      "isLatest": true
    }
  }
}
```

#### Example 2: Stdio (Local) Server

For servers that run locally via stdio transport (npm packages, Python packages, etc.):

```json
{
  "server": {
    "name": "playwright/mcp-server",
    "description": "MCP server for browser automation using Playwright with stdio transport.",
    "title": "Playwright MCP Server",
    "version": "0.2.0",
    "repository": {
      "url": "https://github.com/microsoft/playwright",
      "source": "github"
    },
    "packages": [
      {
        "registryType": "npm",
        "registryBaseUrl": "https://registry.npmjs.org",
        "identifier": "@playwright/mcp",
        "version": "0.2.0",
        "transport": {
          "type": "stdio"
        }
      }
    ]
  },
  "_meta": {
    "io.modelcontextprotocol.registry/official": {
      "status": "active",
      "publishedAt": "2025-12-20T12:00:00.000000Z",
      "updatedAt": "2025-12-20T12:00:00.000000Z",
      "isLatest": true
    }
  }
}
```

### 2. Field Descriptions

#### Server Object (required):
- **name** (required): Unique identifier in format `namespace/server-name` (e.g., `io.github.username/server-name`)
- **description** (required): Brief description of the server's functionality (max 100 characters)
- **title** (required): Display name for the server
- **version** (required): Semantic version (e.g., "1.0.0")
- **repository** (optional): Repository information
  - **url**: Git repository URL
  - **source**: Source type (e.g., "github")

#### For Streamable HTTP Servers:
- **remotes** (required): Array of remote endpoints
  - **type**: Must be "streamable-http"
  - **url**: API endpoint URL

#### For Stdio (Local) Servers:
- **packages** (required): Array of package information
  - **registryType**: Package registry type ("npm", "pypi", "oci", etc.)
  - **registryBaseUrl**: Base URL of the package registry
  - **identifier**: Package identifier (e.g., "@playwright/mcp")
  - **version**: Package version
  - **transport**: Transport configuration
    - **type**: Must be "stdio" for local execution

#### Metadata (_meta):
- **io.modelcontextprotocol.registry/official**: Registry metadata
  - **status**: Status of the server ("active", "deprecated", "beta")
  - **publishedAt**: ISO 8601 timestamp of first publication
  - **updatedAt**: ISO 8601 timestamp of last update
  - **isLatest**: Boolean indicating if this is the latest version

### 3. Multiple Versions

To add multiple versions of the same server:

1. Add separate entries with different versions
2. Set `isLatest: true` only on the most recent version
3. Set `isLatest: false` on older versions

Example:
```json
{
  "servers": [
    {
      "server": {
        "name": "playwright/mcp-server",
        "version": "0.2.0",
        ...
      },
      "_meta": {
        "io.modelcontextprotocol.registry/official": {
          "isLatest": true,
          ...
        }
      }
    },
    {
      "server": {
        "name": "playwright/mcp-server",
        "version": "0.1.0",
        ...
      },
      "_meta": {
        "io.modelcontextprotocol.registry/official": {
          "isLatest": false,
          ...
        }
      }
    }
  ]
}
```

### 4. Client Configuration

Once your stdio server is added to the registry, clients can configure it in their MCP client configuration (e.g., `servers.json`):

```json
{
  "mcpServers": {
    "playwright": {
      "type": "local",
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

For detailed client-side configuration, see the [GitHub Copilot MCP documentation](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-mcp-usage/configure-mcp-registry).

### 5. Test Your Changes

After adding your server, run the tests to ensure everything works:

```bash
npm test
```

All tests should pass. The tests verify:
- API endpoint functionality
- CORS headers
- JSON schema validation
- Error handling

### 6. Build and Preview

Build the static site to preview your changes:

```bash
npm run build
```

You can start a local server to test the API:

```bash
npm run dev
```

Then visit:
- `http://localhost:3000/v0.1/servers` - See all servers
- `http://localhost:3000/v0.1/servers/your-server-name/versions/latest` - See your server

### 7. Submit Your Changes

1. Fork the repository
2. Create a new branch: `git checkout -b add-my-server`
3. Make your changes
4. Run tests: `npm test`
5. Commit your changes: `git commit -am 'Add my-server to registry'`
6. Push to your fork: `git push origin add-my-server`
7. Create a Pull Request

## Guidelines

- Ensure your server follows the MCP specification
- Provide accurate and up-to-date information
- Use clear and descriptive tags
- Keep descriptions concise but informative
- Test your changes before submitting

## Questions?

If you have questions or need help, please:
- Check the [MCP Registry Documentation](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-mcp-usage/configure-mcp-registry)
- Review the [Model Context Protocol](https://github.com/modelcontextprotocol/registry)
- Open an issue in this repository
