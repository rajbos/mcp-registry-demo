/**
 * Integration tests for GitHub Pages deployment
 * These tests validate the deployed endpoints on GitHub Pages
 */

const https = require('https');
const http = require('http');

// Base URL for the deployed site - can be overridden via environment variable
const BASE_URL = process.env.PAGES_URL || 'https://rajbos.github.io/mcp-registry-demo';

/**
 * Helper function to fetch JSON from a URL with redirect support
 */
function fetchJson(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    // Choose http or https based on URL protocol
    const client = url.startsWith('https:') ? https : http;
    client.get(url, (res) => {
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        if (maxRedirects === 0) {
          reject(new Error('Too many redirects'));
          return;
        }
        fetchJson(res.headers.location, maxRedirects - 1)
          .then(resolve)
          .catch(reject);
        return;
      }
      
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          return;
        }
        
        try {
          const json = JSON.parse(data);
          resolve({ statusCode: res.statusCode, headers: res.headers, body: json });
        } catch (error) {
          reject(new Error(`Failed to parse JSON: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Helper function to retry a request with exponential backoff
 */
async function fetchJsonWithRetry(url, maxRetries = 3, initialDelay = 1000) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetchJson(url);
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

describe('GitHub Pages Integration Tests', () => {
  // Increase timeout for network requests and retries (up to 7s for 3 retries with backoff)
  jest.setTimeout(20000);

  describe('Root endpoint', () => {
    it('should return API information at root', async () => {
      const response = await fetchJsonWithRetry(`${BASE_URL}/index.json`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('endpoints');
      expect(response.body.version).toBe('v0.1');
    });
  });

  describe('GET /v0.1/servers', () => {
    it('should return list of servers with correct structure', async () => {
      const response = await fetchJsonWithRetry(`${BASE_URL}/v0.1/servers/index.json`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('metadata');
      expect(response.body).toHaveProperty('servers');
      expect(Array.isArray(response.body.servers)).toBe(true);
      expect(response.body.metadata).toHaveProperty('total');
      expect(response.body.metadata).toHaveProperty('limit');
    });

    it('should validate server object structure', async () => {
      const response = await fetchJsonWithRetry(`${BASE_URL}/v0.1/servers/index.json`);
      
      expect(response.body.servers.length).toBeGreaterThan(0);
      
      const server = response.body.servers[0];
      expect(server).toHaveProperty('id');
      expect(server).toHaveProperty('name');
      expect(server).toHaveProperty('description');
      expect(server).toHaveProperty('version');
      expect(server).toHaveProperty('updated_at');
      expect(server).toHaveProperty('owner');
      expect(server).toHaveProperty('packages');
      expect(server).toHaveProperty('runtime');
      expect(server).toHaveProperty('isLatest');
      
      // Validate packages array
      expect(Array.isArray(server.packages)).toBe(true);
      if (server.packages.length > 0) {
        expect(server.packages[0]).toHaveProperty('type');
        expect(server.packages[0]).toHaveProperty('url');
      }
      
      // Validate runtime object
      expect(server.runtime).toHaveProperty('type');
      expect(server.runtime).toHaveProperty('entry');
    });
  });

  describe('GET /v0.1/servers/:serverName/versions/latest', () => {
    it('should return latest version of github-mcp-server', async () => {
      const response = await fetchJsonWithRetry(`${BASE_URL}/v0.1/servers/github-mcp-server/versions/latest/index.json`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'github-mcp-server');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('isLatest', true);
      expect(response.body).toHaveProperty('description');
      expect(response.body).toHaveProperty('owner');
      expect(response.body).toHaveProperty('packages');
      expect(response.body).toHaveProperty('runtime');
    });
  });

  describe('GET /v0.1/servers/:serverName/versions/:version', () => {
    it('should return specific version of github-mcp-server', async () => {
      const response = await fetchJsonWithRetry(`${BASE_URL}/v0.1/servers/github-mcp-server/versions/1.0.0/index.json`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'github-mcp-server');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('description');
      expect(response.body).toHaveProperty('owner');
      expect(response.body).toHaveProperty('packages');
      expect(response.body).toHaveProperty('runtime');
    });
  });
});
