const baseConfig = require('./jest.config.js');

module.exports = {
  ...baseConfig,
  testMatch: [
    '**/tests/integration.test.js'
  ],
  testPathIgnorePatterns: [
    '/node_modules/'
  ],
  collectCoverageFrom: []
};
