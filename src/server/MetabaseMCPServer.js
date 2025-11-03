import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { ApiClient } from './utils/apiClient.js';
import { CardHandlers } from './handlers/cardHandlers.js';
import { DashboardHandlers } from './handlers/dashboardHandlers.js';
import { DatabaseHandlers } from './handlers/databaseHandlers.js';
import { CollectionHandlers } from './handlers/collectionHandlers.js';
import { QueryHandlers } from './handlers/queryHandlers.js';
import { FieldHandlers } from './handlers/fieldHandlers.js';
import { SegmentMetricHandlers } from './handlers/segmentMetricHandlers.js';
import { UserHandlers } from './handlers/userHandlers.js';
import { TOOL_DEFINITIONS } from './config/toolDefinitions.js';
import { ConfigurationError, ToolExecutionError } from '../shared/errors/MetabaseError.js';
import { logger } from '../shared/utils/logger.js';

/**
 * MCP Server for Metabase API integration
 */
export class MetabaseMCPServer {
  constructor(config) {
    this.config = config;
    this.logger = logger.child('MetabaseMCPServer');
    
    // Initialize API client
    this.apiClient = new ApiClient(
      config.metabaseUrl,
      config.apiKey,
      config.requestTimeout
    );
    
    // Initialize handlers
    this.cardHandlers = new CardHandlers(this.apiClient);
    this.dashboardHandlers = new DashboardHandlers(this.apiClient);
    this.databaseHandlers = new DatabaseHandlers(this.apiClient);
    this.collectionHandlers = new CollectionHandlers(this.apiClient);
    this.queryHandlers = new QueryHandlers(this.apiClient);
    this.fieldHandlers = new FieldHandlers(this.apiClient);
    this.segmentMetricHandlers = new SegmentMetricHandlers(this.apiClient);
    this.userHandlers = new UserHandlers(this.apiClient);
    
    // Create MCP server
    this.server = new Server(
      {
        name: 'metabase-mcp-server',
        version: '2.0.0',
        instructions: this.getServerInstructions(),
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  /**
   * Get server instructions for LLMs
   */
  getServerInstructions() {
    return `# Metabase MCP Server - General Guidelines

## 🎯 Core Principles
1. **Always start with discovery**: Use search or list operations before diving into specific operations
2. **Understand before executing**: Use get_card to inspect SQL queries before executing them
3. **Be mindful of performance**: Some operations return large datasets (15k+ cards, comprehensive metadata)
4. **Check permissions**: Some tools require admin access (list_users)
5. **Use MCP Snowflake for advanced analysis**: If you need to run custom SQL or validate findings, use the MCP Snowflake integration.

## 📊 Recommended Workflows

### When analyzing a card/question:
1. Use list_cards or search to find relevant cards by name/description
2. Use get_card to see the SQL query and understand what it does
3. Check if parameters are needed before executing
4. Use execute_card_query to get actual data

### When exploring a database:
1. Use list_databases to see available data sources
2. Use get_database_metadata for comprehensive schema information
3. Use get_table_metadata to understand specific tables
4. Use execute_native_query for custom SQL (validate first!)

### When finding content:
1. Use list_collections to browse organizational structure
2. Use get_collection_items to see what's in a specific folder
3. Use list_cards with filters for targeted searches

## ⚠️ Important Notes

### Risk Levels:
- **🟢 SAFE tools**: Read-only operations, no data modification, safe to use anytime
- **🟡 MODERATE RISK tools**: Execute queries (read-only but may be slow/resource-intensive)
- Card IDs and Dashboard IDs can be found in Metabase URLs or through search/list operations
- Database IDs are required for many operations - get them from list_databases
- Some tools may not be available in all Metabase versions (list_metrics, get_activity) - they fail gracefully

### Performance Considerations:
- list_cards can return 15k+ items - results are limited to first 50 in display
- get_database_metadata returns ALL tables and columns - can be very large
- execute_card_query and execute_native_query may take time for complex queries
- Use targeted searches instead of listing everything when possible

### SQL Queries:
- All queries returned are read-only - you cannot modify them through this interface
- When executing native queries, always validate SQL syntax first
- Parameters in card queries should match the card's expected parameter format

## 🚀 Quick Tips
- Card IDs are visible in Metabase URLs: /question/[ID]
- Dashboard IDs are in URLs: /dashboard/[ID]
- Use "root" as collectionId to access the root collection
- Admin-only tools will return 403 errors if you lack permissions
- Empty arrays from list_metrics or get_activity indicate the feature isn't available in your Metabase version`;
  }

  /**
   * Setup tool handlers
   */
  setupToolHandlers() {
    // List tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      this.logger.debug('Listing tools');
      return {
        tools: TOOL_DEFINITIONS,
      };
    });

    // Call tool
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      this.logger.info('Tool called', { toolName: name, args });

      try {
        const result = await this.executeTool(name, args);
        this.logger.info('Tool executed successfully', { toolName: name });
        return result;
      } catch (error) {
        this.logger.error('Tool execution failed', error, { toolName: name, args });
        
        return {
          content: [
            {
              type: 'text',
              text: `Error executing ${name}: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  /**
   * Execute a tool by name
   */
  async executeTool(name, args) {
    switch (name) {
      // Card tools
      case 'get_card':
        return await this.cardHandlers.getCard(args.cardId);
      case 'list_cards':
        return await this.cardHandlers.listCards(args.filter, args.modelId);
      case 'execute_card_query':
        return await this.cardHandlers.executeCardQuery(args.cardId, args.parameters);
      case 'execute_query_builder_card':
        return await this.cardHandlers.executeQueryBuilderCard(args.cardId, args.parameters);
      case 'get_generated_sql':
        return await this.cardHandlers.getGeneratedSQL(args.cardId, args.parameters);
      
      // Dashboard tools
      case 'get_dashboard':
        return await this.dashboardHandlers.getDashboard(args.dashboardId);
      case 'list_dashboards':
        return await this.dashboardHandlers.listDashboards();
      case 'get_card_with_parameters':
        return await this.dashboardHandlers.getCardWithParameters(args.url);
      
      // Database tools
      case 'get_database':
        return await this.databaseHandlers.getDatabase(args.databaseId);
      case 'list_databases':
        return await this.databaseHandlers.listDatabases();
      case 'get_database_metadata':
        return await this.databaseHandlers.getDatabaseMetadata(args.databaseId);
      case 'list_database_tables':
        return await this.databaseHandlers.listDatabaseTables(args.databaseId);
      case 'get_table_metadata':
        return await this.databaseHandlers.getTableMetadata(args.tableId);
      
      // Collection tools
      case 'list_collections':
        return await this.collectionHandlers.listCollections(args.namespace);
      case 'get_collection_items':
        return await this.collectionHandlers.getCollectionItems(args.collectionId, args.models);
      
      // Query execution
      case 'execute_native_query':
        return await this.queryHandlers.executeNativeQuery(args.databaseId, args.query);
      
      // Field tools
      case 'get_field':
        return await this.fieldHandlers.getField(args.fieldId);
      case 'get_field_values':
        return await this.fieldHandlers.getFieldValues(args.fieldId);
      
      // Segments & Metrics
      case 'list_segments':
        return await this.segmentMetricHandlers.listSegments();
      case 'list_metrics':
        return await this.segmentMetricHandlers.listMetrics();
      
      // Activity & Users
      case 'get_activity':
        return await this.userHandlers.getActivity(args.limit);
      case 'get_current_user':
        return await this.userHandlers.getCurrentUser();
      case 'list_users':
        return await this.userHandlers.listUsers();
      
      default:
        throw new ToolExecutionError(
          `Unknown tool: ${name}`,
          name,
          null
        );
    }
  }

  /**
   * Setup error handling and process signals
   */
  setupErrorHandling() {
    this.server.onerror = (error) => {
      this.logger.error('MCP Server error', error);
    };

    process.on('SIGINT', async () => {
      this.logger.info('Received SIGINT, shutting down gracefully');
      await this.server.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      this.logger.info('Received SIGTERM, shutting down gracefully');
      await this.server.close();
      process.exit(0);
    });
  }

  /**
   * Run the server
   */
  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    this.logger.info('Metabase MCP server running on stdio');
  }
}

