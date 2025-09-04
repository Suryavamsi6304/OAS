const { User } = require('../models');

const addApprovalFields = async () => {
  try {
    // Add new columns to User table
    await User.sequelize.query(`
      ALTER TABLE "Users" 
      ADD COLUMN IF NOT EXISTS "isApproved" BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS "approvedBy" INTEGER,
      ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP WITH TIME ZONE;
    `);

    // Set existing users as approved (except learners)
    await User.update(
      { isApproved: true },
      { where: { role: ['admin', 'mentor'] } }
    );

    console.log('Approval fields added successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  }
};

if (require.main === module) {
  addApprovalFields();
}

module.exports = addApprovalFields;