#!/usr/bin/env node

import { createDefaultClient } from './src/client/cards.js';

const client = createDefaultClient();

// Card data for "Total Net Created BV per Month"
const cardData = {
  name: 'Total Net Created BV per Month',
  description: 'Shows the total net created BV (TOTAL_BV field) grouped by month',
  dataset_query: {
    database: 214,
    type: 'query',
    query: {
      'source-table': 27097,
      aggregation: [
        ['sum', ['field', 'TOTAL_BV', null]]
      ],
      breakout: [
        ['field', 'CREATED_AT', { 'temporal-unit': 'month' }]
      ]
    }
  },
  display: 'bar',
  collection_id: 14
};

try {
  console.log('Creating card...');
  console.log('Card details:', JSON.stringify(cardData, null, 2));
  
  const card = await client.createCard(cardData);
  
  console.log('\n✅ Card created successfully!');
  console.log(`Card ID: ${card.id}`);
  console.log(`Name: ${card.name}`);
  console.log(`Collection ID: ${card.collection_id}`);
  console.log(`View at: https://data-metabase.swile.co/question/${card.id}`);
} catch (error) {
  console.error('\n❌ Error creating card:', error.message);
  if (error.message.includes('field')) {
    console.log('\n💡 Note: The field references might need to use field IDs instead of names.');
    console.log('   You may need to edit the card in Metabase UI to select the correct fields.');
  }
  process.exit(1);
}

