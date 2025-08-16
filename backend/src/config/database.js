const mongoose = require('mongoose');
const { logger } = require('../utils/logger');

// MongoDB connection configuration
const dbConfig = {
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/youtube_clone',
  options: {
    maxPoolSize: 20, // maximum number of connections in the pool
    serverSelectionTimeoutMS: 5000, // how long to wait for server selection
    socketTimeoutMS: 45000, // how long to wait for socket timeout
    bufferCommands: false, // disable mongoose buffering
    bufferMaxEntries: 0 // disable mongoose buffering
  }
};

// MongoDB connection instance
let connection = null;

// Connect to MongoDB
const connectDB = async () => {
  try {
    if (connection) {
      return connection;
    }

    connection = await mongoose.connect(dbConfig.uri, dbConfig.options);

    // Handle connection events
    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connected successfully');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    logger.info(`MongoDB connected to ${dbConfig.uri}`);
    return connection;
  } catch (error) {
    logger.error('MongoDB connection failed:', error.message);
    throw error;
  }
};

// Get MongoDB connection
const getConnection = () => {
  if (!connection) {
    throw new Error('Database not connected. Call connectDB() first.');
  }
  return mongoose.connection;
};

// Transaction helper for MongoDB
const transaction = async (callback) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await callback(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    logger.error('Transaction rolled back:', error.message);
    throw error;
  } finally {
    session.endSession();
  }
};

// Close database connection
const closeDB = async () => {
  if (connection) {
    await mongoose.connection.close();
    connection = null;
    logger.info('MongoDB connection closed');
  }
};

// Health check
const healthCheck = async () => {
  try {
    return mongoose.connection.readyState === 1;
  } catch (error) {
    logger.error('Database health check failed:', error.message);
    return false;
  }
};

// Database utilities
const dbUtils = {
  // Check if collection exists
  collectionExists: async (collectionName) => {
    try {
      const collections = await mongoose.connection.db.listCollections({ name: collectionName }).toArray();
      return collections.length > 0;
    } catch (error) {
      logger.error('Error checking collection existence:', error.message);
      return false;
    }
  },

  // Get collection document count
  getDocumentCount: async (collectionName) => {
    try {
      const collection = mongoose.connection.db.collection(collectionName);
      return await collection.countDocuments();
    } catch (error) {
      logger.error('Error getting document count:', error.message);
      return 0;
    }
  },

  // Create database backup
  createBackup: async () => {
    // This would typically use mongodump
    logger.info('Database backup functionality would be implemented here');
  }
};

module.exports = {
  connectDB,
  getConnection,
  transaction,
  closeDB,
  healthCheck,
  dbUtils,
  mongoose
};
