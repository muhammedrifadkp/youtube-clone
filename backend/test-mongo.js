const mongoose = require('mongoose');
const User = require('./src/models/UserMongo');
const Video = require('./src/models/VideoMongo');
const Category = require('./src/models/CategoryMongo');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/youtube_clone';

async function testMongoConnection() {
  try {
    console.log('🧪 Testing MongoDB connection and models...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test User model
    console.log('\n👤 Testing User model...');
    const userCount = await User.countDocuments();
    console.log(`   Users in database: ${userCount}`);
    
    if (userCount > 0) {
      const sampleUser = await User.findOne();
      console.log(`   Sample user: ${sampleUser.username} (${sampleUser.email})`);
    }

    // Test Category model
    console.log('\n📋 Testing Category model...');
    const categoryCount = await Category.countDocuments();
    console.log(`   Categories in database: ${categoryCount}`);
    
    if (categoryCount > 0) {
      const categories = await Category.find().limit(3);
      console.log(`   Sample categories: ${categories.map(c => c.name).join(', ')}`);
    }

    // Test Video model
    console.log('\n🎥 Testing Video model...');
    const videoCount = await Video.countDocuments();
    console.log(`   Videos in database: ${videoCount}`);
    
    if (videoCount > 0) {
      const sampleVideo = await Video.findOne().populate('userId', 'channelName');
      console.log(`   Sample video: "${sampleVideo.title}" by ${sampleVideo.userId?.channelName || 'Unknown'}`);
    }

    // Test search functionality
    console.log('\n🔍 Testing search functionality...');
    const searchResults = await Video.find({
      $text: { $search: 'javascript' }
    }).limit(2);
    console.log(`   Search results for "javascript": ${searchResults.length} videos found`);

    // Test aggregation
    console.log('\n📊 Testing aggregation...');
    const stats = await Video.aggregate([
      { $match: { isPublic: true } },
      {
        $group: {
          _id: null,
          totalVideos: { $sum: 1 },
          totalViews: { $sum: '$viewCount' },
          avgDuration: { $avg: '$duration' }
        }
      }
    ]);
    
    if (stats.length > 0) {
      console.log(`   Total public videos: ${stats[0].totalVideos}`);
      console.log(`   Total views: ${stats[0].totalViews}`);
      console.log(`   Average duration: ${Math.round(stats[0].avgDuration)} seconds`);
    }

    console.log('\n✅ All MongoDB tests passed!');
    
  } catch (error) {
    console.error('❌ MongoDB test failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testMongoConnection();
}

module.exports = { testMongoConnection };
