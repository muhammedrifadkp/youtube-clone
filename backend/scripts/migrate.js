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

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting database migrations...');
    
    // Read and execute schema
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📋 Creating database schema...');
    await client.query(schemaSQL);
    console.log('✅ Schema created successfully');
    
    // Read and execute indexes
    const indexesPath = path.join(__dirname, '../database/indexes.sql');
    const indexesSQL = fs.readFileSync(indexesPath, 'utf8');
    
    console.log('🔍 Creating database indexes...');
    await client.query(indexesSQL);
    console.log('✅ Indexes created successfully');
    
    console.log('🎉 Database migrations completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
