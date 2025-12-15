const express = require('express');
const cors = require('cors');
const path = require('path');
const serversData = require('./data/servers.json');

const app = express();

// Helper function to decode server names from URL-safe format
function decodeServerName(serverName) {
  // First try standard URL decoding
  let decodedName = decodeURIComponent(serverName);
  
  // If it looks like our custom encoding (no slashes but has dashes), convert back
  if (!decodedName.includes('/') && decodedName.includes('-')) {
    // Try to find a matching server by checking all possibilities
    const matchingServer = serversData.servers.find(s => {
      const encoded = s.server.name.replace(/[\/.]/g, '-');
      return encoded === serverName;
    });
    if (matchingServer) {
      decodedName = matchingServer.server.name;
    }
  }
  
  return decodedName;
}

// CORS configuration as per MCP registry requirements
app.use(cors({
  origin: '*',
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type']
}));

// JSON middleware
app.use(express.json());

// API Routes

// GET /v0.1/servers - List all servers
app.get('/v0.1/servers', (req, res) => {
  const { search, limit = 30, updated_since, version } = req.query;
  
  let servers = [...serversData.servers];
  
  // Filter by search if provided
  if (search) {
    const searchLower = search.toLowerCase();
    servers = servers.filter(serverResponse => 
      serverResponse.server.name.toLowerCase().includes(searchLower) ||
      serverResponse.server.description.toLowerCase().includes(searchLower) ||
      serverResponse.server.title?.toLowerCase().includes(searchLower)
    );
  }
  
  // Filter by updated_since if provided
  if (updated_since) {
    const sinceDate = new Date(updated_since);
    servers = servers.filter(serverResponse => {
      const updatedAt = serverResponse._meta?.['io.modelcontextprotocol.registry/official']?.updatedAt;
      return updatedAt && new Date(updatedAt) > sinceDate;
    });
  }
  
  // Filter by version if provided
  if (version) {
    if (version === 'latest') {
      servers = servers.filter(serverResponse => 
        serverResponse._meta?.['io.modelcontextprotocol.registry/official']?.isLatest
      );
    } else {
      servers = servers.filter(serverResponse => 
        serverResponse.server?.version === version
      );
    }
  }
  
  // Apply limit
  const maxLimit = Math.min(parseInt(limit, 10) || 30, 100);
  const paginatedServers = servers.slice(0, maxLimit);
  
  // Build response according to OpenAPI spec
  const response = {
    servers: paginatedServers,
    metadata: {
      count: paginatedServers.length
    }
  };
  
  // Add nextCursor if there are more results
  if (servers.length > maxLimit) {
    response.metadata.nextCursor = servers[maxLimit].server.name;
  }
  
  res.json(response);
});

// GET /v0.1/servers/:serverName/versions/latest - Get latest version of a server
app.get('/v0.1/servers/:serverName/versions/latest', (req, res) => {
  const { serverName } = req.params;
  const decodedName = decodeServerName(serverName);
  
  // Find server by name - match exact name or if name contains the search string
  const serverResponse = serversData.servers.find(s => 
    s.server.name === decodedName || 
    s.server.name.includes(serverName) ||
    s.server.name.endsWith('/' + serverName)
  );
  
  if (!serverResponse) {
    return res.status(404).json({
      error: 'Server not found'
    });
  }
  
  // Return the latest version (filter by isLatest flag)
  if (!serverResponse._meta?.['io.modelcontextprotocol.registry/official']?.isLatest) {
    // Find the latest version of this server
    const latestServer = serversData.servers.find(s => 
      (s.server.name === decodedName || 
       s.server.name.includes(serverName) ||
       s.server.name.endsWith('/' + serverName)) &&
      s._meta?.['io.modelcontextprotocol.registry/official']?.isLatest
    );
    
    if (latestServer) {
      return res.json(latestServer);
    }
  }
  
  res.json(serverResponse);
});

// GET /v0.1/servers/:serverName/versions - List all versions of a server
app.get('/v0.1/servers/:serverName/versions', (req, res) => {
  const { serverName } = req.params;
  const decodedName = decodeServerName(serverName);
  
  // Find all versions of this server
  const versions = serversData.servers.filter(s => 
    s.server.name === decodedName || 
    s.server.name.includes(serverName) ||
    s.server.name.endsWith('/' + serverName)
  );
  
  if (versions.length === 0) {
    return res.status(404).json({
      error: 'Server not found'
    });
  }
  
  // Return as ServerList format
  res.json({
    servers: versions,
    metadata: {
      count: versions.length
    }
  });
});

// GET /v0.1/servers/:serverName/versions/:version - Get specific version of a server
app.get('/v0.1/servers/:serverName/versions/:version', (req, res) => {
  const { serverName, version } = req.params;
  const decodedName = decodeServerName(serverName);
  const decodedVersion = decodeURIComponent(version);
  
  // Handle 'latest' version by redirecting to the latest endpoint
  if (decodedVersion === 'latest') {
    return res.redirect(`/v0.1/servers/${serverName}/versions/latest`);
  }
  
  // Find server by name and version
  const serverResponse = serversData.servers.find(s => 
    (s.server.name === decodedName || 
     s.server.name.includes(serverName) ||
     s.server.name.endsWith('/' + serverName)) && 
    s.server?.version === decodedVersion
  );
  
  if (!serverResponse) {
    return res.status(404).json({
      error: 'Server not found'
    });
  }
  
  res.json(serverResponse);
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'MCP Registry Demo',
    version: 'v0.1',
    endpoints: {
      servers: '/v0.1/servers',
      latestVersion: '/v0.1/servers/:serverName/versions/latest',
      specificVersion: '/v0.1/servers/:serverName/versions/:version'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `The endpoint ${req.path} does not exist`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

module.exports = app;
