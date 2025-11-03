# Changelog

All notable changes to the Metabase MCP Server will be documented in this file.

## [2.1.0] - 2025-11-03

### 🚀 Added - Write Operations (PUT & POST)

This major update adds **9 new write operations** that enable creating and modifying Metabase resources programmatically through the MCP server.

#### New Tools

**Card Operations:**
- `create_card` - Create new cards (questions) in Metabase
- `update_card` - Update existing cards

**Collection Operations:**
- `create_collection` - Create new collections (folders)
- `update_collection` - Update existing collections

**Dashboard Operations:**
- `create_dashboard` - Create new dashboards
- `update_dashboard` - Update existing dashboards
- `update_dashboard_cards` - Bulk update dashboard card layout and positioning

**Database Operations (Admin Only):**
- `create_database` - Create new database connections
- `update_database` - Update existing database connections

### 🔒 Safety Features

**Mandatory User Confirmation:**
- All write operations now require **explicit user confirmation** before execution
- Updated server instructions to enforce a strict safety protocol
- Added comprehensive error handling for write operations
- Write operations clearly marked with risk levels (HIGH RISK / VERY HIGH RISK)

**Safety Protocol Steps:**
1. Stop and ask for explicit user confirmation
2. Explain what will be created/modified
3. Show the exact data that will be sent to the API
4. Wait for explicit "yes", "confirm", or "proceed" from the user
5. Only then execute the operation

### 📚 Documentation

**New Documentation:**
- Added `WRITE_OPERATIONS.md` - Comprehensive guide for all write operations
- Added `CHANGELOG.md` - Version history tracking
- Updated `README.md` with write operations overview and safety warnings
- Updated server instructions with detailed safety guidelines

**Enhanced Instructions:**
- Added critical safety rules section
- Added example user interaction patterns
- Added workflow for creating/modifying resources
- Added risk level classifications

### 🔧 Technical Changes

**Server (`src/server/index.js`):**
- Added 9 new tool definitions for write operations
- Added 9 new handler methods in the request handler
- Added implementation methods for all write operations
- Updated version to 2.1.0
- Enhanced instructions with safety protocols

**Client (`src/client/cards.js`):**
- Added write operation methods to MetabaseClient class
- All methods include proper error handling
- Methods fetch current state before updating to merge changes

**Package:**
- Updated version to 2.1.0
- Updated description to mention write operations support

### 🎯 API Endpoints Covered

| Endpoint | Method | Tool Name |
|----------|--------|-----------|
| `/api/card` | POST | `create_card` |
| `/api/card/:id` | PUT | `update_card` |
| `/api/collection` | POST | `create_collection` |
| `/api/collection/:id` | PUT | `update_collection` |
| `/api/dashboard` | POST | `create_dashboard` |
| `/api/dashboard/:id` | PUT | `update_dashboard` |
| `/api/dashboard/:id/cards` | PUT | `update_dashboard_cards` |
| `/api/database` | POST | `create_database` |
| `/api/database/:id` | PUT | `update_database` |

### ⚠️ Breaking Changes

None. All existing read-only operations remain unchanged and backward compatible.

### 🔄 Migration Guide

For users upgrading from v2.0.0 or earlier:

1. **Update your MCP configuration** to use the new version
2. **Review the safety guidelines** in `WRITE_OPERATIONS.md`
3. **Test write operations** in a non-production environment first
4. **Ensure your API key has appropriate permissions** for the operations you need
5. **For database operations**, ensure you have admin permissions in Metabase

---

## [2.0.0] - 2024

### Added
- Initial comprehensive MCP server implementation
- 27 read-only tools for Metabase API interaction
- Card/Question management (read)
- Dashboard management (read)
- Database and table metadata access
- Collection browsing
- Query execution
- Field and column inspection
- Segments and metrics listing
- Activity and user management
- Dashboard URL parameter extraction
- Query builder card execution

### Technical
- Full MCP SDK integration
- Comprehensive error handling
- Authentication via API keys
- Environment variable configuration
- Client library for programmatic access

---

## [1.0.0] - Initial Release

### Added
- Basic MCP server structure
- Initial Metabase API client
- Core functionality for reading cards and dashboards

---

## Version Format

This project follows [Semantic Versioning](https://semver.org/):
- MAJOR version for incompatible API changes
- MINOR version for backwards-compatible functionality additions
- PATCH version for backwards-compatible bug fixes

