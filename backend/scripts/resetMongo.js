const mongoose = require('mongoose');
const { seedDatabase } = require('../database/seedMongo');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/youtube_clone';

async function resetMongoDB() {
  try {
    console.log('🔄 Starting MongoDB database reset...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📋 Found ${collections.length} collections to drop`);

    // Drop all collections
    for (const collection of collections) {
      await mongoose.connection.db.collection(collection.name).drop();
      console.log(`🗑️  Dropped collection: ${collection.name}`);
    }

    console.log('✅ All collections dropped successfully');
    
    // Close connection
    await mongoose.connection.close();

    // Run seed
    console.log('🌱 Running database seed...');
    await seedDatabase();

    console.log('🎉 MongoDB database reset completed successfully!');

  } catch (error) {
    console.error('❌ MongoDB reset failed:', error.message);
    process.exit(1);
  }
}

// Run reset if this file is executed directly
if (require.main === module) {
  resetMongoDB();
}

module.exports = { resetMongoDB };
