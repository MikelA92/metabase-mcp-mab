/**
 * Backward compatibility wrapper for MetabaseClient
 * Re-exports everything from the new MetabaseClient module
 */

export { 
  MetabaseClient as default,
  MetabaseClient,
  createMetabaseClient,
  createDefaultClient,
  DEFAULT_CONFIG
} from './MetabaseClient.js';
