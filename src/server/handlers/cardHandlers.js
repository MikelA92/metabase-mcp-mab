import { Validators } from '../../shared/utils/validators.js';
import { logger } from '../../shared/utils/logger.js';

/**
 * Handlers for card-related operations
 */
export class CardHandlers {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.logger = logger.child('CardHandlers');
  }

  /**
   * Get a card by ID
   */
  async getCard(cardId) {
    Validators.validateCardId(cardId);
    
    this.logger.debug('Getting card', { cardId });
    const card = await this.apiClient.makeRequest(`/api/card/${cardId}`);
    
    const sqlQuery = card.dataset_query?.native?.query || 'No native SQL query found';
    const queryBuilder = card.dataset_query?.query ? JSON.stringify(card.dataset_query.query, null, 2) : null;
    
    const cardInfo = {
      id: card.id,
      name: card.name,
      description: card.description,
      sqlQuery: sqlQuery,
      databaseId: card.dataset_query?.database,
      queryType: card.dataset_query?.type,
      createdAt: card.created_at,
      updatedAt: card.updated_at,
    };

    let queryDetails = '';
    if (card.dataset_query?.type === 'native') {
      queryDetails = `SQL Query:\n${sqlQuery}`;
    } else if (card.dataset_query?.type === 'query' && queryBuilder) {
      queryDetails = `Query Builder Structure:\n${queryBuilder}`;
    } else {
      queryDetails = 'No query information available';
    }

    return {
      content: [
        {
          type: 'text',
          text: `Card Information:
ID: ${cardInfo.id}
Name: ${cardInfo.name}
Description: ${cardInfo.description || 'No description'}
Database ID: ${cardInfo.databaseId}
Query Type: ${cardInfo.queryType}
Created: ${cardInfo.createdAt}
Updated: ${cardInfo.updatedAt}

${queryDetails}`,
        },
      ],
    };
  }

  /**
   * List cards with optional filtering
   */
  async listCards(filter = 'all', modelId = null) {
    this.logger.debug('Listing cards', { filter, modelId });
    
    const params = new URLSearchParams({ f: filter });
    if (modelId) {
      params.append('model_id', modelId);
    }
    
    const response = await this.apiClient.makeRequest(`/api/card/?${params}`);
    const cards = Array.isArray(response) ? response : response.data || [];
    
    const cardList = cards.map(card => ({
      id: card.id,
      name: card.name,
      description: card.description,
      databaseId: card.dataset_query?.database,
      queryType: card.dataset_query?.type,
      createdAt: card.created_at,
    }));

    return {
      content: [
        {
          type: 'text',
          text: `Found ${cardList.length} cards (filter: ${filter}):
${cardList.slice(0, 50).map(card => 
  `- ID: ${card.id} | Name: ${card.name} | DB: ${card.databaseId} | Type: ${card.queryType}`
).join('\n')}${cardList.length > 50 ? `\n... and ${cardList.length - 50} more cards` : ''}`,
        },
      ],
    };
  }

  /**
   * Execute a card query
   */
  async executeCardQuery(cardId, parameters = {}) {
    Validators.validateCardId(cardId);
    
    this.logger.debug('Executing card query', { cardId, parameters });
    
    const queryParams = new URLSearchParams();
    Object.entries(parameters).forEach(([key, value]) => {
      queryParams.append(key, value);
    });

    const results = await this.apiClient.makeRequest(`/api/card/${cardId}/query?${queryParams}`, {
      method: 'POST',
    });
    
    return {
      content: [
        {
          type: 'text',
          text: `Query Results for Card ${cardId}:
${JSON.stringify(results, null, 2)}`,
        },
      ],
    };
  }

  /**
   * Execute a query builder card with specific parameters
   */
  async executeQueryBuilderCard(cardId, parameters) {
    Validators.validateCardId(cardId);
    
    this.logger.debug('Executing query builder card', { cardId, parameters });
    
    // First, get the base card to understand its structure
    const baseCard = await this.apiClient.makeRequest(`/api/card/${cardId}`);
    
    if (baseCard.dataset_query.type !== 'query') {
      throw new Error('Card is not a query-builder card');
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

    const results = await this.apiClient.makeRequest('/api/dataset', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    
    return {
      content: [
        {
          type: 'text',
          text: `Query Builder Card Execution Results:
Card ID: ${cardId}
Parameters Applied:
${JSON.stringify(parameters, null, 2)}

Results:
${JSON.stringify(results, null, 2)}`,
        },
      ],
    };
  }

  /**
   * Get generated SQL for a query builder card with parameters
   */
  async getGeneratedSQL(cardId, parameters) {
    Validators.validateCardId(cardId);
    
    this.logger.debug('Getting generated SQL', { cardId, parameters });
    
    // Get the base card
    const baseCard = await this.apiClient.makeRequest(`/api/card/${cardId}`);
    
    if (baseCard.dataset_query.type !== 'query') {
      throw new Error('Card is not a query-builder card');
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

    const results = await this.apiClient.makeRequest('/api/dataset', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    
    // Extract SQL if available
    const sql = results.query || results.native?.query || 'SQL not available in response';
    
    return {
      content: [
        {
          type: 'text',
          text: `Generated SQL for Query Builder Card:
Card ID: ${cardId}
Card Name: ${baseCard.name}

Parameters Applied:
${JSON.stringify(parameters, null, 2)}

Generated SQL:
${sql}

Full Query Response:
${JSON.stringify(results, null, 2)}`,
        },
      ],
    };
  }
}

