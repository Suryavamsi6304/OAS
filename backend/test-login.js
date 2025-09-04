require('dotenv').config();
const { User } = require('./models');

async function testLogin() {
  try {
    const user = await User.findOne({ where: { username: 'admin' } });
    
    if (!user) {
      console.log('❌ Admin user not found');
      return;
    }
    
    console.log('✅ Admin user found');
    console.log('Username:', user.username);
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    
    // Test password
    const isValid = await user.comparePassword('password');
    console.log('Password test result:', isValid);
    
    if (!isValid) {
      console.log('🔧 Updating password...');
      user.password = 'password';
      await user.save();
      console.log('✅ Password updated');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testLogin();