const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';
let testUserId = '';
let testVideoId = '';

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, error = null) {
  testResults.tests.push({ name, passed, error });
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${name}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${name}: ${error}`);
  }
}

async function testHealthCheck() {
  try {
    const response = await axios.get('http://localhost:5000/health');
    logTest('Health Check', response.status === 200);
    return true;
  } catch (error) {
    logTest('Health Check', false, error.message);
    return false;
  }
}

async function testUserRegistration() {
  try {
    const userData = {
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'TestPassword123',
      firstName: 'Test',
      lastName: 'User',
      channelName: 'Test Channel'
    };

    const response = await axios.post(`${BASE_URL}/auth/register`, userData);
    
    if (response.status === 201 && response.data.success) {
      authToken = response.data.data.token;
      testUserId = response.data.data.user.id;
      logTest('User Registration', true);
      return true;
    } else {
      logTest('User Registration', false, 'Invalid response format');
      return false;
    }
  } catch (error) {
    logTest('User Registration', false, error.response?.data?.error?.message || error.message);
    return false;
  }
}

async function testUserLogin() {
  try {
    const loginData = {
      email: `test_${Date.now()}@example.com`,
      password: 'TestPassword123'
    };

    // First register a user for login test
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      username: `logintest_${Date.now()}`,
      email: loginData.email,
      password: loginData.password,
      firstName: 'Login',
      lastName: 'Test'
    });

    if (registerResponse.status === 201) {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData);
      logTest('User Login', loginResponse.status === 200 && loginResponse.data.success);
      return true;
    } else {
      logTest('User Login', false, 'Failed to create test user');
      return false;
    }
  } catch (error) {
    logTest('User Login', false, error.response?.data?.error?.message || error.message);
    return false;
  }
}

async function testProtectedRoute() {
  if (!authToken) {
    logTest('Protected Route Access', false, 'No auth token available');
    return false;
  }

  try {
    const response = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    logTest('Protected Route Access', response.status === 200 && response.data.success);
    return true;
  } catch (error) {
    logTest('Protected Route Access', false, error.response?.data?.error?.message || error.message);
    return false;
  }
}

async function testGetCategories() {
  try {
    const response = await axios.get(`${BASE_URL}/categories`);
    logTest('Get Categories', response.status === 200 && response.data.success);
    return true;
  } catch (error) {
    logTest('Get Categories', false, error.response?.data?.error?.message || error.message);
    return false;
  }
}

async function testGetVideos() {
  try {
    const response = await axios.get(`${BASE_URL}/videos`);
    logTest('Get Videos', response.status === 200 && response.data.success);
    return true;
  } catch (error) {
    logTest('Get Videos', false, error.response?.data?.error?.message || error.message);
    return false;
  }
}

async function testSearchVideos() {
  try {
    const response = await axios.get(`${BASE_URL}/search/videos?q=test`);
    logTest('Search Videos', response.status === 200 && response.data.success);
    return true;
  } catch (error) {
    logTest('Search Videos', false, error.response?.data?.error?.message || error.message);
    return false;
  }
}

async function testGetUsers() {
  try {
    const response = await axios.get(`${BASE_URL}/users/search?q=test`);
    logTest('Search Users', response.status === 200 && response.data.success);
    return true;
  } catch (error) {
    logTest('Search Users', false, error.response?.data?.error?.message || error.message);
    return false;
  }
}

async function testAPIDocumentation() {
  try {
    const response = await axios.get('http://localhost:5000/api-docs');
    logTest('API Documentation', response.status === 200);
    return true;
  } catch (error) {
    logTest('API Documentation', false, error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting API Tests...\n');

  // Test server availability
  const serverRunning = await testHealthCheck();
  if (!serverRunning) {
    console.log('\n❌ Server is not running. Please start the backend server first.');
    console.log('Run: cd backend && npm run dev');
    return;
  }

  // Run authentication tests
  console.log('\n📋 Testing Authentication...');
  await testUserRegistration();
  await testUserLogin();
  await testProtectedRoute();

  // Run API endpoint tests
  console.log('\n📋 Testing API Endpoints...');
  await testGetCategories();
  await testGetVideos();
  await testSearchVideos();
  await testGetUsers();
  await testAPIDocumentation();

  // Print results
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);

  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.tests
      .filter(test => !test.passed)
      .forEach(test => console.log(`   - ${test.name}: ${test.error}`));
  }

  console.log('\n🎉 API Testing Complete!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests };
