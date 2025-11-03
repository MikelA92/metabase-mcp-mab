#!/usr/bin/env node

/**
 * Test script for new Metabase MCP tools
 * Tests all newly added functionality
 */

import { createDefaultClient } from './src/client/cards.js';

async function testNewTools() {
  console.log('🧪 Testing New Metabase MCP Tools\n');
  console.log('='.repeat(60));
  
  const client = createDefaultClient();
  let passedTests = 0;
  let failedTests = 0;

  // Helper function to run tests
  async function runTest(name, testFn) {
    try {
      console.log(`\n📝 Testing: ${name}`);
      await testFn();
      console.log(`✅ PASSED: ${name}`);
      passedTests++;
    } catch (error) {
      console.log(`❌ FAILED: ${name}`);
      console.error(`   Error: ${error.message}`);
      failedTests++;
    }
  }

  // Test 1: Dashboard Tools
  await runTest('Get Dashboard', async () => {
    const dashboards = await client.listDashboards();
    if (dashboards.length === 0) {
      throw new Error('No dashboards found');
    }
    const dashboard = await client.getDashboard(dashboards[0].id);
    console.log(`   Found dashboard: ${dashboard.name} with ${dashboard.cards.length} cards`);
  });

  await runTest('List Dashboards', async () => {
    const dashboards = await client.listDashboards();
    console.log(`   Found ${dashboards.length} dashboards`);
    if (dashboards.length > 0) {
      console.log(`   Sample: ${dashboards[0].name}`);
    }
  });

  // Test 2: Database Metadata
  await runTest('Get Database Metadata', async () => {
    const databases = await client.listDatabases();
    if (databases.length === 0) {
      throw new Error('No databases found');
    }
    const metadata = await client.getDatabaseMetadata(databases[0].id);
    console.log(`   Database: ${metadata.name} with ${metadata.tables.length} tables`);
  });

  await runTest('List Database Tables', async () => {
    const databases = await client.listDatabases();
    if (databases.length === 0) {
      throw new Error('No databases found');
    }
    const tables = await client.listDatabaseTables(databases[0].id);
    console.log(`   Found ${tables.length} tables in database ${databases[0].name}`);
    if (tables.length > 0) {
      console.log(`   Sample table: ${tables[0].schema}.${tables[0].name}`);
    }
  });

  await runTest('Get Table Metadata', async () => {
    const databases = await client.listDatabases();
    if (databases.length === 0) {
      throw new Error('No databases found');
    }
    const tables = await client.listDatabaseTables(databases[0].id);
    if (tables.length === 0) {
      throw new Error('No tables found');
    }
    const tableMetadata = await client.getTableMetadata(tables[0].id);
    console.log(`   Table: ${tableMetadata.name} with ${tableMetadata.fields.length} fields`);
  });

  // Test 3: Search (using client-side filtering)
  await runTest('Search Cards', async () => {
    const cards = await client.searchCards('revenue');
    console.log(`   Found ${cards.length} cards matching "revenue"`);
  });

  await runTest('Search Dashboards', async () => {
    const dashboards = await client.searchDashboards('revenue');
    console.log(`   Found ${dashboards.length} dashboards matching "revenue"`);
  });

  // Test 4: Collections
  await runTest('List Collections', async () => {
    const collections = await client.listCollections();
    console.log(`   Found ${collections.length} collections`);
    if (collections.length > 0) {
      console.log(`   Sample: ${collections[0].name}`);
    }
  });

  await runTest('Get Collection Items', async () => {
    const collections = await client.listCollections();
    if (collections.length === 0) {
      console.log('   No collections to test (skipping)');
      return;
    }
    const items = await client.getCollectionItems(collections[0].id);
    console.log(`   Collection "${collections[0].name}" has ${items.total} items`);
  });

  // Test 5: Field Methods
  await runTest('Get Field', async () => {
    const databases = await client.listDatabases();
    if (databases.length === 0) {
      throw new Error('No databases found');
    }
    const tables = await client.listDatabaseTables(databases[0].id);
    if (tables.length === 0) {
      throw new Error('No tables found');
    }
    const tableMetadata = await client.getTableMetadata(tables[0].id);
    if (tableMetadata.fields.length === 0) {
      throw new Error('No fields found');
    }
    const field = await client.getField(tableMetadata.fields[0].id);
    console.log(`   Field: ${field.name} (${field.type})`);
  });

  await runTest('Get Field Values', async () => {
    const databases = await client.listDatabases();
    if (databases.length === 0) {
      throw new Error('No databases found');
    }
    const tables = await client.listDatabaseTables(databases[0].id);
    if (tables.length === 0) {
      throw new Error('No tables found');
    }
    const tableMetadata = await client.getTableMetadata(tables[0].id);
    if (tableMetadata.fields.length === 0) {
      throw new Error('No fields found');
    }
    const values = await client.getFieldValues(tableMetadata.fields[0].id);
    console.log(`   Found ${values.length} distinct values`);
  });

  // Test 6: Segments & Metrics
  await runTest('List Segments', async () => {
    const segments = await client.listSegments();
    console.log(`   Found ${segments.length} segments`);
    if (segments.length > 0) {
      console.log(`   Sample: ${segments[0].name}`);
    }
  });

  await runTest('List Metrics', async () => {
    const metrics = await client.listMetrics();
    console.log(`   Found ${metrics.length} metrics`);
    if (metrics.length > 0) {
      console.log(`   Sample: ${metrics[0].name}`);
    }
  });

  // Test 7: Activity & Users
  await runTest('Get Activity', async () => {
    const activity = await client.getActivity(10);
    console.log(`   Retrieved ${activity.length} activity items`);
    if (activity.length > 0) {
      console.log(`   Latest: ${activity[0].topic}`);
    }
  });

  await runTest('Get Current User', async () => {
    const user = await client.getCurrentUser();
    console.log(`   Current user: ${user.commonName} (${user.email})`);
    console.log(`   Admin: ${user.isAdmin}`);
  });

  await runTest('List Users', async () => {
    try {
      const users = await client.listUsers();
      console.log(`   Found ${users.length} users`);
    } catch (error) {
      if (error.message.includes('403') || error.message.includes('permission')) {
        console.log('   Requires admin permissions (expected)');
      } else {
        throw error;
      }
    }
  });

  // Test 8: Execute Native Query (careful - this is moderate risk)
  await runTest('Execute Native Query', async () => {
    const databases = await client.listDatabases();
    if (databases.length === 0) {
      throw new Error('No databases found');
    }
    
    // Simple SELECT 1 query - safe and fast
    const result = await client.executeNativeQuery(databases[0].id, 'SELECT 1 as test');
    console.log(`   Query executed successfully on ${databases[0].name}`);
    console.log(`   Result has ${result.data?.rows?.length || 0} rows`);
  });

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Summary:');
  console.log(`   ✅ Passed: ${passedTests}`);
  console.log(`   ❌ Failed: ${failedTests}`);
  console.log(`   📈 Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);
  
  if (failedTests === 0) {
    console.log('\n🎉 All tests passed! The MCP server is ready to use.');
  } else {
    console.log('\n⚠️  Some tests failed. Review the errors above.');
  }
}

// Run tests
testNewTools().catch(error => {
  console.error('\n💥 Fatal error running tests:', error);
  process.exit(1);
});

