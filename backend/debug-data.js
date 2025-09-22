const { User, Exam, Batch, Result } = require('./models');

const checkData = async () => {
  try {
    console.log('🔍 Checking database data...');
    
    const users = await User.findAll();
    const exams = await Exam.findAll();
    const batches = await Batch.findAll();
    const results = await Result.findAll();
    
    console.log(`👥 Users: ${users.length}`);
    users.forEach(u => console.log(`  - ${u.username} (${u.role}) - ${u.name}`));
    
    console.log(`📚 Exams: ${exams.length}`);
    exams.forEach(e => console.log(`  - ID: ${e.id}, Title: ${e.title}, Type: ${e.type || 'exam'}`));
    
    console.log(`🎓 Batches: ${batches.length}`);
    batches.forEach(b => console.log(`  - ${b.code}: ${b.name}`));
    
    console.log(`📊 Results: ${results.length}`);
    
    return { users, exams, batches, results };
  } catch (error) {
    console.error('❌ Error checking data:', error);
  }
};

module.exports = { checkData };