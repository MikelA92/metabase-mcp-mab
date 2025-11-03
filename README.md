# Metabase MCP Server

A Model Context Protocol (MCP) server that enables LLMs to interact with your Metabase instance. This server provides 33 tools for querying cards, dashboards, databases, collections, and executing queries against your Metabase installation.

## 🚀 Quick Start

### Prerequisites

- **Node.js >= 18.0.0** (required by `@modelcontextprotocol/sdk`)
- **npm** (comes with Node.js)

### Installation

1. **Clone or navigate to the project directory:**
   ```bash
   cd metabase-mcp-mab
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Verify Node.js version:**
   ```bash
   node --version  # Should be >= 18.0.0
   ```

### Configuration

The server requires environment variables to be set. When using with Cursor/Claude Desktop, configure these in your `~/.cursor/mcp.json` file:

```json
{
  "mcpServers": {
    "metabase-local": {
      "command": "node",
      "args": ["/path/to/metabase-mcp-mab/src/server/index.js"],
      "env": {
        "METABASE_URL": "https://your-metabase-instance.com",
        "METABASE_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

#### Environment Variables

- `METABASE_URL` (optional): Your Metabase instance URL. Defaults to `https://data-metabase.swile.co`
- `METABASE_API_KEY` (required): Your Metabase API key. **Must be provided** - no default value for security.

**Note**: The API key is required and must be provided via environment variables. There is no hardcoded default for security reasons.

### Getting Your Metabase API Key

1. Log into your Metabase instance
2. Go to Settings → Account Settings → API Keys
3. Create a new API key or use an existing one
4. Copy the key and add it to your `mcp.json` configuration

## 📖 Usage

### With Cursor/Claude Desktop

Once configured in `mcp.json`, you can ask LLMs questions like:

```
"Get the SQL query for card ID 17033"
"List all cards in the database"
"Show me cards related to revenue"
"Execute card 17033 with parameters"
"What databases are available?"
```

### Direct Server Usage

Run the server directly:

```bash
npm start
```

Or run in development mode with auto-reload:

```bash
npm run dev
```

### Programmatic Usage

```javascript
import { createDefaultClient } from './src/client/cards.js';

const client = createDefaultClient();

// Get a specific card
const card = await client.getCard(17033);
console.log(card.sqlQuery);

// List all cards
const cards = await client.listCards('all');

// Search for cards
const revenueCards = await client.searchCards('revenue');

// Execute a query
const results = await client.executeCardQuery(17033, {param: 'value'});
```

## 🛠️ Available Tools

This MCP server provides **27 tools** organized into categories:

### Card Tools (Questions/Queries)
- `get_card` - Get card details and SQL query
- `list_cards` - List cards with filtering
- `execute_card_query` - Execute saved queries
- `execute_query_builder_card` - Execute query builder cards with parameters
- `get_generated_sql` - Get generated SQL for query builder cards
- `get_card_with_parameters` - Extract card info from dashboard URLs

### Dashboard Tools
- `get_dashboard` - Get dashboard details
- `list_dashboards` - List all dashboards

### Database & Table Tools
- `get_database` - Get database information
- `list_databases` - List all databases
- `get_database_metadata` - Get comprehensive database schema
- `list_database_tables` - List tables in a database
- `get_table_metadata` - Get detailed table information

### Collection Tools
- `list_collections` - List all collections (folders)
- `get_collection_items` - Get items in a collection

### Query Execution
- `execute_native_query` - Execute custom SQL queries

### Field & Column Tools
- `get_field` - Get field/column information
- `get_field_values` - Get distinct values for a field

### Segments & Metrics
- `list_segments` - List saved filter segments
- `list_metrics` - List saved aggregations

### Activity & Users
- `get_activity` - Get recent activity feed
- `get_current_user` - Get current authenticated user
- `list_users` - List all users (requires admin)

For detailed documentation on all tools, see [TOOLS_REFERENCE.md](./TOOLS_REFERENCE.md).

## 📚 Documentation

- **[USAGE_GUIDE.md](./USAGE_GUIDE.md)** - Complete usage guide with examples
- **[TOOLS_REFERENCE.md](./TOOLS_REFERENCE.md)** - Detailed reference for all 27 tools

## 🏗️ Project Structure

```
metabase-mcp-mab/
├── src/
│   ├── server/
│   │   └── index.js          # Main MCP server implementation
│   └── client/
│       └── cards.js           # JavaScript client library
├── testing/
│   └── test-new-tools.js     # Test scripts
├── package.json              # Dependencies and scripts
├── README.md                 # This file
├── USAGE_GUIDE.md            # Usage documentation
└── TOOLS_REFERENCE.md        # Tools reference
```

## 🔧 Development

### Scripts

- `npm start` - Run the server
- `npm run dev` - Run the server with auto-reload (watch mode)

### Dependencies

- `@modelcontextprotocol/sdk` - MCP SDK framework
- `axios` - HTTP client library (though native `fetch` is used)
- `dotenv` - Environment variable management

### Testing

Run test scripts:

```bash
node testing/test-new-tools.js
```

## ⚠️ Important Notes

### Risk Levels

- **🟢 SAFE tools**: Read-only operations, no data modification
- **🟡 MODERATE RISK tools**: Execute queries (read-only but may be slow/resource-intensive)

### Performance Considerations

- `list_cards` can return 15k+ items - results are limited to first 50 in display
- `get_database_metadata` returns ALL tables and columns - can be very large
- `execute_card_query` and `execute_native_query` may take time for complex queries
- Use search operations instead of listing everything when possible

### Version Compatibility

Some tools may not be available in all Metabase versions (e.g., `list_metrics`, `get_activity`). The server gracefully handles missing endpoints.

## 🐛 Troubleshooting

### Server won't start

1. **Check Node.js version:**
   ```bash
   node --version  # Must be >= 18.0.0
   ```

2. **Verify dependencies are installed:**
   ```bash
   npm install
   ```

3. **Check environment variables:**
   - Ensure `METABASE_API_KEY` is set in `mcp.json`
   - Verify `METABASE_URL` is correct (if custom)

### API authentication errors

- Verify your API key is correct and active
- Check that the API key has the necessary permissions
- Ensure the Metabase URL is accessible from your network

### Connection issues

- Verify your Metabase instance is running and accessible
- Check network connectivity
- Ensure firewall rules allow connections

## 📝 License

ISC

## 🤝 Contributing

Contributions welcome! Please ensure:
- Node.js >= 18.0.0
- All tests pass
- Code follows existing patterns

