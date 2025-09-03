const { Client } = require('pg');
require('dotenv').config({ path: './backend/.env' });

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'oas_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'shiva'
});

async function checkDatabase() {
  try {
    await client.connect();
    
    // Check tables
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('Available tables:', tables.rows.map(r => r.table_name));
    
    // Check Exams table structure
    const examColumns = await client.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'Exams' AND table_schema = 'public';
    `);
    console.log('\nExams table columns:', examColumns.rows);
    
    // Add proctoringEnabled column if it doesn't exist
    try {
      await client.query('ALTER TABLE "Exams" ADD COLUMN IF NOT EXISTS "proctoringEnabled" BOOLEAN DEFAULT false;');
      console.log('\n✓ Added proctoringEnabled column to Exams table');
      
      // Enable proctoring for all exams
      await client.query('UPDATE "Exams" SET "proctoringEnabled" = true;');
      console.log('✓ Enabled proctoring for all exams');
      
      // Verify
      const result = await client.query('SELECT id, title, "proctoringEnabled" FROM "Exams";');
      console.log('\nCurrent exams with proctoring status:', result.rows);
      
    } catch (error) {
      console.log('Error updating Exams table:', error.message);
    }
    
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    await client.end();
  }
}

checkDatabase();