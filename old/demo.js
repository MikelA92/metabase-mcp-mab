#!/usr/bin/env node

/**
 * Example usage of the Metabase Cards Client
 * This demonstrates how to use the client library directly
 */

import { createDefaultClient } from '../src/client/cards.js';

async function demonstrateClient() {
  console.log('🚀 Metabase Cards Client Demo\n');
  
  try {
    // Create client with default configuration
    const client = createDefaultClient();
    
    // Test connection
    console.log('1. Testing connection...');
    const isConnected = await client.testConnection();
    console.log(`   Connection: ${isConnected ? '✅ Success' : '❌ Failed'}\n`);
    
    if (!isConnected) {
      console.log('❌ Cannot proceed without connection');
      return;
    }
    
    // List databases
    console.log('2. Listing databases...');
    const databases = await client.listDatabases();
    console.log(`   Found ${databases.length} databases:`);
    databases.forEach(db => {
      console.log(`   - ${db.name} (ID: ${db.id}, Engine: ${db.engine})`);
    });
    console.log();
    
    // List cards
    console.log('3. Listing cards...');
    const cards = await client.listCards('all');
    console.log(`   Found ${cards.length} cards:`);
    cards.slice(0, 5).forEach(card => { // Show first 5
      console.log(`   - ${card.name} (ID: ${card.id}, DB: ${card.databaseId})`);
    });
    if (cards.length > 5) {
      console.log(`   ... and ${cards.length - 5} more`);
    }
    console.log();
    
    // Get specific card (using the ID from your test)
    console.log('4. Getting specific card (ID: 17033)...');
    const card = await client.getCard(17033);
    console.log(`   Card: ${card.name}`);
    console.log(`   Database ID: ${card.databaseId}`);
    console.log(`   Query Type: ${card.queryType}`);
    console.log(`   SQL Query:`);
    console.log(`   ${card.sqlQuery || 'No SQL query found'}`);
    console.log();
    
    // Search for cards
    console.log('5. Searching for cards with "revenue"...');
    const searchResults = await client.searchCards('revenue');
    console.log(`   Found ${searchResults.length} cards matching "revenue":`);
    searchResults.forEach(card => {
      console.log(`   - ${card.name} (ID: ${card.id})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

// Run the demonstration
demonstrateClient();
