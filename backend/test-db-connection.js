const { Pool } = require('pg');
require('dotenv').config();

async function testDatabaseConnection() {
  console.log('Testing database connection with current settings:');
  console.log(`Host: ${process.env.DB_HOST}`);
  console.log(`Port: ${process.env.DB_PORT}`);
  console.log(`Database: ${process.env.DB_NAME}`);
  console.log(`User: ${process.env.DB_USER}`);
  
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 1,
    connectionTimeoutMillis: 5000,
  });

  try {
    console.log('\nAttempting to connect...');
    const client = await pool.connect();
    console.log('✅ Database connection successful!');
    
    const result = await client.query('SELECT NOW(), version()');
    console.log('✅ Query executed successfully');
    console.log('Current time:', result.rows[0].now);
    console.log('PostgreSQL version:', result.rows[0].version.split(' ')[0]);
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.log('❌ Database connection failed:');
    console.log('Error code:', error.code);
    console.log('Error message:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Suggestions:');
      console.log('- Check if PostgreSQL is running');
      console.log('- Verify the host and port are correct');
      console.log('- Check firewall settings');
    } else if (error.code === '28000') {
      console.log('\n💡 Suggestions:');
      console.log('- Check pg_hba.conf configuration');
      console.log('- Verify username and password');
    }
  }
  
  process.exit(0);
}

testDatabaseConnection();