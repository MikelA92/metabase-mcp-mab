#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

//
// Metabase configuration
const METABASE_URL = process.env.METABASE_URL || 'https://data-metabase.swile.co';
const API_KEY = process.env.METABASE_API_KEY;

if (!API_KEY) {
  throw new Error('METABASE_API_KEY environment variable is required. Please set it in your mcp.json configuration or environment.');
}

class MetabaseMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'metabase-mcp-server',
        version: '2.1.0',
        instructions: `# Metabase MCP Server - General Guidelines

## 🎯 Core Principles
1. **Always start with discovery**: Use search_metabase or list_databases before diving into specific operations
2. **Understand before executing**: Use get_card to inspect SQL queries before executing them
3. **Be mindful of performance**: Some operations return large datasets (15k+ cards, comprehensive metadata)
4. **Check permissions**: Some tools require admin access (list_users)
5. **Use MCP Snowflake for advanced analysis**: If you need to run custom SQL or validate findings, use the MCP Snowflake integration.

## 🔒 CRITICAL SAFETY RULES FOR WRITE OPERATIONS (PUT & POST)

### ⛔ MANDATORY USER VALIDATION BEFORE ANY WRITE OPERATION
**ALWAYS follow these steps for ANY PUT or POST operation:**

1. **STOP and ASK for explicit user confirmation** - Never execute write operations without user approval
2. **EXPLAIN what will be created/modified** - Clearly describe the operation and its impact
3. **SHOW the exact data** that will be sent to the API
4. **WAIT for explicit "yes", "confirm", or "proceed"** from the user
5. **Only then execute** the operation after receiving confirmation

### 🚨 Write Operations Requiring Explicit User Confirmation:
- ✏️ **create_card**: Creating new questions/cards
- ✏️ **update_card**: Modifying existing questions/cards
- 📁 **create_collection**: Creating new collections/folders
- 📁 **update_collection**: Modifying existing collections
- 📊 **create_dashboard**: Creating new dashboards
- 📊 **update_dashboard**: Modifying existing dashboards
- 📊 **update_dashboard_cards**: Adding/removing/repositioning cards on dashboards
- 🗄️ **create_database**: Creating new database connections (REQUIRES ADMIN)
- 🗄️ **update_database**: Modifying database connections (REQUIRES ADMIN)

### Example User Interaction for Write Operations:
\`\`\`
❌ WRONG: Directly executing create_card without asking
✅ CORRECT:
1. "I will create a new card with the following details:
   - Name: 'Monthly Sales Report'
   - Query: SELECT * FROM sales WHERE month = '2024-11'
   - Display: table
   - Collection: Sales Reports (ID: 5)
   
   Do you want me to proceed with creating this card? (yes/no)"
2. Wait for user response
3. Only if user says "yes", "confirm", or "proceed", then execute the operation
\`\`\`

### 🔴 Risk Levels:
- **🟢 SAFE tools**: Read-only operations, no data modification, safe to use anytime (no confirmation needed)
- **🟡 MODERATE RISK tools**: Execute queries (read-only but may be slow/resource-intensive - no confirmation needed)
- **🔴 HIGH RISK tools**: Write operations that create/modify resources (ALWAYS require user confirmation)
- **🔴 VERY HIGH RISK tools**: Database connection operations (ALWAYS require user confirmation + admin permissions)

## 📊 Recommended Workflows

### When analyzing a card/question:
1. Use search_metabase to find relevant cards by name/description
2. Use get_card to see the SQL query and understand what it does
3. Check if parameters are needed before executing
4. Use execute_card_query to get actual data

### When creating or modifying resources (REQUIRES USER CONFIRMATION):
1. **First**: Gather all necessary information (names, IDs, queries, etc.)
2. **Then**: Present the complete operation details to the user
3. **Ask**: "Do you want me to proceed with this operation?"
4. **Wait**: For explicit user confirmation
5. **Only then**: Execute the write operation
6. **Never skip** asking for confirmation, even if the user seems to expect it

### When exploring a database:
1. Use list_databases to see available data sources
2. Use get_database_metadata for comprehensive schema information
3. Use get_table_metadata to understand specific tables
4. Use execute_native_query for custom SQL (validate first!)

### When finding content:
1. Prefer search_metabase - it's the fastest way to find cards, dashboards, collections
2. Use list_collections to browse organizational structure
3. Use get_collection_items to see what's in a specific folder

## ⚠️ Important Notes

### Permissions:
- Card IDs and Dashboard IDs can be found in Metabase URLs or through search/list operations
- Database IDs are required for many operations - get them from list_databases
- Some tools may not be available in all Metabase versions (list_metrics, get_activity) - they fail gracefully
- Database creation/modification requires admin permissions

### Performance Considerations:
- list_cards can return 15k+ items - results are limited to first 50 in display
- get_database_metadata returns ALL tables and columns - can be very large
- execute_card_query and execute_native_query may take time for complex queries
- Use search_metabase instead of listing everything when possible

### SQL Queries:
- All queries returned are read-only - you cannot modify them through this interface
- When executing native queries, always validate SQL syntax first
- Parameters in card queries should match the card's expected parameter format

## 🚀 Quick Tips
- Card IDs are visible in Metabase URLs: /question/[ID]
- Dashboard IDs are in URLs: /dashboard/[ID]
- Use "root" as collectionId to access the root collection
- Admin-only tools will return 403 errors if you lack permissions
- Empty arrays from list_metrics or get_activity indicate the feature isn't available in your Metabase version
- NEVER execute write operations (PUT/POST) without explicit user confirmation`,
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

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          // ========== CARD TOOLS (Read-Only, Safe) ==========
          {
            name: 'get_card',
            description: '🔍 [SAFE] Get a Metabase card/question by ID, including its SQL query. Use this when you need to see the SQL behind a specific question or analyze how a card is built. Risk: None - read-only operation.',
            inputSchema: {
              type: 'object',
              properties: {
                cardId: {
                  type: 'integer',
                  description: 'The ID of the card/question to retrieve',
                  minimum: 1,
                },
              },
              required: ['cardId'],
            },
          },
          {
            name: 'list_cards',
            description: '📋 [SAFE] List Metabase cards/questions with optional filtering. Use this to discover available cards, find cards by type, or see all questions in the system. Can return large results (15k+ cards). Risk: None - read-only, but may be slow with many cards.',
            inputSchema: {
              type: 'object',
              properties: {
                filter: {
                  type: 'string',
                  description: 'Filter type: all (all cards), mine (my cards), bookmarked, database, table, using_model, using_segment, archived',
                  enum: ['all', 'mine', 'bookmarked', 'database', 'table', 'using_model', 'using_segment', 'archived'],
                  default: 'all',
                },
                modelId: {
                  type: 'integer',
                  description: 'Model ID for filtering (only when filter=using_model)',
                  minimum: 1,
                },
              },
            },
          },
          {
            name: 'execute_card_query',
            description: '▶️ [MODERATE RISK] Execute a saved card query and return results. Use this to get actual data from a card. May take time for complex queries. Risk: Moderate - executes queries that may be slow or resource-intensive. Does not modify data.',
            inputSchema: {
              type: 'object',
              properties: {
                cardId: {
                  type: 'integer',
                  description: 'The ID of the card to execute',
                  minimum: 1,
                },
                parameters: {
                  type: 'object',
                  description: 'Query parameters (e.g., date filters, IDs)',
                  additionalProperties: true,
                },
              },
              required: ['cardId'],
            },
          },

          // ========== DASHBOARD TOOLS (Read-Only, Safe) ==========
          {
            name: 'get_dashboard',
            description: '📊 [SAFE] Get a dashboard by ID including all its cards, layout, and parameters. Use this to understand dashboard structure or see all questions in a dashboard at once. Risk: None - read-only operation.',
            inputSchema: {
              type: 'object',
              properties: {
                dashboardId: {
                  type: 'integer',
                  description: 'The ID of the dashboard to retrieve',
                  minimum: 1,
                },
              },
              required: ['dashboardId'],
            },
          },
          {
            name: 'list_dashboards',
            description: '📊 [SAFE] List all dashboards in Metabase. Use this to discover available dashboards or find dashboards by name. Risk: None - read-only operation.',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },

          // ========== DATABASE & TABLE DISCOVERY (Read-Only, Safe) ==========
          {
            name: 'get_database',
            description: '🗄️ [SAFE] Get database information by ID including engine type and connection details. Use this to understand which database a card connects to. Risk: None - read-only operation.',
            inputSchema: {
              type: 'object',
              properties: {
                databaseId: {
                  type: 'integer',
                  description: 'The ID of the database to retrieve',
                  minimum: 1,
                },
              },
              required: ['databaseId'],
            },
          },
          {
            name: 'list_databases',
            description: '🗄️ [SAFE] List all available databases. Use this to see what data sources are connected to Metabase. Risk: None - read-only operation.',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_database_metadata',
            description: '🔍 [SAFE] Get complete metadata for a database including ALL tables, columns, and field types. This is comprehensive and may return large amounts of data. Use this when you need to understand the full database schema. Risk: None - read-only, but returns large payloads.',
            inputSchema: {
              type: 'object',
              properties: {
                databaseId: {
                  type: 'integer',
                  description: 'The ID of the database',
                  minimum: 1,
                },
              },
              required: ['databaseId'],
            },
          },
          {
            name: 'list_database_tables',
            description: '📑 [SAFE] List all tables in a specific database. Use this to see what tables are available before querying. Risk: None - read-only operation.',
            inputSchema: {
              type: 'object',
              properties: {
                databaseId: {
                  type: 'integer',
                  description: 'The ID of the database',
                  minimum: 1,
                },
              },
              required: ['databaseId'],
            },
          },
          {
            name: 'get_table_metadata',
            description: '🔍 [SAFE] Get detailed metadata for a specific table including all columns, data types, and foreign key relationships. Use this to understand table structure before writing queries. Risk: None - read-only operation.',
            inputSchema: {
              type: 'object',
              properties: {
                tableId: {
                  type: 'integer',
                  description: 'The ID of the table',
                  minimum: 1,
                },
              },
              required: ['tableId'],
            },
          },


          // ========== COLLECTION TOOLS (Read-Only, Safe) ==========
          {
            name: 'list_collections',
            description: '📁 [SAFE] List all collections (folders) in Metabase. Collections organize cards and dashboards. Use this to understand the organizational structure. Risk: None - read-only operation.',
            inputSchema: {
              type: 'object',
              properties: {
                namespace: {
                  type: 'string',
                  description: 'Optional namespace filter (e.g., "snippets")',
                },
              },
            },
          },
          {
            name: 'get_collection_items',
            description: '📁 [SAFE] Get all items (cards, dashboards, models) in a specific collection. Use this to see what content is organized in a folder. Risk: None - read-only operation.',
            inputSchema: {
              type: 'object',
              properties: {
                collectionId: {
                  type: 'string',
                  description: 'The ID of the collection (use "root" for root collection)',
                },
                models: {
                  type: 'array',
                  description: 'Filter by item type (optional)',
                  items: {
                    type: 'string',
                    enum: ['card', 'dashboard', 'dataset'],
                  },
                },
              },
              required: ['collectionId'],
            },
          },

          // ========== QUERY EXECUTION (Moderate Risk) ==========
          {
            name: 'execute_native_query',
            description: '⚠️ [MODERATE RISK] Execute an ad-hoc native SQL query directly against a database. Use this when you need to run custom SQL that doesn\'t exist as a saved card. Risk: Moderate - executes arbitrary SQL (read-only with API key, but can be slow or resource-intensive). Always validate SQL before executing.',
            inputSchema: {
              type: 'object',
              properties: {
                databaseId: {
                  type: 'integer',
                  description: 'The ID of the database to query',
                  minimum: 1,
                },
                query: {
                  type: 'string',
                  description: 'The SQL query to execute (SELECT statements only recommended)',
                  minLength: 1,
                },
              },
              required: ['databaseId', 'query'],
            },
          },

          // ========== FIELD & COLUMN TOOLS (Read-Only, Safe) ==========
          {
            name: 'get_field',
            description: '🔍 [SAFE] Get detailed information about a specific field/column including its type, description, and metadata. Use this to understand what a column contains. Risk: None - read-only operation.',
            inputSchema: {
              type: 'object',
              properties: {
                fieldId: {
                  type: 'integer',
                  description: 'The ID of the field',
                  minimum: 1,
                },
              },
              required: ['fieldId'],
            },
          },
          {
            name: 'get_field_values',
            description: '🔍 [SAFE] Get distinct values for a field (useful for understanding what values exist in a column). May return many values for high-cardinality fields. Risk: None - read-only, but may return large results.',
            inputSchema: {
              type: 'object',
              properties: {
                fieldId: {
                  type: 'integer',
                  description: 'The ID of the field',
                  minimum: 1,
                },
              },
              required: ['fieldId'],
            },
          },

          // ========== SEGMENTS & METRICS (Read-Only, Safe) ==========
          {
            name: 'list_segments',
            description: '🎯 [SAFE] List all segments (saved filters) in Metabase. Segments are reusable filters like "Active Users" or "Premium Customers". Risk: None - read-only operation.',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'list_metrics',
            description: '📊 [SAFE] List all metrics (saved aggregations) in Metabase. Metrics are reusable calculations like "Total Revenue" or "Average Order Value". Risk: None - read-only operation.',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },

          // ========== ACTIVITY & AUDIT (Read-Only, Safe) ==========
          {
            name: 'get_activity',
            description: '📜 [SAFE] Get recent activity feed showing views, edits, and other actions in Metabase. Use this to see what users are doing or what content is popular. Risk: None - read-only operation.',
            inputSchema: {
              type: 'object',
              properties: {
                limit: {
                  type: 'integer',
                  description: 'Maximum number of activity items to return (default: 20)',
                  minimum: 1,
                  maximum: 100,
                  default: 20,
                },
              },
            },
          },

          // ========== USER TOOLS (Read-Only, Safe but may require permissions) ==========
          {
            name: 'get_current_user',
            description: '👤 [SAFE] Get information about the currently authenticated user (you). Risk: None - read-only operation.',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'list_users',
            description: '👥 [SAFE - REQUIRES ADMIN] List all Metabase users. Requires admin permissions. Use this to see who has access to Metabase. Risk: None - read-only, but may fail if not admin.',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },

          // ========== DASHBOARD URL & PARAMETER TOOLS (New) ==========
          {
            name: 'get_card_with_parameters',
            description: '🔗 [SAFE] Get a card with applied parameters from dashboard URL. Use this to extract card ID and parameters from Metabase dashboard URLs with filters. Risk: None - read-only operation.',
            inputSchema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: 'The full Metabase dashboard URL with encoded parameters',
                },
              },
              required: ['url'],
            },
          },
          {
            name: 'execute_query_builder_card',
            description: '⚙️ [MODERATE RISK] Execute a query-builder card with specific parameters. Use this to run query builder cards with custom filters and aggregations. Risk: Moderate - executes queries that may be slow or resource-intensive.',
            inputSchema: {
              type: 'object',
              properties: {
                cardId: {
                  type: 'integer',
                  description: 'The card ID',
                  minimum: 1,
                },
                parameters: {
                  type: 'object',
                  description: 'Query parameters object with filters, aggregations, breakouts',
                  additionalProperties: true,
                },
              },
              required: ['cardId', 'parameters'],
            },
          },
          {
            name: 'get_generated_sql',
            description: '📝 [MODERATE RISK] Get the generated SQL for a query-builder card with parameters. Use this to see the actual SQL that Metabase generates from query builder parameters. Risk: Moderate - executes queries to generate SQL.',
            inputSchema: {
              type: 'object',
              properties: {
                cardId: {
                  type: 'integer',
                  description: 'The card ID',
                  minimum: 1,
                },
                parameters: {
                  type: 'object',
                  description: 'Query parameters object',
                  additionalProperties: true,
                },
              },
              required: ['cardId', 'parameters'],
            },
          },

          // ========== WRITE OPERATIONS - CARDS (High Risk) ==========
          {
            name: 'create_card',
            description: '✏️ [HIGH RISK] Create a new card (question) in Metabase. Use this to programmatically create saved questions. Risk: High - creates new resources in Metabase.',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'The name of the card',
                  minLength: 1,
                },
                description: {
                  type: 'string',
                  description: 'Optional description of the card',
                },
                dataset_query: {
                  type: 'object',
                  description: 'The dataset query object (native SQL or query builder)',
                  additionalProperties: true,
                },
                display: {
                  type: 'string',
                  description: 'Display type (e.g., "table", "bar", "line")',
                },
                visualization_settings: {
                  type: 'object',
                  description: 'Visualization settings',
                  additionalProperties: true,
                },
                collection_id: {
                  type: 'integer',
                  description: 'ID of the collection to place the card in',
                },
              },
              required: ['name', 'dataset_query', 'display'],
            },
          },
          {
            name: 'update_card',
            description: '✏️ [HIGH RISK] Update an existing card (question) in Metabase. Use this to modify saved questions. Risk: High - modifies existing resources in Metabase.',
            inputSchema: {
              type: 'object',
              properties: {
                cardId: {
                  type: 'integer',
                  description: 'The ID of the card to update',
                  minimum: 1,
                },
                name: {
                  type: 'string',
                  description: 'The name of the card',
                },
                description: {
                  type: 'string',
                  description: 'Description of the card',
                },
                dataset_query: {
                  type: 'object',
                  description: 'The dataset query object',
                  additionalProperties: true,
                },
                display: {
                  type: 'string',
                  description: 'Display type',
                },
                visualization_settings: {
                  type: 'object',
                  description: 'Visualization settings',
                  additionalProperties: true,
                },
                collection_id: {
                  type: 'integer',
                  description: 'ID of the collection',
                },
              },
              required: ['cardId'],
            },
          },

          // ========== WRITE OPERATIONS - COLLECTIONS (High Risk) ==========
          {
            name: 'create_collection',
            description: '📁 [HIGH RISK] Create a new collection (folder) in Metabase. Use this to organize cards and dashboards. Risk: High - creates new organizational structure.',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'The name of the collection',
                  minLength: 1,
                },
                description: {
                  type: 'string',
                  description: 'Optional description of the collection',
                },
                color: {
                  type: 'string',
                  description: 'Color for the collection (e.g., "#509EE3")',
                },
                parent_id: {
                  type: 'integer',
                  description: 'ID of the parent collection (omit for root level)',
                },
              },
              required: ['name'],
            },
          },
          {
            name: 'update_collection',
            description: '📁 [HIGH RISK] Update an existing collection in Metabase. Use this to modify collection properties. Risk: High - modifies organizational structure.',
            inputSchema: {
              type: 'object',
              properties: {
                collectionId: {
                  type: 'integer',
                  description: 'The ID of the collection to update',
                  minimum: 1,
                },
                name: {
                  type: 'string',
                  description: 'The name of the collection',
                },
                description: {
                  type: 'string',
                  description: 'Description of the collection',
                },
                color: {
                  type: 'string',
                  description: 'Color for the collection',
                },
                archived: {
                  type: 'boolean',
                  description: 'Whether the collection is archived',
                },
              },
              required: ['collectionId'],
            },
          },

          // ========== WRITE OPERATIONS - DASHBOARDS (High Risk) ==========
          {
            name: 'create_dashboard',
            description: '📊 [HIGH RISK] Create a new dashboard in Metabase. Use this to programmatically create dashboards. Risk: High - creates new resources in Metabase.',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'The name of the dashboard',
                  minLength: 1,
                },
                description: {
                  type: 'string',
                  description: 'Optional description of the dashboard',
                },
                collection_id: {
                  type: 'integer',
                  description: 'ID of the collection to place the dashboard in',
                },
                parameters: {
                  type: 'array',
                  description: 'Dashboard parameters (filters)',
                  items: {
                    type: 'object',
                  },
                },
              },
              required: ['name'],
            },
          },
          {
            name: 'update_dashboard',
            description: '📊 [HIGH RISK] Update an existing dashboard in Metabase. Use this to modify dashboard properties. Risk: High - modifies existing resources.',
            inputSchema: {
              type: 'object',
              properties: {
                dashboardId: {
                  type: 'integer',
                  description: 'The ID of the dashboard to update',
                  minimum: 1,
                },
                name: {
                  type: 'string',
                  description: 'The name of the dashboard',
                },
                description: {
                  type: 'string',
                  description: 'Description of the dashboard',
                },
                collection_id: {
                  type: 'integer',
                  description: 'ID of the collection',
                },
                parameters: {
                  type: 'array',
                  description: 'Dashboard parameters',
                  items: {
                    type: 'object',
                  },
                },
                archived: {
                  type: 'boolean',
                  description: 'Whether the dashboard is archived',
                },
              },
              required: ['dashboardId'],
            },
          },
          {
            name: 'update_dashboard_cards',
            description: '📊 [HIGH RISK] Update cards within a dashboard (bulk update). Use this to add, remove, or reposition cards on a dashboard. Risk: High - modifies dashboard layout and content.',
            inputSchema: {
              type: 'object',
              properties: {
                dashboardId: {
                  type: 'integer',
                  description: 'The ID of the dashboard',
                  minimum: 1,
                },
                cards: {
                  type: 'array',
                  description: 'Array of dashboard cards with positioning and configuration',
                  items: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'integer',
                        description: 'Dashboard card ID (for updates)',
                      },
                      card_id: {
                        type: 'integer',
                        description: 'The card/question ID to add',
                      },
                      row: {
                        type: 'integer',
                        description: 'Row position',
                      },
                      col: {
                        type: 'integer',
                        description: 'Column position',
                      },
                      size_x: {
                        type: 'integer',
                        description: 'Width in grid units',
                      },
                      size_y: {
                        type: 'integer',
                        description: 'Height in grid units',
                      },
                    },
                  },
                },
              },
              required: ['dashboardId', 'cards'],
            },
          },

          // ========== WRITE OPERATIONS - DATABASES (Very High Risk) ==========
          {
            name: 'create_database',
            description: '🗄️ [VERY HIGH RISK] Create a new database connection in Metabase. Use this to add new data sources. Risk: Very High - creates database connections with credentials. Requires admin permissions.',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'The name of the database connection',
                  minLength: 1,
                },
                engine: {
                  type: 'string',
                  description: 'Database engine type (e.g., "postgres", "mysql", "snowflake")',
                },
                details: {
                  type: 'object',
                  description: 'Connection details (host, port, database name, credentials, etc.)',
                  additionalProperties: true,
                },
                is_full_sync: {
                  type: 'boolean',
                  description: 'Whether to perform a full sync',
                },
                is_on_demand: {
                  type: 'boolean',
                  description: 'Whether to scan only on-demand',
                },
              },
              required: ['name', 'engine', 'details'],
            },
          },
          {
            name: 'update_database',
            description: '🗄️ [VERY HIGH RISK] Update an existing database connection in Metabase. Use this to modify connection settings. Risk: Very High - modifies database connections. Requires admin permissions.',
            inputSchema: {
              type: 'object',
              properties: {
                databaseId: {
                  type: 'integer',
                  description: 'The ID of the database to update',
                  minimum: 1,
                },
                name: {
                  type: 'string',
                  description: 'The name of the database connection',
                },
                engine: {
                  type: 'string',
                  description: 'Database engine type',
                },
                details: {
                  type: 'object',
                  description: 'Connection details',
                  additionalProperties: true,
                },
                is_full_sync: {
                  type: 'boolean',
                  description: 'Whether to perform a full sync',
                },
                is_on_demand: {
                  type: 'boolean',
                  description: 'Whether to scan only on-demand',
                },
                auto_run_queries: {
                  type: 'boolean',
                  description: 'Whether to auto-run queries',
                },
              },
              required: ['databaseId'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          // Card tools
          case 'get_card':
            return await this.getCard(args.cardId);
          case 'list_cards':
            return await this.listCards(args.filter, args.modelId);
          case 'execute_card_query':
            return await this.executeCardQuery(args.cardId, args.parameters);
          
          // Dashboard tools
          case 'get_dashboard':
            return await this.getDashboard(args.dashboardId);
          case 'list_dashboards':
            return await this.listDashboards();
          
          // Database tools
          case 'get_database':
            return await this.getDatabase(args.databaseId);
          case 'list_databases':
            return await this.listDatabases();
          case 'get_database_metadata':
            return await this.getDatabaseMetadata(args.databaseId);
          case 'list_database_tables':
            return await this.listDatabaseTables(args.databaseId);
          case 'get_table_metadata':
            return await this.getTableMetadata(args.tableId);
          
          // Collection tools
          case 'list_collections':
            return await this.listCollections(args.namespace);
          case 'get_collection_items':
            return await this.getCollectionItems(args.collectionId, args.models);
          
          // Query execution
          case 'execute_native_query':
            return await this.executeNativeQuery(args.databaseId, args.query);
          
          // Field tools
          case 'get_field':
            return await this.getField(args.fieldId);
          case 'get_field_values':
            return await this.getFieldValues(args.fieldId);
          
          // Segments & Metrics
          case 'list_segments':
            return await this.listSegments();
          case 'list_metrics':
            return await this.listMetrics();
          
          // Activity & Users
          case 'get_activity':
            return await this.getActivity(args.limit);
          case 'get_current_user':
            return await this.getCurrentUser();
          case 'list_users':
            return await this.listUsers();
          
          // Dashboard URL & Parameter tools
          case 'get_card_with_parameters':
            return await this.getCardWithParameters(args.url);
          case 'execute_query_builder_card':
            return await this.executeQueryBuilderCard(args.cardId, args.parameters);
          case 'get_generated_sql':
            return await this.getGeneratedSQL(args.cardId, args.parameters);
          
          // Write operations - Cards
          case 'create_card':
            return await this.createCard(args);
          case 'update_card':
            return await this.updateCard(args.cardId, args);
          
          // Write operations - Collections
          case 'create_collection':
            return await this.createCollection(args);
          case 'update_collection':
            return await this.updateCollection(args.collectionId, args);
          
          // Write operations - Dashboards
          case 'create_dashboard':
            return await this.createDashboard(args);
          case 'update_dashboard':
            return await this.updateDashboard(args.dashboardId, args);
          case 'update_dashboard_cards':
            return await this.updateDashboardCards(args.dashboardId, args.cards);
          
          // Write operations - Databases
          case 'create_database':
            return await this.createDatabase(args);
          case 'update_database':
            return await this.updateDatabase(args.databaseId, args);
          
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
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

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async makeApiRequest(endpoint, options = {}) {
    const url = `${METABASE_URL}${endpoint}`;
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
    };

    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Non-JSON response: ${text.substring(0, 500)}`);
    }

    return await response.json();
  }

  // ========== DASHBOARD URL & PARAMETER UTILITIES ==========
  
  /**
   * Decode dashboard URL and extract parameters
   * @param {string} url - The Metabase dashboard URL with encoded parameters
   * @returns {Object} Decoded data with card ID and parameters
   */
  decodeDashboardUrl(url) {
    try {
      // Extract the base64 fragment after the #
      const fragment = url.split('#')[1];
      if (!fragment) {
        throw new Error('No fragment found in URL');
      }
      
      // Decode base64
      const decoded = Buffer.from(fragment, 'base64').toString('utf-8');
      const data = JSON.parse(decoded);
      
      return {
        originalCardId: data.original_card_id,
        datasetQuery: data.dataset_query,
        parameters: this.extractParametersFromQuery(data.dataset_query),
        display: data.display,
        visualizationSettings: data.visualization_settings,
        name: data.name,
        description: data.description
      };
    } catch (error) {
      throw new Error(`Failed to decode dashboard URL: ${error.message}`);
    }
  }

  /**
   * Extract parameters from query builder dataset query
   * @param {Object} datasetQuery - The dataset query object
   * @returns {Object} Extracted parameters
   */
  extractParametersFromQuery(datasetQuery) {
    if (!datasetQuery || datasetQuery.type !== 'query') {
      return {};
    }
    
    const query = datasetQuery.query;
    const parameters = {};
    
    // Extract filters
    if (query.filter) {
      parameters.filters = query.filter;
    }
    
    // Extract aggregations
    if (query.aggregation) {
      parameters.aggregations = query.aggregation;
    }
    
    // Extract breakouts
    if (query.breakout) {
      parameters.breakouts = query.breakout;
    }
    
    // Extract source table
    if (query['source-table']) {
      parameters.sourceTable = query['source-table'];
    }
    
    // Extract order by
    if (query['order-by']) {
      parameters.orderBy = query['order-by'];
    }
    
    // Extract limit
    if (query.limit) {
      parameters.limit = query.limit;
    }
    
    return parameters;
  }

  /**
   * Convert query builder parameters to Metabase API format
   * @param {Object} parameters - Query builder parameters
   * @returns {Object} API-formatted parameters
   */
  convertParametersToApiFormat(parameters) {
    const apiParams = {};
    
    // Handle filters
    if (parameters.filters) {
      parameters.filters.forEach((filter, index) => {
        if (Array.isArray(filter) && filter[0] === 'time-interval') {
          // Convert time-interval filter to API format
          apiParams[`time-interval-${index}`] = {
            type: 'time-interval',
            field: filter[1],
            value: filter[2],
            unit: filter[3]
          };
        } else if (Array.isArray(filter) && filter[0] === '=') {
          // Convert equality filter to API format
          apiParams[`filter-${index}`] = {
            type: '=',
            field: filter[1],
            value: filter[2]
          };
        } else if (Array.isArray(filter) && filter[0] === 'and') {
          // Handle AND filters
          filter.slice(1).forEach((subFilter, subIndex) => {
            apiParams[`and-filter-${index}-${subIndex}`] = subFilter;
          });
        }
      });
    }
    
    return apiParams;
  }

  // ========== CARD METHODS ==========
  async getCard(cardId) {
    const card = await this.makeApiRequest(`/api/card/${cardId}`);
    
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

  async listCards(filter = 'all', modelId = null) {
    const params = new URLSearchParams({ f: filter });
    if (modelId) {
      params.append('model_id', modelId);
    }
    
    const response = await this.makeApiRequest(`/api/card/?${params}`);
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

  async executeCardQuery(cardId, parameters = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(parameters).forEach(([key, value]) => {
      queryParams.append(key, value);
    });

    const results = await this.makeApiRequest(`/api/card/${cardId}/query?${queryParams}`, {
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

  // ========== DASHBOARD METHODS ==========
  async getDashboard(dashboardId) {
    const dashboard = await this.makeApiRequest(`/api/dashboard/${dashboardId}`);
    
    const cards = dashboard.dashcards?.map(dc => ({
      cardId: dc.card_id,
      cardName: dc.card?.name,
      row: dc.row,
      col: dc.col,
    })) || [];

    return {
      content: [
        {
          type: 'text',
          text: `Dashboard Information:
ID: ${dashboard.id}
Name: ${dashboard.name}
Description: ${dashboard.description || 'No description'}
Created: ${dashboard.created_at}
Updated: ${dashboard.updated_at}
Number of Cards: ${cards.length}

Cards in Dashboard:
${cards.map(c => `- Card ${c.cardId}: ${c.cardName} (Row: ${c.row}, Col: ${c.col})`).join('\n')}`,
        },
      ],
    };
  }

  async listDashboards() {
    const dashboards = await this.makeApiRequest('/api/dashboard');
    
    return {
      content: [
        {
          type: 'text',
          text: `Found ${dashboards.length} dashboards:
${dashboards.slice(0, 50).map(d => 
  `- ID: ${d.id} | Name: ${d.name}`
).join('\n')}${dashboards.length > 50 ? `\n... and ${dashboards.length - 50} more dashboards` : ''}`,
        },
      ],
    };
  }

  // ========== DATABASE METHODS ==========
  async getDatabase(databaseId) {
    const database = await this.makeApiRequest(`/api/database/${databaseId}`);
    
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

  async listDatabases() {
    const response = await this.makeApiRequest('/api/database/');
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

  async getDatabaseMetadata(databaseId) {
    const metadata = await this.makeApiRequest(`/api/database/${databaseId}/metadata`);
    
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

  async listDatabaseTables(databaseId) {
    // Use metadata endpoint as /tables endpoint doesn't exist
    const metadata = await this.makeApiRequest(`/api/database/${databaseId}/metadata`);
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

  async getTableMetadata(tableId) {
    const table = await this.makeApiRequest(`/api/table/${tableId}/query_metadata`);
    
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

  // ========== COLLECTION METHODS ==========
  async listCollections(namespace = null) {
    const params = namespace ? new URLSearchParams({ namespace }) : '';
    const collections = await this.makeApiRequest(`/api/collection/${params ? '?' + params : ''}`);
    
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

  async getCollectionItems(collectionId, models = null) {
    const params = models && models.length > 0 ? new URLSearchParams({ models: models.join(',') }) : '';
    const items = await this.makeApiRequest(`/api/collection/${collectionId}/items${params ? '?' + params : ''}`);
    
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

  // ========== QUERY EXECUTION ==========
  async executeNativeQuery(databaseId, query) {
    const body = {
      database: databaseId,
      type: 'native',
      native: {
        query: query,
      },
    };

    const results = await this.makeApiRequest('/api/dataset', {
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

  // ========== FIELD METHODS ==========
  async getField(fieldId) {
    const field = await this.makeApiRequest(`/api/field/${fieldId}`);
    
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

  async getFieldValues(fieldId) {
    const values = await this.makeApiRequest(`/api/field/${fieldId}/values`);
    
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

  // ========== SEGMENTS & METRICS ==========
  async listSegments() {
    const segments = await this.makeApiRequest('/api/segment');
    
    return {
      content: [
        {
          type: 'text',
          text: `Segments:
${segments.map(s => 
  `- ID: ${s.id} | Name: ${s.name} | Table: ${s.table?.name}${s.description ? ` | ${s.description}` : ''}`
).join('\n')}`,
        },
      ],
    };
  }

  async listMetrics() {
    try {
      const metrics = await this.makeApiRequest('/api/metric');
      
      return {
        content: [
          {
            type: 'text',
            text: `Metrics:
${metrics.map(m => 
  `- ID: ${m.id} | Name: ${m.name} | Table: ${m.table?.name}${m.description ? ` | ${m.description}` : ''}`
).join('\n')}`,
          },
        ],
      };
    } catch (error) {
      if (error.message.includes('404')) {
        return {
          content: [{ type: 'text', text: 'Metrics endpoint not available in this Metabase version' }],
        };
      }
      throw error;
    }
  }

  // ========== ACTIVITY & USER METHODS ==========
  async getActivity(limit = 20) {
    try {
      const activity = await this.makeApiRequest(`/api/activity?limit=${limit}`);
      
      return {
        content: [
          {
            type: 'text',
            text: `Recent Activity (last ${limit} items):
${activity.map(a => 
  `- ${a.timestamp} | ${a.user?.common_name || 'Unknown'} | ${a.topic} | ${a.details}`
).join('\n')}`,
          },
        ],
      };
    } catch (error) {
      if (error.message.includes('404')) {
        return {
          content: [{ type: 'text', text: 'Activity endpoint not available in this Metabase version' }],
        };
      }
      throw error;
    }
  }

  async getCurrentUser() {
    const user = await this.makeApiRequest('/api/user/current');
    
    return {
      content: [
        {
          type: 'text',
          text: `Current User:
ID: ${user.id}
Name: ${user.common_name}
Email: ${user.email}
Is Admin: ${user.is_superuser}`,
        },
      ],
    };
  }

  async listUsers() {
    const users = await this.makeApiRequest('/api/user/');
    
    return {
      content: [
        {
          type: 'text',
          text: `Users (${users.length}):
${users.map(u => 
  `- ID: ${u.id} | Name: ${u.common_name} | Email: ${u.email} | Admin: ${u.is_superuser}`
).join('\n')}`,
        },
      ],
    };
  }

  // ========== DASHBOARD URL & PARAMETER METHODS ==========
  
  /**
   * Get card with parameters from dashboard URL
   * @param {string} url - The dashboard URL with encoded parameters
   * @returns {Object} Card information with extracted parameters
   */
  async getCardWithParameters(url) {
    try {
      const decoded = this.decodeDashboardUrl(url);
      const baseCard = await this.makeApiRequest(`/api/card/${decoded.originalCardId}`);
      
      return {
        content: [
          {
            type: 'text',
            text: `Card with Parameters:
Original Card ID: ${decoded.originalCardId}
Card Name: ${baseCard.name}
Description: ${baseCard.description || 'No description'}
Database ID: ${baseCard.dataset_query?.database}
Query Type: ${baseCard.dataset_query?.type}
Display Type: ${decoded.display}

Applied Parameters:
${JSON.stringify(decoded.parameters, null, 2)}

Dataset Query:
${JSON.stringify(decoded.datasetQuery, null, 2)}

Visualization Settings:
${JSON.stringify(decoded.visualizationSettings, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error extracting card with parameters: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Execute a query builder card with specific parameters
   * @param {number} cardId - The card ID
   * @param {Object} parameters - Query builder parameters
   * @returns {Object} Query execution results
   */
  async executeQueryBuilderCard(cardId, parameters) {
    try {
      // First, get the base card to understand its structure
      const baseCard = await this.makeApiRequest(`/api/card/${cardId}`);
      
      if (baseCard.dataset_query.type !== 'query') {
        throw new Error('Card is not a query-builder card');
      }
      
      // Create a modified dataset query with the provided parameters
      const modifiedQuery = {
        ...baseCard.dataset_query,
        query: {
          ...baseCard.dataset_query.query,
          ...parameters
        }
      };
      
      // Execute the query using the dataset endpoint
      const body = {
        database: baseCard.dataset_query.database,
        type: 'query',
        query: modifiedQuery.query,
      };

      const results = await this.makeApiRequest('/api/dataset', {
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
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error executing query builder card: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Get generated SQL for a query builder card with parameters
   * @param {number} cardId - The card ID
   * @param {Object} parameters - Query builder parameters
   * @returns {Object} Generated SQL information
   */
  async getGeneratedSQL(cardId, parameters) {
    try {
      // Get the base card
      const baseCard = await this.makeApiRequest(`/api/card/${cardId}`);
      
      if (baseCard.dataset_query.type !== 'query') {
        throw new Error('Card is not a query-builder card');
      }
      
      // Create a modified dataset query with the provided parameters
      const modifiedQuery = {
        ...baseCard.dataset_query,
        query: {
          ...baseCard.dataset_query.query,
          ...parameters
        }
      };
      
      // Use the query endpoint to get the generated SQL
      const body = {
        database: baseCard.dataset_query.database,
        type: 'query',
        query: modifiedQuery.query,
      };

      // Try to get the SQL by using the query endpoint with explain parameter
      const results = await this.makeApiRequest('/api/dataset', {
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
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error generating SQL: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  // ========== WRITE OPERATIONS - CARDS ==========
  
  /**
   * Create a new card (question) in Metabase
   * @param {Object} cardData - Card data including name, dataset_query, display, etc.
   * @returns {Object} Created card information
   */
  async createCard(cardData) {
    try {
      const body = {
        name: cardData.name,
        description: cardData.description || null,
        dataset_query: cardData.dataset_query,
        display: cardData.display,
        visualization_settings: cardData.visualization_settings || {},
        collection_id: cardData.collection_id || null,
      };

      const card = await this.makeApiRequest('/api/card', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      return {
        content: [
          {
            type: 'text',
            text: `Card Created Successfully:
ID: ${card.id}
Name: ${card.name}
Description: ${card.description || 'No description'}
Database ID: ${card.dataset_query?.database}
Query Type: ${card.dataset_query?.type}
Collection ID: ${card.collection_id}
Created: ${card.created_at}

You can view the card at: ${METABASE_URL}/question/${card.id}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error creating card: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Update an existing card
   * @param {number} cardId - The card ID to update
   * @param {Object} updates - Updated card data
   * @returns {Object} Updated card information
   */
  async updateCard(cardId, updates) {
    try {
      // Get the current card first
      const currentCard = await this.makeApiRequest(`/api/card/${cardId}`);
      
      // Merge updates with current card data
      const body = {
        name: updates.name || currentCard.name,
        description: updates.description !== undefined ? updates.description : currentCard.description,
        dataset_query: updates.dataset_query || currentCard.dataset_query,
        display: updates.display || currentCard.display,
        visualization_settings: updates.visualization_settings || currentCard.visualization_settings,
        collection_id: updates.collection_id !== undefined ? updates.collection_id : currentCard.collection_id,
      };

      const card = await this.makeApiRequest(`/api/card/${cardId}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });

      return {
        content: [
          {
            type: 'text',
            text: `Card Updated Successfully:
ID: ${card.id}
Name: ${card.name}
Description: ${card.description || 'No description'}
Updated: ${card.updated_at}

You can view the card at: ${METABASE_URL}/question/${card.id}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error updating card: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  // ========== WRITE OPERATIONS - COLLECTIONS ==========
  
  /**
   * Create a new collection
   * @param {Object} collectionData - Collection data including name, description, etc.
   * @returns {Object} Created collection information
   */
  async createCollection(collectionData) {
    try {
      const body = {
        name: collectionData.name,
        description: collectionData.description || null,
        color: collectionData.color || '#509EE3',
        parent_id: collectionData.parent_id || null,
      };

      const collection = await this.makeApiRequest('/api/collection', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      return {
        content: [
          {
            type: 'text',
            text: `Collection Created Successfully:
ID: ${collection.id}
Name: ${collection.name}
Description: ${collection.description || 'No description'}
Color: ${collection.color}
Parent ID: ${collection.parent_id || 'Root level'}
Slug: ${collection.slug}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error creating collection: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Update an existing collection
   * @param {number} collectionId - The collection ID to update
   * @param {Object} updates - Updated collection data
   * @returns {Object} Updated collection information
   */
  async updateCollection(collectionId, updates) {
    try {
      // Get the current collection first
      const currentCollection = await this.makeApiRequest(`/api/collection/${collectionId}`);
      
      // Merge updates with current collection data
      const body = {
        name: updates.name || currentCollection.name,
        description: updates.description !== undefined ? updates.description : currentCollection.description,
        color: updates.color || currentCollection.color,
        archived: updates.archived !== undefined ? updates.archived : currentCollection.archived,
      };

      const collection = await this.makeApiRequest(`/api/collection/${collectionId}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });

      return {
        content: [
          {
            type: 'text',
            text: `Collection Updated Successfully:
ID: ${collection.id}
Name: ${collection.name}
Description: ${collection.description || 'No description'}
Color: ${collection.color}
Archived: ${collection.archived}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error updating collection: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  // ========== WRITE OPERATIONS - DASHBOARDS ==========
  
  /**
   * Create a new dashboard
   * @param {Object} dashboardData - Dashboard data including name, description, etc.
   * @returns {Object} Created dashboard information
   */
  async createDashboard(dashboardData) {
    try {
      const body = {
        name: dashboardData.name,
        description: dashboardData.description || null,
        collection_id: dashboardData.collection_id || null,
        parameters: dashboardData.parameters || [],
      };

      const dashboard = await this.makeApiRequest('/api/dashboard', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      return {
        content: [
          {
            type: 'text',
            text: `Dashboard Created Successfully:
ID: ${dashboard.id}
Name: ${dashboard.name}
Description: ${dashboard.description || 'No description'}
Collection ID: ${dashboard.collection_id}
Created: ${dashboard.created_at}

You can view the dashboard at: ${METABASE_URL}/dashboard/${dashboard.id}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error creating dashboard: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Update an existing dashboard
   * @param {number} dashboardId - The dashboard ID to update
   * @param {Object} updates - Updated dashboard data
   * @returns {Object} Updated dashboard information
   */
  async updateDashboard(dashboardId, updates) {
    try {
      // Get the current dashboard first
      const currentDashboard = await this.makeApiRequest(`/api/dashboard/${dashboardId}`);
      
      // Merge updates with current dashboard data
      const body = {
        name: updates.name || currentDashboard.name,
        description: updates.description !== undefined ? updates.description : currentDashboard.description,
        collection_id: updates.collection_id !== undefined ? updates.collection_id : currentDashboard.collection_id,
        parameters: updates.parameters || currentDashboard.parameters,
        archived: updates.archived !== undefined ? updates.archived : currentDashboard.archived,
      };

      const dashboard = await this.makeApiRequest(`/api/dashboard/${dashboardId}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });

      return {
        content: [
          {
            type: 'text',
            text: `Dashboard Updated Successfully:
ID: ${dashboard.id}
Name: ${dashboard.name}
Description: ${dashboard.description || 'No description'}
Updated: ${dashboard.updated_at}

You can view the dashboard at: ${METABASE_URL}/dashboard/${dashboard.id}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error updating dashboard: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Update dashboard cards (bulk update)
   * @param {number} dashboardId - The dashboard ID
   * @param {Array} cards - Array of dashboard cards with positioning
   * @returns {Object} Update result
   */
  async updateDashboardCards(dashboardId, cards) {
    try {
      const body = {
        cards: cards,
      };

      const result = await this.makeApiRequest(`/api/dashboard/${dashboardId}/cards`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });

      return {
        content: [
          {
            type: 'text',
            text: `Dashboard Cards Updated Successfully:
Dashboard ID: ${dashboardId}
Number of cards updated: ${cards.length}

Result:
${JSON.stringify(result, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error updating dashboard cards: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  // ========== WRITE OPERATIONS - DATABASES ==========
  
  /**
   * Create a new database connection
   * @param {Object} databaseData - Database connection data
   * @returns {Object} Created database information
   */
  async createDatabase(databaseData) {
    try {
      const body = {
        name: databaseData.name,
        engine: databaseData.engine,
        details: databaseData.details,
        is_full_sync: databaseData.is_full_sync !== undefined ? databaseData.is_full_sync : true,
        is_on_demand: databaseData.is_on_demand !== undefined ? databaseData.is_on_demand : false,
      };

      const database = await this.makeApiRequest('/api/database', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      return {
        content: [
          {
            type: 'text',
            text: `Database Created Successfully:
ID: ${database.id}
Name: ${database.name}
Engine: ${database.engine}
Created: ${database.created_at}

Note: The database will begin syncing metadata. This may take some time.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error creating database: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Update an existing database connection
   * @param {number} databaseId - The database ID to update
   * @param {Object} updates - Updated database data
   * @returns {Object} Updated database information
   */
  async updateDatabase(databaseId, updates) {
    try {
      // Get the current database first
      const currentDatabase = await this.makeApiRequest(`/api/database/${databaseId}`);
      
      // Merge updates with current database data
      const body = {
        name: updates.name || currentDatabase.name,
        engine: updates.engine || currentDatabase.engine,
        details: updates.details || currentDatabase.details,
        is_full_sync: updates.is_full_sync !== undefined ? updates.is_full_sync : currentDatabase.is_full_sync,
        is_on_demand: updates.is_on_demand !== undefined ? updates.is_on_demand : currentDatabase.is_on_demand,
        auto_run_queries: updates.auto_run_queries !== undefined ? updates.auto_run_queries : currentDatabase.auto_run_queries,
      };

      const database = await this.makeApiRequest(`/api/database/${databaseId}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });

      return {
        content: [
          {
            type: 'text',
            text: `Database Updated Successfully:
ID: ${database.id}
Name: ${database.name}
Engine: ${database.engine}
Updated: ${database.updated_at}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error updating database: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Metabase MCP server running on stdio');
  }
}

const server = new MetabaseMCPServer();
server.run().catch(console.error);
