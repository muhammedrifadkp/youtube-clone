const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../src/models/UserMongo');
const Category = require('../src/models/CategoryMongo');
const Video = require('../src/models/VideoMongo');
const Comment = require('../src/models/CommentMongo');
const Subscription = require('../src/models/SubscriptionMongo');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/youtube_clone';

async function seedDatabase() {
  try {
    console.log('🌱 Starting MongoDB database seeding...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if data already exists
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('⚠️  Database already contains data. Skipping seed.');
      await mongoose.connection.close();
      return;
    }

    // Clear existing data (just in case)
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Video.deleteMany({}),
      Comment.deleteMany({}),
      Subscription.deleteMany({})
    ]);

    // Insert categories
    console.log('📋 Creating categories...');
    const categories = await Category.insertMany([
      { name: 'New', description: 'Latest videos', icon: 'HomeIcon' },
      { name: 'Coding', description: 'Programming and development content', icon: 'CodeIcon' },
      { name: 'ReactJS', description: 'React.js tutorials and content', icon: 'CodeIcon' },
      { name: 'NextJS', description: 'Next.js framework content', icon: 'CodeIcon' },
      { name: 'Music', description: 'Music videos and audio content', icon: 'MusicNoteIcon' },
      { name: 'Education', description: 'Educational and learning content', icon: 'SchoolIcon' },
      { name: 'Podcast', description: 'Podcast episodes and audio shows', icon: 'GraphicEqIcon' },
      { name: 'Movie', description: 'Movie trailers and film content', icon: 'OndemandVideoIcon' },
      { name: 'Gaming', description: 'Gaming videos and live streams', icon: 'SportsEsportsIcon' },
      { name: 'Live', description: 'Live streaming content', icon: 'LiveTvIcon' },
      { name: 'Sport', description: 'Sports highlights and content', icon: 'FitnessCenterIcon' },
      { name: 'Fashion', description: 'Fashion and style content', icon: 'CheckroomIcon' },
      { name: 'Beauty', description: 'Beauty tutorials and reviews', icon: 'FaceRetouchingNaturalIcon' },
      { name: 'Comedy', description: 'Comedy sketches and funny videos', icon: 'TheaterComedyIcon' },
      { name: 'Gym', description: 'Fitness and workout content', icon: 'FitnessCenterIcon' },
      { name: 'Crypto', description: 'Cryptocurrency and blockchain content', icon: 'DeveloperModeIcon' }
    ]);
    console.log(`✅ Created ${categories.length} categories`);

    // Insert demo users
    console.log('👥 Creating users...');
    const saltRounds = 12;
    const users = await User.insertMany([
      {
        username: 'javascript_mastery',
        email: 'admin@jsmastery.pro',
        passwordHash: await bcrypt.hash('password123', saltRounds),
        firstName: 'JavaScript',
        lastName: 'Mastery',
        channelName: 'JavaScript Mastery',
        channelDescription: 'Learn modern web development with JavaScript, React, and more!',
        avatarUrl: 'http://dergipark.org.tr/assets/app/images/buddy_sample.png',
        isVerified: true,
        subscriberCount: 1250000,
        totalViews: 50000000
      },
      {
        username: 'tech_reviewer',
        email: 'tech@example.com',
        passwordHash: await bcrypt.hash('password123', saltRounds),
        firstName: 'Tech',
        lastName: 'Reviewer',
        channelName: 'Tech Reviews Pro',
        channelDescription: 'Honest reviews of the latest technology and gadgets',
        avatarUrl: 'http://dergipark.org.tr/assets/app/images/buddy_sample.png',
        isVerified: true,
        subscriberCount: 850000,
        totalViews: 25000000
      },
      {
        username: 'coding_ninja',
        email: 'ninja@code.com',
        passwordHash: await bcrypt.hash('password123', saltRounds),
        firstName: 'Code',
        lastName: 'Ninja',
        channelName: 'Coding Ninja',
        channelDescription: 'Advanced programming tutorials and tips',
        avatarUrl: 'http://dergipark.org.tr/assets/app/images/buddy_sample.png',
        isVerified: false,
        subscriberCount: 125000,
        totalViews: 5000000
      },
      {
        username: 'music_producer',
        email: 'beats@music.com',
        passwordHash: await bcrypt.hash('password123', saltRounds),
        firstName: 'Beat',
        lastName: 'Maker',
        channelName: 'Beat Factory',
        channelDescription: 'Original music production and beats',
        avatarUrl: 'http://dergipark.org.tr/assets/app/images/buddy_sample.png',
        isVerified: false,
        subscriberCount: 75000,
        totalViews: 2000000
      }
    ]);
    console.log(`✅ Created ${users.length} users`);

    // Find categories for video creation
    const codingCategory = categories.find(c => c.name === 'Coding');
    const reactCategory = categories.find(c => c.name === 'ReactJS');
    const newCategory = categories.find(c => c.name === 'New');

    // Insert demo videos
    console.log('🎥 Creating videos...');
    const videos = await Video.insertMany([
      {
        userId: users[0]._id,
        categoryId: codingCategory._id,
        title: 'Build and Deploy 5 JavaScript & React API Projects in 10 Hours - Full Course | RapidAPI',
        description: 'Learn to build and deploy 5 amazing JavaScript and React projects using various APIs. Perfect for beginners and intermediate developers looking to enhance their skills.',
        videoUrl: '/uploads/videos/demo-video-1.mp4',
        thumbnailUrl: 'https://i.ibb.co/G2L2Gwp/API-Course.png',
        duration: 36000, // 10 hours
        fileSize: 2500000000, // 2.5GB
        viewCount: 125000,
        likeCount: 3200,
        commentCount: 450,
        isPublic: true,
        tags: ['javascript', 'react', 'api', 'tutorial', 'programming', 'web development']
      },
      {
        userId: users[0]._id,
        categoryId: reactCategory._id,
        title: 'React 18 Complete Tutorial - Build Modern Web Apps',
        description: 'Complete React 18 tutorial covering hooks, context, suspense, and all the latest features. Build real-world applications step by step.',
        videoUrl: '/uploads/videos/demo-video-2.mp4',
        thumbnailUrl: 'https://i.ibb.co/G2L2Gwp/API-Course.png',
        duration: 7200, // 2 hours
        fileSize: 1200000000, // 1.2GB
        viewCount: 89000,
        likeCount: 2100,
        commentCount: 320,
        isPublic: true,
        tags: ['react', 'react18', 'hooks', 'tutorial', 'frontend']
      },
      {
        userId: users[1]._id,
        categoryId: newCategory._id,
        title: 'iPhone 15 Pro Max Review - Is It Worth The Upgrade?',
        description: 'Comprehensive review of the iPhone 15 Pro Max covering camera, performance, battery life, and whether you should upgrade from previous models.',
        videoUrl: '/uploads/videos/demo-video-3.mp4',
        thumbnailUrl: 'https://i.ibb.co/G2L2Gwp/API-Course.png',
        duration: 1200, // 20 minutes
        fileSize: 800000000, // 800MB
        viewCount: 250000,
        likeCount: 8500,
        commentCount: 1200,
        isPublic: true,
        tags: ['iphone', 'review', 'apple', 'smartphone', 'tech']
      }
    ]);
    console.log(`✅ Created ${videos.length} videos`);

    // Insert demo comments
    console.log('💬 Creating comments...');
    const comments = await Comment.insertMany([
      {
        videoId: videos[1]._id, // React tutorial
        userId: users[2]._id, // coding_ninja
        content: 'Amazing tutorial! This really helped me understand React better. Thank you for the detailed explanation.',
        likeCount: 45
      },
      {
        videoId: videos[2]._id, // iPhone review
        userId: users[0]._id, // javascript_mastery
        content: 'Great review! Very thorough analysis of the camera improvements.',
        likeCount: 23
      }
    ]);
    console.log(`✅ Created ${comments.length} comments`);

    // Insert demo subscriptions
    console.log('🔔 Creating subscriptions...');
    const subscriptions = await Subscription.insertMany([
      {
        subscriberId: users[2]._id, // coding_ninja subscribes to javascript_mastery
        channelId: users[0]._id
      },
      {
        subscriberId: users[3]._id, // music_producer subscribes to javascript_mastery
        channelId: users[0]._id
      },
      {
        subscriberId: users[2]._id, // coding_ninja subscribes to tech_reviewer
        channelId: users[1]._id
      }
    ]);
    console.log(`✅ Created ${subscriptions.length} subscriptions`);

    // Print summary
    console.log('\n📈 Seed data summary:');
    console.log(`   Users: ${users.length}`);
    console.log(`   Categories: ${categories.length}`);
    console.log(`   Videos: ${videos.length}`);
    console.log(`   Comments: ${comments.length}`);
    console.log(`   Subscriptions: ${subscriptions.length}`);

    console.log('\n🎉 MongoDB database seeding completed successfully!');

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
