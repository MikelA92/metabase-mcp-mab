/**
 * Tool definitions for the MCP server
 * Separated from the main server logic for better maintainability
 */

export const TOOL_DEFINITIONS = [
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
];

