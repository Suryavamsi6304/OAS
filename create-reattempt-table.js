const { sequelize } = require('./backend/config/database');

async function createReAttemptTable() {
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "ReAttemptRequests" (
        "id" SERIAL PRIMARY KEY,
        "studentId" INTEGER NOT NULL REFERENCES "Users"("id"),
        "examId" INTEGER NOT NULL REFERENCES "Exams"("id"),
        "resultId" INTEGER NOT NULL REFERENCES "Results"("id"),
        "reason" TEXT NOT NULL,
        "status" VARCHAR(20) DEFAULT 'pending' CHECK ("status" IN ('pending', 'approved', 'rejected', 'used')),
        "reviewedBy" INTEGER REFERENCES "Users"("id"),
        "reviewedAt" TIMESTAMP,
        "reviewComment" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `);
    
    console.log('✅ ReAttemptRequests table created successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating table:', error);
    process.exit(1);
  }
}

createReAttemptTable();