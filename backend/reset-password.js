const bcrypt = require('bcryptjs');
const db = require('./config/database');
require('dotenv').config();

async function resetPassword() {
  try {
    const email = 'sangi@gmail.com';
    const newPassword = 'surya1234';
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const result = await db.query(
      'UPDATE users SET password = $1 WHERE email = $2',
      [hashedPassword, email]
    );
    
    if (result.rowCount > 0) {
      console.log(`Password updated successfully for ${email}`);
      console.log(`New password: ${newPassword}`);
    } else {
      console.log(`User not found: ${email}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating password:', error);
    process.exit(1);
  }
}

resetPassword();