# Metabase MCP Server - Tools Reference Guide

## 📋 Overview

This MCP server provides **27 tools** for comprehensive Metabase API interaction. All tools include:
- **Risk Level** indicators (Safe, Moderate Risk)
- **Detailed descriptions** for LLM understanding
- **Input validation** and error handling
- **Version compatibility** (graceful degradation for missing endpoints)

---

## 🔍 Tool Categories

### 1. Card Tools (Questions/Queries)
Tools for working with Metabase cards (saved questions).

#### `get_card`
- **Risk**: 🟢 SAFE - Read-only
- **Description**: Get a specific card by ID including its SQL query
- **Use When**: You need to see the SQL behind a question or analyze how a card is built
- **Parameters**: `cardId` (integer, required)
- **Returns**: Card details with SQL query, database ID, query type, timestamps

#### `list_cards`
- **Risk**: 🟢 SAFE - Read-only (may be slow with many cards)
- **Description**: List all cards with optional filtering
- **Use When**: Discovering available cards, finding cards by type
- **Parameters**: 
  - `filter` (string): all, mine, bookmarked, database, table, using_model, using_segment, archived
  - `modelId` (integer, optional): Filter by model ID
- **Returns**: Array of card summaries (can be 15k+ items)
- **Note**: Results limited to first 50 in display for performance

#### `execute_card_query`
- **Risk**: 🟡 MODERATE - Executes queries (may be slow/resource-intensive)
- **Description**: Execute a saved card query and return actual data
- **Use When**: You need to get actual data from a card
- **Parameters**: 
  - `cardId` (integer, required)
  - `parameters` (object, optional): Query parameters like date filters
- **Returns**: Query execution results with data
- **Warning**: May take time for complex queries

---

### 2. Dashboard Tools
Tools for working with dashboards.

#### `get_dashboard`
- **Risk**: 🟢 SAFE - Read-only
- **Description**: Get a dashboard by ID with all its cards and layout
- **Use When**: Understanding dashboard structure or seeing all questions at once
- **Parameters**: `dashboardId` (integer, required)
- **Returns**: Dashboard info with all cards, their positions, and metadata

#### `list_dashboards`
- **Risk**: 🟢 SAFE - Read-only
- **Description**: List all dashboards in Metabase
- **Use When**: Discovering available dashboards or finding by name
- **Parameters**: None
- **Returns**: Array of dashboard summaries (1000+ items possible)

---

### 3. Database & Schema Discovery
Tools for exploring database structure.

#### `get_database`
- **Risk**: 🟢 SAFE - Read-only
- **Description**: Get database information by ID
- **Use When**: Understanding which database a card connects to
- **Parameters**: `databaseId` (integer, required)
- **Returns**: Database name, engine type, connection details

#### `list_databases`
- **Risk**: 🟢 SAFE - Read-only
- **Description**: List all available databases
- **Use When**: Seeing what data sources are connected
- **Parameters**: None
- **Returns**: Array of databases with engine types (Snowflake, PostgreSQL, etc.)

#### `get_database_metadata`
- **Risk**: 🟢 SAFE - Read-only (returns large payloads)
- **Description**: Get COMPLETE metadata for a database including ALL tables, columns, and field types
- **Use When**: You need to understand the full database schema
- **Parameters**: `databaseId` (integer, required)
- **Returns**: Comprehensive schema with all tables and their fields
- **Warning**: Can return very large responses

#### `list_database_tables`
- **Risk**: 🟢 SAFE - Read-only
- **Description**: List all tables in a specific database
- **Use When**: Seeing what tables are available before querying
- **Parameters**: `databaseId` (integer, required)
- **Returns**: Array of tables with schema names

#### `get_table_metadata`
- **Risk**: 🟢 SAFE - Read-only
- **Description**: Get detailed metadata for a specific table
- **Use When**: Understanding table structure before writing queries
- **Parameters**: `tableId` (integer, required)
- **Returns**: All columns, data types, foreign key relationships

---

### 4. Collection Tools
Tools for working with collections (folders).

#### `list_collections`
- **Risk**: 🟢 SAFE - Read-only
- **Description**: List all collections (folders) in Metabase
- **Use When**: Understanding organizational structure
- **Parameters**: `namespace` (string, optional): Filter by namespace
- **Returns**: Array of collections (1000+ possible)

#### `get_collection_items`
- **Risk**: 🟢 SAFE - Read-only
- **Description**: Get all items in a specific collection
- **Use When**: Seeing what content is organized in a folder
- **Parameters**: 
  - `collectionId` (string, required): Collection ID or "root"
  - `models` (array, optional): Filter by item type
- **Returns**: Items in collection with counts

---

### 5. Query Execution
Tools for running queries.

#### `execute_native_query`
- **Risk**: ⚠️ MODERATE - Executes arbitrary SQL
- **Description**: Execute an ad-hoc native SQL query directly against a database
- **Use When**: You need to run custom SQL that doesn't exist as a saved card
- **Parameters**: 
  - `databaseId` (integer, required)
  - `query` (string, required): SQL query (SELECT recommended)
