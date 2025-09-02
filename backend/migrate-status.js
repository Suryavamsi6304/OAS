const { sequelize } = require('./config/database');

async function updateStatusEnum() {
  try {
    // Drop the existing enum constraint and recreate it
    await sequelize.query(`
      ALTER TABLE "Results" 
      DROP CONSTRAINT IF EXISTS "Results_status_check";
    `);
    
    await sequelize.query(`
      ALTER TABLE "Results" 
      ADD CONSTRAINT "Results_status_check" 
      CHECK (status IN ('completed', 'in-progress', 'reviewed', 'passed', 'failed'));
    `);
    
    console.log('Status enum updated successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

updateStatusEnum();