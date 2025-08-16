const { Pool } = require('pg');
const { runMigrations } = require('./migrate');
const { seedDatabase } = require('./seed');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'youtube_clone',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function resetDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting database reset...');
    
    // Drop all tables
    console.log('🗑️  Dropping existing tables...');
    await client.query(`
      DROP SCHEMA public CASCADE;
      CREATE SCHEMA public;
      GRANT ALL ON SCHEMA public TO postgres;
      GRANT ALL ON SCHEMA public TO public;
    `);
    console.log('✅ Tables dropped successfully');
    
    client.release();
    await pool.end();
    
    // Run migrations
    await runMigrations();
    
    // Seed database
    await seedDatabase();
    
    console.log('🎉 Database reset completed successfully!');
    
  } catch (error) {
    console.error('❌ Database reset failed:', error.message);
    client.release();
    await pool.end();
    process.exit(1);
  }
}

// Run reset if this file is executed directly
if (require.main === module) {
  resetDatabase();
}

module.exports = { resetDatabase };
