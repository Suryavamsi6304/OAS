const db = require('./backend/config/database');
const fs = require('fs');
const path = require('path');

async function updateProctoringSchema() {
  try {
    console.log('Updating proctoring database schema...');
    
    const sqlFile = path.join(__dirname, 'database', 'update-proctoring-schema.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    await db.query(sql);
    
    console.log('✅ Proctoring schema updated successfully!');
    console.log('✅ Added mentor_request, status, total_violations, and risk_score columns');
    console.log('✅ Created indexes for better performance');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating proctoring schema:', error);
    process.exit(1);
  }
}

updateProctoringSchema();