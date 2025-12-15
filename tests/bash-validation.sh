#!/bin/bash

# MCP Registry API Validation Script
# Based on: https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/api/generic-registry-api.md
#
# This script validates an MCP registry API implementation by testing:
# - Core endpoints (GET /v0.1/servers, GET /v0.1/servers/{serverName}/versions, etc.)
# - Response content and structure
# - HTTP headers
# - Pagination
# - Error handling

set -o pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REGISTRY_URL="${1:-http://localhost:3000}"
TEMP_DIR=$(mktemp -d)
VERBOSE="${VERBOSE:-0}"

# Counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Cleanup function
cleanup() {
    rm -rf "$TEMP_DIR"
}
trap cleanup EXIT

# Print functions
print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

print_test() {
    echo -e "${YELLOW}TEST:${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
    ((TESTS_PASSED++))
    ((TESTS_TOTAL++))
}

print_failure() {
    echo -e "${RED}✗${NC} $1"
    ((TESTS_FAILED++))
    ((TESTS_TOTAL++))
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Helper function to make HTTP request and save headers + body
http_request() {
    local method="$1"
    local url="$2"
    local headers_file="$TEMP_DIR/headers_$TESTS_TOTAL.txt"
    local body_file="$TEMP_DIR/body_$TESTS_TOTAL.json"
    
    if [ "$VERBOSE" = "1" ]; then
        print_info "Request: $method $url" >&2
    fi
    
    local http_code=$(curl -s -L -X "$method" \
        -w "%{http_code}" \
        -D "$headers_file" \
        -o "$body_file" \
        "$url")
    
    echo "$http_code|$headers_file|$body_file"
}

# Parse response from http_request
get_http_code() {
    echo "$1" | cut -d'|' -f1
}

get_headers_file() {
    echo "$1" | cut -d'|' -f2
}

get_body_file() {
    echo "$1" | cut -d'|' -f3
}

# Validate JSON structure
validate_json() {
    local file="$1"
    if ! jq empty "$file" 2>/dev/null; then
        return 1
    fi
    return 0
}

# Check if header exists
check_header() {
    local headers_file="$1"
    local header_name="$2"
    local expected_value="$3"
    
    if grep -qi "^$header_name:" "$headers_file"; then
        if [ -n "$expected_value" ]; then
            local actual_value=$(grep -i "^$header_name:" "$headers_file" | cut -d':' -f2- | tr -d '\r\n' | sed 's/^ *//')
            if [[ "$actual_value" =~ $expected_value ]]; then
                return 0
            else
                if [ "$VERBOSE" = "1" ]; then
                    print_warning "Header $header_name has value '$actual_value', expected pattern '$expected_value'"
                fi
                return 1
            fi
        fi
        return 0
    fi
    return 1
}

# Test 1: List Servers Endpoint
test_list_servers() {
    print_header "Test 1: List Servers Endpoint (GET /v0.1/servers)"
    
    print_test "Request to GET /v0.1/servers"
    local response=$(http_request "GET" "$REGISTRY_URL/v0.1/servers")
    local http_code=$(get_http_code "$response")
    local headers_file=$(get_headers_file "$response")
    local body_file=$(get_body_file "$response")
    
    # Check HTTP status code
    if [ "$http_code" = "200" ]; then
        print_success "HTTP 200 OK"
    else
        print_failure "Expected HTTP 200, got $http_code"
        cat "$body_file" 2>/dev/null
        return
    fi
    
    # Check Content-Type header
    print_test "Checking Content-Type header"
    if check_header "$headers_file" "content-type" "application/json"; then
        print_success "Content-Type: application/json"
    else
        print_failure "Content-Type header missing or not application/json"
    fi
    
    # Validate JSON response
    print_test "Validating JSON response structure"
    if validate_json "$body_file"; then
        print_success "Response is valid JSON"
    else
        print_failure "Response is not valid JSON"
        return
    fi
    
    # Check response structure
    print_test "Checking response structure (servers array)"
    if jq -e '.servers' "$body_file" > /dev/null 2>&1; then
        print_success "Response contains 'servers' array"
    else
        print_failure "Response missing 'servers' array"
    fi
    
    print_test "Checking response structure (metadata object)"
    if jq -e '.metadata' "$body_file" > /dev/null 2>&1; then
        print_success "Response contains 'metadata' object"
    else
        print_failure "Response missing 'metadata' object"
    fi
    
    # Check metadata structure
    print_test "Checking metadata.count field"
    if jq -e '.metadata.count' "$body_file" > /dev/null 2>&1; then
        local count=$(jq -r '.metadata.count' "$body_file")
        print_success "metadata.count = $count"
    else
        print_warning "metadata.count field missing"
    fi
    
    # Check server structure
    local server_count=$(jq '.servers | length' "$body_file")
    if [ "$server_count" -gt 0 ]; then
        print_test "Checking first server structure"
        
        if jq -e '.servers[0].server' "$body_file" > /dev/null 2>&1; then
            print_success "Server has 'server' object"
        else
            print_failure "Server missing 'server' object"
        fi
        
        if jq -e '.servers[0].server.name' "$body_file" > /dev/null 2>&1; then
            local name=$(jq -r '.servers[0].server.name' "$body_file")
            print_success "Server has 'name' field: $name"
        else
            print_failure "Server missing 'name' field"
        fi
        
        if jq -e '.servers[0].server.version' "$body_file" > /dev/null 2>&1; then
            local version=$(jq -r '.servers[0].server.version' "$body_file")
            print_success "Server has 'version' field: $version"
        else
            print_failure "Server missing 'version' field"
        fi
    else
        print_info "No servers in response (empty registry)"
    fi
    
    # Check for CORS headers
    print_test "Checking for CORS headers"
    if check_header "$headers_file" "access-control-allow-origin" ""; then
        print_success "CORS header present"
    else
        print_info "CORS header not present (optional)"
    fi
}

# Test 2: List Servers with Pagination
test_list_servers_pagination() {
    print_header "Test 2: List Servers with Pagination"
    
    print_test "Request to GET /v0.1/servers?limit=2"
    local response=$(http_request "GET" "$REGISTRY_URL/v0.1/servers?limit=2")
    local http_code=$(get_http_code "$response")
    local body_file=$(get_body_file "$response")
    
    if [ "$http_code" = "200" ]; then
        print_success "HTTP 200 OK"
    else
        print_failure "Expected HTTP 200, got $http_code"
        return
    fi
    
    print_test "Checking limit parameter respected"
    local count=$(jq '.servers | length' "$body_file")
    if [ "$count" -le 2 ]; then
        print_success "Server count ($count) respects limit=2"
    else
        print_failure "Server count ($count) exceeds limit=2"
    fi
    
    print_test "Checking for nextCursor in pagination"
    if jq -e '.metadata.nextCursor' "$body_file" > /dev/null 2>&1; then
        local next_cursor=$(jq -r '.metadata.nextCursor' "$body_file")
        if [ "$next_cursor" != "null" ] && [ -n "$next_cursor" ]; then
            print_success "nextCursor present: $next_cursor"
            
            # Try to use the cursor
            print_test "Testing cursor-based pagination"
            local cursor_encoded=$(echo -n "$next_cursor" | jq -sRr @uri)
            local cursor_response=$(http_request "GET" "$REGISTRY_URL/v0.1/servers?cursor=$cursor_encoded&limit=2")
            local cursor_http_code=$(get_http_code "$cursor_response")
            
            if [ "$cursor_http_code" = "200" ]; then
                print_success "Cursor-based pagination works"
            else
                print_failure "Cursor-based pagination failed with HTTP $cursor_http_code"
            fi
        else
            print_info "nextCursor is null (no more pages)"
        fi
    else
        print_info "No nextCursor field (single page result)"
    fi
}

# Test 3: Get Server Versions
test_get_server_versions() {
    print_header "Test 3: Get Server Versions"
    
    # First get a server name
    print_test "Getting a server name from list"
    local list_response=$(http_request "GET" "$REGISTRY_URL/v0.1/servers?limit=1")
    local list_body=$(get_body_file "$list_response")
    
    if ! jq -e '.servers[0].server.name' "$list_body" > /dev/null 2>&1; then
        print_warning "No servers available to test versions endpoint"
        return
    fi
    
    local server_name=$(jq -r '.servers[0].server.name' "$list_body")
    local server_name_encoded=$(echo -n "$server_name" | jq -sRr @uri)
    
    print_test "Request to GET /v0.1/servers/$server_name/versions"
    local response=$(http_request "GET" "$REGISTRY_URL/v0.1/servers/$server_name_encoded/versions")
    local http_code=$(get_http_code "$response")
    local headers_file=$(get_headers_file "$response")
    local body_file=$(get_body_file "$response")
    
    if [ "$http_code" = "200" ]; then
        print_success "HTTP 200 OK"
    else
        print_failure "Expected HTTP 200, got $http_code"
        cat "$body_file" 2>/dev/null
        return
    fi
    
    print_test "Checking Content-Type header"
    if check_header "$headers_file" "content-type" "application/json"; then
        print_success "Content-Type: application/json"
    else
        print_failure "Content-Type not application/json"
    fi
    
    print_test "Validating JSON response"
    if validate_json "$body_file"; then
        print_success "Valid JSON response"
    else
        print_failure "Invalid JSON response"
        return
    fi
    
    print_test "Checking servers array in response"
    if jq -e '.servers' "$body_file" > /dev/null 2>&1; then
        local version_count=$(jq '.servers | length' "$body_file")
        print_success "Found $version_count version(s) of server '$server_name'"
    else
        print_failure "Response missing 'servers' array"
    fi
}

# Test 4: Get Specific Server Version
test_get_specific_version() {
    print_header "Test 4: Get Specific Server Version"
    
    # First get a server name and version
    print_test "Getting a server name and version from list"
    local list_response=$(http_request "GET" "$REGISTRY_URL/v0.1/servers?limit=1")
    local list_body=$(get_body_file "$list_response")
    
    if ! jq -e '.servers[0].server' "$list_body" > /dev/null 2>&1; then
        print_warning "No servers available to test specific version endpoint"
        return
    fi
    
    local server_name=$(jq -r '.servers[0].server.name' "$list_body")
    local server_version=$(jq -r '.servers[0].server.version' "$list_body")
    local server_name_encoded=$(echo -n "$server_name" | jq -sRr @uri)
    local server_version_encoded=$(echo -n "$server_version" | jq -sRr @uri)
    
    print_test "Request to GET /v0.1/servers/$server_name/versions/$server_version"
    local response=$(http_request "GET" "$REGISTRY_URL/v0.1/servers/$server_name_encoded/versions/$server_version_encoded")
    local http_code=$(get_http_code "$response")
    local headers_file=$(get_headers_file "$response")
    local body_file=$(get_body_file "$response")
    
    if [ "$http_code" = "200" ]; then
        print_success "HTTP 200 OK"
    else
        print_failure "Expected HTTP 200, got $http_code"
        cat "$body_file" 2>/dev/null
        return
    fi
    
    print_test "Checking Content-Type header"
    if check_header "$headers_file" "content-type" "application/json"; then
        print_success "Content-Type: application/json"
    else
        print_failure "Content-Type not application/json"
    fi
    
    print_test "Validating JSON response"
    if validate_json "$body_file"; then
        print_success "Valid JSON response"
    else
        print_failure "Invalid JSON response"
        return
    fi
    
    print_test "Checking server object in response"
    if jq -e '.server' "$body_file" > /dev/null 2>&1; then
        print_success "Response contains 'server' object"
        
        local resp_name=$(jq -r '.server.name' "$body_file")
        local resp_version=$(jq -r '.server.version' "$body_file")
        
        if [ "$resp_name" = "$server_name" ]; then
            print_success "Server name matches: $resp_name"
        else
            print_failure "Server name mismatch: expected '$server_name', got '$resp_name'"
        fi
        
        if [ "$resp_version" = "$server_version" ]; then
            print_success "Server version matches: $resp_version"
        else
            print_failure "Server version mismatch: expected '$server_version', got '$resp_version'"
        fi
    else
        print_failure "Response missing 'server' object"
    fi
}

# Test 5: Get Latest Version
test_get_latest_version() {
    print_header "Test 5: Get Latest Server Version"
    
    # First get a server name
    print_test "Getting a server name from list"
    local list_response=$(http_request "GET" "$REGISTRY_URL/v0.1/servers?limit=1")
    local list_body=$(get_body_file "$list_response")
    
    if ! jq -e '.servers[0].server.name' "$list_body" > /dev/null 2>&1; then
        print_warning "No servers available to test latest version endpoint"
        return
    fi
    
    local server_name=$(jq -r '.servers[0].server.name' "$list_body")
    local server_name_encoded=$(echo -n "$server_name" | jq -sRr @uri)
    
    print_test "Request to GET /v0.1/servers/$server_name/versions/latest"
    local response=$(http_request "GET" "$REGISTRY_URL/v0.1/servers/$server_name_encoded/versions/latest")
    local http_code=$(get_http_code "$response")
    local body_file=$(get_body_file "$response")
    
    if [ "$http_code" = "200" ]; then
        print_success "HTTP 200 OK"
    else
        print_failure "Expected HTTP 200, got $http_code"
        cat "$body_file" 2>/dev/null
        return
    fi
    
    print_test "Validating JSON response"
    if validate_json "$body_file"; then
        print_success "Valid JSON response"
    else
        print_failure "Invalid JSON response"
        return
    fi
    
    print_test "Checking server object"
    if jq -e '.server' "$body_file" > /dev/null 2>&1; then
        local version=$(jq -r '.server.version' "$body_file")
        print_success "Latest version endpoint works, version: $version"
    else
        print_failure "Response missing 'server' object"
    fi
}

# Test 6: Error Handling - Invalid Server
test_error_handling() {
    print_header "Test 6: Error Handling"
    
    print_test "Request to non-existent server"
    local response=$(http_request "GET" "$REGISTRY_URL/v0.1/servers/nonexistent%2Fserver/versions/1.0.0")
    local http_code=$(get_http_code "$response")
    local body_file=$(get_body_file "$response")
    
    if [ "$http_code" = "404" ]; then
        print_success "HTTP 404 for non-existent server"
    else
        print_info "HTTP $http_code for non-existent server (404 expected but $http_code is acceptable)"
    fi
    
    # Check if error response is JSON
    if validate_json "$body_file"; then
        print_success "Error response is valid JSON"
    else
        print_info "Error response is not JSON (acceptable)"
    fi
    
    print_test "Request to invalid endpoint"
    local invalid_response=$(http_request "GET" "$REGISTRY_URL/v0.1/invalid-endpoint")
    local invalid_http_code=$(get_http_code "$invalid_response")
    
    if [ "$invalid_http_code" = "404" ]; then
        print_success "HTTP 404 for invalid endpoint"
    else
        print_info "HTTP $invalid_http_code for invalid endpoint (404 expected but $invalid_http_code is acceptable)"
    fi
}

# Test 7: Check Additional Headers
test_additional_headers() {
    print_header "Test 7: Additional HTTP Headers"
    
    local response=$(http_request "GET" "$REGISTRY_URL/v0.1/servers?limit=1")
    local headers_file=$(get_headers_file "$response")
    
    print_test "Checking for Cache-Control header"
    if check_header "$headers_file" "cache-control" ""; then
        local cache_value=$(grep -i "^cache-control:" "$headers_file" | cut -d':' -f2- | tr -d '\r\n' | sed 's/^ *//')
        print_success "Cache-Control: $cache_value"
    else
        print_info "Cache-Control header not present (optional)"
    fi
    
    print_test "Checking for X-Content-Type-Options header"
    if check_header "$headers_file" "x-content-type-options" "nosniff"; then
        print_success "X-Content-Type-Options: nosniff"
    else
        print_info "X-Content-Type-Options header not present (optional)"
    fi
    
    print_test "Checking for X-Frame-Options header"
    if check_header "$headers_file" "x-frame-options" ""; then
        local frame_value=$(grep -i "^x-frame-options:" "$headers_file" | cut -d':' -f2- | tr -d '\r\n' | sed 's/^ *//')
        print_success "X-Frame-Options: $frame_value"
    else
        print_info "X-Frame-Options header not present (optional)"
    fi
    
    print_test "Checking for Server header"
    if check_header "$headers_file" "server" ""; then
        local server_value=$(grep -i "^server:" "$headers_file" | cut -d':' -f2- | tr -d '\r\n' | sed 's/^ *//')
        print_info "Server: $server_value"
    else
        print_info "Server header not present"
    fi
}

# Test 8: Filter by updated_since
test_updated_since_filter() {
    print_header "Test 8: Filter by updated_since parameter"
    
    # Use a date in the past
    local since_date="2024-01-01T00:00:00.000Z"
    print_test "Request to GET /v0.1/servers?updated_since=$since_date"
    local response=$(http_request "GET" "$REGISTRY_URL/v0.1/servers?updated_since=$since_date&limit=5")
    local http_code=$(get_http_code "$response")
    local body_file=$(get_body_file "$response")
    
    if [ "$http_code" = "200" ]; then
        print_success "HTTP 200 OK with updated_since parameter"
        
        if validate_json "$body_file"; then
            local count=$(jq '.servers | length' "$body_file")
            print_info "Found $count server(s) updated since $since_date"
        fi
    else
        print_info "updated_since parameter not supported or returned HTTP $http_code"
    fi
}

# Main execution
main() {
    echo -e "${BLUE}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║     MCP Registry API Validation Script                   ║"
    echo "║     Testing: $REGISTRY_URL"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    # Check dependencies
    if ! command -v curl &> /dev/null; then
        echo -e "${RED}Error: curl is not installed${NC}"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        echo -e "${RED}Error: jq is not installed${NC}"
        exit 1
    fi
    
    # Run tests
    test_list_servers
    test_list_servers_pagination
    test_get_server_versions
    test_get_specific_version
    test_get_latest_version
    test_error_handling
    test_additional_headers
    test_updated_since_filter
    
    # Summary
    print_header "Test Summary"
    echo -e "Total tests: $TESTS_TOTAL"
    echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
    echo -e "${RED}Failed: $TESTS_FAILED${NC}"
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "\n${GREEN}✓ All tests passed!${NC}\n"
        exit 0
    else
        echo -e "\n${RED}✗ Some tests failed${NC}\n"
        exit 1
    fi
}

# Show usage if --help or -h
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Usage: $0 [REGISTRY_URL]"
    echo ""
    echo "Validates an MCP registry API implementation."
    echo ""
    echo "Arguments:"
    echo "  REGISTRY_URL    Base URL of the registry (default: http://localhost:3000)"
    echo ""
    echo "Environment variables:"
    echo "  VERBOSE=1       Enable verbose output"
    echo ""
    echo "Examples:"
    echo "  $0"
    echo "  $0 http://localhost:3000"
    echo "  $0 https://registry.modelcontextprotocol.io"
    echo "  VERBOSE=1 $0 http://localhost:3000"
    exit 0
fi

main
