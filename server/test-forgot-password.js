#!/usr/bin/env node

/**
 * Forgot Password API Test Script
 * 
 * This script tests the forgot password API endpoint with various scenarios
 */

require('dotenv').config();
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testForgotPassword() {
  console.log('🧪 Testing Forgot Password API...\n');

  const testCases = [
    {
      name: 'Valid existing email',
      email: 'ratulahr124@gmail.com',
      expectedStatus: 200,
      description: 'Should send reset email successfully'
    },
    {
      name: 'Non-existent email',
      email: 'nonexistent@example.com',
      expectedStatus: 404,
      description: 'Should return "No account found" error'
    },
    {
      name: 'Invalid email format',
      email: 'invalid-email',
      expectedStatus: 400,
      description: 'Should return "Invalid email" error'
    },
    {
      name: 'Empty email',
      email: '',
      expectedStatus: 400,
      description: 'Should return "Email required" error'
    },
    {
      name: 'Inactive user email',
      email: 'yoush123@gmail.com', // This user is inactive according to our check
      expectedStatus: 403,
      description: 'Should return "Account inactive" error'
    }
  ];

  for (const testCase of testCases) {
    console.log(`🔍 Testing: ${testCase.name}`);
    console.log(`📧 Email: "${testCase.email}"`);
    console.log(`📝 Expected: ${testCase.description}`);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
        email: testCase.email
      });
      
      if (response.status === testCase.expectedStatus) {
        console.log(`✅ PASS: Got expected status ${response.status}`);
        console.log(`📄 Response: ${response.data.message}`);
      } else {
        console.log(`❌ FAIL: Expected status ${testCase.expectedStatus}, got ${response.status}`);
      }
      
    } catch (error) {
      if (error.response && error.response.status === testCase.expectedStatus) {
        console.log(`✅ PASS: Got expected error status ${error.response.status}`);
        console.log(`📄 Error message: ${error.response.data.message}`);
      } else {
        console.log(`❌ FAIL: Expected status ${testCase.expectedStatus}, got ${error.response?.status || 'Network Error'}`);
        console.log(`📄 Error: ${error.response?.data?.message || error.message}`);
      }
    }
    
    console.log(''); // Empty line for readability
  }
  
  console.log('🎯 Test Summary:');
  console.log('- Valid emails should receive reset instructions');
  console.log('- Invalid emails should show appropriate error messages');
  console.log('- Frontend should display these errors to users');
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get(`${API_BASE_URL}/auth/profile`);
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Server is not running!');
      console.log('💡 Start the server with: npm run dev');
      return false;
    }
    // Server is running but endpoint requires auth (expected)
    return true;
  }
}

async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await testForgotPassword();
  }
}

main();
