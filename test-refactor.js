#!/usr/bin/env node

/**
 * Quick test to verify the refactored code works correctly
 */

import { MetabaseMCPServer } from './src/server/MetabaseMCPServer.js';
import { MetabaseClient } from './src/client/MetabaseClient.js';
import { logger } from './src/shared/utils/logger.js';
import { Validators } from './src/shared/utils/validators.js';
import { DashboardUrlDecoder } from './src/shared/utils/urlDecoder.js';
import {
  MetabaseError,
  ApiError,
  ValidationError,
  ConfigurationError,
} from './src/shared/errors/MetabaseError.js';

async function main() {
  console.log('🧪 Testing Refactored Code Structure\n');
  console.log('='.repeat(60));

  let passedTests = 0;
  let failedTests = 0;

  async function runTest(name, testFn) {
    try {
      await testFn();
      console.log(`✅ PASSED: ${name}`);
      passedTests++;
    } catch (error) {
      console.log(`❌ FAILED: ${name}`);
      console.error(`   Error: ${error.message}`);
      failedTests++;
    }
  }

  // Test 1: Error classes
  await runTest('Error classes are properly exported', () => {
  const error = new ValidationError('Test error', 'testField', 'testValue');
  if (error.name !== 'ValidationError') throw new Error('ValidationError not properly initialized');
  if (error.field !== 'testField') throw new Error('ValidationError field not set');
});

  // Test 2: Validators
  await runTest('Validators work correctly', () => {
  try {
    Validators.validateCardId(-1);
    throw new Error('Should have thrown ValidationError');
  } catch (error) {
    if (!(error instanceof ValidationError)) throw new Error('Did not throw ValidationError');
  }
});

  await runTest('Validators accept valid input', () => {
  Validators.validateCardId(123); // Should not throw
});

  // Test 3: Logger
  await runTest('Logger is properly initialized', () => {
  const testLogger = logger.child('Test');
  if (!testLogger.context.includes('Test')) throw new Error('Child logger not created correctly');
});

  // Test 4: DashboardUrlDecoder (error case only, as we need a real URL for success case)
  await runTest('DashboardUrlDecoder throws on invalid URL', () => {
  try {
    DashboardUrlDecoder.decode('invalid-url-without-fragment');
    throw new Error('Should have thrown ValidationError');
  } catch (error) {
    if (!(error instanceof ValidationError)) throw new Error('Did not throw ValidationError');
  }
});

  // Test 5: MetabaseClient can be instantiated
  await runTest('MetabaseClient can be instantiated', () => {
  const client = new MetabaseClient('https://test.com', 'test-key');
  if (!client.metabaseUrl) throw new Error('Client not properly initialized');
  if (client.metabaseUrl !== 'https://test.com') throw new Error('URL not set correctly');
});

  // Test 6: MetabaseMCPServer can be instantiated
  await runTest('MetabaseMCPServer can be instantiated', () => {
  const config = {
    metabaseUrl: 'https://test.com',
    apiKey: 'test-key',
    requestTimeout: 30000,
  };
  const server = new MetabaseMCPServer(config);
  if (!server.apiClient) throw new Error('Server not properly initialized');
});

  // Test 7: Tool definitions are properly exported
  await runTest('Tool definitions are available', async () => {
  const { TOOL_DEFINITIONS } = await import('./src/server/config/toolDefinitions.js');
  if (!Array.isArray(TOOL_DEFINITIONS)) throw new Error('TOOL_DEFINITIONS is not an array');
  if (TOOL_DEFINITIONS.length === 0) throw new Error('TOOL_DEFINITIONS is empty');
  
  // Check that all tools have required properties
  TOOL_DEFINITIONS.forEach(tool => {
    if (!tool.name) throw new Error(`Tool missing name: ${JSON.stringify(tool)}`);
    if (!tool.description) throw new Error(`Tool ${tool.name} missing description`);
    if (!tool.inputSchema) throw new Error(`Tool ${tool.name} missing inputSchema`);
  });
  
  console.log(`   Found ${TOOL_DEFINITIONS.length} tool definitions`);
});

  // Test 8: All handlers are properly exported
  await runTest('All handler classes are available', async () => {
  const { CardHandlers } = await import('./src/server/handlers/cardHandlers.js');
  const { DashboardHandlers } = await import('./src/server/handlers/dashboardHandlers.js');
  const { DatabaseHandlers } = await import('./src/server/handlers/databaseHandlers.js');
  const { CollectionHandlers } = await import('./src/server/handlers/collectionHandlers.js');
  const { QueryHandlers } = await import('./src/server/handlers/queryHandlers.js');
  const { FieldHandlers } = await import('./src/server/handlers/fieldHandlers.js');
  const { SegmentMetricHandlers } = await import('./src/server/handlers/segmentMetricHandlers.js');
  const { UserHandlers } = await import('./src/server/handlers/userHandlers.js');
  
  const handlers = [
    CardHandlers,
    DashboardHandlers,
    DatabaseHandlers,
    CollectionHandlers,
    QueryHandlers,
    FieldHandlers,
    SegmentMetricHandlers,
    UserHandlers,
  ];
  
  handlers.forEach(Handler => {
    if (typeof Handler !== 'function') throw new Error(`Handler is not a class: ${Handler}`);
  });
  
  console.log(`   Found ${handlers.length} handler classes`);
});

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Summary:');
  console.log(`   ✅ Passed: ${passedTests}`);
  console.log(`   ❌ Failed: ${failedTests}`);
  console.log(`   📈 Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);

  if (failedTests === 0) {
    console.log('\n🎉 All refactoring tests passed! The code structure is working correctly.');
    console.log('\n📝 Next steps:');
    console.log('   1. Test with actual Metabase instance');
    console.log('   2. Run the existing test suite: node testing/test-new-tools.js');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Review the errors above.');
    process.exit(1);
  }
}

// Run main
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

