import { Validators } from '../../shared/utils/validators.js';
import { logger } from '../../shared/utils/logger.js';

/**
 * Handlers for query execution operations
 */
export class QueryHandlers {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.logger = logger.child('QueryHandlers');
  }

  /**
   * Execute a native SQL query
   */
  async executeNativeQuery(databaseId, query) {
    Validators.validateDatabaseId(databaseId);
    Validators.validateQuery(query);
    
    this.logger.debug('Executing native query', { databaseId, queryLength: query.length });
    
    const body = {
      database: databaseId,
      type: 'native',
      native: {
        query: query,
      },
    };

    const results = await this.apiClient.makeRequest('/api/dataset', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    
    return {
      content: [
        {
          type: 'text',
          text: `Query Execution Results:
Database: ${databaseId}
Query: ${query}

Results:
${JSON.stringify(results, null, 2)}`,
        },
      ],
    };
  }
}

