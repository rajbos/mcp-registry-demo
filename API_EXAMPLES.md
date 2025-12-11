# API Examples

This document provides examples of the MCP Registry v0.1 API responses.

## OpenAPI Specification

This API conforms to the [MCP Registry OpenAPI specification](https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/api/openapi.yaml).

The OpenAPI spec is available locally at: [docs/openapi.yaml](docs/openapi.yaml)

## Base URL

Production: `https://rajbos.github.io/mcp-registry-demo/`

## Endpoints

### 1. List All Servers

**Request:**
```
GET /v0.1/servers/
```

**Response:** (ServerList schema)
```json
{
  "servers": [
    {
      "server": {
        "name": "io.github.githubcopilot/github-mcp-server",
        "description": "Tools and resources for GitHub repos, issues, PRs, and Actions.",
        "title": "GitHub MCP Server",
        "version": "1.0.0",
        "packages": [
          {
            "registryType": "api",
            "identifier": "github-mcp-server",
            "transport": {
              "type": "streamable-http",
              "url": "https://api.githubcopilot.com/mcp/"
            }
          }
        ]
      },
      "_meta": {
        "io.modelcontextprotocol.registry/official": {
          "status": "active",
          "publishedAt": "2025-12-05T17:00:00.243434Z",
          "updatedAt": "2025-12-05T17:00:00.243434Z",
          "isLatest": true
        }
      }
    }
  ],
  "metadata": {
    "count": 1
  }
}
```

### 2. Get Latest Server Version

**Request:**
```
GET /v0.1/servers/github-mcp-server/versions/latest/
```

**Response:** (ServerResponse schema)
```json
{
  "server": {
    "name": "io.github.githubcopilot/github-mcp-server",
    "description": "Tools and resources for GitHub repos, issues, PRs, and Actions.",
    "title": "GitHub MCP Server",
    "version": "1.0.0",
    "packages": [
      {
        "registryType": "api",
        "identifier": "github-mcp-server",
        "transport": {
          "type": "streamable-http",
          "url": "https://api.githubcopilot.com/mcp/"
        }
      }
    ]
  },
  "_meta": {
    "io.modelcontextprotocol.registry/official": {
      "status": "active",
      "publishedAt": "2025-12-05T17:00:00.243434Z",
      "updatedAt": "2025-12-05T17:00:00.243434Z",
      "isLatest": true
    }
  }
}
```

### 3. Get Specific Server Version

**Request:**
```
GET /v0.1/servers/github-mcp-server/versions/1.0.0/
```

**Response:** Same as above (ServerResponse schema)

### 4. List All Versions of a Server

**Request:**
```
GET /v0.1/servers/github-mcp-server/versions/
```

**Response:** (ServerList schema)
```json
{
  "servers": [
    {
      "server": {
        "name": "io.github.githubcopilot/github-mcp-server",
        "description": "Tools and resources for GitHub repos, issues, PRs, and Actions.",
        "title": "GitHub MCP Server",
        "version": "1.0.0",
        "packages": [
          {
            "registryType": "api",
            "identifier": "github-mcp-server",
            "transport": {
              "type": "streamable-http",
              "url": "https://api.githubcopilot.com/mcp/"
            }
          }
        ]
      },
      "_meta": {
        "io.modelcontextprotocol.registry/official": {
          "status": "active",
          "publishedAt": "2025-12-05T17:00:00.243434Z",
          "updatedAt": "2025-12-05T17:00:00.243434Z",
          "isLatest": true
        }
      }
    }
  ],
  "metadata": {
    "count": 1
  }
}
```

## Query Parameters

### For `/v0.1/servers`

- `search` - Filter servers by name, description, or title (substring match)
  - Example: `/v0.1/servers/?search=github`
  
- `limit` - Maximum number of results (default: 30, max: 100)
  - Example: `/v0.1/servers/?limit=10`
  
- `updated_since` - Filter servers updated after this date (RFC3339 datetime)
  - Example: `/v0.1/servers/?updated_since=2025-12-01T00:00:00Z`

- `version` - Filter by version ('latest' for latest version, or an exact version like '1.2.3')
  - Example: `/v0.1/servers/?version=latest`
  - Example: `/v0.1/servers/?version=1.0.0`

- `cursor` - Pagination cursor for retrieving the next page of results
  - Use the `nextCursor` value from the previous response's metadata

## CORS Headers

All endpoints include these CORS headers:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type
```

## Error Responses

All error responses follow a consistent format:

### 404 Not Found

```json
{
  "error": "Server not found"
}
```

## Testing Locally

You can test the API locally:

1. Install dependencies: `npm install`
2. Start the server: `npm start`
3. Access endpoints at `http://localhost:3000`

Example:
```bash
curl http://localhost:3000/v0.1/servers/ | jq
```
