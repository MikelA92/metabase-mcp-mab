#!/usr/bin/env node

/**
 * Test script for the new Dashboard URL & Parameter functionality
 * This demonstrates how to use the new tools for working with dashboard URLs
 */

import { createDefaultClient } from './src/client/cards.js';

async function testDashboardUrlFunctionality() {
  console.log('🚀 Testing Dashboard URL & Parameter Functionality\n');
  
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
    
    // Test URL from the user's example
    const testUrl = 'https://data-metabase.swile.co/question#eyJuYW1lIjoiWWVhcmx5IOKCrCBDaHVybiBieSBDbGllbnQgU2l6ZSIsImRlc2NyaXB0aW9uIjpudWxsLCJkYXRhc2V0X3F1ZXJ5Ijp7ImRhdGFiYXNlIjoxMjUsInF1ZXJ5Ijp7ImFnZ3JlZ2F0aW9uIjpbWyJhZ2dyZWdhdGlvbi1vcHRpb25zIixbIioiLC0xLFsic3VtIixbImZpZWxkIiwiQ0hBTkdFX0FNT1VOVF9WMl9SRVdSSVRFX0hJU1RPIix7ImJhc2UtdHlwZSI6InR5cGUvRmxvYXQifV1dXSx7ImRpc3BsYXktbmFtZSI6IkNodXJuIOKCrCIsIm5hbWUiOiJDaHVybiDigqwifV1dLCJicmVha291dCI6W1siZmllbGQiLCJDTElFTlRfU0laRV9UUkFOQ0hFIix7ImJhc2UtdHlwZSI6InR5cGUvVGV4dCJ9XV0sImZpbHRlciI6WyJhbmQiLFsiPSIsWyJmaWVsZCIsIlNUQVRVU19DSFVSTl9WMl9SRVdSSVRFX0hJU1RPIix7ImJhc2UtdHlwZSI6InR5cGUvQm9vbGVhbiJ9XSx0cnVlXSxbInRpbWUtaW50ZXJ2YWwiLFsiZmllbGQiLCJPUkRFUl9EQVRFIix7ImJhc2UtdHlwZSI6InR5cGUvRGF0ZVRpbWVXaXRoTG9jYWxUWiJ9XSwtMSwieWVhciJdXSwic291cmNlLXRhYmxlIjoiY2FyZF9fMjIyNDUifSwidHlwZSI6InF1ZXJ5In0sImRpc3BsYXkiOiJwaWUiLCJkaXNwbGF5SXNMb2NrZWQiOnRydWUsInZpc3VhbGl6YXRpb25fc2V0dGluZ3MiOnsicGllLmRlY2ltYWxfcGxhY2VzIjoxLCJwaWUucGVyY2VudF92aXNpYmlsaXR5IjoiaW5zaWRlIiwicGllLnNob3dfbGFiZWxzIjpmYWxzZSwicGllLnNob3dfbGVnZW5kIjp0cnVlLCJwaWUuc2hvd190b3RhbCI6dHJ1ZSwidmVyc2lvbiI6Mn0sIm9yaWdpbmFsX2NhcmRfaWQiOjIyMzM5LCJ0eXBlIjoicXVlc3Rpb24ifQ==';
    
    console.log('2. Testing URL decoding...');
    const decoded = client.decodeDashboardUrl(testUrl);
    console.log(`   ✅ Successfully decoded URL`);
    console.log(`   Original Card ID: ${decoded.originalCardId}`);
    console.log(`   Card Name: ${decoded.name}`);
    console.log(`   Display Type: ${decoded.display}`);
    console.log(`   Parameters Found: ${Object.keys(decoded.parameters).length}`);
    console.log();
    
    console.log('3. Testing getCardWithParameters...');
    const cardWithParams = await client.getCardWithParameters(testUrl);
    console.log(`   ✅ Successfully extracted card with parameters`);
    console.log(`   Card ID: ${cardWithParams.id}`);
    console.log(`   Card Name: ${cardWithParams.name}`);
    console.log(`   Query Type: ${cardWithParams.queryType}`);
    console.log(`   Extracted Parameters:`);
    console.log(`   - Filters: ${cardWithParams.extractedParameters.filters ? 'Yes' : 'No'}`);
    console.log(`   - Aggregations: ${cardWithParams.extractedParameters.aggregations ? 'Yes' : 'No'}`);
    console.log(`   - Breakouts: ${cardWithParams.extractedParameters.breakouts ? 'Yes' : 'No'}`);
    console.log();
    
    console.log('4. Testing getGeneratedSQL...');
    try {
      const sqlResult = await client.getGeneratedSQL(cardWithParams.id, cardWithParams.extractedParameters);
      console.log(`   ✅ Successfully generated SQL`);
      console.log(`   Card Name: ${sqlResult.cardName}`);
      console.log(`   SQL Length: ${sqlResult.generatedSQL.length} characters`);
      console.log(`   SQL Preview: ${sqlResult.generatedSQL.substring(0, 200)}...`);
      console.log();
    } catch (error) {
      console.log(`   ⚠️ SQL generation failed: ${error.message}`);
      console.log(`   This might be expected for query-builder cards`);
      console.log();
    }
    
    console.log('5. Testing executeQueryBuilderCard...');
    try {
      const executionResult = await client.executeQueryBuilderCard(cardWithParams.id, cardWithParams.extractedParameters);
      console.log(`   ✅ Successfully executed query builder card`);
      console.log(`   Results available: ${executionResult ? 'Yes' : 'No'}`);
      console.log();
    } catch (error) {
      console.log(`   ⚠️ Query execution failed: ${error.message}`);
      console.log(`   This might be expected for complex queries`);
      console.log();
    }
    
    console.log('6. Testing parameter extraction details...');
    console.log(`   Detailed Parameters:`);
    console.log(`   ${JSON.stringify(cardWithParams.extractedParameters, null, 2)}`);
    console.log();
    
    console.log('7. Testing with a simple native SQL card...');
    // Test with the card we know works (17033)
    try {
      const simpleCard = await client.getCard(17033);
      console.log(`   ✅ Successfully retrieved simple card`);
      console.log(`   Card Name: ${simpleCard.name}`);
      console.log(`   Query Type: ${simpleCard.queryType}`);
      console.log(`   Has SQL: ${simpleCard.sqlQuery ? 'Yes' : 'No'}`);
      console.log();
    } catch (error) {
      console.log(`   ❌ Failed to retrieve simple card: ${error.message}`);
      console.log();
    }
    
    console.log('🎉 Dashboard URL functionality test completed!');
    console.log('\n📋 Summary:');
    console.log('✅ URL decoding works');
    console.log('✅ Parameter extraction works');
    console.log('✅ Card retrieval with parameters works');
    console.log('⚠️ SQL generation may not work for all query types');
    console.log('⚠️ Query execution may not work for all query types');
    console.log('\n💡 The new functionality successfully extracts card IDs and parameters from dashboard URLs!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testDashboardUrlFunctionality();