- **Returns**: Query execution results
- **Warning**: Can be slow or resource-intensive. Always validate SQL before executing. Read-only with API key but still use caution.

---

### 6. Field & Column Tools
Tools for working with individual fields.

#### `get_field`
- **Risk**: 🟢 SAFE - Read-only
- **Description**: Get detailed information about a specific field/column
- **Use When**: Understanding what a column contains
- **Parameters**: `fieldId` (integer, required)
- **Returns**: Field type, description, semantic type, metadata

#### `get_field_values`
- **Risk**: 🟢 SAFE - Read-only (may return large results)
- **Description**: Get distinct values for a field
- **Use When**: Understanding what values exist in a column
- **Parameters**: `fieldId` (integer, required)
- **Returns**: Array of distinct values
- **Warning**: May return many values for high-cardinality fields

---

### 7. Segments & Metrics
Tools for reusable filters and calculations.

#### `list_segments`
- **Risk**: 🟢 SAFE - Read-only
- **Description**: List all segments (saved filters)
- **Use When**: Finding reusable filters like "Active Users" or "Premium Customers"
- **Parameters**: None
- **Returns**: Array of segments with descriptions

#### `list_metrics`
- **Risk**: 🟢 SAFE - Read-only
- **Description**: List all metrics (saved aggregations)
- **Use When**: Finding reusable calculations like "Total Revenue"
- **Parameters**: None
- **Returns**: Array of metrics with descriptions
- **Note**: May not be available in all Metabase versions

---

### 8. Activity & Audit
Tools for tracking usage.

#### `get_activity`
- **Risk**: 🟢 SAFE - Read-only
- **Description**: Get recent activity feed
- **Use When**: Seeing what users are doing or what content is popular
- **Parameters**: `limit` (integer, 1-100, default: 20)
- **Returns**: Recent activity items with timestamps and users
- **Note**: May not be available in all Metabase versions

---

### 9. User Management
Tools for user information.

#### `get_current_user`
- **Risk**: 🟢 SAFE - Read-only
- **Description**: Get information about the currently authenticated user
- **Use When**: Checking your own permissions and details
- **Parameters**: None
- **Returns**: User name, email, admin status

#### `list_users`
- **Risk**: 🟢 SAFE - Read-only (REQUIRES ADMIN)
- **Description**: List all Metabase users
- **Use When**: Seeing who has access to Metabase
- **Parameters**: None
- **Returns**: Array of users with roles
- **Warning**: Requires admin permissions, will fail with 403 otherwise

---

### 10. Dashboard URL & Parameter Tools (New)
Tools for working with dashboard URLs and query builder parameters.

#### `get_card_with_parameters`
- **Risk**: 🟢 SAFE - Read-only
- **Description**: Get a card with applied parameters from dashboard URL
- **Use When**: You need to extract card ID and parameters from Metabase dashboard URLs with filters
- **Parameters**: `url` (string, required): The full Metabase dashboard URL with encoded parameters
- **Returns**: Card information with extracted parameters, filters, aggregations, and visualization settings
- **Note**: Automatically decodes base64-encoded URL fragments

#### `execute_query_builder_card`
- **Risk**: 🟡 MODERATE - Executes queries (may be slow/resource-intensive)
- **Description**: Execute a query-builder card with specific parameters
- **Use When**: You need to run query builder cards with custom filters and aggregations
- **Parameters**: 
  - `cardId` (integer, required): The card ID
  - `parameters` (object, required): Query parameters with filters, aggregations, breakouts
- **Returns**: Query execution results with applied parameters
- **Warning**: May take time for complex queries with many parameters

#### `get_generated_sql`
- **Risk**: 🟡 MODERATE - Executes queries to generate SQL
- **Description**: Get the generated SQL for a query-builder card with parameters
- **Use When**: You need to see the actual SQL that Metabase generates from query builder parameters
- **Parameters**: 
  - `cardId` (integer, required): The card ID
  - `parameters` (object, required): Query parameters object
- **Returns**: Generated SQL with parameter information
- **Note**: Shows the actual SQL that would be executed by Metabase

---

## 🎯 Common Use Cases

### Analyzing a Card
```
1. Use search_metabase to find cards about "revenue"
2. Use get_card to see the SQL query
3. Use execute_card_query to get the actual data
```

### Exploring a Database
```
1. Use list_databases to see available databases
2. Use get_database_metadata to see all tables
3. Use get_table_metadata to understand a specific table
4. Use execute_native_query to run custom SQL
```

### Understanding a Dashboard
```
1. Use search_metabase to find dashboards
2. Use get_dashboard to see all cards in it
3. Use get_card for each card to see their SQL
```

### Finding Content
```
1. Use search_metabase with specific terms (fastest)
2. Or use list_collections to browse by folder
3. Or use list_cards with filters
```

### Working with Dashboard URLs
```
1. Use get_card_with_parameters to extract card ID and filters from dashboard URL
2. Use get_generated_sql to see the actual SQL with applied filters
3. Use execute_query_builder_card to run the query with custom parameters
```

---

## ⚠️ Risk Levels Explained

