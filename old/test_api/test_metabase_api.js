// test-metabase-api-key.js
const METABASE_URL = 'https://data-metabase.swile.co';  // Removed trailing slash
const API_KEY = 'mb_d5MaAfRhXJ6iKP86emIL04G1RuRIz/PB5UDPiOfeK4U=';
const CARD_ID = 22339;

async function getCardWithApiKey(cardId) {
  try {
    console.log(`Fetching card ${cardId} from ${METABASE_URL}...`);
    
    const response = await fetch(`${METABASE_URL}/api/card/${cardId}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      }
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    
    // Check if response is OK
    if (!response.ok) {
      const text = await response.text();
      console.error('Error response:', text.substring(0, 500)); // First 500 chars
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Check content type
    const contentType = response.headers.get('content-type');
    console.log('Content-Type:', contentType);
    
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response:', text.substring(0, 500));
      throw new Error('Response is not JSON');
    }

    const card = await response.json();
    console.log('\n✅ Success!');
    console.log('Card Name:', card.name);
    console.log('\nSQL Query:');
    console.log(card.dataset_query?.native?.query || 'No native query');
    
    return card;
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

getCardWithApiKey(CARD_ID);