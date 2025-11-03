import { Validators } from '../../shared/utils/validators.js';
import { logger } from '../../shared/utils/logger.js';

/**
 * Handlers for database-related operations
 */
export class DatabaseHandlers {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.logger = logger.child('DatabaseHandlers');
  }

  /**
   * Get a database by ID
   */
  async getDatabase(databaseId) {
    Validators.validateDatabaseId(databaseId);
    
    this.logger.debug('Getting database', { databaseId });
    const database = await this.apiClient.makeRequest(`/api/database/${databaseId}`);
    
    return {
      content: [
        {
          type: 'text',
          text: `Database Information:
ID: ${database.id}
Name: ${database.name}
Engine: ${database.engine}
Description: ${database.description || 'No description'}
Created: ${database.created_at}
Updated: ${database.updated_at}`,
        },
      ],
    };
  }

  /**
   * List all databases
   */
  async listDatabases() {
    this.logger.debug('Listing databases');
    const response = await this.apiClient.makeRequest('/api/database/');
    const databases = Array.isArray(response) ? response : response.data || [];
    
    return {
      content: [
        {
          type: 'text',
          text: `Available Databases (${databases.length}):
${databases.map(db => 
  `- ID: ${db.id} | Name: ${db.name} | Engine: ${db.engine}`
).join('\n')}`,
        },
      ],
    };
  }

  /**
   * Get database metadata
   */
  async getDatabaseMetadata(databaseId) {
    Validators.validateDatabaseId(databaseId);
    
    this.logger.debug('Getting database metadata', { databaseId });
    const metadata = await this.apiClient.makeRequest(`/api/database/${databaseId}/metadata`);
    
    const tables = metadata.tables?.map(t => ({
      id: t.id,
      name: t.name,
      schema: t.schema,
      fieldCount: t.fields?.length || 0,
    })) || [];

    return {
      content: [
        {
          type: 'text',
          text: `Database Metadata (ID: ${databaseId}):
Database: ${metadata.name}
Engine: ${metadata.engine}
Total Tables: ${tables.length}

Tables:
${tables.map(t => 
  `- ID: ${t.id} | Schema: ${t.schema} | Name: ${t.name} | Fields: ${t.fieldCount}`
).join('\n')}`,
        },
      ],
    };
  }

  /**
   * List database tables
   */
  async listDatabaseTables(databaseId) {
    Validators.validateDatabaseId(databaseId);
    
    this.logger.debug('Listing database tables', { databaseId });
    // Use metadata endpoint as /tables endpoint doesn't exist
    const metadata = await this.apiClient.makeRequest(`/api/database/${databaseId}/metadata`);
    const tables = metadata.tables || [];
    
    return {
      content: [
        {
          type: 'text',
          text: `Tables in Database ${databaseId}:
${tables.map(t => 
  `- ID: ${t.id} | Schema: ${t.schema} | Name: ${t.name}`
).join('\n')}`,
        },
      ],
    };
  }

  /**
   * Get table metadata
   */
  async getTableMetadata(tableId) {
    Validators.validateTableId(tableId);
    
    this.logger.debug('Getting table metadata', { tableId });
    const table = await this.apiClient.makeRequest(`/api/table/${tableId}/query_metadata`);
    
    const fields = table.fields?.map(f => ({
      id: f.id,
      name: f.name,
      type: f.base_type,
      description: f.description,
    })) || [];

    return {
      content: [
        {
          type: 'text',
          text: `Table Metadata:
ID: ${table.id}
Name: ${table.name}
Schema: ${table.schema}
Database: ${table.db?.name}
Total Fields: ${fields.length}

Fields:
${fields.map(f => 
  `- ${f.name} (${f.type})${f.description ? ` - ${f.description}` : ''}`
).join('\n')}`,
        },
      ],
    };
  }
}

