const { sequelize } = require('./config/database');

async function fixDatabase() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    console.log('Adding missing columns to Exams table...');
    
    // Add type column if it doesn't exist
    try {
      await sequelize.query(`
        ALTER TABLE "Exams" 
        ADD COLUMN IF NOT EXISTS "type" VARCHAR(255) DEFAULT 'exam'
      `);
      console.log('✅ Added type column');
    } catch (error) {
      console.log('Type column might already exist:', error.message);
    }

    // Add passingScore column if it doesn't exist
    try {
      await sequelize.query(`
        ALTER TABLE "Exams" 
        ADD COLUMN IF NOT EXISTS "passingScore" INTEGER DEFAULT 60
      `);
      console.log('✅ Added passingScore column');
    } catch (error) {
      console.log('PassingScore column might already exist:', error.message);
    }

    // Create enum type for exam types
    try {
      await sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE exam_type AS ENUM ('exam', 'practice', 'skill-assessment');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);
      console.log('✅ Created exam_type enum');
    } catch (error) {
      console.log('Enum might already exist:', error.message);
    }

    // Update type column to use enum
    try {
      await sequelize.query(`
        ALTER TABLE "Exams" 
        ALTER COLUMN "type" TYPE exam_type USING "type"::exam_type
      `);
      console.log('✅ Updated type column to use enum');
    } catch (error) {
      console.log('Type column update error:', error.message);
    }

    console.log('✅ Database schema updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database fix failed:', error);
    process.exit(1);
  }
}

fixDatabase();