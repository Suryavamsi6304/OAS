const axios = require('axios');

async function testReAttemptFlow() {
  try {
    console.log('🧪 Testing Re-attempt Request Flow...\n');
    
    axios.defaults.baseURL = 'http://localhost:3000';
    
    // 1. Login as learner
    console.log('1. Logging in as learner...');
    const loginRes = await axios.post('/api/auth/login', {
      username: 'learner',
      password: 'password'
    });
    
    const learnerToken = loginRes.data.token;
    axios.defaults.headers.common['Authorization'] = `Bearer ${learnerToken}`;
    console.log('✅ Learner logged in');
    
    // 2. Get learner's results
    console.log('\n2. Getting learner results...');
    const resultsRes = await axios.get('/api/results/student');
    const results = resultsRes.data.data;
    console.log(`✅ Found ${results.length} results`);
    
    if (results.length === 0) {
      console.log('⚠️  No results found. Please take an exam first.');
      return;
    }
    
    // 3. Create a failed result for testing (simulate)
    const firstResult = results[0];
    console.log(`\n3. Using result: ${firstResult.exam?.title} (${firstResult.percentage}%)`);
    
    // 4. Request re-attempt
    console.log('\n4. Requesting re-attempt...');
    try {
      const reAttemptRes = await axios.post('/api/re-attempt/request', {
        resultId: firstResult.id,
        reason: 'I had technical difficulties during the exam and would like another chance to demonstrate my knowledge.'
      });
      console.log('✅ Re-attempt request submitted:', reAttemptRes.data.success);
    } catch (error) {
      console.log('ℹ️  Re-attempt request response:', error.response?.data?.message);
    }
    
    // 5. Login as mentor to review
    console.log('\n5. Logging in as mentor...');
    const mentorLoginRes = await axios.post('/api/auth/login', {
      username: 'mentor',
      password: 'password'
    });
    
    const mentorToken = mentorLoginRes.data.token;
    axios.defaults.headers.common['Authorization'] = `Bearer ${mentorToken}`;
    console.log('✅ Mentor logged in');
    
    // 6. Get re-attempt requests
    console.log('\n6. Getting re-attempt requests...');
    const requestsRes = await axios.get('/api/re-attempt/requests');
    const requests = requestsRes.data.data;
    console.log(`✅ Found ${requests.length} re-attempt requests`);
    
    if (requests.length > 0) {
      const request = requests[0];
      console.log(`   - Request from: ${request.student?.name}`);
      console.log(`   - Exam: ${request.exam?.title}`);
      console.log(`   - Status: ${request.status}`);
      
      // 7. Approve the request
      if (request.status === 'pending') {
        console.log('\n7. Approving re-attempt request...');
        const approveRes = await axios.put(`/api/re-attempt/requests/${request.id}/review`, {
          status: 'approved',
          comment: 'Request approved. You may re-attempt the exam.'
        });
        console.log('✅ Request approved:', approveRes.data.success);
      }
    }
    
    // 8. Check notifications
    console.log('\n8. Checking notifications...');
    const notificationsRes = await axios.get('/api/notifications');
    const notifications = notificationsRes.data.data;
    console.log(`✅ Found ${notifications.length} notifications`);
    
    notifications.forEach((notif, index) => {
      console.log(`   ${index + 1}. ${notif.title}: ${notif.message}`);
    });
    
    console.log('\n🎉 Re-attempt flow test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testReAttemptFlow();