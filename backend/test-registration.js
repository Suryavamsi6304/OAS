const axios = require('axios');

async function testRegistration() {
  try {
    console.log('Testing registration endpoint...');
    
    const response = await axios.post('http://localhost:3001/api/auth/register', {
      name: 'Test User',
      username: 'testuser123',
      email: 'test123@test.com',
      password: 'password123',
      role: 'learner'
    });
    
    console.log('✅ Registration successful:', response.data);
  } catch (error) {
    console.error('❌ Registration failed:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message || error.message);
    console.error('Full error:', error.response?.data || error.message);
  }
}

testRegistration();