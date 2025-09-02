const axios = require('axios');

async function testResultsEndpoint() {
  try {
    console.log('Testing Results Endpoint...\n');
    
    // Set base URL
    axios.defaults.baseURL = 'http://localhost:3000';
    
    // Test server connection
    console.log('1. Testing server connection...');
    const serverTest = await axios.get('/api/test');
    console.log('✅ Server is running:', serverTest.data.message);
    
    // Test login with learner credentials
    console.log('\n2. Testing login...');
    const loginResponse = await axios.post('/api/auth/login', {
      username: 'learner',
      password: 'password'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ Login successful');
      const token = loginResponse.data.token;
      
      // Set authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Test results endpoint
      console.log('\n3. Testing results endpoint...');
      const resultsResponse = await axios.get('/api/results/student');
      console.log('✅ Results endpoint working:', resultsResponse.data);
      
    } else {
      console.log('❌ Login failed:', loginResponse.data.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the backend server is running on port 3000');
      console.log('   Run: cd backend && npm run dev');
    }
  }
}

testResultsEndpoint();