require('dotenv').config();
const { sequelize } = require('./config/database');
const models = require('./models');

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection and models...\n');
    
    // Test database connection
    console.log('1. Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connected successfully\n');
    
    // Test model loading
    console.log('2. Testing model loading...');
    const modelNames = Object.keys(models);
    console.log(`✅ Loaded ${modelNames.length} models: ${modelNames.join(', ')}\n`);
    
    // Test model sync
    console.log('3. Testing model synchronization...');
    await sequelize.sync({ alter: true });
    console.log('✅ All models synchronized successfully\n');
    
    // Test model associations
    console.log('4. Testing model associations...');
    const { User, Exam, Result, ProctoringLog } = models;
    
    // Check if associations exist
    const userAssociations = Object.keys(User.associations);
    const examAssociations = Object.keys(Exam.associations);
    const resultAssociations = Object.keys(Result.associations);
    const proctoringLogAssociations = Object.keys(ProctoringLog.associations);
    
    console.log(`✅ User associations: ${userAssociations.join(', ')}`);
    console.log(`✅ Exam associations: ${examAssociations.join(', ')}`);
    console.log(`✅ Result associations: ${resultAssociations.join(', ')}`);
    console.log(`✅ ProctoringLog associations: ${proctoringLogAssociations.join(', ')}\n`);
    
    // Test basic CRUD operations
    console.log('5. Testing basic CRUD operations...');
    
    // Create test user
    const testUser = await User.create({
      username: 'test_user_' + Date.now(),
      email: `test${Date.now()}@example.com`,
      password: 'password123',
      name: 'Test User',
      role: 'learner',
      batchCode: 'TEST001'
    });
    console.log('✅ Test user created successfully');
    
    // Create test exam
    const testExam = await Exam.create({
      title: 'Test Exam',
      description: 'A test exam',
      duration: 30,
      questions: [
        {
          _id: '1',
          type: 'multiple-choice',
          question: 'Test question?',
          options: [
            { _id: 'a', text: 'Option A', isCorrect: true },
            { _id: 'b', text: 'Option B', isCorrect: false }
          ],
          points: 1
        }
      ],
      createdBy: testUser.id,
      type: 'exam',
      batchCode: 'TEST001'
    });
    console.log('✅ Test exam created successfully');
    
    // Create test result
    const testResult = await Result.create({
      studentId: testUser.id,
      examId: testExam.id,
      answers: [{ questionId: '1', answer: 'a' }],
      score: 1,
      totalPoints: 1,
      timeSpent: 15,
      status: 'completed'
    });
    console.log('✅ Test result created successfully');
    
    // Create test proctoring log
    const testLog = await ProctoringLog.create({
      sessionId: 'test_session_' + Date.now(),
      studentId: testUser.id,
      examId: testExam.id,
      violationType: 'test_violation',
      severity: 'low',
      details: 'Test violation details',
      riskScore: 10
    });
    console.log('✅ Test proctoring log created successfully');
    
    // Test associations by fetching with includes
    console.log('\n6. Testing association queries...');
    
    const userWithResults = await User.findByPk(testUser.id, {
      include: [
        { model: Result, as: 'results' },
        { model: ProctoringLog, as: 'proctoringLogs' }
      ]
    });
    console.log(`✅ User with ${userWithResults.results.length} results and ${userWithResults.proctoringLogs.length} proctoring logs`);
    
    const examWithResults = await Exam.findByPk(testExam.id, {
      include: [
        { model: Result, as: 'results' },
        { model: ProctoringLog, as: 'proctoringLogs' }
      ]
    });
    console.log(`✅ Exam with ${examWithResults.results.length} results and ${examWithResults.proctoringLogs.length} proctoring logs`);
    
    // Clean up test data
    console.log('\n7. Cleaning up test data...');
    await testLog.destroy();
    await testResult.destroy();
    await testExam.destroy();
    await testUser.destroy();
    console.log('✅ Test data cleaned up successfully');
    
    console.log('\n🎉 All tests passed! Database and models are working correctly.');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testDatabase();