const axios = require('axios');

async function testApp() {
  try {
    console.log('Testing the dynamic website...');
    
    // Test homepage
    const homeResponse = await axios.get('http://localhost:8081');
    console.log(`Homepage status: ${homeResponse.status}`);
    
    // Test API endpoint to save data
    const saveResponse = await axios.post('http://localhost:8081/api/data', {
      content: 'Test entry from automated test'
    });
    console.log(`Save data status: ${saveResponse.status}, Response:`, saveResponse.data);
    
    // Test API endpoint to get data
    const getDataResponse = await axios.get('http://localhost:8081/api/data');
    console.log(`Get data status: ${getDataResponse.status}, Count:`, getDataResponse.data.length);
    
    console.log('Application is working correctly!');
  } catch (error) {
    console.error('Error testing application:', error.message);
  }
}

testApp();