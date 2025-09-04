const axios = require('axios');

// Test the compiler API
async function testCompiler() {
  const baseURL = 'http://localhost:3001';
  
  // First login to get token
  try {
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      username: 'learner',
      password: 'password'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Test Python code
    const pythonCode = `
def solution():
    a, b = map(int, input().split())
    return a + b

result = solution()
print(result)
`;
    
    const testCases = [
      { input: '2 3', expectedOutput: '5' },
      { input: '10 20', expectedOutput: '30' }
    ];
    
    console.log('\n🐍 Testing Python compiler...');
    const pythonResponse = await axios.post(`${baseURL}/api/compiler/execute`, {
      code: pythonCode,
      language: 'python',
      testCases: testCases
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Python Results:', pythonResponse.data);
    
    // Test Java code
    const javaCode = `
import java.util.Scanner;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        System.out.println(a + b);
        sc.close();
    }
}
`;
    
    console.log('\n☕ Testing Java compiler...');
    const javaResponse = await axios.post(`${baseURL}/api/compiler/execute`, {
      code: javaCode,
      language: 'java',
      testCases: testCases
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Java Results:', javaResponse.data);
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testCompiler();