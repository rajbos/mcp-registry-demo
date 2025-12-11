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
  servers: serversData.servers,
  metadata: {
    count: serversData.servers.length
  }
};
writeJsonFile('v0.1/servers/index.json', serversResponse);

// Generate individual server endpoints
serversData.servers.forEach(serverResponse => {
  const serverName = serverResponse.server.name;
  const version = serverResponse.server.version;
  
  // Generate /v0.1/servers/:serverName/versions/latest
  if (serverResponse._meta?.['io.modelcontextprotocol.registry/official']?.isLatest) {
    writeJsonFile(`v0.1/servers/${serverName}/versions/latest/index.json`, serverResponse);
  }
  
  // Generate /v0.1/servers/:serverName/versions/:version
  writeJsonFile(`v0.1/servers/${serverName}/versions/${version}/index.json`, serverResponse);
  
  // Generate /v0.1/servers/:serverName/versions endpoint (list of all versions)
  const serverVersions = serversData.servers.filter(s => s.server.name === serverName);
  const versionsResponse = {
    servers: serverVersions,
    metadata: {
      count: serverVersions.length
    }
  };
  writeJsonFile(`v0.1/servers/${serverName}/versions/index.json`, versionsResponse);
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
// The servers are already in the correct format (ServerResponse with server and _meta)
writeJsonFile('registry.json', {
  servers: serversData.servers
});

console.log('\nStatic site generation complete!');
console.log(`Files generated in: ${siteDir}`);
