require('dotenv').config();
const { sequelize } = require('./config/database');
const { User, Exam, Result, JobPosting, Application, ProctoringSession } = require('./models');

async function syncDatabase() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');
    
    console.log('Syncing models...');
    await sequelize.sync({ alter: true });
    console.log('✅ Database synced successfully');
    
    console.log('Testing User model...');
    const testUser = await User.create({
      username: 'synctest',
      email: 'synctest@test.com',
      password: 'password123',
      name: 'Sync Test User',
      role: 'learner'
    });
    console.log('✅ Test user created:', testUser.username);
    
    // Clean up test user
    await testUser.destroy();
    console.log('✅ Test user cleaned up');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database sync failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

syncDatabase();