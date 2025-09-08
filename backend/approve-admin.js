require('dotenv').config();
const { User } = require('./models');
const { sanitizeForLog } = require('./utils/sanitize');

async function approveAdmin() {
  try {
    const user = await User.findOne({ where: { username: 'admin' } });
    
    if (!user) {
      console.log('❌ Admin user not found');
      return;
    }
    
    await User.update(
      { isApproved: true },
      { where: { username: 'admin' } }
    );
    
    console.log('✅ Admin approved successfully');
    
  } catch (error) {
    console.error('❌ Error:', sanitizeForLog(error.message));
  }
}

approveAdmin();