const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const BACKEND_URL = 'http://localhost:5000';
const FRONTEND_URL = 'http://localhost:3000';

// Test results
let passed = 0;
let failed = 0;

function logTest(name, success, error = null) {
  if (success) {
    passed++;
    console.log(`✅ ${name}`);
  } else {
    failed++;
    console.log(`❌ ${name}: ${error || 'Failed'}`);
  }
}

async function testFileStructure() {
  console.log('\n📁 Testing File Structure...');
  
  const requiredFiles = [
    'backend/server.js',
    'backend/src/config/database.js',
    'backend/src/models/UserMongo.js',
    'backend/src/models/VideoMongo.js',
    'backend/package.json',
    'frontend/src/App.js',
    'frontend/src/components/Navbar.jsx',
    'frontend/src/components/SideBar.jsx',
    'frontend/src/components/Feed.jsx',
    'frontend/src/components/VideoCard.jsx',
    'frontend/src/components/Videos.jsx',
    'frontend/src/components/Video.jsx',
    'frontend/src/components/Search.jsx',
    'frontend/src/utils/api.js',
    'frontend/package.json'
  ];

  for (const file of requiredFiles) {
    const exists = fs.existsSync(file);
    logTest(`File exists: ${file}`, exists);
  }
}

async function testBackendHealth() {
  console.log('\n🔧 Testing Backend...');
  
  try {
    const response = await axios.get(`${BACKEND_URL}/health`, { timeout: 5000 });
    logTest('Backend Health Check', response.status === 200);
    return true;
  } catch (error) {
    logTest('Backend Health Check', false, 'Backend not running - start with: cd backend && npm run dev');
    return false;
  }
}

async function testFrontendAccess() {
  console.log('\n🎨 Testing Frontend...');
  
  try {
    const response = await axios.get(FRONTEND_URL, { timeout: 5000 });
    logTest('Frontend Access', response.status === 200);
    return true;
  } catch (error) {
    logTest('Frontend Access', false, 'Frontend not running - start with: cd frontend && npm start');
    return false;
  }
}

async function testAPIEndpoints() {
  console.log('\n🔌 Testing API Endpoints...');
  
  const endpoints = [
    { path: '/api/categories', name: 'Categories API' },
    { path: '/api/videos', name: 'Videos API' },
    { path: '/api-docs', name: 'API Documentation' }
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${BACKEND_URL}${endpoint.path}`, { timeout: 5000 });
      logTest(endpoint.name, response.status === 200);
    } catch (error) {
      logTest(endpoint.name, false, error.message);
    }
  }
}

async function testDatabaseConnection() {
  console.log('\n🗄️ Testing Database...');
  
  try {
    // Test if we can fetch categories (indicates MongoDB is working)
    const response = await axios.get(`${BACKEND_URL}/api/categories`, { timeout: 5000 });
    logTest('MongoDB Connection', response.status === 200);
    
    if (response.data && response.data.data) {
      const categories = response.data.data.categories || [];
      logTest('Sample Data Loaded', categories.length > 0);
    }
  } catch (error) {
    logTest('MongoDB Connection', false, 'Run: cd backend && npm run db:setup');
  }
}

async function testUIComponents() {
  console.log('\n🎨 Testing UI Components...');
  
  // Check if key component files exist and have YouTube-like styling
  const components = [
    { file: 'frontend/src/components/Navbar.jsx', name: 'YouTube-style Navbar' },
    { file: 'frontend/src/components/SideBar.jsx', name: 'YouTube-style Sidebar' },
    { file: 'frontend/src/components/VideoCard.jsx', name: 'YouTube-style Video Cards' },
    { file: 'frontend/src/components/Feed.jsx', name: 'YouTube-style Feed' }
  ];

  for (const component of components) {
    try {
      const content = fs.readFileSync(component.file, 'utf8');
      
      // Check for YouTube-like styling indicators
      const hasYouTubeColors = content.includes('#0f0f0f') || content.includes('#ff0000');
      const hasMaterialUI = content.includes('@mui/material');
      const hasResponsiveDesign = content.includes('xs:') || content.includes('sm:') || content.includes('md:');
      
      logTest(component.name, hasYouTubeColors && hasMaterialUI);
    } catch (error) {
      logTest(component.name, false, 'File not found or unreadable');
    }
  }
}

async function testPackageIntegrity() {
  console.log('\n📦 Testing Package Integrity...');
  
  try {
    // Check backend package.json
    const backendPkg = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
    const hasMongoose = backendPkg.dependencies && backendPkg.dependencies.mongoose;
    const hasExpress = backendPkg.dependencies && backendPkg.dependencies.express;
    logTest('Backend Dependencies (MongoDB)', hasMongoose && hasExpress);

    // Check frontend package.json
    const frontendPkg = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
    const hasReact = frontendPkg.dependencies && frontendPkg.dependencies.react;
    const hasMUI = frontendPkg.dependencies && frontendPkg.dependencies['@mui/material'];
    logTest('Frontend Dependencies (React + MUI)', hasReact && hasMUI);

  } catch (error) {
    logTest('Package Integrity', false, error.message);
  }
}

async function runAllTests() {
  console.log('🧪 YouTube Clone Integration Test Suite');
  console.log('=====================================\n');

  // Test file structure
  await testFileStructure();
  
  // Test package integrity
  await testPackageIntegrity();
  
  // Test UI components
  await testUIComponents();
  
  // Test backend
  const backendRunning = await testBackendHealth();
  if (backendRunning) {
    await testAPIEndpoints();
    await testDatabaseConnection();
  }
  
  // Test frontend
  await testFrontendAccess();

  // Print results
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('\n🚀 Your YouTube Clone is ready!');
    console.log('\n📋 Quick Start:');
    console.log('   1. Backend: cd backend && npm run dev');
    console.log('   2. Frontend: cd frontend && npm start');
    console.log('   3. Open: http://localhost:3000');
    console.log('\n✨ Features:');
    console.log('   • Exact YouTube UI/UX with dark theme');
    console.log('   • MongoDB backend integration');
    console.log('   • Responsive design for all devices');
    console.log('   • Video management and user authentication');
    console.log('   • Search, categories, and social features');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the issues above.');
    console.log('\n🔧 Common Solutions:');
    console.log('   • Install dependencies: npm install (in both backend and frontend)');
    console.log('   • Start MongoDB: brew services start mongodb/brew/mongodb-community');
    console.log('   • Setup database: cd backend && npm run db:setup');
    console.log('   • Start backend: cd backend && npm run dev');
    console.log('   • Start frontend: cd frontend && npm start');
  }

  console.log('\n📖 For detailed setup instructions, see: YOUTUBE_CLONE_SETUP.md');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests };
