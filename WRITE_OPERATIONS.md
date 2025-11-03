# Metabase MCP Write Operations

## Version 2.1.0 - NEW Features

This document describes the **write operations** (POST and PUT endpoints) that have been added to the Metabase MCP server. These operations allow you to create and modify Metabase resources programmatically.

⚠️ **WARNING**: These operations modify your Metabase instance. Use with caution!

---

## 📋 Card Operations

### `create_card`
**Risk Level**: 🔴 HIGH RISK - Creates new resources in Metabase

**Description**: Create a new card (question) in Metabase.

**Parameters**:
- `name` (string, required): The name of the card
- `description` (string, optional): Description of the card
- `dataset_query` (object, required): The dataset query object (native SQL or query builder)
- `display` (string, required): Display type (e.g., "table", "bar", "line")
- `visualization_settings` (object, optional): Visualization settings
- `collection_id` (integer, optional): ID of the collection to place the card in

**Example**:
```javascript
{
  "name": "Total Sales",
  "description": "Shows total sales by month",
  "dataset_query": {
    "database": 1,
    "type": "native",
    "native": {
      "query": "SELECT * FROM sales"
    }
  },
  "display": "table",
  "collection_id": 5
}
```

---

### `update_card`
**Risk Level**: 🔴 HIGH RISK - Modifies existing resources

**Description**: Update an existing card (question) in Metabase.

**Parameters**:
- `cardId` (integer, required): The ID of the card to update
- `name` (string, optional): Updated name
- `description` (string, optional): Updated description
- `dataset_query` (object, optional): Updated dataset query
- `display` (string, optional): Updated display type
- `visualization_settings` (object, optional): Updated visualization settings
- `collection_id` (integer, optional): Updated collection ID

**Example**:
```javascript
{
  "cardId": 42,
  "name": "Updated Sales Report",
  "description": "New description"
}
```

---

## 📁 Collection Operations

### `create_collection`
**Risk Level**: 🔴 HIGH RISK - Creates new organizational structure

**Description**: Create a new collection (folder) in Metabase to organize cards and dashboards.

**Parameters**:
- `name` (string, required): The name of the collection
- `description` (string, optional): Description of the collection
- `color` (string, optional): Color for the collection (e.g., "#509EE3")
- `parent_id` (integer, optional): ID of the parent collection (omit for root level)

**Example**:
```javascript
{
  "name": "Sales Reports",
  "description": "Collection for all sales-related reports",
  "color": "#509EE3"
}
```

---

### `update_collection`
**Risk Level**: 🔴 HIGH RISK - Modifies organizational structure

**Description**: Update an existing collection in Metabase.

**Parameters**:
- `collectionId` (integer, required): The ID of the collection to update
- `name` (string, optional): Updated name
- `description` (string, optional): Updated description
- `color` (string, optional): Updated color
- `archived` (boolean, optional): Whether the collection is archived

**Example**:
```javascript
{
  "collectionId": 10,
  "name": "Q4 Sales Reports",
  "archived": false
}
```

---

## 📊 Dashboard Operations

### `create_dashboard`
**Risk Level**: 🔴 HIGH RISK - Creates new resources

**Description**: Create a new dashboard in Metabase.

**Parameters**:
- `name` (string, required): The name of the dashboard
- `description` (string, optional): Description of the dashboard
- `collection_id` (integer, optional): ID of the collection to place the dashboard in
- `parameters` (array, optional): Dashboard parameters (filters)

**Example**:
```javascript
{
  "name": "Sales Overview",
  "description": "Comprehensive sales dashboard",
  "collection_id": 5,
  "parameters": []
}
```

---

### `update_dashboard`
**Risk Level**: 🔴 HIGH RISK - Modifies existing resources

**Description**: Update an existing dashboard in Metabase.

**Parameters**:
- `dashboardId` (integer, required): The ID of the dashboard to update
- `name` (string, optional): Updated name
- `description` (string, optional): Updated description
- `collection_id` (integer, optional): Updated collection ID
- `parameters` (array, optional): Updated dashboard parameters
- `archived` (boolean, optional): Whether the dashboard is archived

**Example**:
```javascript
{
  "dashboardId": 15,
  "name": "Updated Sales Overview",
  "archived": false
}
```

---

### `update_dashboard_cards`
**Risk Level**: 🔴 HIGH RISK - Modifies dashboard layout and content

**Description**: Update cards within a dashboard (bulk update). Use this to add, remove, or reposition cards on a dashboard.

