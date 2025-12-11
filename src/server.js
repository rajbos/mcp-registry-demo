const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`MCP Registry API server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/v0.1/servers`);
});
