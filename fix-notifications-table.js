const { Client } = require('pg');
require('dotenv').config({ path: './backend/.env' });

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'oas_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'shiva'
});

async function fixNotificationsTable() {
  try {
    await client.connect();
    
    // Drop the problematic table
    await client.query('DROP TABLE IF EXISTS "Notifications" CASCADE;');
    console.log('✓ Dropped Notifications table');
    
    // Let Sequelize recreate it with correct schema
    console.log('✓ Table will be recreated by Sequelize on next startup');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

fixNotificationsTable();