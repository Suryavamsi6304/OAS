const { Client } = require('pg');

const passwords = ['shiva', 'surya', 'password', 'postgres', ''];

async function testPassword(password) {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'oas_db',
    user: 'postgres',
    password: password
  });

  try {
    await client.connect();
    console.log(`✓ Password "${password}" works!`);
    await client.end();
    return true;
  } catch (error) {
    console.log(`✗ Password "${password}" failed: ${error.message}`);
    return false;
  }
}

async function findCorrectPassword() {
  console.log('Testing PostgreSQL passwords...\n');
  
  for (const password of passwords) {
    const success = await testPassword(password);
    if (success) {
      console.log(`\nCorrect password found: "${password}"`);
      return password;
    }
  }
  
  console.log('\nNo working password found. Please check PostgreSQL installation.');
}

findCorrectPassword();