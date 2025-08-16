const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const BACKEND_URL = 'http://localhost:5000';
const FRONTEND_URL = 'http://localhost:3000';

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

async function testBackendHealth() {
  try {
    const response = await axios.get(`${BACKEND_URL}/health`);
    logTest('Backend Health Check', response.status === 200);
    return true;
  } catch (error) {
    logTest('Backend Health Check', false, error.message);
    return false;
  }
}

async function testFrontendAccess() {
  try {
    const response = await axios.get(FRONTEND_URL);
    logTest('Frontend Access', response.status === 200);
    return true;
  } catch (error) {
    logTest('Frontend Access', false, error.message);
    return false;
  }
}

async function testAPIEndpoints() {
  const endpoints = [
    { path: '/api/categories', name: 'Categories API' },
    { path: '/api/videos', name: 'Videos API' },
    { path: '/api/search/videos?q=test', name: 'Search API' },
    { path: '/api-docs', name: 'API Documentation' }
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${BACKEND_URL}${endpoint.path}`);
      logTest(endpoint.name, response.status === 200);
    } catch (error) {
      logTest(endpoint.name, false, error.message);
    }
  }
}

async function testAuthentication() {
  try {
    // Test user registration
    const userData = {
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'TestPassword123',
      firstName: 'Test',
      lastName: 'User'
    };

    const registerResponse = await axios.post(`${BACKEND_URL}/api/auth/register`, userData);
    logTest('User Registration', registerResponse.status === 201);

    if (registerResponse.status === 201) {
      const token = registerResponse.data.data.token;
      
      // Test authenticated endpoint
      const meResponse = await axios.get(`${BACKEND_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      logTest('Authenticated Request', meResponse.status === 200);

      // Test logout
      const logoutResponse = await axios.post(`${BACKEND_URL}/api/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      logTest('User Logout', logoutResponse.status === 200);
    }
  } catch (error) {
    logTest('Authentication Flow', false, error.response?.data?.error?.message || error.message);
  }
}

async function testDatabaseIntegration() {
  try {
    // Test if we can fetch data (indicates MongoDB is working)
    const categoriesResponse = await axios.get(`${BACKEND_URL}/api/categories`);
    const categories = categoriesResponse.data.data?.categories || [];
    logTest('Database - Categories', categories.length > 0);

    const videosResponse = await axios.get(`${BACKEND_URL}/api/videos`);
    const videos = videosResponse.data.data || [];
    logTest('Database - Videos', videos.length >= 0); // Could be empty, that's ok

    // Test search functionality
    const searchResponse = await axios.get(`${BACKEND_URL}/api/search/videos?q=javascript`);
    logTest('Database - Search', searchResponse.status === 200);

  } catch (error) {
    logTest('Database Integration', false, error.message);
  }
}

async function testFileStructure() {
  const requiredFiles = [
    'backend/server.js',
    'backend/src/config/database.js',
    'backend/src/models/UserMongo.js',
    'backend/src/models/VideoMongo.js',
    'backend/package.json',
    'src/App.js',
    'src/contexts/AuthContext.js',
    'src/contexts/VideoContext.js',
    'src/components/Navbar.jsx',
    'src/components/Sidebar.jsx',
    'package.json'
  ];

  for (const file of requiredFiles) {
    const exists = fs.existsSync(file);
    logTest(`File Structure - ${file}`, exists);
  }
}

async function runIntegrationTests() {
  console.log('🧪 Starting Full Stack Integration Tests...\n');

  // Test file structure first
  console.log('📁 Testing File Structure...');
  await testFileStructure();

  // Test backend
  console.log('\n🔧 Testing Backend...');
  const backendRunning = await testBackendHealth();
  
  if (backendRunning) {
    await testAPIEndpoints();
    await testAuthentication();
    await testDatabaseIntegration();
  } else {
    console.log('⚠️  Backend is not running. Please start it with: cd backend && npm run dev');
  }

  // Test frontend
  console.log('\n🎨 Testing Frontend...');
  await testFrontendAccess();

  // Print results
  console.log('\n📊 Integration Test Results:');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);

  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.tests
      .filter(test => !test.passed)
      .forEach(test => console.log(`   - ${test.name}: ${test.error}`));
  }

  console.log('\n🎉 Integration Testing Complete!');
  
  if (testResults.failed === 0) {
    console.log('\n🚀 All tests passed! Your YouTube clone is ready to use.');
    console.log('\n📋 Next steps:');
    console.log('   1. Open http://localhost:3000 in your browser');
    console.log('   2. Register a new account or sign in');
    console.log('   3. Start uploading and watching videos!');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the setup and try again.');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runIntegrationTests().catch(console.error);
}

module.exports = { runIntegrationTests };
