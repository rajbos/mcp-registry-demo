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

// Generate /v0.1/servers endpoint
const serversResponse = {
  metadata: {
    total: serversData.servers.length,
    limit: 30
  },
  servers: serversData.servers
};
writeJsonFile('v0.1/servers/index.json', serversResponse);

// Generate individual server endpoints
serversData.servers.forEach(server => {
  const serverName = server.name;
  const version = server.version;
  
  // Generate /v0.1/servers/:serverName/versions/latest
  writeJsonFile(`v0.1/servers/${serverName}/versions/latest/index.json`, server);
  
  // Generate /v0.1/servers/:serverName/versions/:version
  writeJsonFile(`v0.1/servers/${serverName}/versions/${version}/index.json`, server);
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

// Copy backward-compatible registry.json for legacy support
writeJsonFile('registry.json', {
  servers: serversData.servers.map(server => ({
    server: {
      $schema: "https://static.modelcontextprotocol.io/schemas/2025-09-29/server.schema.json",
      name: server.description,
      description: server.description,
      repository: {
        url: server.packages[0]?.url || "",
        source: "github"
      },
      version: server.version
    },
    _meta: {
      "io.modelcontextprotocol.registry/official": {
        status: server.status || "active",
        publishedAt: server.updated_at,
        updatedAt: server.updated_at,
        isLatest: server.isLatest || true
      }
    }
  }))
});

console.log('\nStatic site generation complete!');
console.log(`Files generated in: ${siteDir}`);
