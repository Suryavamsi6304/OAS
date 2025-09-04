const axios = require('axios');

async function testAdminLogin() {
  const baseURL = 'http://localhost:3001';
  
  try {
    // First, seed the database to create admin user
    console.log('🌱 Seeding database...');
    await axios.post(`${baseURL}/api/seed`);
    console.log('✅ Database seeded successfully');
    
    // Test admin login
    console.log('\n🔐 Testing admin login...');
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      username: 'admin',
      password: 'password'
    });
    
    if (loginResponse.data.success && loginResponse.data.user.role === 'admin') {
      console.log('✅ Admin login successful!');
      console.log('👤 Admin user:', loginResponse.data.user);
      console.log('🎫 Token:', loginResponse.data.token.substring(0, 20) + '...');
      console.log('\n🌐 You can now login at: http://localhost:3000/login');
      console.log('📋 Credentials: admin / password');
    } else {
      console.log('❌ Admin login failed');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
  }
}

testAdminLogin();