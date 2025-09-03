const { Client } = require('pg');
require('dotenv').config({ path: './backend/.env' });

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'oas_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'shiva'
});

async function enableProctoring() {
  try {
    await client.connect();
    
    // Enable proctoring for all exams
    const result = await client.query('UPDATE "Exams" SET "proctoringEnabled" = true;');
    console.log(`✓ Enabled proctoring for ${result.rowCount} exams`);
    
    // Check current status
    const exams = await client.query('SELECT id, title, "proctoringEnabled" FROM "Exams";');
    console.log('\nCurrent exam proctoring status:');
    exams.rows.forEach(exam => {
      console.log(`- ${exam.title}: ${exam.proctoringEnabled ? 'ENABLED' : 'DISABLED'}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

enableProctoring();