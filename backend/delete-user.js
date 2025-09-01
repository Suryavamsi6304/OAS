const db = require('./config/database');
require('dotenv').config();

async function deleteUser() {
  try {
    const email = 'sangi@gmail.com';
    
    // First check if user exists
    const userCheck = await db.query('SELECT id, email FROM users WHERE email = $1', [email]);
    
    if (userCheck.rows.length === 0) {
      console.log(`User not found: ${email}`);
      process.exit(0);
    }
    
    console.log(`Found user: ${userCheck.rows[0].email} (ID: ${userCheck.rows[0].id})`);
    
    // Delete the user
    const result = await db.query('DELETE FROM users WHERE email = $1', [email]);
    
    if (result.rowCount > 0) {
      console.log(`User deleted successfully: ${email}`);
    } else {
      console.log(`Failed to delete user: ${email}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error deleting user:', error);
    process.exit(1);
  }
}

deleteUser();