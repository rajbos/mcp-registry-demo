# API Examples

This document provides examples of the MCP Registry v0.1 API responses.

## Base URL

Production: `https://rajbos.github.io/mcp-registry-demo/`

## Endpoints

### 1. List All Servers

**Request:**
```
GET /v0.1/servers/
```

**Response:**
```json
{
  "metadata": {
    "total": 1,
    "limit": 30
  },
  "servers": [
    {
      "id": "io.github.githubcopilot/github-mcp-server",
      "name": "github-mcp-server",
      "description": "Tools and resources for GitHub repos, issues, PRs, and Actions.",
      "version": "1.0.0",
      "updated_at": "2025-12-05T17:00:00.243434Z",
      "owner": "io.github.githubcopilot",
      "packages": [
        {
          "type": "api",
          "url": "https://api.githubcopilot.com/mcp/"
        }
      ],
      "runtime": {
        "type": "api",
        "entry": "https://api.githubcopilot.com/mcp/"
      },
      "tags": ["github", "repos", "issues", "pull-requests", "actions"],
      "capabilities": ["repositories", "issues", "pull_requests", "actions"],
      "status": "active",
      "isLatest": true
    }
  ]
}
```

### 2. Get Latest Server Version

**Request:**
```
GET /v0.1/servers/github-mcp-server/versions/latest/
```

**Response:**
```json
{
  "id": "io.github.githubcopilot/github-mcp-server",
  "name": "github-mcp-server",
  "description": "Tools and resources for GitHub repos, issues, PRs, and Actions.",
  "version": "1.0.0",
  "updated_at": "2025-12-05T17:00:00.243434Z",
  "owner": "io.github.githubcopilot",
  "packages": [
    {
      "type": "api",
      "url": "https://api.githubcopilot.com/mcp/"
    }
  ],
  "runtime": {
    "type": "api",
    "entry": "https://api.githubcopilot.com/mcp/"
  },
  "tags": ["github", "repos", "issues", "pull-requests", "actions"],
  "capabilities": ["repositories", "issues", "pull_requests", "actions"],
  "status": "active",
  "isLatest": true
}
```

### 3. Get Specific Server Version

**Request:**
```
GET /v0.1/servers/github-mcp-server/versions/1.0.0/
```

**Response:** Same as above

## Query Parameters

### For `/v0.1/servers`

- `search` - Filter servers by name, description, or tags
  - Example: `/v0.1/servers/?search=github`
  
- `limit` - Maximum number of results (default: 30, max: 100)
  - Example: `/v0.1/servers/?limit=10`
  
- `updated_since` - Filter servers updated after this date (ISO 8601)
  - Example: `/v0.1/servers/?updated_since=2025-12-01T00:00:00Z`

## CORS Headers

All endpoints include these CORS headers:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type
```

## Error Responses

### 404 Not Found

```json
{
  "error": "Server not found",
  "message": "No server found with name: non-existent-server"
}
```

### 404 Version Not Found

```json
{
  "error": "Server version not found",
  "message": "No server found with name: github-mcp-server and version: 99.99.99"
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
