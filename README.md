# mcp-registry-demo
Demo registry with GitHub Pages

This repository hosts a GitHub Pages site that provides a JSON file following the MCP (Model Context Protocol) registry format for GitHub Copilot.

## Registry JSON

The registry is available at: `https://rajbos.github.io/mcp-registry-demo/registry.json`

## Structure

The registry follows the MCP protocol structure as documented in the [GitHub Copilot documentation](https://docs.github.com/en/copilot/how-tos/administer-copilot/configure-mcp-server-access).

### Files

- `registry.json` - The MCP registry JSON file containing approved server configurations
- `index.html` - GitHub Pages landing page with information about the registry
- `.nojekyll` - Bypasses Jekyll processing for direct file serving

## Usage

To use this registry with GitHub Copilot:

1. Configure your organization or enterprise GitHub Copilot settings
2. Set the MCP registry URL to: `https://rajbos.github.io/mcp-registry-demo/registry.json`
3. Set the policy to "Registry only" to restrict access to servers listed in the registry
