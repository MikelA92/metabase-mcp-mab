/**
 * Metabase API Client
 * Comprehensive client for interacting with Metabase API
 * Version 2.0 - Refactored with shared utilities and error handling
 */

import { ApiError, ValidationError } from '../shared/errors/MetabaseError.js';
import { Validators } from '../shared/utils/validators.js';
import { DashboardUrlDecoder } from '../shared/utils/urlDecoder.js';
import { logger } from '../shared/utils/logger.js';

export class MetabaseClient {
  constructor(metabaseUrl, apiKey, timeout = 30000) {
    this.metabaseUrl = metabaseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = apiKey;
    this.timeout = timeout;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
    };
    this.logger = logger.child('MetabaseClient');
  }

  /**
   * Make an authenticated API request to Metabase
   * @param {string} endpoint - API endpoint (e.g., '/api/card/123')
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} JSON response
   */
  async makeRequest(endpoint, options = {}) {
    const url = `${this.metabaseUrl}${endpoint}`;
    const requestOptions = {
      headers: { ...this.defaultHeaders },
      ...options,
    };

    this.logger.debug('Making API request', { endpoint, method: requestOptions.method || 'GET' });

    try {
      const response = await this.fetchWithTimeout(url, requestOptions, this.timeout);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new ApiError(
          `API request failed: ${response.status} ${response.statusText}`,
          response.status,
          endpoint,
          errorText
        );
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new ApiError(
          'Non-JSON response received',
          response.status,
          endpoint,
          text.substring(0, 500)
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      this.logger.error('Unexpected error during API request', error, { endpoint });
      throw new ApiError(
        `Unexpected error: ${error.message}`,
        0,
        endpoint,
        error.message
      );
    }
  }

  /**
   * Fetch with timeout support
   */
  async fetchWithTimeout(url, options = {}, timeout = 30000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      
      throw error;
    }
  }

  // ========================================
  // CARD METHODS
  // ========================================

  /**
   * Get a specific card/question by ID
   */
  async getCard(cardId) {
    Validators.validateCardId(cardId);

    const card = await this.makeRequest(`/api/card/${cardId}`);
    
    return {
      id: card.id,
      name: card.name,
      description: card.description,
      sqlQuery: card.dataset_query?.native?.query || null,
      databaseId: card.dataset_query?.database,
      queryType: card.dataset_query?.type,
      createdAt: card.created_at,
      updatedAt: card.updated_at,
      rawData: card,
    };
  }

  /**
   * List cards with optional filtering
   */
  async listCards(filter = 'all', modelId = null) {
    const params = new URLSearchParams({ f: filter });
    if (modelId) {
      params.append('model_id', modelId);
    }
    
    const response = await this.makeRequest(`/api/card/?${params}`);
    const cards = Array.isArray(response) ? response : response.data || [];
    
    return cards.map(card => ({
      id: card.id,
      name: card.name,
      description: card.description,
      databaseId: card.dataset_query?.database,
      queryType: card.dataset_query?.type,
      createdAt: card.created_at,
      updatedAt: card.updated_at,
    }));
  }

  /**
   * Execute a card query and return results
   */
  async executeCardQuery(cardId, parameters = {}) {
    Validators.validateCardId(cardId);

    const queryParams = new URLSearchParams();
    Object.entries(parameters).forEach(([key, value]) => {
      queryParams.append(key, value);
    });

    const endpoint = `/api/card/${cardId}/query${queryParams.toString() ? `?${queryParams}` : ''}`;
    return await this.makeRequest(endpoint, { method: 'POST' });
  }

  /**
   * Extract SQL query from a card (convenience method)
   */
  async getCardSQL(cardId) {
    const card = await this.getCard(cardId);
    return card.sqlQuery;
  }

  // ========================================
  // DASHBOARD METHODS
  // ========================================

  /**
   * Get a dashboard by ID
   */
  async getDashboard(dashboardId) {
    Validators.validateDashboardId(dashboardId);

    const dashboard = await this.makeRequest(`/api/dashboard/${dashboardId}`);
    
    return {
      id: dashboard.id,
      name: dashboard.name,
      description: dashboard.description,
      cards: dashboard.dashcards?.map(dc => ({
        cardId: dc.card_id,
        cardName: dc.card?.name,
        row: dc.row,
        col: dc.col,
        sizeX: dc.size_x,
        sizeY: dc.size_y,
      })) || [],
      createdAt: dashboard.created_at,
      updatedAt: dashboard.updated_at,
      rawData: dashboard,
    };
  }

  /**
   * List all dashboards
   */
  async listDashboards() {
    const dashboards = await this.makeRequest('/api/dashboard');
    
    return dashboards.map(d => ({
      id: d.id,
      name: d.name,
      description: d.description,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }));
  }

  // ========================================
  // DATABASE METHODS
  // ========================================

  /**
   * Get database information by ID
   */
  async getDatabase(databaseId) {
    Validators.validateDatabaseId(databaseId);

    const database = await this.makeRequest(`/api/database/${databaseId}`);
    
    return {
      id: database.id,
      name: database.name,
      engine: database.engine,
      description: database.description,
      createdAt: database.created_at,
      updatedAt: database.updated_at,
      rawData: database,
    };
  }

  /**
   * List all available databases
   */
  async listDatabases() {
    const response = await this.makeRequest('/api/database/');
    const databases = Array.isArray(response) ? response : response.data || [];
    
    return databases.map(db => ({
      id: db.id,
      name: db.name,
      engine: db.engine,
      description: db.description,
      createdAt: db.created_at,
      updatedAt: db.updated_at,
    }));
  }

  /**
   * Get complete metadata for a database including all tables and fields
   */
  async getDatabaseMetadata(databaseId) {
    Validators.validateDatabaseId(databaseId);

    const metadata = await this.makeRequest(`/api/database/${databaseId}/metadata`);
    
    return {
      id: metadata.id,
      name: metadata.name,
      engine: metadata.engine,
      tables: metadata.tables?.map(t => ({
        id: t.id,
        name: t.name,
        schema: t.schema,
        fields: t.fields?.map(f => ({
          id: f.id,
          name: f.name,
          type: f.base_type,
        })) || [],
      })) || [],
      rawData: metadata,
    };
  }

  /**
   * List all tables in a database
   */
  async listDatabaseTables(databaseId) {
    Validators.validateDatabaseId(databaseId);

    // Use metadata endpoint as /tables endpoint doesn't exist
    const metadata = await this.makeRequest(`/api/database/${databaseId}/metadata`);
    
    return (metadata.tables || []).map(t => ({
      id: t.id,
      name: t.name,
      schema: t.schema,
      description: t.description,
    }));
  }

  /**
   * Get detailed metadata for a specific table
   */
  async getTableMetadata(tableId) {
    Validators.validateTableId(tableId);

    const table = await this.makeRequest(`/api/table/${tableId}/query_metadata`);
    
    return {
      id: table.id,
      name: table.name,
      schema: table.schema,
      database: table.db,
      fields: table.fields?.map(f => ({
        id: f.id,
        name: f.name,
        displayName: f.display_name,
        type: f.base_type,
        semanticType: f.semantic_type,
        description: f.description,
      })) || [],
      rawData: table,
    };
  }

  // ========================================
  // COLLECTION METHODS
  // ========================================

  /**
   * List all collections
   */
  async listCollections(namespace = null) {
    const params = namespace ? new URLSearchParams({ namespace }) : '';
    const collections = await this.makeRequest(`/api/collection/${params ? '?' + params : ''}`);
    
    return collections.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      slug: c.slug,
    }));
  }

  /**
   * Get all items in a collection
   */
  async getCollectionItems(collectionId, models = null) {
    Validators.validateCollectionId(collectionId);

    const params = models && models.length > 0 ? new URLSearchParams({ models: models.join(',') }) : '';
    const items = await this.makeRequest(`/api/collection/${collectionId}/items${params ? '?' + params : ''}`);
    
    return {
      data: items.data?.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        model: item.model,
      })) || [],
      total: items.total || 0,
    };
  }

  // ========================================
  // QUERY EXECUTION METHODS
  // ========================================

  /**
   * Execute an ad-hoc native SQL query
   */
  async executeNativeQuery(databaseId, query) {
    Validators.validateDatabaseId(databaseId);
    Validators.validateQuery(query);

    const body = {
      database: databaseId,
      type: 'native',
      native: {
        query: query,
      },
    };

    return await this.makeRequest('/api/dataset', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // ========================================
  // FIELD METHODS
  // ========================================

  /**
   * Get detailed information about a field
   */
  async getField(fieldId) {
    Validators.validateFieldId(fieldId);

    const field = await this.makeRequest(`/api/field/${fieldId}`);
    
    return {
      id: field.id,
      name: field.name,
      displayName: field.display_name,
      type: field.base_type,
      semanticType: field.semantic_type,
      description: field.description,
      table: field.table,
      rawData: field,
    };
  }

  /**
   * Get distinct values for a field
   */
  async getFieldValues(fieldId) {
    Validators.validateFieldId(fieldId);

    const values = await this.makeRequest(`/api/field/${fieldId}/values`);
    
    return values.values || [];
  }

  // ========================================
  // SEGMENTS & METRICS METHODS
  // ========================================

  /**
   * List all segments (saved filters)
   */
  async listSegments() {
    const segments = await this.makeRequest('/api/segment');
    
    return segments.map(s => ({
      id: s.id,
      name: s.name,
      description: s.description,
      tableId: s.table_id,
      table: s.table,
    }));
  }

  /**
   * List all metrics (saved aggregations)
   */
  async listMetrics() {
    try {
      const metrics = await this.makeRequest('/api/metric');
      
      return metrics.map(m => ({
        id: m.id,
        name: m.name,
        description: m.description,
        tableId: m.table_id,
        table: m.table,
      }));
    } catch (error) {
      // Metrics endpoint may not exist in all Metabase versions
      if (error.statusCode === 404) {
        return [];
      }
      throw error;
    }
  }

  // ========================================
  // ACTIVITY & USER METHODS
  // ========================================

  /**
   * Get recent activity feed
   */
  async getActivity(limit = 20) {
    Validators.validateLimit(limit, 1, 100);

    try {
      const activity = await this.makeRequest(`/api/activity?limit=${limit}`);
      
      return activity.map(a => ({
        id: a.id,
        topic: a.topic,
        timestamp: a.timestamp,
        user: a.user,
        details: a.details,
      }));
    } catch (error) {
      // Activity endpoint may not exist in all Metabase versions
      if (error.statusCode === 404) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Get current user information
   */
  async getCurrentUser() {
    const user = await this.makeRequest('/api/user/current');
    
    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      commonName: user.common_name,
      isAdmin: user.is_superuser,
      rawData: user,
    };
  }

  /**
   * List all users (requires admin permissions)
   */
  async listUsers() {
    const users = await this.makeRequest('/api/user/');
    
    return users.map(u => ({
      id: u.id,
      email: u.email,
      firstName: u.first_name,
      lastName: u.last_name,
      commonName: u.common_name,
      isAdmin: u.is_superuser,
    }));
  }

  // ========================================
  // DASHBOARD URL & PARAMETER METHODS
  // ========================================

  /**
   * Get card with parameters from dashboard URL
   */
  async getCardWithParameters(url) {
    Validators.validateUrl(url);
    
    const decoded = DashboardUrlDecoder.decode(url);
    const baseCard = await this.getCard(decoded.originalCardId);
    
    return {
      ...baseCard,
      extractedParameters: decoded.parameters,
      datasetQuery: decoded.datasetQuery,
      display: decoded.display,
      visualizationSettings: decoded.visualizationSettings,
      decodedData: decoded,
    };
  }

  /**
   * Execute a query builder card with specific parameters
   */
  async executeQueryBuilderCard(cardId, parameters) {
    Validators.validateCardId(cardId);

    // First, get the base card to understand its structure
    const baseCard = await this.makeRequest(`/api/card/${cardId}`);
    
    if (baseCard.dataset_query.type !== 'query') {
      throw new ValidationError(
        'Card is not a query-builder card',
        'cardId',
        cardId
      );
    }
    
    // Create a modified dataset query with the provided parameters
    const modifiedQuery = {
      ...baseCard.dataset_query,
      query: {
        ...baseCard.dataset_query.query,
        ...parameters,
      },
    };
    
    // Execute the query using the dataset endpoint
    const body = {
      database: baseCard.dataset_query.database,
      type: 'query',
      query: modifiedQuery.query,
    };

    return await this.makeRequest('/api/dataset', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * Get generated SQL for a query builder card with parameters
   */
  async getGeneratedSQL(cardId, parameters) {
    Validators.validateCardId(cardId);

    // Get the base card
    const baseCard = await this.makeRequest(`/api/card/${cardId}`);
    
    if (baseCard.dataset_query.type !== 'query') {
      throw new ValidationError(
        'Card is not a query-builder card',
        'cardId',
        cardId
      );
    }
    
    // Create a modified dataset query with the provided parameters
    const modifiedQuery = {
      ...baseCard.dataset_query,
      query: {
        ...baseCard.dataset_query.query,
        ...parameters,
      },
    };
    
    // Use the query endpoint to get the generated SQL
    const body = {
      database: baseCard.dataset_query.database,
      type: 'query',
      query: modifiedQuery.query,
    };

    // Try to get the SQL by using the query endpoint
    const results = await this.makeRequest('/api/dataset', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    
    // Extract SQL if available
    const sql = results.query || results.native?.query || 'SQL not available in response';
    
    return {
      cardId: cardId,
      cardName: baseCard.name,
      parameters: parameters,
      generatedSQL: sql,
      fullResults: results,
    };
  }

  // ========================================
  // CONVENIENCE METHODS
  // ========================================

  /**
   * Search for cards by name or description
   */
  async searchCards(searchTerm) {
    const allCards = await this.listCards('all');
    const searchLower = searchTerm.toLowerCase();
    return allCards.filter(card => 
      card.name.toLowerCase().includes(searchLower) ||
      (card.description && card.description.toLowerCase().includes(searchLower))
    );
  }

  /**
   * Search for dashboards by name or description
   */
  async searchDashboards(searchTerm) {
    const allDashboards = await this.listDashboards();
    const searchLower = searchTerm.toLowerCase();
    return allDashboards.filter(dashboard => 
      dashboard.name.toLowerCase().includes(searchLower) ||
      (dashboard.description && dashboard.description.toLowerCase().includes(searchLower))
    );
  }

  /**
   * Get cards by database ID
   */
  async getCardsByDatabase(databaseId) {
    const allCards = await this.listCards('all');
    return allCards.filter(card => card.databaseId === databaseId);
  }

  /**
   * Test the API connection
   */
  async testConnection() {
    try {
      await this.listDatabases();
      return true;
    } catch (error) {
      this.logger.error('Metabase connection test failed', error);
      return false;
    }
  }
}

// Export for use in other modules
export default MetabaseClient;

// Factory functions
export function createMetabaseClient(metabaseUrl, apiKey, timeout) {
  return new MetabaseClient(metabaseUrl, apiKey, timeout);
}

// Default configuration (can be overridden)
export const DEFAULT_CONFIG = {
  metabaseUrl: process.env.METABASE_URL || 'https://data-metabase.swile.co',
};

// Convenience function to create client with default config
// Reads API key from environment variables for security
export function createDefaultClient() {
  const apiKey = process.env.METABASE_API_KEY;
  
  if (!apiKey) {
    throw new Error('METABASE_API_KEY environment variable is required. Please set it in your environment or mcp.json configuration.');
  }
  
  return new MetabaseClient(DEFAULT_CONFIG.metabaseUrl, apiKey);
}

