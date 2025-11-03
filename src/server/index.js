#!/usr/bin/env node

import { MetabaseMCPServer } from './MetabaseMCPServer.js';
import { ConfigurationError } from '../shared/errors/MetabaseError.js';
import { logger } from '../shared/utils/logger.js';

/**
 * Load and validate configuration
 */
function loadConfig() {
  const metabaseUrl = process.env.METABASE_URL || 'https://data-metabase.swile.co';
  const apiKey = process.env.METABASE_API_KEY;
  const requestTimeout = parseInt(process.env.REQUEST_TIMEOUT || '30000', 10);

  if (!apiKey) {
    throw new ConfigurationError(
      'METABASE_API_KEY environment variable is required. Please set it in your mcp.json configuration or environment.',
      'METABASE_API_KEY'
    );
  }

  return {
    metabaseUrl,
    apiKey,
    requestTimeout,
  };
}

/**
 * Main entry point
 */
async function main() {
  try {
    logger.info('Starting Metabase MCP Server');
    
    const config = loadConfig();
    logger.info('Configuration loaded', {
      metabaseUrl: config.metabaseUrl,
      requestTimeout: config.requestTimeout,
    });
    
    const server = new MetabaseMCPServer(config);
    await server.run();
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

// Run the server
main();

