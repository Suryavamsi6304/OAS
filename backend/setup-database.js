require('dotenv').config();
const { sequelize } = require('./config/database');
const models = require('./models');

async function setupDatabase() {
  try {
    console.log('🚀 Setting up database...\n');
    
    // Test connection
    console.log('1. Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Connected to database successfully\n');
    
    // Sync all models
    console.log('2. Synchronizing database models...');
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized successfully\n');
    
    // Create default admin user if it doesn't exist
    console.log('3. Setting up default admin user...');
    const { User } = models;
    
    const [admin, created] = await User.findOrCreate({
      where: { username: 'admin' },
      defaults: {
        username: 'admin',
        email: 'admin@oas.com',
        password: 'admin123',
        name: 'System Administrator',
        role: 'admin'
      }
    });
    
    if (created) {
      console.log('✅ Default admin user created');
      console.log('   Username: admin');
      console.log('   Password: admin123');
    } else {
      console.log('✅ Admin user already exists');
    }
    
    // Create sample mentor user
    console.log('\n4. Setting up sample mentor user...');
    const [mentor, mentorCreated] = await User.findOrCreate({
      where: { username: 'mentor' },
      defaults: {
        username: 'mentor',
        email: 'mentor@oas.com',
        password: 'mentor123',
        name: 'Sample Mentor',
        role: 'mentor'
      }
    });
    
    if (mentorCreated) {
      console.log('✅ Sample mentor user created');
      console.log('   Username: mentor');
      console.log('   Password: mentor123');
    } else {
      console.log('✅ Mentor user already exists');
    }
    
    // Create sample learner user
    console.log('\n5. Setting up sample learner user...');
    const [learner, learnerCreated] = await User.findOrCreate({
      where: { username: 'student' },
      defaults: {
        username: 'student',
        email: 'student@oas.com',
        password: 'student123',
        name: 'Sample Student',
        role: 'learner',
        batchCode: 'BATCH001'
      }
    });
    
    if (learnerCreated) {
      console.log('✅ Sample learner user created');
      console.log('   Username: student');
      console.log('   Password: student123');
      console.log('   Batch Code: BATCH001');
    } else {
      console.log('✅ Learner user already exists');
    }
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('\nYou can now login with:');
    console.log('- Admin: admin / admin123');
    console.log('- Mentor: mentor / mentor123');
    console.log('- Student: student / student123');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('Full error:', error);
    
    if (error.name === 'SequelizeConnectionError') {
      console.log('\n💡 Connection Tips:');
      console.log('1. Make sure PostgreSQL is running');
      console.log('2. Check your database credentials in .env file');
      console.log('3. Ensure the database "oas_db_new" exists');
      console.log('4. Verify the database user has proper permissions');
    }
    
    process.exit(1);
  }
}

setupDatabase();