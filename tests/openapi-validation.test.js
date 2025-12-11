const request = require('supertest');
const app = require('../src/app');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

// Load OpenAPI spec
const openApiPath = path.join(__dirname, '../docs/openapi.yaml');
const openApiSpec = yaml.load(fs.readFileSync(openApiPath, 'utf8'));

// Setup AJV validator
const ajv = new Ajv({ 
  strict: false,
  allErrors: true,
  validateFormats: true
});
addFormats(ajv);

// Add all schemas from OpenAPI spec to AJV
Object.keys(openApiSpec.components.schemas).forEach(schemaName => {
  ajv.addSchema(openApiSpec.components.schemas[schemaName], `#/components/schemas/${schemaName}`);
});

// Helper function to validate response against schema
function validateResponse(data, schemaName) {
  const schemaRef = `#/components/schemas/${schemaName}`;
  const validate = ajv.getSchema(schemaRef) || ajv.compile(openApiSpec.components.schemas[schemaName]);
  const valid = validate(data);
  
  if (!valid) {
    console.error('Validation errors:', JSON.stringify(validate.errors, null, 2));
  }
  
  return { valid, errors: validate.errors };
}

describe('OpenAPI Specification Compliance', () => {
  
  describe('GET /v0.1/servers', () => {
    it('should return response matching ServerList schema', async () => {
      const response = await request(app)
        .get('/v0.1/servers')
        .expect('Content-Type', /json/)
        .expect(200);
      
      const result = validateResponse(response.body, 'ServerList');
      
      if (!result.valid) {
        console.log('Response body:', JSON.stringify(response.body, null, 2));
      }
      
      expect(result.valid).toBe(true);
    });

    it('should return ServerResponse objects in servers array', async () => {
      const response = await request(app)
        .get('/v0.1/servers')
        .expect(200);
      
      expect(response.body).toHaveProperty('servers');
      expect(Array.isArray(response.body.servers)).toBe(true);
      
      if (response.body.servers.length > 0) {
        const server = response.body.servers[0];
        const result = validateResponse(server, 'ServerResponse');
        
        if (!result.valid) {
          console.log('ServerResponse validation errors:', JSON.stringify(result.errors, null, 2));
        }
        
        expect(result.valid).toBe(true);
        expect(server).toHaveProperty('server');
        expect(server).toHaveProperty('_meta');
      }
    });

    it('should validate ServerDetail within ServerResponse', async () => {
      const response = await request(app)
        .get('/v0.1/servers')
        .expect(200);
      
      if (response.body.servers.length > 0) {
        const serverDetail = response.body.servers[0].server;
        const result = validateResponse(serverDetail, 'ServerDetail');
        
        if (!result.valid) {
          console.log('ServerDetail validation errors:', JSON.stringify(result.errors, null, 2));
        }
        
        expect(result.valid).toBe(true);
        expect(serverDetail).toHaveProperty('name');
        expect(serverDetail).toHaveProperty('description');
        expect(serverDetail).toHaveProperty('version');
      }
    });

    it('should handle search parameter', async () => {
      const response = await request(app)
        .get('/v0.1/servers?search=github')
        .expect(200);
      
      const result = validateResponse(response.body, 'ServerList');
      expect(result.valid).toBe(true);
    });

    it('should handle limit parameter', async () => {
      const response = await request(app)
        .get('/v0.1/servers?limit=10')
        .expect(200);
      
      const result = validateResponse(response.body, 'ServerList');
      expect(result.valid).toBe(true);
      expect(response.body.metadata.count).toBeLessThanOrEqual(10);
    });
  });

  describe('GET /v0.1/servers/:serverName/versions/latest', () => {
    it('should return response matching ServerResponse schema', async () => {
      const response = await request(app)
        .get('/v0.1/servers/github-mcp-server/versions/latest')
        .expect('Content-Type', /json/)
        .expect(200);
      
      const result = validateResponse(response.body, 'ServerResponse');
      
      if (!result.valid) {
        console.log('Response body:', JSON.stringify(response.body, null, 2));
        console.log('Validation errors:', JSON.stringify(result.errors, null, 2));
      }
      
      expect(result.valid).toBe(true);
      expect(response.body).toHaveProperty('server');
      expect(response.body).toHaveProperty('_meta');
    });

    it('should validate isLatest flag in metadata', async () => {
      const response = await request(app)
        .get('/v0.1/servers/github-mcp-server/versions/latest')
        .expect(200);
      
      expect(response.body._meta['io.modelcontextprotocol.registry/official'].isLatest).toBe(true);
    });
  });

  describe('GET /v0.1/servers/:serverName/versions/:version', () => {
    it('should return response matching ServerResponse schema', async () => {
      const response = await request(app)
        .get('/v0.1/servers/github-mcp-server/versions/1.0.0')
        .expect('Content-Type', /json/)
        .expect(200);
      
      const result = validateResponse(response.body, 'ServerResponse');
      
      if (!result.valid) {
        console.log('Response body:', JSON.stringify(response.body, null, 2));
        console.log('Validation errors:', JSON.stringify(result.errors, null, 2));
      }
      
      expect(result.valid).toBe(true);
    });

    it('should handle URL-encoded server names', async () => {
      const encodedName = encodeURIComponent('io.github.githubcopilot/github-mcp-server');
      const response = await request(app)
        .get(`/v0.1/servers/${encodedName}/versions/1.0.0`)
        .expect(200);
      
      const result = validateResponse(response.body, 'ServerResponse');
      expect(result.valid).toBe(true);
    });
  });

  describe('GET /v0.1/servers/:serverName/versions', () => {
    it('should return response matching ServerList schema', async () => {
      const response = await request(app)
        .get('/v0.1/servers/github-mcp-server/versions')
        .expect('Content-Type', /json/)
        .expect(200);
      
      const result = validateResponse(response.body, 'ServerList');
      
      if (!result.valid) {
        console.log('Response body:', JSON.stringify(response.body, null, 2));
        console.log('Validation errors:', JSON.stringify(result.errors, null, 2));
      }
      
      expect(result.valid).toBe(true);
    });
  });

  describe('Error Responses', () => {
    it('should return proper error format for 404', async () => {
      const response = await request(app)
        .get('/v0.1/servers/non-existent-server/versions/latest')
        .expect('Content-Type', /json/)
        .expect(404);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Server not found');
    });
  });
});
