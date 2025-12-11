const express = require('express');
const cors = require('cors');
const path = require('path');
const serversData = require('./data/servers.json');

const app = express();

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
  const { search, limit = 30, updated_since } = req.query;
  
  let servers = [...serversData.servers];
  
  // Filter by search if provided
  if (search) {
    const searchLower = search.toLowerCase();
    servers = servers.filter(server => 
      server.name.toLowerCase().includes(searchLower) ||
      server.description.toLowerCase().includes(searchLower) ||
      server.tags?.some(tag => tag.toLowerCase().includes(searchLower))
    );
  }
  
  // Filter by updated_since if provided
  if (updated_since) {
    const sinceDate = new Date(updated_since);
    servers = servers.filter(server => 
      new Date(server.updated_at) > sinceDate
    );
  }
  
  // Apply limit
  const maxLimit = Math.min(parseInt(limit, 10) || 30, 100);
  const paginatedServers = servers.slice(0, maxLimit);
  
  // Build response
  const response = {
    metadata: {
      total: servers.length,
      limit: maxLimit
    },
    servers: paginatedServers
  };
  
  // Add nextCursor if there are more results
  if (servers.length > maxLimit) {
    response.metadata.nextCursor = servers[maxLimit].id;
  }
  
  res.json(response);
});

// GET /v0.1/servers/:serverName/versions/latest - Get latest version of a server
app.get('/v0.1/servers/:serverName/versions/latest', (req, res) => {
  const { serverName } = req.params;
  
  // Find server by name (looking for id that contains the serverName)
  const server = serversData.servers.find(s => 
    s.id.includes(serverName) || s.name === serverName
  );
  
  if (!server) {
    return res.status(404).json({
      error: 'Server not found',
      message: `No server found with name: ${serverName}`
    });
  }
  
  // Return the latest version (filter by isLatest flag)
  if (!server.isLatest) {
    // Find the latest version of this server
    const latestServer = serversData.servers.find(s => 
      (s.id.includes(serverName) || s.name === serverName) && s.isLatest
    );
    
    if (latestServer) {
      return res.json(latestServer);
    }
  }
  
  res.json(server);
});

// GET /v0.1/servers/:serverName/versions/:version - Get specific version of a server
app.get('/v0.1/servers/:serverName/versions/:version', (req, res) => {
  const { serverName, version } = req.params;
  
  // Find server by name and version
  const server = serversData.servers.find(s => 
    (s.id.includes(serverName) || s.name === serverName) && s.version === version
  );
  
  if (!server) {
    return res.status(404).json({
      error: 'Server version not found',
      message: `No server found with name: ${serverName} and version: ${version}`
    });
  }
  
  res.json(server);
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
