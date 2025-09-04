require('dotenv').config();
const { User } = require('./models');

async function createAdmin() {
  try {
    const [admin] = await User.findOrCreate({
      where: { username: 'admin' },
      defaults: {
        username: 'admin',
        email: 'admin@test.com',
        password: 'password',
        name: 'Admin User',
        role: 'admin'
      }
    });
    
    console.log('✅ Admin created');
    console.log('Username: admin');
    console.log('Password: password');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed:', error.message);
    process.exit(1);
  }
}

createAdmin();