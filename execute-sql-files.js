const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './backend/.env' });

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'oas_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'shiva'
});

const sqlFiles = [
  'schema.sql',
  'sample-data.sql', 
  'proctoring-schema.sql',
  'create-proctoring-table.sql',
  'update-exam-id-to-integer.sql',
  'debug-proctoring.sql',
  'enable-proctoring-simple.sql',
  'enable-proctoring-new.sql',
  'verify-proctoring.sql'
];

async function executeSQLFiles() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');

    for (const sqlFile of sqlFiles) {
      const filePath = path.join(__dirname, 'database', sqlFile);
      
      if (fs.existsSync(filePath)) {
        console.log(`\nExecuting ${sqlFile}...`);
        const sql = fs.readFileSync(filePath, 'utf8');
        
        try {
          const result = await client.query(sql);
          console.log(`✓ ${sqlFile} executed successfully`);
          if (result.rows && result.rows.length > 0) {
            console.log('Results:', result.rows);
          }
        } catch (error) {
          console.log(`⚠ Error in ${sqlFile}:`, error.message);
        }
      } else {
        console.log(`⚠ File not found: ${sqlFile}`);
      }
    }
  } catch (error) {
    console.error('Database connection error:', error);
  } finally {
    await client.end();
    console.log('\nDatabase connection closed');
  }
}

executeSQLFiles();