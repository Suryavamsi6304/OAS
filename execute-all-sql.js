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
  'proctoring-schema.sql',
  'sample-data.sql'
];

async function executeSQLFiles() {
  try {
    await client.connect();
    console.log('Connected to database');

    for (const sqlFile of sqlFiles) {
      const filePath = path.join(__dirname, 'database', sqlFile);
      
      if (fs.existsSync(filePath)) {
        console.log(`\nExecuting ${sqlFile}...`);
        const sql = fs.readFileSync(filePath, 'utf8');
        
        try {
          await client.query(sql);
          console.log(`✓ ${sqlFile} executed successfully`);
        } catch (error) {
          console.log(`⚠ ${sqlFile}: ${error.message}`);
        }
      }
    }
    
    console.log('\n✓ All SQL files processed');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

executeSQLFiles();