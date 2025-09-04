const axios = require('axios');

// Test the re-attempt flow
async function testReAttemptFlow() {
  const baseURL = 'http://localhost:3001';
  
  try {
    console.log('🧪 Testing Re-attempt Flow...\n');
    
    // 1. Login as learner
    console.log('1. Logging in as learner...');
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      username: 'learner1',
      password: 'password'
    });
    
    const learnerToken = loginResponse.data.token;
    console.log('✅ Learner login successful\n');
    
    // 2. Get skill assessments
    console.log('2. Fetching skill assessments...');
    const assessmentsResponse = await axios.get(`${baseURL}/api/skill-assessments`, {
      headers: { Authorization: `Bearer ${learnerToken}` }
    });
    
    const assessments = assessmentsResponse.data.data || [];
    console.log(`✅ Found ${assessments.length} skill assessments\n`);
    
    if (assessments.length === 0) {
      console.log('❌ No skill assessments found. Please create one first.');
      return;
    }
    
    const testAssessment = assessments[0];
    console.log(`📝 Using assessment: ${testAssessment.title}\n`);
    
    // 3. Try to access the exam (should work first time)
    console.log('3. Trying to access exam for first time...');
    try {
      const examResponse = await axios.get(`${baseURL}/api/exams/${testAssessment.id}`, {
        headers: { Authorization: `Bearer ${learnerToken}` }
      });
      console.log('✅ First access successful - exam can be taken\n');
      
      // 4. Submit exam with failing score
      console.log('4. Submitting exam with failing answers...');
      const submitResponse = await axios.post(`${baseURL}/api/exams/submit`, {
        examId: testAssessment.id,
        answers: [
          { questionId: '1', answer: 'wrong_answer' },
          { questionId: '2', answer: 'wrong_answer' }
        ],
        timeSpent: 300
      }, {
        headers: { Authorization: `Bearer ${learnerToken}` }
      });
      
      console.log(`✅ Exam submitted - Score: ${submitResponse.data.data.percentage}%\n`);
      
    } catch (error) {
      console.log('ℹ️ Exam already taken, proceeding to re-attempt test...\n');
    }
    
    // 5. Try to access exam again (should require re-attempt)
    console.log('5. Trying to access exam again (should require re-attempt)...');
    try {
      await axios.get(`${baseURL}/api/exams/${testAssessment.id}`, {
        headers: { Authorization: `Bearer ${learnerToken}` }
      });
      console.log('❌ Unexpected: Exam access should be blocked');
    } catch (error) {
      if (error.response?.data?.requiresReAttempt) {
        console.log('✅ Exam access blocked - re-attempt required\n');
        
        // 6. Submit re-attempt request
        console.log('6. Submitting re-attempt request...');
        try {
          const reAttemptResponse = await axios.post(`${baseURL}/api/re-attempt/request`, {
            examId: testAssessment.id,
            reason: 'I need to improve my understanding of the concepts and would like another chance to demonstrate my knowledge.'
          }, {
            headers: { Authorization: `Bearer ${learnerToken}` }
          });
          
          console.log('✅ Re-attempt request submitted successfully\n');
          
          // 7. Login as mentor to approve request
          console.log('7. Logging in as mentor...');
          const mentorLoginResponse = await axios.post(`${baseURL}/api/auth/login`, {
            username: 'mentor',
            password: 'password'
          });
          
          const mentorToken = mentorLoginResponse.data.token;
          console.log('✅ Mentor login successful\n');
          
          // 8. Get re-attempt requests
          console.log('8. Fetching re-attempt requests...');
          const requestsResponse = await axios.get(`${baseURL}/api/re-attempt/requests`, {
            headers: { Authorization: `Bearer ${mentorToken}` }
          });
          
          const requests = requestsResponse.data.data || [];
          console.log(`✅ Found ${requests.length} re-attempt requests\n`);
          
          if (requests.length > 0) {
            const latestRequest = requests[0];
            
            // 9. Approve the request
            console.log('9. Approving re-attempt request...');
            await axios.put(`${baseURL}/api/re-attempt/requests/${latestRequest.id}/review`, {
              status: 'approved',
              comment: 'Request approved. You may retake the exam.'
            }, {
              headers: { Authorization: `Bearer ${mentorToken}` }
            });
            
            console.log('✅ Re-attempt request approved\n');
            
            // 10. Try to access exam as learner again (should work now)
            console.log('10. Trying to access exam after approval...');
            const finalExamResponse = await axios.get(`${baseURL}/api/exams/${testAssessment.id}`, {
              headers: { Authorization: `Bearer ${learnerToken}` }
            });
            
            console.log('✅ Exam access successful after approval!\n');
            console.log('🎉 Re-attempt flow test completed successfully!');
          }
          
        } catch (reAttemptError) {
          if (reAttemptError.response?.status === 400) {
            console.log('ℹ️ Re-attempt already requested for this exam\n');
            console.log('🎉 Re-attempt flow working correctly!');
          } else {
            throw reAttemptError;
          }
        }
      } else {
        console.log('❌ Unexpected error:', error.response?.data?.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testReAttemptFlow();