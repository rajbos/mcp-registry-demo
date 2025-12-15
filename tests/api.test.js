const request = require('supertest');
const app = require('../src/app');

describe('MCP Registry API v0.1', () => {
  
  describe('GET /', () => {
    it('should return API information', async () => {
      const response = await request(app)
        .get('/')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('endpoints');
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'ok');
    });
  });

  describe('GET /v0.1/servers', () => {
    it('should return list of servers', async () => {
      const response = await request(app)
        .get('/v0.1/servers')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).toHaveProperty('metadata');
      expect(response.body).toHaveProperty('servers');
      expect(Array.isArray(response.body.servers)).toBe(true);
      expect(response.body.metadata).toHaveProperty('count');
    });

    it('should return CORS headers', async () => {
      const response = await request(app)
        .get('/v0.1/servers')
        .expect(200);
      
      expect(response.headers['access-control-allow-origin']).toBe('*');
    });

    it('should filter servers by search query', async () => {
      const response = await request(app)
        .get('/v0.1/servers?search=github')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body.servers.length).toBeGreaterThan(0);
      const serverResponse = response.body.servers[0];
      const server = serverResponse.server;
      const hasGithub = 
        server.name.toLowerCase().includes('github') ||
        server.description.toLowerCase().includes('github') ||
        (server.title && server.title.toLowerCase().includes('github'));
      expect(hasGithub).toBe(true);
    });

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/v0.1/servers?limit=1')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body.servers.length).toBeLessThanOrEqual(1);
      expect(response.body.metadata.count).toBeLessThanOrEqual(1);
    });

    it('should validate server object structure', async () => {
      const response = await request(app)
        .get('/v0.1/servers')
        .expect(200);
      
      if (response.body.servers.length > 0) {
        const serverResponse = response.body.servers[0];
        expect(serverResponse).toHaveProperty('server');
        expect(serverResponse).toHaveProperty('_meta');
        
        const server = serverResponse.server;
        expect(server).toHaveProperty('name');
        expect(server).toHaveProperty('description');
        expect(server).toHaveProperty('version');

        // Server must have either packages or remotes (or both)
        const hasPackages = server.packages && Array.isArray(server.packages);
        const hasRemotes = server.remotes && Array.isArray(server.remotes);
        expect(hasPackages || hasRemotes).toBe(true);
        
        const meta = serverResponse._meta;
        const officialMeta = meta['io.modelcontextprotocol.registry/official'];
        expect(officialMeta).toBeDefined();
        expect(officialMeta).toHaveProperty('status');
        expect(officialMeta).toHaveProperty('updatedAt');
        expect(officialMeta).toHaveProperty('isLatest');
      }
    });
  });

  describe('GET /v0.1/servers/:serverName/versions/latest', () => {
    it('should return latest version of a server', async () => {
      const response = await request(app)
        .get('/v0.1/servers/github-mcp-server/versions/latest')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).toHaveProperty('server');
      expect(response.body).toHaveProperty('_meta');
      expect(response.body.server).toHaveProperty('version');
      expect(response.body._meta['io.modelcontextprotocol.registry/official'].isLatest).toBe(true);
    });

    it('should return 404 for non-existent server', async () => {
      const response = await request(app)
        .get('/v0.1/servers/non-existent-server/versions/latest')
        .expect('Content-Type', /json/)
        .expect(404);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Server not found');
    });

    it('should have CORS headers', async () => {
      const response = await request(app)
        .get('/v0.1/servers/github-mcp-server/versions/latest')
        .expect(200);
      
      expect(response.headers['access-control-allow-origin']).toBe('*');
    });
  });

  describe('GET /v0.1/servers/:serverName/versions/:version', () => {
    it('should return specific version of a server', async () => {
      const response = await request(app)
        .get('/v0.1/servers/github-mcp-server/versions/1.0.0')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).toHaveProperty('server');
      expect(response.body).toHaveProperty('_meta');
      expect(response.body.server).toHaveProperty('version', '1.0.0');
    });

    it('should return 404 for non-existent version', async () => {
      const response = await request(app)
        .get('/v0.1/servers/github-mcp-server/versions/99.99.99')
        .expect('Content-Type', /json/)
        .expect(404);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Server not found');
    });

    it('should have CORS headers', async () => {
      const response = await request(app)
        .get('/v0.1/servers/github-mcp-server/versions/1.0.0')
        .expect(200);
      
      expect(response.headers['access-control-allow-origin']).toBe('*');
    });
  });

  describe('OPTIONS requests (CORS preflight)', () => {
    it('should handle OPTIONS request for /v0.1/servers', async () => {
      const response = await request(app)
        .options('/v0.1/servers')
        .expect(204);
      
      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-allow-methods']).toContain('GET');
    });
  });

  describe('404 handling', () => {
    it('should return 404 for unknown endpoints', async () => {
      const response = await request(app)
        .get('/unknown/endpoint')
        .expect('Content-Type', /json/)
        .expect(404);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Not found');
    });
  });
});
