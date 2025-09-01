const db = require('./config/database');
require('dotenv').config();

async function deleteUserCascade() {
  try {
    const email = 'sangi@gmail.com';
    
    // First get the user ID
    const userResult = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    
    if (userResult.rows.length === 0) {
      console.log(`User not found: ${email}`);
      process.exit(0);
    }
    
    const userId = userResult.rows[0].id;
    console.log(`Found user ID: ${userId}`);
    
    // Delete related records first
    console.log('Deleting related records...');
    
    // Delete from results table
    const resultsDelete = await db.query('DELETE FROM results WHERE student_id = $1', [userId]);
    console.log(`Deleted ${resultsDelete.rowCount} records from results table`);
    
    // Delete from audit_logs table if exists
    try {
      const auditDelete = await db.query('DELETE FROM audit_logs WHERE user_id = $1', [userId]);
      console.log(`Deleted ${auditDelete.rowCount} records from audit_logs table`);
    } catch (error) {
      console.log('No audit_logs table or no records to delete');
    }
    
    // Now delete the user
    const userDelete = await db.query('DELETE FROM users WHERE id = $1', [userId]);
    
    if (userDelete.rowCount > 0) {
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

deleteUserCascade();