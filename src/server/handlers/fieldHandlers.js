import { Validators } from '../../shared/utils/validators.js';
import { logger } from '../../shared/utils/logger.js';

/**
 * Handlers for field-related operations
 */
export class FieldHandlers {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.logger = logger.child('FieldHandlers');
  }

  /**
   * Get a field by ID
   */
  async getField(fieldId) {
    Validators.validateFieldId(fieldId);
    
    this.logger.debug('Getting field', { fieldId });
    const field = await this.apiClient.makeRequest(`/api/field/${fieldId}`);
    
    return {
      content: [
        {
          type: 'text',
          text: `Field Information:
ID: ${field.id}
Name: ${field.name}
Display Name: ${field.display_name}
Type: ${field.base_type}
Semantic Type: ${field.semantic_type || 'None'}
Description: ${field.description || 'No description'}
Table: ${field.table?.name}`,
        },
      ],
    };
  }

  /**
   * Get field values
   */
  async getFieldValues(fieldId) {
    Validators.validateFieldId(fieldId);
    
    this.logger.debug('Getting field values', { fieldId });
    const values = await this.apiClient.makeRequest(`/api/field/${fieldId}/values`);
    
    const distinctValues = values.values || [];
    
    return {
      content: [
        {
          type: 'text',
          text: `Field Values (ID: ${fieldId}):
Total Distinct Values: ${distinctValues.length}

${distinctValues.length > 0 ? `Values:\n${distinctValues.slice(0, 100).join(', ')}${distinctValues.length > 100 ? `\n... and ${distinctValues.length - 100} more values` : ''}` : 'No values found'}`,
        },
      ],
    };
  }
}

