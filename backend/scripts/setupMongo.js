const mongoose = require('mongoose');
const { seedDatabase } = require('../database/seedMongo');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/youtube_clone';

async function setupMongoDB() {
  try {
    console.log('🚀 Starting MongoDB setup...');
    
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');

    // Check if database exists and has data
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📋 Found ${collections.length} collections`);

    if (collections.length === 0) {
      console.log('🌱 Database is empty, running seed...');
      await mongoose.connection.close();
      await seedDatabase();
    } else {
      console.log('📊 Database already contains collections:');
      for (const collection of collections) {
        const count = await mongoose.connection.db.collection(collection.name).countDocuments();
        console.log(`   - ${collection.name}: ${count} documents`);
      }
      
      // Check if we have essential data
      const userCount = await mongoose.connection.db.collection('users').countDocuments();
      const videoCount = await mongoose.connection.db.collection('videos').countDocuments();
      const categoryCount = await mongoose.connection.db.collection('categories').countDocuments();

      if (userCount === 0 || videoCount === 0 || categoryCount === 0) {
        console.log('⚠️  Essential data missing, running seed...');
        await mongoose.connection.close();
        await seedDatabase();
      } else {
        console.log('✅ Database setup is complete');
        await mongoose.connection.close();
      }
    }

    console.log('\n🎉 MongoDB setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Start the backend server: npm run dev');
    console.log('   2. Start the frontend: npm start (in the root directory)');
    console.log('   3. Open http://localhost:3000 in your browser');

  } catch (error) {
    console.error('❌ MongoDB setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupMongoDB();
}

module.exports = { setupMongoDB };