**Parameters**:
- `dashboardId` (integer, required): The ID of the dashboard
- `cards` (array, required): Array of dashboard cards with positioning and configuration
  - `id` (integer, optional): Dashboard card ID (for updates)
  - `card_id` (integer): The card/question ID to add
  - `row` (integer): Row position
  - `col` (integer): Column position
  - `size_x` (integer): Width in grid units
  - `size_y` (integer): Height in grid units

**Example**:
```javascript
{
  "dashboardId": 15,
  "cards": [
    {
      "card_id": 42,
      "row": 0,
      "col": 0,
      "size_x": 4,
      "size_y": 4
    },
    {
      "card_id": 43,
      "row": 0,
      "col": 4,
      "size_x": 4,
      "size_y": 4
    }
  ]
}
```

---

## 🗄️ Database Operations

### `create_database`
**Risk Level**: 🔴 VERY HIGH RISK - Creates database connections with credentials

**Description**: Create a new database connection in Metabase. **Requires admin permissions**.

**Parameters**:
- `name` (string, required): The name of the database connection
- `engine` (string, required): Database engine type (e.g., "postgres", "mysql", "snowflake")
- `details` (object, required): Connection details (host, port, database name, credentials, etc.)
- `is_full_sync` (boolean, optional): Whether to perform a full sync
- `is_on_demand` (boolean, optional): Whether to scan only on-demand

**Example**:
```javascript
{
  "name": "Production Database",
  "engine": "postgres",
  "details": {
    "host": "db.example.com",
    "port": 5432,
    "dbname": "production",
    "user": "metabase_user",
    "password": "secure_password"
  },
  "is_full_sync": true
}
```

---

### `update_database`
**Risk Level**: 🔴 VERY HIGH RISK - Modifies database connections

**Description**: Update an existing database connection in Metabase. **Requires admin permissions**.

**Parameters**:
- `databaseId` (integer, required): The ID of the database to update
- `name` (string, optional): Updated name
- `engine` (string, optional): Updated database engine type
- `details` (object, optional): Updated connection details
- `is_full_sync` (boolean, optional): Whether to perform a full sync
- `is_on_demand` (boolean, optional): Whether to scan only on-demand
- `auto_run_queries` (boolean, optional): Whether to auto-run queries

**Example**:
```javascript
{
  "databaseId": 3,
  "name": "Production DB (Updated)",
  "auto_run_queries": true
}
```

---

## 🔒 Security Considerations

1. **Authentication**: All write operations require a valid Metabase API key with appropriate permissions
2. **Admin Operations**: Database create/update operations require admin-level permissions
3. **Validation**: Always validate input data before creating or updating resources
4. **Audit Trail**: Metabase logs all changes made through the API
5. **Testing**: Test write operations in a non-production environment first

---

## 📊 API Endpoint Summary

| Operation | HTTP Method | Endpoint | Risk Level |
|-----------|-------------|----------|------------|
| Create Card | POST | `/api/card` | HIGH |
| Update Card | PUT | `/api/card/:id` | HIGH |
| Create Collection | POST | `/api/collection` | HIGH |
| Update Collection | PUT | `/api/collection/:id` | HIGH |
| Create Dashboard | POST | `/api/dashboard` | HIGH |
| Update Dashboard | PUT | `/api/dashboard/:id` | HIGH |
| Update Dashboard Cards | PUT | `/api/dashboard/:id/cards` | HIGH |
| Create Database | POST | `/api/database` | VERY HIGH |
| Update Database | PUT | `/api/database/:id` | VERY HIGH |

---

## 🚀 Usage via MCP

These operations are now available as MCP tools. Use them through your MCP client:

```javascript
// Example: Create a new card
await mcp.call_tool("create_card", {
  name: "Monthly Revenue",
  dataset_query: {
    database: 1,
    type: "native",
    native: {
      query: "SELECT date_trunc('month', created_at) as month, sum(amount) as revenue FROM orders GROUP BY 1"
    }
  },
  display: "line"
});

// Example: Update a dashboard
await mcp.call_tool("update_dashboard", {
  dashboardId: 10,
  name: "Updated Dashboard Title",
  description: "New description for the dashboard"
});
```

---

## 📚 Related Documentation

- [Metabase API Documentation](https://www.metabase.com/docs/latest/api-documentation)
- [Main README](./README.md)
- [Usage Guide](./USAGE_GUIDE.md)
- [Tools Reference](./TOOLS_REFERENCE.md)

---

## ⚙️ Version History

- **v2.1.0** (2025-11-03): Added all POST and PUT write operations
- **v2.0.0**: Initial read-only operations
- **v1.0.0**: Basic MCP server setup

