# MCP Metabase Server

A local MCP server that connects to Metabase's API to fetch question (card) details.

## Project Structure

```
mcp-metabase/
├─ src/
│  ├─ client/
│  │  └─ cards.js       # Metabase API client
│  ├─ server/
│  │  └─ index.js       # MCP server
├─ .env                  # Environment variables
├─ package.json
├─ Dockerfile
```

## Setup

1. **Configure Environment Variables**
   
   Edit the `.env` file with your Metabase credentials:
   ```
   METABASE_URL=https://your-metabase-url.com
   METABASE_API_KEY=your_metabase_api_key
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Run Locally**
   ```bash
   npm start
   ```

## Docker Usage

1. **Build the Docker Image**
   ```bash
   docker build -t mcp-metabase .
   ```

2. **Run the Container**
   ```bash
   docker run --rm --env-file .env mcp-metabase
   ```

## API Methods

### `metabase.get_card`

Fetches details of a Metabase question (card) by ID.

**Parameters:**
- `cardId` (number): The ID of the card to fetch

**Example Request:**
```json
{
  "method": "metabase.get_card",
  "params": { "cardId": 123 }
}
```

**Example Response:**
```json
{
  "id": 123,
  "name": "Revenue by Region",
  "dataset_query": { ... },
  "display": "bar"
}
```

## Architecture

1. **Client Layer** (`cards.js`): Handles HTTP calls to the Metabase API
2. **Server Layer** (`index.js`): Exposes MCP methods using JSON-RPC
3. **Docker**: Packages everything for consistent deployment
4. **Environment**: Secure configuration via `.env` file

## Extending

To add more Metabase API endpoints:
1. Add new functions to `src/client/cards.js` (or create new client files)
2. Register new methods in `src/server/index.js`
3. Follow the same pattern for consistent API design