### 🟢 SAFE (Read-Only)
- No data modification
- No security risk
- May be slow with large datasets
- Safe to use anytime

### 🟡 MODERATE RISK
- Executes queries (read-only but resource-intensive)
- May impact database performance
- May take long time to complete
- Validate inputs before using

### 🔴 HIGH RISK (None in this server)
- Would modify data
- Would change configuration
- Not implemented in this server

---

## 📊 Test Results

**Success Rate**: 94.4% (17/18 tests passed)

### ✅ Working Tools (20)
- All card tools
- All dashboard tools
- All database/table discovery tools
- Search functionality
- Collection management
- Field tools
- User management
- Native query execution
- **NEW**: Dashboard URL parameter extraction
- **NEW**: Query builder card execution
- **NEW**: SQL generation for query builder cards

### ⚠️ Limited Availability (3)
These tools work but may not be available in all Metabase versions:
- `list_metrics` - Returns empty array if not available
- `get_activity` - Returns empty array if not available
- `search_metabase` - May have limited functionality

---

## 🚀 Quick Start

### For LLMs
Simply call the tools by name with the required parameters. The server will:
1. Validate inputs
2. Make the API request
3. Format the response
4. Handle errors gracefully

### For Developers
```javascript
import { createDefaultClient } from './src/client/cards.js';

const client = createDefaultClient();

// Get a card
const card = await client.getCard(17033);
console.log(card.sqlQuery);

// Search for content
const results = await client.searchMetabase('revenue');

// Execute a query
const data = await client.executeCardQuery(17033);

// Work with dashboard URLs
const url = 'https://data-metabase.swile.co/question#eyJuYW1lIjoiWWVhcmx5IOKCrCBDaHVybiBieSBDbGllbnQgU2l6ZSIsImRlc2NyaXB0aW9uIjpudWxsLCJkYXRhc2V0X3F1ZXJ5Ijp7ImRhdGFiYXNlIjoxMjUsInF1ZXJ5Ijp7ImFnZ3JlZ2F0aW9uIjpbWyJhZ2dyZWdhdGlvbi1vcHRpb25zIixbIioiLC0xLFsic3VtIixbImZpZWxkIiwiQ0hBTkdFX0FNT1VOVF9WMl9SRVdSSVRFX0hJU1RPIix7ImJhc2UtdHlwZSI6InR5cGUvRmxvYXQifV1dXSx7ImRpc3BsYXktbmFtZSI6IkNodXJuIOKCrCIsIm5hbWUiOiJDaHVybiDigqwifV1dLCJicmVha291dCI6W1siZmllbGQiLCJDTElFTlRfU0laRV9UUkFOQ0hFIix7ImJhc2UtdHlwZSI6InR5cGUvVGV4dCJ9XV0sImZpbHRlciI6WyJhbmQiLFsiPSIsWyJmaWVsZCIsIlNUQVRVU19DSFVSTl9WMl9SRVdSSVRFX0hJU1RPIix7ImJhc2UtdHlwZSI6InR5cGUvQm9vbGVhbiJ9XSx0cnVlXSxbInRpbWUtaW50ZXJ2YWwiLFsiZmllbGQiLCJPUkRFUl9EQVRFIix7ImJhc2UtdHlwZSI6InR5cGUvRGF0ZVRpbWVXaXRoTG9jYWxUWiJ9XSwtMSwieWVhciJdXSwic291cmNlLXRhYmxlIjoiY2FyZF9fMjIyNDUifSwidHlwZSI6InF1ZXJ5In0sImRpc3BsYXkiOiJwaWUiLCJkaXNwbGF5SXNMb2NrZWQiOnRydWUsInZpc3VhbGl6YXRpb25fc2V0dGluZ3MiOnsicGllLmRlY2ltYWxfcGxhY2VzIjoxLCJwaWUucGVyY2VudF92aXNpYmlsaXR5IjoiaW5zaWRlIiwicGllLnNob3dfbGFiZWxzIjpmYWxzZSwicGllLnNob3dfbGVnZW5kIjp0cnVlLCJwaWUuc2hvd190b3RhbCI6dHJ1ZSwidmVyc2lvbiI6Mn0sIm9yaWdpbmFsX2NhcmRfaWQiOjIyMzM5LCJ0eXBlIjoicXVlc3Rpb24ifQ==';
const cardWithParams = await client.getCardWithParameters(url);
const sql = await client.getGeneratedSQL(cardWithParams.id, cardWithParams.extractedParameters);
```

---

## 📝 Notes

1. **Performance**: Some operations (list_cards, get_database_metadata) can return large amounts of data
2. **Permissions**: Some tools require admin permissions (list_users)
3. **Version Compatibility**: The server gracefully handles endpoints that don't exist in older Metabase versions
4. **Rate Limiting**: No built-in rate limiting - use responsibly
5. **Error Handling**: All tools include comprehensive error handling and validation

---

## 🔗 References

- [Metabase API Documentation](https://www.metabase.com/docs/latest/api)
- Server Implementation: `src/server/index.js`
- Client Implementation: `src/client/cards.js`
- Test Suite: `test-new-tools.js`

