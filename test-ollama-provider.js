const OllamaProvider = require('./lib/providers/ollama');

async function test() {
  console.log('Creating Ollama provider...');
  const ollama = new OllamaProvider();
  
  console.log('Testing initialize...');
  try {
    await ollama.initialize();
    console.log('✅ Initialize successful');
  } catch (error) {
    console.error('❌ Initialize failed:', error.message);
  }
  
  console.log('\nTesting checkHealth...');
  try {
    const health = await ollama.checkHealth();
    console.log('✅ Health check:', health);
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
  }
  
  console.log('\nTesting listModels...');
  try {
    const models = await ollama.listModels();
    console.log('✅ Models:', models);
  } catch (error) {
    console.error('❌ List models failed:', error.message);
  }
}

test().catch(console.error);