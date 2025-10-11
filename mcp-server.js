#!/usr/bin/env node

/**
 * MCP Server for NJCabinets API
 *
 * This server exposes the NJCabinets REST API through the Model Context Protocol (MCP),
 * allowing AI assistants like Claude to interact with the API.
 *
 * Usage:
 *   node mcp-server.js
 *
 * Configuration via environment variables:
 *   API_BASE_URL - Base URL for the API (default: http://localhost:8080)
 *   API_TOKEN - JWT token for authentication (required for authenticated endpoints)
 */

const { OpenAPIServer } = require('@openapi-mcp/server');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');

// Configuration
const config = {
  name: 'njcabinets-api',
  version: '8.2.3',
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:8080',
  openApiSpec: `${process.env.API_BASE_URL || 'http://localhost:8080'}/api-docs.json`,
  specInputMethod: 'url',
  headers: process.env.API_TOKEN ? {
    Authorization: `Bearer ${process.env.API_TOKEN}`,
  } : {},
  transportType: 'stdio',
  toolsMode: 'all', // Options: 'all', 'dynamic', 'explicit'
};

async function main() {
  try {
    console.error('Starting NJCabinets MCP Server...');
    console.error(`API Base URL: ${config.apiBaseUrl}`);
    console.error(`OpenAPI Spec: ${config.openApiSpec}`);
    console.error(`Authentication: ${config.headers.Authorization ? 'Enabled' : 'Disabled (set API_TOKEN env var)'}`);

    const server = new OpenAPIServer(config);
    const transport = new StdioServerTransport();

    await server.connect(transport);

    console.error('MCP Server started successfully!');
    console.error('Waiting for requests...');
  } catch (error) {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  }
}

main();
