const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'youtube_clone',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function seedDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting database seeding...');
    
    // Check if data already exists
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCount.rows[0].count) > 0) {
      console.log('⚠️  Database already contains data. Skipping seed.');
      return;
    }
    
    // Read and execute seed data
    const seedPath = path.join(__dirname, '../database/seed.sql');
    const seedSQL = fs.readFileSync(seedPath, 'utf8');
    
    console.log('📊 Inserting seed data...');
    await client.query(seedSQL);
    console.log('✅ Seed data inserted successfully');
    
    // Verify seed data
    const results = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM categories) as categories,
        (SELECT COUNT(*) FROM videos) as videos
    `);
    
    const counts = results.rows[0];
    console.log('📈 Seed data summary:');
    console.log(`   Users: ${counts.users}`);
    console.log(`   Categories: ${counts.categories}`);
    console.log(`   Videos: ${counts.videos}`);
    
    console.log('🎉 Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
