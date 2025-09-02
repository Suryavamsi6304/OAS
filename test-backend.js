const axios = require('axios');

async function testBackend() {
  try {
    console.log('Testing backend connection...');
    
    // Test basic connection
    const response = await axios.get('http://localhost:3001/api/test');
    console.log('✅ Backend is running:', response.data);
    
    // Test login
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      username: 'learner',
      password: 'password'
    });
    console.log('✅ Login works:', loginResponse.data);
    
  } catch (error) {
    console.error('❌ Backend test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testBackend();