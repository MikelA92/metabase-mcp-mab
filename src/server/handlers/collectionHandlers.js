import { Validators } from '../../shared/utils/validators.js';
import { logger } from '../../shared/utils/logger.js';

/**
 * Handlers for collection-related operations
 */
export class CollectionHandlers {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.logger = logger.child('CollectionHandlers');
  }

  /**
   * List all collections
   */
  async listCollections(namespace = null) {
    this.logger.debug('Listing collections', { namespace });
    
    const params = namespace ? new URLSearchParams({ namespace }) : '';
    const collections = await this.apiClient.makeRequest(`/api/collection/${params ? '?' + params : ''}`);
    
    return {
      content: [
        {
          type: 'text',
          text: `Collections:
${collections.map(c => 
  `- ID: ${c.id} | Name: ${c.name}${c.description ? ` | ${c.description}` : ''}`
).join('\n')}`,
        },
      ],
    };
  }

  /**
   * Get collection items
   */
  async getCollectionItems(collectionId, models = null) {
    Validators.validateCollectionId(collectionId);
    
    this.logger.debug('Getting collection items', { collectionId, models });
    
    const params = models && models.length > 0 ? new URLSearchParams({ models: models.join(',') }) : '';
    const items = await this.apiClient.makeRequest(`/api/collection/${collectionId}/items${params ? '?' + params : ''}`);
    
    return {
      content: [
        {
          type: 'text',
          text: `Items in Collection ${collectionId}:
Found ${items.data?.length || 0} items

${(items.data || []).map(item => 
  `- [${item.model}] ID: ${item.id} | Name: ${item.name}`
).join('\n')}`,
        },
      ],
    };
  }
}

