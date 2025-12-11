# Contributing to MCP Registry Demo

Thank you for your interest in contributing to the MCP Registry Demo! This document provides guidelines for adding new MCP servers to the registry.

## Adding a New MCP Server

To add a new server to the registry, follow these steps:

### 1. Edit the Server Data File

Open `src/data/servers.json` and add your server entry to the `servers` array. Each server must follow this schema:

```json
{
  "id": "io.github.username/server-name",
  "name": "server-name",
  "description": "A brief description of what this server does",
  "version": "1.0.0",
  "updated_at": "2025-12-11T00:00:00.000Z",
  "owner": "io.github.username",
  "packages": [
    {
      "type": "npm",
      "url": "https://www.npmjs.com/package/@username/server-name"
    }
  ],
  "runtime": {
    "type": "node",
    "entry": "index.js"
  },
  "tags": ["tag1", "tag2", "tag3"],
  "capabilities": ["capability1", "capability2"],
  "status": "active",
  "isLatest": true
}
```

### 2. Field Descriptions

- **id** (required): Unique identifier in format `io.github.username/server-name`
- **name** (required): Server name (should match the server-name in the id)
- **description** (required): Brief description of the server's functionality
- **version** (required): Semantic version (e.g., "1.0.0")
- **updated_at** (required): ISO 8601 timestamp of last update
- **owner** (required): Namespace owner (e.g., "io.github.username")
- **packages** (required): Array of package distribution information
  - **type**: Distribution type ("npm", "pypi", "docker", "api", "github")
  - **url**: URL to the package
- **runtime** (required): Runtime information
  - **type**: Runtime type ("node", "python", "docker", "api")
  - **entry**: Entry point file or URL
- **tags** (optional): Array of searchable tags
- **capabilities** (optional): Array of server capabilities
- **status** (optional): Status of the server ("active", "deprecated", "beta")
- **isLatest** (required): Boolean indicating if this is the latest version

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
      "id": "io.github.username/server-name",
      "name": "server-name",
      "version": "2.0.0",
      "isLatest": true,
      ...
    },
    {
      "id": "io.github.username/server-name",
      "name": "server-name",
      "version": "1.0.0",
      "isLatest": false,
      ...
    }
  ]
}
```

### 4. Test Your Changes

After adding your server, run the tests to ensure everything works:

```bash
npm test
```

All tests should pass. The tests verify:
- API endpoint functionality
- CORS headers
- JSON schema validation
- Error handling

### 5. Build and Preview

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

### 6. Submit Your Changes

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
