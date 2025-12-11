const fs = require('fs');
const path = require('path');
const serversData = require('./data/servers.json');

// Create the _site directory
const siteDir = path.join(__dirname, '..', '_site');
if (!fs.existsSync(siteDir)) {
  fs.mkdirSync(siteDir, { recursive: true });
}

// Helper function to write JSON file
function writeJsonFile(filepath, data) {
  const fullPath = path.join(siteDir, filepath);
  const dir = path.dirname(fullPath);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2));
  console.log(`Generated: ${filepath}`);
}

// Helper function to flatten server response for static site
// Transforms {server: {...}, _meta: {...}} to flat structure expected by integration tests
function flattenServerResponse(serverResponse) {
  const server = serverResponse.server;
  const meta = serverResponse._meta?.['io.modelcontextprotocol.registry/official'];
  
  // Extract simple server name from full name (e.g., "github-mcp-server" from "io.github.githubcopilot/github-mcp-server")
  const simpleName = server.name.split('/').pop();
  
  return {
    id: simpleName,
    name: simpleName,
    description: server.description,
    title: server.title,
    version: server.version,
    updated_at: meta?.updatedAt,
    owner: server.name.split('/')[0], // Extract owner from full name
    packages: server.packages?.map(pkg => ({
      type: pkg.registryType,
      url: pkg.transport?.url
    })) || [],
    runtime: server.packages?.[0]?.transport ? {
      type: server.packages[0].transport.type,
      entry: server.packages[0].transport.url
    } : null,
    isLatest: meta?.isLatest || false
  };
}

// Generate /v0.1/servers endpoint with flattened server objects
const flattenedServers = serversData.servers.map(flattenServerResponse);
const serversResponse = {
  servers: flattenedServers,
  metadata: {
    total: flattenedServers.length,
    limit: 100,
    count: flattenedServers.length
  }
};
writeJsonFile('v0.1/servers/index.json', serversResponse);

// Generate individual server endpoints with flattened structure
serversData.servers.forEach(serverResponse => {
  const serverName = serverResponse.server.name;
  const simpleName = serverName.split('/').pop(); // Extract simple name for path
  const version = serverResponse.server.version;
  const flattenedServer = flattenServerResponse(serverResponse);
  
  // Generate /v0.1/servers/:serverName/versions/latest
  if (serverResponse._meta?.['io.modelcontextprotocol.registry/official']?.isLatest) {
    writeJsonFile(`v0.1/servers/${simpleName}/versions/latest/index.json`, flattenedServer);
  }
  
  // Generate /v0.1/servers/:serverName/versions/:version
  writeJsonFile(`v0.1/servers/${simpleName}/versions/${version}/index.json`, flattenedServer);
  
  // Generate /v0.1/servers/:serverName/versions endpoint (list of all versions)
  const serverVersions = serversData.servers
    .filter(s => s.server.name === serverName)
    .map(flattenServerResponse);
  const versionsResponse = {
    servers: serverVersions,
    metadata: {
      total: serverVersions.length,
      limit: 100,
      count: serverVersions.length
    }
  };
  writeJsonFile(`v0.1/servers/${simpleName}/versions/index.json`, versionsResponse);
});

// Generate root API info
const apiInfo = {
  name: 'MCP Registry Demo',
  version: 'v0.1',
  endpoints: {
    servers: '/v0.1/servers',
    latestVersion: '/v0.1/servers/:serverName/versions/latest',
    specificVersion: '/v0.1/servers/:serverName/versions/:version'
  }
};
writeJsonFile('index.json', apiInfo);

// Copy the HTML index file
const indexHtmlSrc = path.join(__dirname, '..', 'index.html');
const indexHtmlDest = path.join(siteDir, 'index.html');
fs.copyFileSync(indexHtmlSrc, indexHtmlDest);
console.log('Copied: index.html');

// Copy .nojekyll
const nojekyllSrc = path.join(__dirname, '..', '.nojekyll');
const nojekyllDest = path.join(siteDir, '.nojekyll');
fs.copyFileSync(nojekyllSrc, nojekyllDest);
console.log('Copied: .nojekyll');

console.log('\nStatic site generation complete!');
console.log(`Files generated in: ${siteDir}`);
