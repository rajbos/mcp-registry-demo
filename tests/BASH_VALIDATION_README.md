# Bash Validation Script

## Overview

The `bash-validation.sh` script is a comprehensive validation tool for MCP Registry API implementations. It tests compliance with the [Generic Registry API Specification](https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/api/generic-registry-api.md).

## Features

### Endpoint Testing
- `GET /v0.1/servers` - List all servers
- `GET /v0.1/servers?limit=N` - Pagination support
- `GET /v0.1/servers?cursor=X` - Cursor-based pagination
- `GET /v0.1/servers?updated_since=DATE` - Filter by update date
- `GET /v0.1/servers/{serverName}/versions` - List server versions
- `GET /v0.1/servers/{serverName}/versions/{version}` - Get specific version
- `GET /v0.1/servers/{serverName}/versions/latest` - Get latest version

### Response Validation
- ✓ HTTP status codes (200, 404, etc.)
- ✓ JSON structure and validity
- ✓ Required fields presence
- ✓ Metadata structure (`servers`, `metadata.count`, `metadata.nextCursor`)
- ✓ Server object structure (`name`, `version`, `description`, etc.)

### HTTP Headers Testing
- ✓ Content-Type: application/json
- ✓ CORS headers (Access-Control-Allow-Origin)
- ✓ Security headers (X-Content-Type-Options, X-Frame-Options)
- ✓ Cache-Control headers
- ✓ Server identification

### Error Handling
- ✓ Non-existent server handling (404)
- ✓ Invalid endpoint handling
- ✓ Error response format

## Usage

```bash
./tests/bash-validation.sh [REGISTRY_URL]
```

### Arguments
- `REGISTRY_URL` - Base URL of the registry to test (default: http://localhost:3000)

### Environment Variables
- `VERBOSE=1` - Enable verbose output showing request details

### Examples

```bash
# Test local development server
./tests/bash-validation.sh http://localhost:3000

# Test official MCP registry
./tests/bash-validation.sh https://registry.modelcontextprotocol.io

# Test with verbose output
VERBOSE=1 ./tests/bash-validation.sh http://localhost:3000

# Show help
./tests/bash-validation.sh --help
```

## Requirements

- `bash` - Shell interpreter
- `curl` - HTTP client for API requests
- `jq` - JSON processor for parsing responses

Install dependencies on Ubuntu/Debian:
```bash
sudo apt-get install curl jq
```

Install on macOS:
```bash
brew install curl jq
```

## Output

The script provides colorized output:
- 🟢 Green checkmarks (✓) - Tests passed
- 🔴 Red crosses (✗) - Tests failed
- 🔵 Blue info (ℹ) - Informational messages
- 🟡 Yellow warnings (⚠) - Optional features not present

### Example Output

```
╔═══════════════════════════════════════════════════════════╗
║     MCP Registry API Validation Script                   ║
║     Testing: https://registry.modelcontextprotocol.io
╚═══════════════════════════════════════════════════════════╝


=== Test 1: List Servers Endpoint (GET /v0.1/servers) ===

TEST: Request to GET /v0.1/servers
✓ HTTP 200 OK
TEST: Checking Content-Type header
✓ Content-Type: application/json
TEST: Validating JSON response structure
✓ Response is valid JSON
...

=== Test Summary ===

Total tests: 30
Passed: 30
Failed: 0

✓ All tests passed!
```

## Test Coverage

### Test 1: List Servers Endpoint
- HTTP 200 status code
- Content-Type header validation
- JSON response structure
- Required fields: `servers`, `metadata`
- Server object structure validation

### Test 2: Pagination
- Limit parameter support
- Cursor-based pagination
- nextCursor field presence
- Cursor value validity

### Test 3: Server Versions
- Get all versions of a server
- Response structure validation
- URL encoding of server names

### Test 4: Specific Version
- Get specific server version
- Version matching validation
- Server name validation

### Test 5: Latest Version
- Special "latest" version handling
- Latest version retrieval

### Test 6: Error Handling
- 404 for non-existent servers
- 404 for invalid endpoints
- Error response format

### Test 7: HTTP Headers
- Content-Type verification
- CORS headers (optional)
- Security headers (optional)
- Cache headers (optional)

### Test 8: Filter Parameters
- `updated_since` parameter support
- Date filtering validation

## Exit Codes

- `0` - All tests passed
- `1` - One or more tests failed

## Integration

### CI/CD Integration

Add to GitHub Actions:

```yaml
- name: Validate Registry API
  run: |
    npm start &
    sleep 5
    ./tests/bash-validation.sh http://localhost:3000
```

### Pre-deployment Validation

```bash
#!/bin/bash
# validate-before-deploy.sh

echo "Starting server..."
npm start &
SERVER_PID=$!

sleep 5

echo "Running validation..."
./tests/bash-validation.sh http://localhost:3000

RESULT=$?

echo "Stopping server..."
kill $SERVER_PID

exit $RESULT
```

## Technical Details

### HTTP Request Handling
- Uses `curl` with custom headers file capture
- Separates HTTP status code, headers, and body
- Temporary files for response storage

### JSON Validation
- Uses `jq` for JSON parsing and validation
- Field existence checks with `jq -e`
- Nested object validation

### URL Encoding
- Proper URL encoding for path parameters
- Server names and versions are encoded
- Special character handling

### Error Handling
- Graceful handling of missing servers
- Network error detection
- Invalid JSON handling

## Known Limitations

1. **Authentication**: Does not test authenticated endpoints
2. **POST/PUT/DELETE**: Only tests GET endpoints
3. **Performance**: Does not measure response times
4. **Load Testing**: No concurrent request testing
5. **Extensions**: Does not test registry-specific extensions

## Contributing

To add new tests:

1. Create a new test function following the naming convention `test_*`
2. Use helper functions: `http_request`, `print_test`, `print_success`, `print_failure`
3. Update the main() function to call your test
4. Document the test in this README

## References

- [Generic Registry API Specification](https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/api/generic-registry-api.md)
- [Official MCP Registry API](https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/api/official-registry-api.md)
- [OpenAPI Specification](https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/api/openapi.yaml)
