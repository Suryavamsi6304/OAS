const axios = require('axios');

async function testStudentFlow() {
  const baseURL = 'http://localhost:3001';
  
  try {
    console.log('🧪 Testing Student Flow...\n');
    
    // 1. Test login
    console.log('1. Testing login...');
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      username: 'learner',
      password: 'password'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ Login successful');
      const token = loginResponse.data.token;
      const headers = { Authorization: `Bearer ${token}` };
      
      // 2. Test get exams
      console.log('2. Testing get exams...');
      const examsResponse = await axios.get(`${baseURL}/api/exams`, { headers });
      console.log(`✅ Found ${examsResponse.data.data?.length || 0} exams`);
      
      // 3. Test get results
      console.log('3. Testing get student results...');
      const resultsResponse = await axios.get(`${baseURL}/api/results/student`, { headers });
      console.log(`✅ Found ${resultsResponse.data.data?.length || 0} results`);
      
      // 4. Test get specific exam
      if (examsResponse.data.data?.length > 0) {
        const examId = examsResponse.data.data[0].id;
        console.log(`4. Testing get exam ${examId}...`);
        const examResponse = await axios.get(`${baseURL}/api/exams/${examId}`, { headers });
        console.log(`✅ Exam loaded: ${examResponse.data.data.title}`);
        console.log(`   Questions: ${examResponse.data.data.questions?.length || 0}`);
      }
      
      console.log('\n🎉 All tests passed! Student functionality is working.');
      
    } else {
      console.log('❌ Login failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testStudentFlow();