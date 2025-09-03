const axios = require('axios');

async function testBackend() {
  try {
    console.log('Testing backend connection...');
    
    // Test basic server
    const testResponse = await axios.get('http://localhost:3000/api/test');
    console.log('✓ Server is running:', testResponse.data);
    
    // Test registration
    const registerData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      role: 'learner',
      batchCode: 'TEST001'
    };
    
    try {
      const registerResponse = await axios.post('http://localhost:3000/api/auth/register', registerData);
      console.log('✓ Registration works:', registerResponse.data.success);
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        console.log('✓ Registration endpoint works (user already exists)');
      } else {
        console.log('✗ Registration failed:', error.response?.data || error.message);
      }
    }
    
    // Test login
    try {
      const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
        username: 'testuser',
        password: 'password123'
      });
      console.log('✓ Login works:', loginResponse.data.success);
    } catch (error) {
      console.log('✗ Login failed:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.log('✗ Backend not responding:', error.message);
    console.log('Make sure the backend server is running on port 3000');
  }
}

testBackend();