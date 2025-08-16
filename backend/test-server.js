// Simple server test without database dependency
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5001; // Use different port to avoid conflicts

// Basic middleware
app.use(cors());
app.use(express.json());

// Test routes
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working',
    data: {
      server: 'YouTube Clone Backend',
      version: '1.0.0'
    }
  });
});

// Error handling
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found'
    }
  });
});

app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Test server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API test: http://localhost:${PORT}/api/test`);
});

module.exports = app;
