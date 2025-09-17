const { User } = require('./models');

async function createAdmin() {
  try {
    const admin = await User.create({
      username: 'admin1',
      email: 'surya@admin.com',
      password: 'surya1234',
      name: 'Surya vamsi',
      role: 'admin',
      isApproved: true
    });
    
    console.log('✅ Admin user created:', {
      username: admin.username,
      email: admin.email,
      role: admin.role
    });
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
  }
}

createAdmin();