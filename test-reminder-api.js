const axios = require('axios');

async function testReminderSettingsAPI() {
  try {
    console.log('Testing reminder settings API...');
    
    // Test data
    const testSettings = {
      morningTime: '09:00',
      lunchTime: '13:00',
      dinnerTime: '20:00',
      enabled: true,
      notificationEnabled: true,
      reminderMinutesBefore: 15
    };
    
    console.log('Sending test data:', testSettings);
    
    // Note: This will fail without proper authentication, but we can see the error
    const response = await axios.post('http://localhost:5000/api/medicines/patients/1/reminder-settings', testSettings, {
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': 'Bearer your-token-here' // Add this if you have a valid token
      }
    });
    
    console.log('Success:', response.data);
  } catch (error) {
    console.error('Error testing API:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data);
    console.error('Full error:', error.message);
  }
}

testReminderSettingsAPI();

