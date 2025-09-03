const { Client } = require('pg');
require('dotenv').config({ path: './backend/.env' });

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'oas_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'shiva'
});

async function fixDatabaseSchema() {
  try {
    await client.connect();
    
    // Check Users table structure
    const usersTable = await client.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'Users' AND table_schema = 'public';
    `);
    console.log('Users table structure:', usersTable.rows);
    
    // Drop all tables to start fresh
    const tables = ['Notifications', 'Results', 'Exams', 'Users', 'JobPostings', 'Applications', 'ProctoringSessions', 'ReAttemptRequests'];
    
    for (const table of tables) {
      await client.query(`DROP TABLE IF EXISTS "${table}" CASCADE;`);
      console.log(`✓ Dropped ${table} table`);
    }
    
    // Drop enums
    await client.query(`DROP TYPE IF EXISTS "enum_Users_role" CASCADE;`);
    await client.query(`DROP TYPE IF EXISTS "enum_Notifications_type" CASCADE;`);
    await client.query(`DROP TYPE IF EXISTS "enum_Exams_type" CASCADE;`);
    await client.query(`DROP TYPE IF EXISTS "enum_JobPostings_status" CASCADE;`);
    await client.query(`DROP TYPE IF EXISTS "enum_Applications_status" CASCADE;`);
    await client.query(`DROP TYPE IF EXISTS "enum_ProctoringSessions_status" CASCADE;`);
    await client.query(`DROP TYPE IF EXISTS "enum_ReAttemptRequests_status" CASCADE;`);
    console.log('✓ Dropped all enum types');
    
    console.log('✓ Database cleaned. Sequelize will recreate tables on next startup.');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

fixDatabaseSchema();