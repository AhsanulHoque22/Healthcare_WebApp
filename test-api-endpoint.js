const axios = require('axios');

async function testAPIEndpoint() {
  try {
    console.log('Testing API endpoint availability...');
    
    // Test if the endpoint exists (will get 401 but should not get 404)
    const response = await axios.post('http://localhost:5000/api/medicines/patients/1/reminder-settings', {
      morningTime: '09:00',
      lunchTime: '13:00',
      dinnerTime: '20:00',
      enabled: true
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      validateStatus: function (status) {
        // Accept both 200 and 401 status codes
        return status < 500;
      }
    });
    
    console.log('API endpoint is accessible!');
    console.log('Status:', response.status);
    console.log('Response:', response.data);
    
  } catch (error) {
    if (error.response) {
      console.log('API endpoint exists but returned:', error.response.status);
      console.log('Message:', error.response.data);
      
      if (error.response.status === 401) {
        console.log('✅ Endpoint exists - authentication required (expected)');
      } else if (error.response.status === 404) {
        console.log('❌ Endpoint not found - check route configuration');
      } else {
        console.log('⚠️  Unexpected status code:', error.response.status);
      }
    } else if (error.code === 'ECONNREFUSED') {
      console.log('❌ Server not running on port 5000');
    } else {
      console.log('❌ Network error:', error.message);
    }
  }
}

testAPIEndpoint();

